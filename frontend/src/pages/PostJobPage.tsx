import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import Navbar from '../components/layout/Navbar';
import { JobForm } from '../components/job/JobForm';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';

export default function PostJobPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (jobData: any) => {
    try {
      await api.post('/jobs/', jobData);
      toast.success('Job posted successfully!');
      navigate('/employer/dashboard');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to post job';
      toast.error(errorMsg);
      throw error;
    }
  };

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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Post a New Job</h1>
          <p className="text-white/80 text-lg">
            Create a job posting with AI-powered resume screening
          </p>
        </div>

        {/* Form */}
        <GlassCard>
          <JobForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/employer/dashboard')}
          />
        </GlassCard>
      </div>
    </GlassLayout>
  );
}