import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Briefcase, Save } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Input } from '../components/ui/Input';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuthStore();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/auth/me', formData);
      toast.success('Profile updated successfully!');
      await checkAuth(); // Refresh user data
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to update profile';
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
      <Navbar />

      <div className="container mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <User className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-white/80">Manage your account information</p>
          </div>

          {/* Profile Info Card */}
          <GlassCard className="mb-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-white/70 text-sm mb-1">Email</p>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-white/50" />
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>

              <div>
                <p className="text-white/70 text-sm mb-1">Role</p>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-white/50" />
                  <p className="text-white font-medium capitalize">{user?.role}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
              <p className="text-sm text-blue-200">
                <strong>Note:</strong> Email and role cannot be changed. 
                Contact support if you need to update these fields.
              </p>
            </div>
          </GlassCard>

          {/* Edit Form */}
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6">Update Information</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                icon={<User className="w-5 h-5" />}
                required
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                icon={<Phone className="w-5 h-5" />}
              />

              <GlassButton
                type="submit"
                variant="indigo"
                fullWidth
                loading={loading}
              >
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </GlassButton>
            </form>
          </GlassCard>

          {/* Account Stats */}
          <GlassCard className="mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Account Details</h3>
            <div className="space-y-3 text-white/70 text-sm">
              <div className="flex items-center justify-between">
                <span>Account Created:</span>
                <span className="text-white font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Account Type:</span>
                <span className="text-white font-medium capitalize">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
                  Active
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </GlassLayout>
  );
}