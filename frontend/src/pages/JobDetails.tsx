import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, Building2, Eye, FileText, X } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import Navbar from '../components/layout/Navbar';
import { ApplicationDetailsModal } from '../components/application/ApplicationDetailsModal';
import { Spinner } from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';
import type { Job, Application } from '../types';

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Application form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    current_company: '',
    current_position: '',
    current_salary: '',
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    fetchJobDetails();

    if (user?.role === 'employer') {
      fetchApplications();
    }
    // We intentionally depend on jobId and user.role only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get<Job>(`/jobs/${jobId}`);
      setJob(response.data);

      // Check if already applied (candidate view)
      if (user?.role === 'candidate') {
        try {
          const myApps = await api.get('/jobs/applications/my');
          const applied = myApps.data.some((app: any) => app.job_id === Number(jobId));
          setHasApplied(applied);
        } catch (error) {
          console.error('Error checking application status:', error);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load job details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get<Application[]>(`/jobs/${jobId}/applications`);
      setApplications(response.data);
    } catch (error: any) {
      console.error('Failed to load applications:', error);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeFile) {
      toast.error('Please upload your resume');
      return;
    }

    setIsApplying(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);

      if (formData.current_company) {
        formDataToSend.append('current_company', formData.current_company);
      }

      if (formData.current_position) {
        formDataToSend.append('current_position', formData.current_position);
      }

      if (formData.current_salary) {
        formDataToSend.append('current_salary', formData.current_salary);
      }

      formDataToSend.append('resume', resumeFile);

      await api.post(`/jobs/${jobId}/apply`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Application submitted successfully! AI screening in progress...');
      setShowApplicationModal(false);
      setHasApplied(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to submit application';
      toast.error(errorMsg);
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <GlassLayout>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </GlassLayout>
    );
  }

  if (!job) {
    return (
      <GlassLayout>
        <Navbar />
        <div className="container mx-auto px-6 py-12">
          <GlassCard className="text-center py-12">
            <p className="text-white/70 text-lg">Job not found</p>
            <GlassButton variant="indigo" onClick={() => navigate('/jobs')} className="mt-6">
              Browse Jobs
            </GlassButton>
          </GlassCard>
        </div>
      </GlassLayout>
    );
  }

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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <GlassCard animate>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-3">{job.title}</h1>
                  <div className="flex items-center space-x-2 text-white/80 mb-4">
                    <Building2 className="w-5 h-5" />
                    <span className="text-xl font-medium">{job.company}</span>
                  </div>
                </div>

                {!job.is_active && (
                  <span className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
                    Position Closed
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {job.location && (
                  <div className="flex items-center space-x-3 text-white/70">
                    <MapPin className="w-5 h-5" />
                    <span>{job.location}</span>
                  </div>
                )}

                {job.employment_type && (
                  <div className="flex items-center space-x-3 text-white/70">
                    <Briefcase className="w-5 h-5" />
                    <span className="capitalize">{job.employment_type}</span>
                  </div>
                )}

                {job.salary_range && (
                  <div className="flex items-center space-x-3 text-white/70">
                    <DollarSign className="w-5 h-5" />
                    <span>{job.salary_range}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-white/70">
                  <Calendar className="w-5 h-5" />
                  <span>Posted {formatDate(job.created_at)}</span>
                </div>
              </div>
            </GlassCard>

            {/* Job Description */}
            {job.description && (
              <GlassCard>
                <h2 className="text-2xl font-bold text-white mb-4">Job Description</h2>
                <div className="text-white/80 whitespace-pre-line leading-relaxed">
                  {job.description}
                </div>
              </GlassCard>
            )}

            {/* Requirements */}
            {job.rules && (job.rules.required_all?.length > 0 || job.rules.required_any?.length > 0) && (
              <GlassCard>
                <h2 className="text-2xl font-bold text-white mb-4">Requirements</h2>

                {job.rules.required_all && job.rules.required_all.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white/90 mb-2">Required Skills:</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.rules.required_all.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded-lg text-indigo-200 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {job.rules.required_any && job.rules.required_any.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white/90 mb-2">Preferred Skills:</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.rules.required_any.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-200 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {job.rules.min_years && job.rules.min_years > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white/90 mb-2">Experience:</h3>
                    <p className="text-white/70">Minimum {job.rules.min_years} years required</p>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Applications (Employer View) */}
            {user?.role === 'employer' && user.id === job.employer_id && (
              <GlassCard id="applications-section">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Applications ({applications.length})
                </h2>

                {applications.length === 0 ? (
                  <p className="text-white/70 text-center py-8">No applications yet</p>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="p-4 bg-white/5 rounded-xl border border-white/20 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">{app.name}</h3>
                            <p className="text-white/70 text-sm">{app.phone}</p>

                            {app.current_company && (
                              <p className="text-white/60 text-sm mt-1">
                                {app.current_position} at {app.current_company}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <div
                              className={`text-2xl font-bold mb-1 ${
                                app.score ? (app.score >= 50 ? 'text-green-400' : 'text-red-400') : 'text-white/50'
                              }`}
                            >
                              {app.score ? `${app.score.toFixed(1)}/100` : 'N/A'}
                            </div>

                            <div
                              className={`text-sm px-2 py-1 rounded ${
                                app.status === 'selected'
                                  ? 'bg-green-500/20 text-green-300'
                                  : app.status === 'rejected'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-yellow-500/20 text-yellow-300'
                              }`}
                            >
                              {app.status}
                            </div>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <GlassButton
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedApplication(app)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View AI Screening Details
                        </GlassButton>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Section (Candidate View) */}
            {user?.role === 'candidate' && job.is_active && (
              <GlassCard>
                <h3 className="text-xl font-bold text-white mb-4">Apply Now</h3>

                {hasApplied ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-green-400" />
                    </div>

                    <p className="text-green-300 font-semibold mb-2">Already Applied!</p>
                    <p className="text-white/70 text-sm">Check your dashboard for updates</p>

                    <GlassButton
                      variant="secondary"
                      fullWidth
                      onClick={() => navigate('/candidate/applications')}
                      className="mt-4"
                    >
                      View Applications
                    </GlassButton>
                  </div>
                ) : (
                  <>
                    <p className="text-white/70 mb-4 text-sm">
                      Submit your application with your resume. Our AI will screen it instantly!
                    </p>

                    <GlassButton
                      variant="indigo"
                      fullWidth
                      showArrow
                      onClick={() => setShowApplicationModal(true)}
                    >
                      Apply for this Position
                    </GlassButton>
                  </>
                )}
              </GlassCard>
            )}

            {/* AI Screening Info */}
            <GlassCard>
              <h3 className="text-xl font-bold text-white mb-4">AI Screening</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5" />
                  <p className="text-white/70">Instant resume analysis</p>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5" />
                  <p className="text-white/70">Skill matching & scoring</p>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5" />
                  <p className="text-white/70">Experience verification</p>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5" />
                  <p className="text-white/70">Detailed feedback provided</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Application Modal - Simple placeholder for now */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <GlassCard className="p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Apply for {job.title}</h2>
              <button onClick={() => setShowApplicationModal(false)} className="text-white/70 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-white/70">Application form temporarily disabled. Please contact support.</p>
            <GlassButton onClick={() => setShowApplicationModal(false)} variant="secondary" className="mt-4">
              Close
            </GlassButton>
          </GlassCard>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <ApplicationDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />
      )}
    </GlassLayout>
  );
}