import { useState, useEffect } from 'react';
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
  const { login, isAuthenticated, user } = useAuthStore();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Already authenticated, redirecting...', user.role);
      if (user.role === 'employer') {
        navigate('/employer/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Starting login process...');
      
      // Call login and WAIT for it to complete
      await login(formData);
      
      console.log('✅ Login completed, checking state...');
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the updated state
      const state = useAuthStore.getState();
      console.log('📊 Current state:', {
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        tokenExists: !!state.token,
      });
      
      // Check localStorage directly
      const tokenInStorage = localStorage.getItem('token');
      const userInStorage = localStorage.getItem('user');
      
      console.log('💾 LocalStorage check:', {
        token: !!tokenInStorage,
        user: !!userInStorage,
      });
      
      if (!tokenInStorage || !userInStorage) {
        throw new Error('Token not saved to localStorage');
      }
      
      toast.success('Login successful!');
      
      // Parse user to get role
      const userData = JSON.parse(userInStorage);
      console.log('👤 User role:', userData.role);
      
      // Force a small delay before redirect
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect based on role
      if (userData.role === 'employer') {
        console.log('🔄 Redirecting to employer dashboard');
        navigate('/employer/dashboard', { replace: true });
      } else {
        console.log('🔄 Redirecting to candidate dashboard');
        navigate('/candidate/dashboard', { replace: true });
      }
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      toast.error(errorMsg);
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
              disabled={loading}
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
              disabled={loading}
            />

            <GlassButton
              type="submit"
              variant="indigo"
              fullWidth
              showArrow
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
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