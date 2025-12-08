import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Eye, X } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { ApplicationDetailsModal } from '../application/ApplicationDetailsModal';
import type { Application } from '../../types';

interface ScoreBand {
  name: string;
  value: number;
  color: string;
  band: string;
  applications: {
    id: number;
    name: string;
    score: number;
    status: string;
    email: string;
    phone: string;
  }[];
}

interface ScorePieChartProps {
  data: ScoreBand[];
  jobTitle: string;
  onViewApplication: (applicationId: number) => void;
}

export const ScorePieChart = ({ data, jobTitle, onViewApplication }: ScorePieChartProps) => {
  const [selectedBand, setSelectedBand] = useState<ScoreBand | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const filteredData = data.filter(item => item.value > 0);

  const handlePieClick = (entry: ScoreBand) => {
    setSelectedBand(entry);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload. length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800/95 backdrop-blur-lg rounded-lg px-4 py-3 border border-white/20">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-white/70">{data.value} candidates</p>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Candidate Score Distribution</h3>
          <p className="text-white/60 text-sm">{jobTitle}</p>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/50">No applications to analyze yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(_, index) => handlePieClick(filteredData[index])}
                  style={{ cursor: 'pointer' }}
                >
                  {filteredData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-white/80">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Score Band Details */}
          <div className="space-y-3">
            <p className="text-white/60 text-sm mb-4">
              Click on a pie slice to view candidates in that score range
            </p>
            {data.map((band) => (
              <button
                key={band.band}
                onClick={() => setSelectedBand(band)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  selectedBand?.band === band.band
                    ? 'bg-white/20 border border-white/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: band.color }}
                  />
                  <span className="text-white">{band.name}</span>
                </div>
                <span className="text-white font-bold">{band.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Band Candidates Modal */}
      {selectedBand && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 rounded-2xl border border-white/20 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedBand.name}</h3>
                <p className="text-white/60">{selectedBand.value} candidates</p>
              </div>
              <button
                onClick={() => setSelectedBand(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedBand.applications.length === 0 ? (
                <p className="text-white/50 text-center py-8">No candidates in this range</p>
              ) : (
                <div className="space-y-3">
                  {selectedBand.applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-medium">{app.name}</p>
                        <p className="text-white/60 text-sm">{app.email}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span
                            className="text-lg font-bold"
                            style={{ color: selectedBand.color }}
                          >
                            {app.score. toFixed(1)}/100
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              app. status === 'selected'
                                ? 'bg-green-500/20 text-green-300'
                                : app.status === 'rejected'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      </div>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewApplication(app.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </GlassButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};