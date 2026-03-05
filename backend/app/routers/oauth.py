"""
OAuth Router — Google and GitHub login
Mounted at /oauth (NOT /auth) in main.py

Flow:
  1. Frontend opens  /oauth/google  or  /oauth/github
  2. Provider redirects back to /oauth/google/callback or /oauth/github/callback
  3. We create/find the user, issue a JWT, redirect to frontend with token
  4. New user  → redirect to /oauth/select-role?token=...  (role selection page)
  5. Existing  → redirect to /oauth/callback?token=...     (straight to dashboard)
"""

import httpx
import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole, OAuthProvider
from app.dependencies import create_access_token, verify_token
from app.config import settings

logger = logging.getLogger(__name__)

# ── Router — NO prefix here, prefix set in main.py as /oauth ─
router = APIRouter()


# ═════════════════════════════════════════════════════════════
# GOOGLE OAUTH
# ═════════════════════════════════════════════════════════════

@router.get("/google", tags=["OAuth"])
async def google_login(request: Request):
    """Redirect user to Google OAuth consent screen"""
    state = secrets.token_urlsafe(32)
    request.session["oauth_state"] = state

    params = {
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile",
        "state":         state,
        "access_type":   "offline",
        "prompt":        "select_account",
    }
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}")


@router.get("/google/callback", tags=["OAuth"])
async def google_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle Google OAuth callback — exchange code for user info"""
    stored_state = request.session.pop("oauth_state", None)
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state — possible CSRF attack")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          code,
                "client_id":     settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
                "grant_type":    "authorization_code",
            },
        )

    if token_resp.status_code != 200:
        logger.error(f"Google token exchange failed: {token_resp.text}")
        raise HTTPException(status_code=400, detail="Failed to exchange Google token")

    access_token = token_resp.json().get("access_token")

    # Fetch user info from Google
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if user_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

    google_user = user_resp.json()
    return await _handle_oauth_user(
        db=db,
        provider=OAuthProvider.google,
        provider_id=str(google_user["id"]),
        email=google_user["email"],
        name=google_user.get("name", google_user["email"].split("@")[0]),
        avatar_url=google_user.get("picture"),
    )


# ═════════════════════════════════════════════════════════════
# GITHUB OAUTH
# ═════════════════════════════════════════════════════════════

@router.get("/github", tags=["OAuth"])
async def github_login(request: Request):
    """Redirect user to GitHub OAuth consent screen"""
    state = secrets.token_urlsafe(32)
    request.session["oauth_state"] = state

    params = {
        "client_id":    settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope":        "user:email read:user",
        "state":        state,
    }
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{query_string}")


@router.get("/github/callback", tags=["OAuth"])
async def github_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle GitHub OAuth callback — exchange code for user info"""
    stored_state = request.session.pop("oauth_state", None)
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state — possible CSRF attack")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id":     settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code":          code,
                "redirect_uri":  settings.GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )

    token_data    = token_resp.json()
    access_token  = token_data.get("access_token")
    if not access_token:
        logger.error(f"GitHub token exchange failed: {token_data}")
        raise HTTPException(status_code=400, detail="Failed to exchange GitHub token")

    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}

    # Fetch user profile + emails in parallel
    async with httpx.AsyncClient() as client:
        user_resp   = await client.get("https://api.github.com/user",        headers=headers)
        emails_resp = await client.get("https://api.github.com/user/emails", headers=headers)

    github_user = user_resp.json()
    emails      = emails_resp.json() if emails_resp.status_code == 200 else []

    # Pick primary verified email
    email = None
    if isinstance(emails, list):
        primary = next(
            (e for e in emails if e.get("primary") and e.get("verified")), None
        )
        email = primary["email"] if primary else None

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve a verified email from GitHub. "
                   "Make sure your GitHub account has a verified primary email."
        )

    name = github_user.get("name") or github_user.get("login") or email.split("@")[0]

    return await _handle_oauth_user(
        db=db,
        provider=OAuthProvider.github,
        provider_id=str(github_user["id"]),
        email=email,
        name=name,
        avatar_url=github_user.get("avatar_url"),
    )


# ═════════════════════════════════════════════════════════════
# COMPLETE PROFILE  (new OAuth users pick candidate / employer)
# ═════════════════════════════════════════════════════════════

@router.post("/complete-profile", tags=["OAuth"])
async def complete_oauth_profile(
    role: str,
    token: str,
    db: Session = Depends(get_db),
):
    """
    New OAuth users call this after choosing their role.
    Returns a fresh JWT with the role embedded.
    """
    if role not in ("candidate", "employer"):
        raise HTTPException(status_code=400, detail="Role must be 'candidate' or 'employer'")

    payload = verify_token(token)
    user_id = payload.get("sub")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Map lowercase string → enum key (CANDIDATE / EMPLOYER)
    user.role = UserRole[role.upper()]
    db.commit()
    db.refresh(user)

    new_token = create_access_token({
        "sub":   user.id,
        "email": user.email,
        "role":  user.role.value,
    })

    return {
        "access_token": new_token,
        "token_type":   "bearer",
        "user": {
            "id":           user.id,
            "name":         user.name,
            "email":        user.email,
            "role":         user.role.value,
            "avatar_url":   user.avatar_url,
            "oauth_provider": user.oauth_provider.value if user.oauth_provider else "local",
        },
    }


# ═════════════════════════════════════════════════════════════
# SHARED HELPER
# ════════���════════════════════════════════════════════════════

async def _handle_oauth_user(
    db: Session,
    provider: OAuthProvider,
    provider_id: str,
    email: str,
    name: str,
    avatar_url: str | None,
) -> RedirectResponse:
    """
    Find existing user OR create new one, then redirect to frontend.
    - Existing user  → /oauth/callback?token=...
    - New user       → /oauth/select-role?token=...
    """
    is_new_user = False

    # 1. Try find by provider ID (fastest path — returning OAuth user)
    user = db.query(User).filter(
        User.oauth_provider == provider,
        User.oauth_provider_id == provider_id,
    ).first()

    # 2. Fallback: find by email (link existing local account to OAuth)
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.oauth_provider    = provider
            user.oauth_provider_id = provider_id
            if not user.avatar_url:
                user.avatar_url = avatar_url
            db.commit()
        else:
            # 3. Brand new user — default to CANDIDATE, let them change on select-role page
            user = User(
                name=name,
                email=email,
                hashed_password=None,
                oauth_provider=provider,
                oauth_provider_id=provider_id,
                avatar_url=avatar_url,
                role=UserRole.CANDIDATE,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            is_new_user = True

    token = create_access_token({
        "sub":   user.id,
        "email": user.email,
        "role":  user.role.value,
    })

    frontend_url = settings.FRONTEND_URL.rstrip("/")

    if is_new_user:
        # New user → role selection page
        return RedirectResponse(f"{frontend_url}/oauth/select-role?token={token}")
    else:
        # Returning user → straight to dashboard
        return RedirectResponse(f"{frontend_url}/oauth/callback?token={token}")