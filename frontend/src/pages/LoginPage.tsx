import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      toast.success('Login successful!');
      
      // Redirect based on role will happen in App.tsx via /dashboard route
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <GlassLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full" animate>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-xl">
              <LogIn className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-white/80 text-lg">
              Sign in to your account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-300 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <GlassButton
              type="submit"
              variant="indigo"
              fullWidth
              showArrow
              loading={loading}
            >
              Sign In
            </GlassButton>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-4">
            <p className="text-white/80">
              Don't have an account?{' '}
              <Link to="/register" className="text-white font-semibold hover:underline">
                Sign up
              </Link>
            </p>

            <Link to="/" className="block text-sm text-white/70 hover:text-white transition-colors">
              ← Back to home
            </Link>
          </div>
        </GlassCard>
      </div>
    </GlassLayout>
  );
}