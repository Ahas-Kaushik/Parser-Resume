"""
Chat Router — Fully fixed + enhanced
Handles: global chat, direct messages, user search, conversations list.
Also sends inbox notifications on new DMs.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatMessage
from app.models.notification import Notification, NotificationType
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter()


def _create_dm_notification(db: Session, sender: User, receiver_id: int, message_preview: str):
    """Helper: create an inbox notification for a new DM"""
    notif = Notification(
        user_id=receiver_id,
        type=NotificationType.DIRECT_MESSAGE,
        title=f"New message from {sender.name}",
        message=message_preview[:100] + ("..." if len(message_preview) > 100 else ""),
        link="/chat",
        is_read=False
    )
    db.add(notif)
    # Don't commit here — caller commits


@router.post("/send", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a chat message (global or direct)"""

    if not message_data.message or not message_data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Validate receiver exists for DMs
    if not message_data.is_global and message_data.receiver_id:
        receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

    new_message = ChatMessage(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id if not message_data.is_global else None,
        message=message_data.message.strip(),
        is_global=message_data.is_global
    )
    db.add(new_message)

    # Create DM notification for receiver
    if not message_data.is_global and message_data.receiver_id:
        _create_dm_notification(db, current_user, message_data.receiver_id, message_data.message)

    db.commit()
    db.refresh(new_message)

    return {
        "id": new_message.id,
        "sender_id": new_message.sender_id,
        "sender_name": current_user.name,
        "receiver_id": new_message.receiver_id,
        "message": new_message.message,
        "is_global": new_message.is_global,
        "created_at": new_message.created_at
    }


@router.get("/global", response_model=List[ChatMessageResponse])
async def get_global_messages(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get global chat messages"""
    cutoff_date = datetime.utcnow() - timedelta(days=settings.CHAT_HISTORY_DAYS)

    messages = db.query(ChatMessage).filter(
        ChatMessage.is_global == True,
        ChatMessage.created_at >= cutoff_date
    ).order_by(ChatMessage.created_at.desc()).limit(min(limit, settings.CHAT_MESSAGE_LIMIT)).all()

    messages = messages[::-1]  # oldest first

    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.name if sender else "Unknown",
            "receiver_id": None,
            "message": msg.message,
            "is_global": True,
            "created_at": msg.created_at
        })
    return result


@router.get("/direct/{user_id}", response_model=List[ChatMessageResponse])
async def get_direct_messages(
    user_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get direct messages between current user and another user"""
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    cutoff_date = datetime.utcnow() - timedelta(days=settings.CHAT_HISTORY_DAYS)

    messages = db.query(ChatMessage).filter(
        ChatMessage.is_global == False,
        ChatMessage.created_at >= cutoff_date,
        or_(
            (ChatMessage.sender_id == current_user.id) & (ChatMessage.receiver_id == user_id),
            (ChatMessage.sender_id == user_id) & (ChatMessage.receiver_id == current_user.id)
        )
    ).order_by(ChatMessage.created_at.desc()).limit(min(limit, settings.CHAT_MESSAGE_LIMIT)).all()

    messages = messages[::-1]

    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.name if sender else "Unknown",
            "receiver_id": msg.receiver_id,
            "message": msg.message,
            "is_global": False,
            "created_at": msg.created_at
        })
    return result


@router.get("/users/search", response_model=List[dict])
async def search_users(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search users by name or email for starting a DM"""
    if len(query.strip()) < 2:
        return []

    users = db.query(User).filter(
        User.id != current_user.id,
        or_(
            User.name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%")
        )
    ).limit(10).all()

    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]


@router.get("/users", response_model=List[dict])
async def get_chat_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users available for direct messaging"""
    users = db.query(User).filter(User.id != current_user.id).all()
    return [{"id": u.id, "name": u.name, "role": u.role} for u in users]


@router.get("/conversations", response_model=List[dict])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all DM conversations for current user's inbox sidebar"""
    # Find all user IDs this user has exchanged DMs with
    sent_to = db.query(ChatMessage.receiver_id.label('user_id')).filter(
        ChatMessage.sender_id == current_user.id,
        ChatMessage.is_global == False,
        ChatMessage.receiver_id.isnot(None)
    ).all()

    received_from = db.query(ChatMessage.sender_id.label('user_id')).filter(
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_global == False
    ).all()

    conversation_user_ids = set(
        [r.user_id for r in sent_to] + [r.user_id for r in received_from]
    )

    conversations = []
    for uid in conversation_user_ids:
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            continue

        last_message = db.query(ChatMessage).filter(
            ChatMessage.is_global == False,
            or_(
                (ChatMessage.sender_id == current_user.id) & (ChatMessage.receiver_id == uid),
                (ChatMessage.sender_id == uid) & (ChatMessage.receiver_id == current_user.id)
            )
        ).order_by(ChatMessage.created_at.desc()).first()

        # Count unread messages from this user
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.sender_id == uid,
            ChatMessage.receiver_id == current_user.id,
            ChatMessage.is_global == False,
            ChatMessage.is_read == False
        ).count()

        conversations.append({
            "user_id": user.id,
            "user_name": user.name,
            "user_role": user.role,
            "last_message": last_message.message[:60] if last_message else None,
            "last_message_at": last_message.created_at if last_message else None,
            "unread_count": unread_count
        })

    conversations.sort(key=lambda x: x['last_message_at'] or datetime.min, reverse=True)
    return conversations