import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Users, TrendingUp, Plus, Eye } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import Navbar from '../components/layout/Navbar';
import { Spinner } from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import type { Job } from '../types';

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    selectedCandidates: 0,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get<Job[]>('/jobs/my/posted');
      setJobs(response.data);

      // Calculate stats
      const totalJobs = response.data.length;
      const activeJobs = response.data.filter(job => job.is_active).length;

      // Get application counts for each job
      let totalApplications = 0;
      let selectedCandidates = 0;

      for (const job of response.data) {
        try {
          const statsRes = await api.get(`/jobs/${job.id}/stats`);
          totalApplications += statsRes.data.total_applications || 0;
          selectedCandidates += statsRes.data.selected_count || 0;
        } catch (error) {
          console.error(`Failed to fetch stats for job ${job.id}`);
        }
      }

      setStats({ totalJobs, activeJobs, totalApplications, selectedCandidates });
    } catch (error: any) {
      toast.error('Failed to load jobs');
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
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Employer Dashboard 💼
            </h1>
            <p className="text-xl text-white/80">
              Manage your job postings and applications
            </p>
          </div>
          <GlassButton
            variant="indigo"
            size="lg"
            onClick={() => navigate('/employer/post-job')}
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Job
          </GlassButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <GlassCard animate>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Briefcase className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.totalJobs}</p>
                <p className="text-white/70 text-sm">Total Jobs</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard animate>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.activeJobs}</p>
                <p className="text-white/70 text-sm">Active Jobs</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard animate>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <FileText className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.totalApplications}</p>
                <p className="text-white/70 text-sm">Applications</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard animate>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-pink-500/20 rounded-xl">
                <Users className="w-6 h-6 text-pink-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.selectedCandidates}</p>
                <p className="text-white/70 text-sm">Selected</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Job Listings */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Job Postings</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg mb-4">No jobs posted yet</p>
              <GlassButton variant="indigo" onClick={() => navigate('/employer/post-job')}>
                Post Your First Job
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{job.title}</h3>
                        {!job.is_active && (
                          <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-xs">
                            Closed
                          </span>
                        )}
                      </div>
                      <p className="text-white/70">{job.company}</p>
                      <p className="text-white/60 text-sm mt-1">
                        Posted on {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <GlassButton
                      variant="indigo"
                      size="sm"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </GlassButton>

                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get(`/jobs/${job.id}/applications`);
                          toast.info(`${response.data.length} applications received`);
                        } catch (error) {
                          toast.error('Failed to load applications');
                        }
                      }}
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      View Applications
                    </button>
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