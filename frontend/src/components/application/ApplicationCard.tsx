import { Calendar, TrendingUp, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { formatDate, getStatusColor, getScoreColor } from '../../lib/utils';
import type { Application } from '../../types';

interface ApplicationCardProps {
  application: Application;
  showJobDetails?: boolean;
}

export const ApplicationCard = ({ application, showJobDetails = false }: ApplicationCardProps) => {
  const statusIcons = {
    selected: <CheckCircle className="w-5 h-5" />,
    rejected: <XCircle className="w-5 h-5" />,
    pending: <Clock className="w-5 h-5" />,
    withdrawn: <XCircle className="w-5 h-5" />,
  };

  return (
    <GlassCard hover={false}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{application.name}</h3>
            <div className="flex items-center space-x-2 text-white/70">
              <FileText className="w-4 h-4" />
              <span className="text-sm">{application.phone}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getStatusColor(application.status)}`}>
            {statusIcons[application.status]}
            <span className="font-semibold text-sm capitalize">{application.status}</span>
          </div>
        </div>

        {/* Current Info */}
        {application.current_company && (
          <div className="space-y-2">
            <div className="text-white/70 text-sm">
              <strong>Current Company:</strong> {application.current_company}
            </div>
            {application.current_position && (
              <div className="text-white/70 text-sm">
                <strong>Position:</strong> {application.current_position}
              </div>
            )}
          </div>
        )}

        {/* Score */}
        {application.score !== null && application.score !== undefined && (
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-white/70" />
            <div>
              <span className="text-white/70 text-sm">AI Score: </span>
              <span className={`text-2xl font-bold ${getScoreColor(application.score)}`}>
                {application.score.toFixed(1)}
              </span>
              <span className="text-white/50 text-sm">/100</span>
            </div>
          </div>
        )}

        {/* Applied Date */}
        <div className="flex items-center space-x-2 text-white/60 text-sm">
          <Calendar className="w-4 h-4" />
          <span>Applied on {formatDate(application.created_at)}</span>
        </div>

        {/* Explanation Summary */}
        {application.explanation && application.explanation.summary && (
          <div className="pt-4 border-t border-white/20">
            <h4 className="text-white font-semibold mb-2">Screening Summary:</h4>
            
            {application.explanation.summary.reasons_pass?.length > 0 && (
              <div className="mb-2">
                <p className="text-green-300 text-sm font-medium mb-1">✓ Passed:</p>
                <ul className="space-y-1">
                  {application.explanation.summary.reasons_pass.map((reason: string, idx: number) => (
                    <li key={idx} className="text-green-200/80 text-xs pl-4">• {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {application.explanation.summary.reasons_fail?.length > 0 && (
              <div>
                <p className="text-red-300 text-sm font-medium mb-1">✗ Issues:</p>
                <ul className="space-y-1">
                  {application.explanation.summary.reasons_fail.map((reason: string, idx: number) => (
                    <li key={idx} className="text-red-200/80 text-xs pl-4">• {reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};