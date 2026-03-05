/**
 * OAuthSelectRolePage
 * Shown to brand-new OAuth (Google/GitHub) users who need to pick their role
 * before accessing the app.
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Search, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

export default function OAuthSelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'employer' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleConfirm = async () => {
    if (!selectedRole || !token) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/oauth/complete-profile?role=${selectedRole}&token=${token}`);
      const { access_token, user } = response.data;

      // Save to localStorage and update auth store
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Trigger auth store hydration
      const { checkAuth } = useAuthStore.getState();
      await checkAuth();

      navigate(user.role === 'employer' ? '/employer/dashboard' : '/candidate/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">One Last Step!</h1>
            <p className="text-white/70 text-sm">
              Tell us how you'll be using <strong className="text-white">Fetch Ya Job</strong>
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="space-y-4 mb-8">
            {/* Candidate */}
            <button
              onClick={() => setSelectedRole('candidate')}
              className={`w-full p-5 rounded-xl border-2 transition-all text-left flex items-center space-x-4 ${
                selectedRole === 'candidate'
                  ? 'border-indigo-400 bg-indigo-500/30 shadow-lg shadow-indigo-500/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedRole === 'candidate' ? 'bg-indigo-500' : 'bg-white/10'
              }`}>
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-lg">Job Seeker</p>
                <p className="text-white/60 text-sm">I'm looking for jobs and want to apply</p>
              </div>
              {selectedRole === 'candidate' && (
                <ChevronRight className="w-5 h-5 text-indigo-300 ml-auto" />
              )}
            </button>

            {/* Employer */}
            <button
              onClick={() => setSelectedRole('employer')}
              className={`w-full p-5 rounded-xl border-2 transition-all text-left flex items-center space-x-4 ${
                selectedRole === 'employer'
                  ? 'border-purple-400 bg-purple-500/30 shadow-lg shadow-purple-500/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedRole === 'employer' ? 'bg-purple-500' : 'bg-white/10'
              }`}>
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-lg">Employer</p>
                <p className="text-white/60 text-sm">I'm hiring and want to post jobs</p>
              </div>
              {selectedRole === 'employer' && (
                <ChevronRight className="w-5 h-5 text-purple-300 ml-auto" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-300 text-sm mb-4 bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!selectedRole || loading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              selectedRole && !loading
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg'
                : 'bg-white/10 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? 'Setting up your account...' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}