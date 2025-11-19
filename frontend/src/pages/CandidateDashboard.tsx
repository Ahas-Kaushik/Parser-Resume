import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import Navbar from '../components/layout/Navbar';
import { Spinner } from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';
import { formatDate, getStatusColor, getScoreColor } from '../lib/utils';
import type { ApplicationListItem } from '../types';

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    selected: 0,
    rejected: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get<ApplicationListItem[]>('/jobs/applications/my');
      setApplications(response.data);

      // Calculate stats
      const total = response.data.length;
      const selected = response.data.filter(app => app.status === 'selected').length;
      const rejected = response.data.filter(app => app.status === 'rejected').length;
      const pending = response.data.filter(app => app.status === 'pending').length;

      setStats({ total, selected, rejected, pending });
    } catch (error: any) {
      toast.error('Failed to load applications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statusIcons = {
    selected: <CheckCircle className="w-5 h-5" />,
    rejected: <XCircle className="w-5 h-5" />,
    pending: <Clock className="w-5 h-5" />,
  };

  return (
    <GlassLayout>
      <Navbar />

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xl text-white/80">
            Track your applications and find your dream job
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <GlassCard animate>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <FileText className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-white/70 text-sm">Total Applications</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard animate>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.selected}</p>
                <p className="text-white/70 text-sm">Selected</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard animate>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <XCircle className="w-6 h-6 text-red-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.rejected}</p>
                <p className="text-white/70 text-sm">Rejected</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard animate>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.pending}</p>
                <p className="text-white/70 text-sm">Pending</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <GlassCard hover onClick={() => navigate('/jobs')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Browse Jobs</h3>
                <p className="text-white/70">Find your perfect opportunity</p>
              </div>
              <Briefcase className="w-12 h-12 text-white/70" />
            </div>
          </GlassCard>

          <GlassCard hover onClick={() => navigate('/candidate/applications')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">My Applications</h3>
                <p className="text-white/70">Track application status</p>
              </div>
              <FileText className="w-12 h-12 text-white/70" />
            </div>
          </GlassCard>
        </div>

        {/* Recent Applications */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Applications</h2>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => navigate('/candidate/applications')}
            >
              View All
            </GlassButton>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg mb-4">No applications yet</p>
              <GlassButton variant="indigo" onClick={() => navigate('/jobs')}>
                Browse Jobs
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/20 transition-all cursor-pointer"
                  onClick={() => navigate(`/jobs/${app.job_id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {app.job_title}
                      </h3>
                      <p className="text-white/70 text-sm mb-2">{app.company}</p>
                      <div className="flex items-center space-x-4 text-white/60 text-sm">
                        <span>{formatDate(app.created_at)}</span>
                        {app.score && (
                          <span className={`font-semibold ${getScoreColor(app.score)}`}>
                            Score: {app.score.toFixed(1)}/100
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getStatusColor(app.status)}`}>
                      {statusIcons[app.status as keyof typeof statusIcons]}
                      <span className="font-semibold text-sm capitalize">{app.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </GlassLayout>
  );
}