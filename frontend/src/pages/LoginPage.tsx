import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Input } from '../components/ui/Input';
import Navbar from '../components/layout/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Show OAuth error if redirected back with error param
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError === 'oauth_failed') setError('OAuth login failed. Please try again.');
    if (oauthError === 'oauth_invalid_token') setError('Invalid OAuth token. Please try again.');
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'employer' ? '/employer/dashboard' : '/candidate/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Redirect browser directly to backend OAuth endpoint
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth/github`;
  };

  return (
    <GlassLayout>
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <GlassCard>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-white/70">Sign in to your account</p>
            </div>

            {/* ── OAuth Buttons ── */}
            <div className="space-y-3 mb-6">
              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl bg-white text-gray-800 font-semibold hover:bg-gray-100 transition-all shadow"
              >
                {/* Google SVG logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* GitHub */}
              <button
                onClick={handleGithubLogin}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all shadow"
              >
                {/* GitHub SVG logo */}
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/50 text-sm">or sign in with email</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                icon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                icon={<Lock className="w-5 h-5" />}
                required
              />

              <GlassButton type="submit" variant="indigo" fullWidth loading={loading}>
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </GlassButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/70 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-300 hover:text-indigo-200 font-semibold underline">
                  Create one
                </Link>
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </GlassLayout>
  );
}