import { useState, useEffect } from 'react';
import { Search, Briefcase, MapPin, DollarSign } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import Navbar from '../components/layout/Navbar';
import { JobCard } from '../components/job/JobCard';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';
import type { Job } from '../types';

export default function JobListings() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchTerm, jobs]);

  const fetchJobs = async () => {
    try {
      const response = await api.get<Job[]>('/jobs/', {
        params: { is_active: true, limit: 100 },
      });
      setJobs(response.data);
      setFilteredJobs(response.data);
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
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Find Your Dream Job</h1>
          <p className="text-xl text-white/80 mb-8">
            Browse through {jobs.length} available opportunities
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="Search by job title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <GlassCard className="text-center py-12">
            <Briefcase className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg">
              {searchTerm ? 'No jobs found matching your search' : 'No jobs available'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}