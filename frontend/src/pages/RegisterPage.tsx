import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, Briefcase, Users } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import type { UserRole } from '../types';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    role: 'candidate' as UserRole,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <GlassLayout>
      <div className="min-h-screen flex items-center justify-center p-6 py-12">
        <GlassCard className="max-w-2xl w-full" animate>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-xl">
              <UserPlus className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2">
              Create Account
            </h1>
            <p className="text-white/80 text-lg">
              Join our AI-powered recruitment platform
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'candidate' })}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  formData.role === 'candidate'
                    ? 'border-indigo-400 bg-indigo-500/20'
                    : 'border-white/30 bg-white/5 hover:border-white/50'
                }`}
              >
                <Users className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-white font-semibold">I'm a Candidate</p>
                <p className="text-white/60 text-xs mt-1">Looking for jobs</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'employer' })}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  formData.role === 'employer'
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-white/30 bg-white/5 hover:border-white/50'
                }`}
              >
                <Briefcase className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-white font-semibold">I'm an Employer</p>
                <p className="text-white/60 text-xs mt-1">Hiring talent</p>
              </button>
            </div>

            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              icon={<User className="w-5 h-5" />}
              required
            />

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
              label="Phone Number (Optional)"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              icon={<Phone className="w-5 h-5" />}
            />

            <div className="grid grid-cols-2 gap-4">
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

              <Input
                label="Confirm Password"
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                required
              />
            </div>

            <GlassButton
              type="submit"
              variant="indigo"
              fullWidth
              showArrow
              loading={loading}
            >
              Create Account
            </GlassButton>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-4">
            <p className="text-white/80">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-semibold hover:underline">
                Sign in
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