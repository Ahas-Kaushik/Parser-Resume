// ========================================
// Type Definitions
// ========================================

export type UserRole = 'candidate' | 'employer';

export type ApplicationStatus = 'pending' | 'selected' | 'rejected' | 'withdrawn';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirm: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  description?: string;
  location?: string;
  salary_range?: string;
  employment_type?: string;
  employer_id: number;
  is_active: boolean;
  created_at: string;
  rules?: JobRules;
}

export interface JobRules {
  version?: string;
  role?: string;
  required_all?: string[];
  required_any?: string[];
  any_min?: number;
  min_years?: number;
  forbidden_keywords?: string[];
  similarity_threshold?: number;
  allowed_degrees?: string[];
  min_degree_level?: string;
  allowed_locations?: string[];
  allow_remote?: boolean;
  require_work_auth?: boolean;
  scoring?: {
    enabled?: boolean;
    threshold?: number;
    weights?: {
      skills_all?: number;
      skills_any?: number;
      experience?: number;
      similarity?: number;
      degree?: number;
    };
  };
}

export interface ApplicationExplanation {
  file?: string;
  decision?: string;
  score?: number;
  rule_version?: string;
  role?: string;
  summary?: {
    passed?: boolean;
    reasons_pass?: string[];
    reasons_fail?: string[];
  };
  skills?: {
    candidate_skills?: string[];
    matched_required_all?: string[];
    missing_required_all?: string[];
    matched_required_any?: string[];
    missing_required_any?: string[];
    target_skills?: string[];
    similarity?: number;
    similarity_threshold?: number;
  };
  experience?: {
    estimated_years?: number;
    min_required_years?: number;
    meets_requirement?: boolean;
  };
  education?: {
    degrees_found?: string[];
    highest_degree?: string;
    allowed_degrees?: string[];
    min_degree_level?: string;
    meets_requirement?: boolean;
  };
  location?: {
    allowed_locations?: string[];
    allow_remote?: boolean;
    meets_requirement?: boolean;
  };
  work_authorization?: {
    required?: boolean;
    found?: boolean;
    meets_requirement?: boolean;
  };
  forbidden_keywords?: {
    found?: string[];
    passed?: boolean;
  };
  scoring?: {
    enabled?: boolean;
    score?: number;
    threshold?: number;
    weights?: Record<string, number>;
  };
}

export interface Application {
  id: number;
  job_id: number;
  candidate_id: number;
  name: string;
  phone: string;
  current_company?: string;
  current_position?: string;
  current_salary?: number;
  resume_path: string;
  status: ApplicationStatus;
  score?: number;
  explanation?: ApplicationExplanation;
  created_at: string;
}

export interface ApplicationListItem {
  id: number;
  job_id: number;
  job_title: string;
  company: string;
  status: ApplicationStatus;
  score?: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  receiver_id?: number;
  message: string;
  is_global: boolean;
  created_at: string;
}

export interface JobStats {
  job_id: number;
  total_applications: number;
  selected_count: number;
  rejected_count: number;
  pending_count: number;
  avg_score?: number;
  top_skills: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}