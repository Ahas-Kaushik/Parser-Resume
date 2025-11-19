import { useState } from 'react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { GlassButton } from '../ui/GlassButton';
import type { Job } from '../../types';

interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export const JobForm = ({ initialData, onSubmit, onCancel }: JobFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    company: initialData?.company || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    salary_range: initialData?.salary_range || '',
    employment_type: initialData?.employment_type || 'full-time',
    required_all: initialData?.rules?.required_all?.join(', ') || '',
    required_any: initialData?.rules?.required_any?.join(', ') || '',
    min_years: initialData?.rules?.min_years || 0,
    similarity_threshold: initialData?.rules?.similarity_threshold || 0.6,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const jobData = {
        title: formData.title,
        company: formData.company,
        description: formData.description,
        location: formData.location,
        salary_range: formData.salary_range,
        employment_type: formData.employment_type,
        rules: {
          version: 'v1',
          required_all: formData.required_all
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s),
          required_any: formData.required_any
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s),
          min_years: Number(formData.min_years),
          similarity_threshold: Number(formData.similarity_threshold),
          scoring: {
            enabled: true,
            threshold: 70.0,
            weights: {
              skills_all: 30.0,
              skills_any: 20.0,
              experience: 20.0,
              similarity: 25.0,
              degree: 5.0,
            },
          },
        },
      };

      await onSubmit(jobData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Basic Information</h3>

        <Input
          label="Job Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Senior Backend Developer"
          required
        />

        <Input
          label="Company Name"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="e.g., Tech Corp"
          required
        />

        <Textarea
          label="Job Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the role, responsibilities, and requirements..."
          rows={6}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Remote / New York"
          />

          <Input
            label="Salary Range"
            name="salary_range"
            value={formData.salary_range}
            onChange={handleChange}
            placeholder="e.g., $80k-$120k"
          />
        </div>

        <Select
          label="Employment Type"
          name="employment_type"
          value={formData.employment_type}
          onChange={handleChange}
          options={[
            { value: 'full-time', label: 'Full Time' },
            { value: 'part-time', label: 'Part Time' },
            { value: 'contract', label: 'Contract' },
            { value: 'internship', label: 'Internship' },
          ]}
        />
      </div>

      {/* AI Screening Rules */}
      <div className="space-y-4 pt-6 border-t border-white/20">
        <h3 className="text-xl font-bold text-white">AI Screening Rules</h3>

        <Input
          label="Required Skills (Must Have) - Comma Separated"
          name="required_all"
          value={formData.required_all}
          onChange={handleChange}
          placeholder="e.g., python, sql, aws"
        />

        <Input
          label="Preferred Skills (Nice to Have) - Comma Separated"
          name="required_any"
          value={formData.required_any}
          onChange={handleChange}
          placeholder="e.g., django, fastapi, docker"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Minimum Years of Experience"
            name="min_years"
            type="number"
            min="0"
            value={formData.min_years}
            onChange={handleChange}
          />

          <Input
            label="Similarity Threshold (0.0 - 1.0)"
            name="similarity_threshold"
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={formData.similarity_threshold}
            onChange={handleChange}
          />
        </div>

        <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
          <p className="text-sm text-blue-200">
            <strong>Note:</strong> AI screening will automatically evaluate candidates based on these criteria.
            Candidates must meet all required skills and similarity threshold to be selected.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4 pt-6">
        <GlassButton
          type="submit"
          variant="indigo"
          fullWidth
          loading={loading}
          showArrow
        >
          {initialData ? 'Update Job' : 'Post Job'}
        </GlassButton>

        {onCancel && (
          <GlassButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </GlassButton>
        )}
      </div>
    </form>
  );
};