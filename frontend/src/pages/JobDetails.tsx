import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, Building2, Eye, FileText, X } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import Navbar from '../components/layout/Navbar';
import { ApplicationDetailsModal } from '../components/application/ApplicationDetailsModal';
import { DownloadButton } from '../components/application/DownloadButton';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOCX, or TXT file');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10485760) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setResumeFile(file);
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

                {/* Education Requirements Display */}
                {job.rules.education_requirements?.enabled && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <h3 className="text-lg font-semibold text-white/90 mb-2">Education:</h3>
                    
                    {job.rules.education_requirements.minimum_qualification && (
                      <p className="text-white/70 mb-2">
                        Minimum: <span className="capitalize">{job.rules.education_requirements.minimum_qualification.level.replace('_', ' or ')}</span>
                      </p>
                    )}

                    {job.rules.education_requirements.degree_requirement?.enabled && (
                      <div className="space-y-2">
                        <p className="text-white/70">
                          Degree: <span className="capitalize">{job.rules.education_requirements.degree_requirement.level}</span>
                        </p>
                        
                        {job.rules.education_requirements.degree_requirement.fields.length > 0 && (
                          <div>
                            <p className="text-white/60 text-sm mb-1">Fields:</p>
                            <div className="flex flex-wrap gap-2">
                              {job.rules.education_requirements.degree_requirement.fields.map((field, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-200 text-xs"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {job.rules.education_requirements.degree_requirement.grade && (
                          <p className="text-white/60 text-sm">
                            Minimum Grade: {job.rules.education_requirements.degree_requirement.grade.value}{' '}
                            ({job.rules.education_requirements.degree_requirement.grade.type.replace('_', ' ').toUpperCase()})
                            {' ≈ '}{job.rules.education_requirements.degree_requirement.grade.normalized}%
                          </p>
                        )}
                      </div>
                    )}
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

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4">
                          {/* View Details Button */}
                          <GlassButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedApplication(app)}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View AI Screening Details
                          </GlassButton>

                          {/* Download Button - NEW! */}
                          <DownloadButton
                            jobId={job.id}
                            applicationId={app.id}
                            candidateName={app.name}
                            variant="dropdown"
                          />
                        </div>
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
                  <p className="text-white/70">Education verification</p>
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

      {/* Application Modal - Simple placeholder */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <GlassCard className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Apply for {job.title}</h2>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Current Company */}
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">
                  Current Company (Optional)
                </label>
                <input
                  type="text"
                  value={formData.current_company}
                  onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Current Position */}
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">
                  Current Position (Optional)
                </label>
                <input
                  type="text"
                  value={formData.current_position}
                  onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Current Salary */}
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">
                  Current Salary (Optional)
                </label>
                <input
                  type="number"
                  value={formData.current_salary}
                  onChange={(e) => setFormData({ ...formData, current_salary: e.target.value })}
                  placeholder="Annual salary in USD"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">
                  Resume * (PDF, DOCX, or TXT)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-500/20 file:text-indigo-200 hover:file:bg-indigo-500/30"
                />
                {resumeFile && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
                <p className="text-sm text-blue-200">
                  <strong>Note:</strong> Your resume will be instantly analyzed by our AI. You'll receive feedback within seconds!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <GlassButton
                  type="submit"
                  variant="indigo"
                  fullWidth
                  loading={isApplying}
                  showArrow
                >
                  Submit Application
                </GlassButton>

                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowApplicationModal(false)}
                  disabled={isApplying}
                >
                  Cancel
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </GlassLayout>
  );
}