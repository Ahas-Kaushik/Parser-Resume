import React from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import type { Application } from '../../types';

interface ApplicationDetailsModalProps {
  application: Application;
  onClose: () => void;
}

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  application,
  onClose,
}) => {
  const explanation = application.explanation || {};
  const summary = explanation.summary || {};
  const skills = explanation.skills || {};
  const experience = explanation.experience || {};
  const education = explanation.education || {};
  const scoring = explanation.scoring || {};

  // Helper to render status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      selected: 'bg-green-500/20 border-green-500/50 text-green-300',
      rejected: 'bg-red-500/20 border-red-500/50 text-red-300',
      pending: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
    };

    return (
      <span
        className={`px-3 py-1 rounded-lg border text-sm font-semibold ${
          colors[status] || colors.pending
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  // Helper to render score with color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Download resume handler
  const handleDownloadResume = () => {
    // In production, this should be a proper backend endpoint
    const resumeUrl = `http://localhost:8000/uploads/${application.resume_path}`;
    window.open(resumeUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">Application Details</h2>
              <div className="flex items-center space-x-4">
                <h3 className="text-xl text-white/90">{application.name}</h3>
                <StatusBadge status={application.status} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white/70 hover:text-white" />
            </button>
          </div>

          {/* Candidate Information */}
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-400" />
              Candidate Information
            </h4>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/60">Phone</p>
                <p className="text-white font-medium">{application.phone}</p>
              </div>

              {application.current_company && (
                <div>
                  <p className="text-white/60">Current Company</p>
                  <p className="text-white font-medium">{application.current_company}</p>
                </div>
              )}

              {application.current_position && (
                <div>
                  <p className="text-white/60">Current Position</p>
                  <p className="text-white font-medium">{application.current_position}</p>
                </div>
              )}

              {application.current_salary && (
                <div>
                  <p className="text-white/60">Current Salary</p>
                  <p className="text-white font-medium">
                    ${application.current_salary.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <GlassButton
              variant="secondary"
              size="sm"
              onClick={handleDownloadResume}
              className="mt-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Resume
            </GlassButton>
          </div>

          {/* AI Screening Score */}
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <Award className="w-5 h-5 mr-2 text-purple-400" />
                AI Screening Score
              </h4>

              {application.score !== null && application.score !== undefined && (
                <div className={`text-5xl font-bold ${getScoreColor(application.score)}`}>
                  {application.score.toFixed(1)}
                  <span className="text-2xl text-white/50">/100</span>
                </div>
              )}
            </div>

            {scoring.threshold !== undefined && (
              <div className="mb-2">
                <div className="flex justify-between text-sm text-white/70 mb-1">
                  <span>Threshold</span>
                  <span>{scoring.threshold}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (application.score || 0) >= scoring.threshold ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(((application.score || 0) / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {scoring.weights && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/60 font-semibold uppercase tracking-wide">
                  Score Breakdown
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(scoring.weights).map(([key, value]) => (
                    <div key={key} className="flex justify-between bg-white/5 px-3 py-2 rounded-lg">
                      <span className="text-white/70 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-white font-medium">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Reasons for Pass */}
            {summary.reasons_pass && summary.reasons_pass.length > 0 && (
              <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                <h4 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Passed Checks
                </h4>
                <ul className="space-y-2">
                  {summary.reasons_pass.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start text-sm text-green-200">
                      <span className="mr-2">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reasons for Fail */}
            {summary.reasons_fail && summary.reasons_fail.length > 0 && (
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                <h4 className="text-lg font-semibold text-red-300 mb-3 flex items-center">
                  <XCircle className="w-5 h-5 mr-2" />
                  Failed Checks
                </h4>
                <ul className="space-y-2">
                  {summary.reasons_fail.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start text-sm text-red-200">
                      <span className="mr-2">✗</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Skills Analysis */}
          {skills.candidate_skills && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                Skills Analysis
              </h4>

              <div className="space-y-4">
                {/* Candidate Skills */}
                <div>
                  <p className="text-sm text-white/60 mb-2">
                    Candidate Skills ({skills.candidate_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.candidate_skills.slice(0, 15).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-200 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.candidate_skills.length > 15 && (
                      <span className="px-2 py-1 text-white/50 text-xs">
                        +{skills.candidate_skills.length - 15} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Matched Skills */}
                {skills.matched_required_all && skills.matched_required_all.length > 0 && (
                  <div>
                    <p className="text-sm text-green-400 mb-2">✓ Matched Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.matched_required_all.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-200 text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Section - NEW! */}
                {education && education.enabled !== false && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-blue-400" />
                      Education Analysis
                    </h4>

                    <div className="space-y-3">
                      {/* All Qualifications */}
                      {education.all_qualifications && education.all_qualifications.length > 0 && (
                        <div>
                          {education.all_qualifications.map((qual: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-white/5 rounded-lg border border-white/10 mb-2"
                            >
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-white/60">Level:</span>
                                  <span className="text-white ml-2 font-medium capitalize">
                                    {qual.level}
                                  </span>
                                </div>

                                {qual.field && (
                                  <div>
                                    <span className="text-white/60">Field:</span>
                                    <span className="text-white ml-2">{qual.field}</span>
                                  </div>
                                )}

                                {qual.year && (
                                  <div>
                                    <span className="text-white/60">Year:</span>
                                    <span className="text-white ml-2">{qual.year}</span>
                                  </div>
                                )}

                                {qual.grade && (
                                  <div>
                                    <span className="text-white/60">Grade:</span>
                                    <span className="text-white ml-2">
                                      {qual.grade.raw_value} ({qual.grade.type.replace('_', ' ').toUpperCase()}) ={' '}
                                      {qual.grade.normalized_percentage}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Highest Qualification */}
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                        <p className="text-indigo-200 text-sm">
                          <strong>Highest Qualification:</strong>{' '}
                          <span className="capitalize">{education.candidate_highest || 'N/A'}</span>
                        </p>
                      </div>

                      {/* Requirement Status */}
                      {education.minimum_qualification_met !== undefined && (
                        <div
                          className={`p-3 rounded-lg ${
                            education.minimum_qualification_met
                              ? 'bg-green-500/10 border border-green-500/30'
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}
                        >
                          <p className={education.minimum_qualification_met ? 'text-green-200' : 'text-red-200'}>
                            {education.minimum_qualification_met ? '✓' : '✗'} Minimum Qualification{' '}
                            {education.minimum_qualification_met ? 'Met' : 'Not Met'}
                          </p>
                        </div>
                      )}

                      {education.degree_requirement_met !== undefined &&
                        education.degree_requirement_met !== null && (
                          <div
                            className={`p-3 rounded-lg ${
                              education.degree_requirement_met
                                ? 'bg-green-500/10 border border-green-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                            }`}
                          >
                            <p className={education.degree_requirement_met ? 'text-green-200' : 'text-red-200'}>
                              {education.degree_requirement_met ? '✓' : '✗'} Degree Requirement{' '}
                              {education.degree_requirement_met ? 'Met' : 'Not Met'}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {skills.missing_required_all && skills.missing_required_all.length > 0 && (
                  <div>
                    <p className="text-sm text-red-400 mb-2">✗ Missing Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.missing_required_all.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Similarity Score */}
                {skills.similarity !== undefined && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-white/70">Skill Similarity</span>
                      <span className="text-white font-semibold">{(skills.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${
                          skills.similarity >= (skills.similarity_threshold || 0.3) ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(skills.similarity * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Experience Analysis */}
            {experience.estimated_years !== undefined && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-orange-400" />
                  Experience
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Estimated Years</span>
                    <span className="text-white font-semibold">{experience.estimated_years} years</span>
                  </div>
                  {experience.min_required_years !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Required</span>
                      <span className="text-white font-semibold">{experience.min_required_years} years</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        experience.meets_requirement ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {experience.meets_requirement ? '✓ Meets Requirement' : '✗ Below Requirement'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Education Analysis */}
            {education.highest_degree && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-indigo-400" />
                  Education
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Highest Degree</span>
                    <span className="text-white font-semibold capitalize">{education.highest_degree}</span>
                  </div>

                  {education.degrees_found && education.degrees_found.length > 0 && (
                    <div>
                      <p className="text-white/70 mb-1">All Degrees Found</p>
                      <div className="flex flex-wrap gap-1">
                        {education.degrees_found.map((degree: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-indigo-500/20 rounded text-indigo-200 text-xs capitalize"
                          >
                            {degree}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {education.min_degree_level && education.min_degree_level !== 'none' && (
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-white/70">Required</span>
                      <span className="text-white font-semibold capitalize">{education.min_degree_level}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        education.meets_requirement ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {education.meets_requirement ? '✓ Meets Requirement' : '✗ Below Requirement'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
            <GlassButton variant="indigo" onClick={onClose}>
              Close
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
