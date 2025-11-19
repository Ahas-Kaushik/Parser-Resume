import { MapPin, Briefcase, DollarSign, Calendar, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { formatDate } from '../../lib/utils';
import type { Job } from '../../types';

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  const navigate = useNavigate();

  return (
    <GlassCard
      hover
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="cursor-pointer"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">{job.title}</h3>
            <div className="flex items-center space-x-2 text-white/80">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{job.company}</span>
            </div>
          </div>
          {!job.is_active && (
            <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              Closed
            </span>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          {job.location && (
            <div className="flex items-center space-x-2 text-white/70">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{job.location}</span>
            </div>
          )}

          {job.employment_type && (
            <div className="flex items-center space-x-2 text-white/70">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm capitalize">{job.employment_type}</span>
            </div>
          )}

          {job.salary_range && (
            <div className="flex items-center space-x-2 text-white/70">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">{job.salary_range}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-white/70">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatDate(job.created_at)}</span>
          </div>
        </div>

        {/* Description Preview */}
        {job.description && (
          <p className="text-white/70 text-sm line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/20">
          <button className="text-indigo-300 hover:text-indigo-200 font-semibold text-sm transition-colors">
            View Details →
          </button>
        </div>
      </div>
    </GlassCard>
  );
};