import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';

interface GradeConfig {
  required: boolean;
  type: 'cgpa_10' | 'percentage' | 'gpa_4';
  value: number;
  normalized: number;
}

interface MinimumQualificationConfig {
  level: '10th' | '12th_diploma' | 'bachelor' | 'master' | 'phd';
  grade?: GradeConfig;
}

interface DegreeRequirementConfig {
  enabled: boolean;
  level: 'bachelor' | 'master' | 'phd';
  fields: string[];
  accept_related_fields: boolean;
  grade?: GradeConfig;
}

interface EducationRequirementsData {
  enabled: boolean;
  minimum_qualification?: MinimumQualificationConfig;
  degree_requirement?: DegreeRequirementConfig;
  alternative_paths?: {
    experience_substitute?: {
      enabled: boolean;
      years_required: number;
    };
  };
}

interface EducationRequirementsProps {
  value: EducationRequirementsData;
  onChange: (value: EducationRequirementsData) => void;
}

const COMMON_FIELDS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Electronics and Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Marketing',
  'Finance',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
];

export const EducationRequirements: React.FC<EducationRequirementsProps> = ({ value, onChange }) => {
  const [newField, setNewField] = useState('');

  const convertGrade = (gradeValue: number, fromType: string, toType: string): number => {
    // First convert to percentage
    let percentage: number;
    
    if (fromType === 'cgpa_10') {
      percentage = gradeValue * 10;
    } else if (fromType === 'gpa_4') {
      percentage = (gradeValue / 4) * 100;
    } else {
      percentage = gradeValue;
    }

    // Then convert from percentage to target type
    if (toType === 'cgpa_10') {
      return percentage / 10;
    } else if (toType === 'gpa_4') {
      return (percentage / 100) * 4;
    } else {
      return percentage;
    }
  };

  const handleMinQualificationChange = (level: MinimumQualificationConfig['level']) => {
    onChange({
      ...value,
      minimum_qualification: {
        level,
        grade: value.minimum_qualification?.grade,
      },
    });
  };

  const handleMinGradeChange = (field: keyof GradeConfig, gradeValue: any) => {
    const currentGrade = value.minimum_qualification?.grade || {
      required: false,
      type: 'percentage' as const,
      value: 0,
      normalized: 0,
    };

    let updatedGrade = { ...currentGrade, [field]: gradeValue };

    // Recalculate normalized value if type or value changes
    if (field === 'type' || field === 'value') {
      const val = field === 'value' ? parseFloat(gradeValue) : currentGrade.value;
      const type = field === 'type' ? gradeValue : currentGrade.type;
      updatedGrade.normalized = convertGrade(val, type, 'percentage');
    }

    onChange({
      ...value,
      minimum_qualification: {
        ...value.minimum_qualification!,
        grade: updatedGrade,
      },
    });
  };

  const handleDegreeRequirementChange = (field: keyof DegreeRequirementConfig, degreeValue: any) => {
    onChange({
      ...value,
      degree_requirement: {
        ...value.degree_requirement!,
        [field]: degreeValue,
      },
    });
  };

  const handleDegreeGradeChange = (field: keyof GradeConfig, gradeValue: any) => {
    const currentGrade = value.degree_requirement?.grade || {
      required: true,
      type: 'cgpa_10' as const,
      value: 0,
      normalized: 0,
    };

    let updatedGrade = { ...currentGrade, [field]: gradeValue };

    if (field === 'type' || field === 'value') {
      const val = field === 'value' ? parseFloat(gradeValue) : currentGrade.value;
      const type = field === 'type' ? gradeValue : currentGrade.type;
      updatedGrade.normalized = convertGrade(val, type, 'percentage');
    }

    onChange({
      ...value,
      degree_requirement: {
        ...value.degree_requirement!,
        grade: updatedGrade,
      },
    });
  };

  const addField = (field: string) => {
    if (!field.trim()) return;
    
    const currentFields = value.degree_requirement?.fields || [];
    if (!currentFields.includes(field)) {
      handleDegreeRequirementChange('fields', [...currentFields, field]);
    }
    setNewField('');
  };

  const removeField = (field: string) => {
    const currentFields = value.degree_requirement?.fields || [];
    handleDegreeRequirementChange(
      'fields',
      currentFields.filter((f) => f !== field)
    );
  };

  const getGradeEquivalents = (gradeValue: number, type: string) => {
    const percentage = convertGrade(gradeValue, type, 'percentage');
    const cgpa = convertGrade(gradeValue, type, 'cgpa_10');
    const gpa = convertGrade(gradeValue, type, 'gpa_4');

    return `≈ ${percentage.toFixed(1)}% | ${cgpa.toFixed(2)} CGPA | ${gpa.toFixed(2)} GPA`;
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="education-enabled"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="w-5 h-5 rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-indigo-500"
        />
        <label htmlFor="education-enabled" className="text-white font-medium text-lg">
          Require Specific Education Qualifications
        </label>
      </div>

      {value.enabled && (
        <>
          {/* STAGE 1: Minimum Qualification */}
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-4">
              Stage 1: Minimum Qualification (Required) *
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-white/90 font-medium mb-3">
                  Select Minimum Qualification Level:
                </label>
                <div className="space-y-2">
                  {[
                    { value: '10th', label: '10th Standard' },
                    { value: '12th_diploma', label: '12th Standard OR Diploma (Either one required)' },
                    { value: 'bachelor', label: "Bachelor's Degree" },
                    { value: 'master', label: "Master's Degree" },
                    { value: 'phd', label: 'PhD' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <input
                        type="radio"
                        name="min-qualification"
                        value={option.value}
                        checked={value.minimum_qualification?.level === option.value}
                        onChange={(e) => handleMinQualificationChange(e.target.value as any)}
                        className="w-4 h-4 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Grade requirement for minimum qualification */}
              {(value.minimum_qualification?.level === '12th_diploma' ||
                value.minimum_qualification?.level === '10th') && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/20">
                  <h4 className="text-white font-semibold mb-3">
                    Minimum Grade (Optional)
                  </h4>

                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="min-grade-required"
                      checked={value.minimum_qualification?.grade?.required || false}
                      onChange={(e) => handleMinGradeChange('required', e.target.checked)}
                      className="w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-500"
                    />
                    <label htmlFor="min-grade-required" className="text-white/90">
                      Require minimum grade
                    </label>
                  </div>

                  {value.minimum_qualification?.grade?.required && (
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/80 text-sm mb-2">Grade Type:</label>
                          <select
                            value={value.minimum_qualification.grade.type}
                            onChange={(e) => handleMinGradeChange('type', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="percentage">Percentage (0-100)</option>
                            <option value="cgpa_10">CGPA (0-10 scale)</option>
                            <option value="gpa_4">GPA (0-4 scale)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white/80 text-sm mb-2">Minimum Value:</label>
                          <input
                            type="number"
                            step="0.1"
                            value={value.minimum_qualification.grade.value}
                            onChange={(e) => handleMinGradeChange('value', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {value.minimum_qualification.grade.value > 0 && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                          <p className="text-indigo-200 text-sm">
                            💡 <strong>Equivalent:</strong>{' '}
                            {getGradeEquivalents(
                              value.minimum_qualification.grade.value,
                              value.minimum_qualification.grade.type
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassCard>

          {/* STAGE 2: Degree Requirement */}
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-4">
              Stage 2: Higher Qualification (Optional)
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="degree-enabled"
                  checked={value.degree_requirement?.enabled || false}
                  onChange={(e) =>
                    handleDegreeRequirementChange('enabled', e.target.checked)
                  }
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-500"
                />
                <label htmlFor="degree-enabled" className="text-white font-medium">
                  Require Degree
                </label>
              </div>

              {value.degree_requirement?.enabled && (
                <>
                  {/* Degree Level */}
                  <div>
                    <label className="block text-white/90 font-medium mb-3">
                      Degree Level:
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'bachelor', label: "Bachelor's Degree" },
                        { value: 'master', label: "Master's Degree" },
                        { value: 'phd', label: 'PhD' },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                        >
                          <input
                            type="radio"
                            name="degree-level"
                            value={option.value}
                            checked={value.degree_requirement?.level === option.value}
                            onChange={(e) =>
                              handleDegreeRequirementChange('level', e.target.value)
                            }
                            className="w-4 h-4 text-indigo-500"
                          />
                          <span className="text-white">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Field/Branch Selection */}
                  <div>
                    <label className="block text-white/90 font-medium mb-2">
                      Field/Branch of Study: *
                    </label>

                    {/* Selected Fields */}
                    {value.degree_requirement.fields.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {value.degree_requirement.fields.map((field) => (
                          <span
                            key={field}
                            className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded-lg text-indigo-200 text-sm flex items-center space-x-2"
                          >
                            <span>{field}</span>
                            <button
                              onClick={() => removeField(field)}
                              className="text-indigo-300 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Common Fields Selector */}
                    <select
                      value=""
                      onChange={(e) => addField(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                    >
                      <option value="">Select a field...</option>
                      {COMMON_FIELDS.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>

                    {/* Custom Field Input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newField}
                        onChange={(e) => setNewField(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addField(newField)}
                        placeholder="Or type custom field..."
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <GlassButton
                        variant="secondary"
                        onClick={() => addField(newField)}
                      >
                        Add
                      </GlassButton>
                    </div>
                  </div>

                  {/* Related Fields Toggle */}
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                    <input
                      type="checkbox"
                      id="accept-related"
                      checked={value.degree_requirement.accept_related_fields}
                      onChange={(e) =>
                        handleDegreeRequirementChange(
                          'accept_related_fields',
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-500"
                    />
                    <label htmlFor="accept-related" className="text-white/90 text-sm">
                      Accept Related Fields (AI will match similar fields)
                      <br />
                      <span className="text-white/60 text-xs">
                        e.g., "Software Engineering" for "Computer Science"
                      </span>
                    </label>
                  </div>

                  {/* Degree Grade Requirements */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/20">
                    <h4 className="text-white font-semibold mb-3">Grade Requirements</h4>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/80 text-sm mb-2">
                            Grade Type:
                          </label>
                          <select
                            value={
                              value.degree_requirement.grade?.type || 'cgpa_10'
                            }
                            onChange={(e) => handleDegreeGradeChange('type', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="cgpa_10">CGPA (0-10 scale)</option>
                            <option value="percentage">Percentage (0-100)</option>
                            <option value="gpa_4">GPA (0-4 scale)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white/80 text-sm mb-2">
                            Minimum Value:
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={value.degree_requirement.grade?.value || 0}
                            onChange={(e) =>
                              handleDegreeGradeChange('value', e.target.value)
                            }
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {(value.degree_requirement.grade?.value || 0) > 0 && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                          <p className="text-indigo-200 text-sm">
                            💡 <strong>Equivalent:</strong>{' '}
                            {getGradeEquivalents(
                              value.degree_requirement.grade?.value || 0,
                              value.degree_requirement.grade?.type || 'cgpa_10'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Alternative Paths */}
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-4">
              Alternative Paths (Optional)
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="exp-substitute"
                  checked={
                    value.alternative_paths?.experience_substitute?.enabled || false
                  }
                  onChange={(e) =>
                    onChange({
                      ...value,
                      alternative_paths: {
                        experience_substitute: {
                          enabled: e.target.checked,
                          years_required:
                            value.alternative_paths?.experience_substitute
                              ?.years_required || 5,
                        },
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-500"
                />
                <label htmlFor="exp-substitute" className="text-white font-medium">
                  Allow work experience as substitute for degree
                </label>
              </div>

              {value.alternative_paths?.experience_substitute?.enabled && (
                <div className="ml-7">
                  <label className="block text-white/80 text-sm mb-2">
                    Years of experience required:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={
                      value.alternative_paths.experience_substitute.years_required
                    }
                    onChange={(e) =>
                      onChange({
                        ...value,
                        alternative_paths: {
                          experience_substitute: {
                            enabled: true,
                            years_required: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-32 px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-white/60 text-sm mt-2">
                    Candidates with{' '}
                    {value.alternative_paths.experience_substitute.years_required}+ years
                    of relevant experience can substitute for degree requirements
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
};