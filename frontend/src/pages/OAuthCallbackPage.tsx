/**
 * OAuthCallbackPage
 * Handles the redirect from backend after successful OAuth login.
 * Extracts the token, saves it, and redirects to dashboard.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // Decode user info from JWT payload (base64)
    try {
      const payloadB64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadB64));

      // Save token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      }));

      // Redirect based on role
      const target = payload.role === 'employer' ? '/employer/dashboard' : '/candidate/dashboard';
      navigate(target, { replace: true });
    } catch {
      navigate('/login?error=oauth_invalid_token', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white text-xl font-semibold">Completing login...</p>
        <p className="text-white/60 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}