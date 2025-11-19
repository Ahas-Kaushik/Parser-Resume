import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Select } from '../components/ui/Select';
import Navbar from '../components/layout/Navbar';
import { ApplicationCard } from '../components/application/ApplicationCard';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';
import type { ApplicationListItem } from '../types';

export default function ApplicationStatus() {
  const navigate = useNavigate();
  const toast = useToast();

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(
        applications.filter((app) => app.status === statusFilter)
      );
    }
  }, [statusFilter, applications]);

  const fetchApplications = async () => {
    try {
      const response = await api.get<ApplicationListItem[]>('/jobs/applications/my');
      setApplications(response.data);
      setFilteredApplications(response.data);
    } catch (error: any) {
      toast.error('Failed to load applications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassLayout>
      <Navbar />

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Applications</h1>
            <p className="text-white/80">Track all your job applications</p>
          </div>

          {/* Filter */}
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'selected', label: 'Selected' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-white/70 text-lg mb-4">
              {statusFilter === 'all'
                ? 'No applications yet'
                : `No ${statusFilter} applications`}
            </p>
            {statusFilter === 'all' && (
              <GlassButton variant="indigo" onClick={() => navigate('/jobs')}>
                Browse Jobs
              </GlassButton>
            )}
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((app) => (
              <div key={app.id} onClick={() => navigate(`/jobs/${app.job_id}`)}>
                <GlassCard hover>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{app.job_title}</h3>
                      <p className="text-white/80 mb-4">{app.company}</p>

                      <div className="flex items-center space-x-6">
                        <div className={`px-3 py-1.5 rounded-lg border ${
                          app.status === 'selected'
                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                            : app.status === 'rejected'
                            ? 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                        }`}>
                          <span className="font-semibold text-sm capitalize">{app.status}</span>
                        </div>

                        {app.score !== null && app.score !== undefined && (
                          <div className="text-white/70">
                            <span className="text-sm">AI Score: </span>
                            <span className={`text-xl font-bold ${
                              app.score >= 80
                                ? 'text-green-400'
                                : app.score >= 60
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}>
                              {app.score.toFixed(1)}
                            </span>
                            <span className="text-white/50 text-sm">/100</span>
                          </div>
                        )}

                        <div className="text-white/60 text-sm">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}