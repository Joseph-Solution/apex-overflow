import { z } from 'zod';
import { Tables, TablesInsert, TablesUpdate } from './types';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];

export const ProjectRole = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type ProjectRoleType = typeof ProjectRole[keyof typeof ProjectRole];

export const AISuggestionType = {
  PRIORITY: 'priority',
  BREAKDOWN: 'breakdown',
  SCHEDULING: 'scheduling',
  SIMILAR_TASK: 'similar_task',
  OPTIMIZATION: 'optimization',
} as const;

export type AISuggestionTypeType = typeof AISuggestionType[keyof typeof AISuggestionType];

export const RecurrenceType = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

export type RecurrenceTypeType = typeof RecurrenceType[keyof typeof RecurrenceType];

export const AICapability = {
  TASK_GENERATION: 'task_generation',
  PRIORITY_ANALYSIS: 'priority_analysis',
  SCHEDULING: 'scheduling',
  TEXT_ANALYSIS: 'text_analysis',
} as const;

export type AICapabilityType = typeof AICapability[keyof typeof AICapability];

export const SuggestionFrequency = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type SuggestionFrequencyType = typeof SuggestionFrequency[keyof typeof SuggestionFrequency];

export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type ThemeType = typeof Theme[keyof typeof Theme];

// ============================================================================
// ENHANCED INTERFACES
// ============================================================================

// Recurrence Pattern Interface
export interface RecurrencePattern {
  type: RecurrenceTypeType;
  interval: number;
  days_of_week?: number[]; // 0-6, Sunday = 0
  day_of_month?: number; // 1-31
  end_date?: string;
}

// AI Suggestion Interface
export interface AISuggestion {
  id: string;
  task_id?: string;
  user_id: string;
  type: AISuggestionTypeType;
  content: string;
  confidence?: number;
  applied: boolean;
  created_at: string;
}

// User Preferences Interface
export interface UserPreferences {
  theme: ThemeType;
  notifications: NotificationSettings;
  dashboard_layout: string;
  default_priority: TaskPriorityType;
  work_hours: {
    start: string;
    end: string;
  };
}

// Notification Settings Interface
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  reminder_intervals: number[]; // minutes before due date
}

// AI Settings Interface
export interface AISettings {
  enabled: boolean;
  preferred_models: string[];
  suggestion_frequency: SuggestionFrequencyType;
  auto_apply_suggestions: boolean;
}

// AI Model Configuration Interface
export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  apiKey?: string;
  endpoint?: string;
  capabilities: AICapabilityType[];
}

// Enhanced Task Interface (extends database Task)
export interface Task extends Tables<'tasks'> {
  category?: Category;
  project?: Project;
  parent_task?: Task;
  subtasks?: Task[];
  time_entries?: TimeEntry[];
  ai_suggestions?: AISuggestion[];
  comments?: TaskComment[];
  assigned_user?: Profile;
}

// Type aliases for database tables
export type Category = Tables<'categories'>;
export type Project = Tables<'projects'>;
export type ProjectMember = Tables<'project_members'>;
export type TimeEntry = Tables<'time_entries'>;
export type UserProfile = Tables<'user_profiles'>;
export type TaskComment = Tables<'task_comments'>;
export type Profile = Tables<'profiles'>;

// Insert types
export type CategoryInsert = TablesInsert<'categories'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type ProjectMemberInsert = TablesInsert<'project_members'>;
export type TimeEntryInsert = TablesInsert<'time_entries'>;
export type UserProfileInsert = TablesInsert<'user_profiles'>;
export type TaskCommentInsert = TablesInsert<'task_comments'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type AISuggestionInsert = TablesInsert<'ai_suggestions'>;

// Update types
export type CategoryUpdate = TablesUpdate<'categories'>;
export type ProjectUpdate = TablesUpdate<'projects'>;
export type ProjectMemberUpdate = TablesUpdate<'project_members'>;
export type TimeEntryUpdate = TablesUpdate<'time_entries'>;
export type UserProfileUpdate = TablesUpdate<'user_profiles'>;
export type TaskCommentUpdate = TablesUpdate<'task_comments'>;
export type TaskUpdate = TablesUpdate<'tasks'>;
export type AISuggestionUpdate = TablesUpdate<'ai_suggestions'>;

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

// Recurrence Pattern Schema
export const RecurrencePatternSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().min(1),
  days_of_week: z.array(z.number().min(0).max(6)).optional(),
  day_of_month: z.number().min(1).max(31).optional(),
  end_date: z.string().optional(),
});

// User Preferences Schema
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    reminder_intervals: z.array(z.number()),
  }),
  dashboard_layout: z.string(),
  default_priority: z.enum(['low', 'medium', 'high']),
  work_hours: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

// AI Settings Schema
export const AISettingsSchema = z.object({
  enabled: z.boolean(),
  preferred_models: z.array(z.string()),
  suggestion_frequency: z.enum(['high', 'medium', 'low']),
  auto_apply_suggestions: z.boolean(),
});

// Category Schema
export const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  user_id: z.string().uuid(),
  created_at: z.string().optional(),
});

// Project Schema
export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  owner_id: z.string().uuid(),
  is_shared: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Enhanced Task Schema
export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().optional(),
  category_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  parent_task_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  estimated_duration: z.number().min(0).optional(), // minutes
  actual_duration: z.number().min(0).optional(), // minutes
  recurrence_pattern: RecurrencePatternSchema.optional(),
  assigned_to: z.string().uuid().optional(),
  position: z.number().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Time Entry Schema
export const TimeEntrySchema = z.object({
  id: z.string().uuid().optional(),
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_time: z.string(),
  end_time: z.string().optional(),
  duration: z.number().optional(), // seconds
  description: z.string().optional(),
  created_at: z.string().optional(),
});

// AI Suggestion Schema
export const AISuggestionSchema = z.object({
  id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  type: z.enum(['priority', 'breakdown', 'scheduling', 'similar_task', 'optimization']),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  applied: z.boolean().default(false),
  created_at: z.string().optional(),
});

// Task Comment Schema
export const TaskCommentSchema = z.object({
  id: z.string().uuid().optional(),
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().min(1),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  preferences: UserPreferencesSchema,
  ai_settings: AISettingsSchema,
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Project Member Schema
export const ProjectMemberSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'editor', 'viewer']).default('viewer'),
  joined_at: z.string().optional(),
});

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Task with relations
export interface TaskWithRelations extends Task {
  category?: Category;
  project?: Project;
  parent_task?: Task;
  subtasks?: Task[];
  time_entries?: TimeEntry[];
  ai_suggestions?: AISuggestion[];
  comments?: TaskComment[];
  assigned_user?: Profile;
}

// Project with members
export interface ProjectWithMembers extends Project {
  members?: (ProjectMember & { user?: Profile })[];
  tasks?: Task[];
}

// Productivity Statistics
export interface ProductivityStats {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  average_completion_time: number; // in minutes
  current_streak: number; // days
  longest_streak: number; // days
  tasks_by_priority: Record<TaskPriorityType, number>;
  tasks_by_category: Record<string, number>;
  productivity_trends: TimeSeriesData[];
}

// Time Series Data for charts
export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

// Task Context for AI
export interface TaskContext {
  user_id: string;
  recent_tasks: Task[];
  user_patterns: UserPattern[];
  current_workload: number;
  preferences: UserPreferences;
}

// User Pattern for AI analysis
export interface UserPattern {
  pattern_type: 'completion_time' | 'priority_preference' | 'category_usage' | 'scheduling';
  pattern_data: Record<string, any>;
  confidence: number;
  last_updated: string;
}

// Scheduling Suggestion
export interface SchedulingSuggestion {
  task_id: string;
  suggested_start_time: string;
  suggested_duration: number; // minutes
  reasoning: string;
  confidence: number;
}

// Dashboard Layout Configuration
export interface DashboardLayout {
  sections: DashboardSection[];
  columns: number;
  compact_mode: boolean;
}

export interface DashboardSection {
  id: string;
  title: string;
  type: 'tasks' | 'analytics' | 'time_tracking' | 'ai_suggestions' | 'recent_activity';
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
  settings: Record<string, any>;
}

// Error types for better error handling
export interface TaskManagementError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export const ErrorCodes = {
  // Task errors
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TASK_ACCESS_DENIED: 'TASK_ACCESS_DENIED',
  INVALID_TASK_DATA: 'INVALID_TASK_DATA',
  
  // Project errors
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_ACCESS_DENIED: 'PROJECT_ACCESS_DENIED',
  MEMBER_ALREADY_EXISTS: 'MEMBER_ALREADY_EXISTS',
  INVALID_ROLE: 'INVALID_ROLE',
  
  // AI errors
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_RATE_LIMIT_EXCEEDED: 'AI_RATE_LIMIT_EXCEEDED',
  AI_INVALID_INPUT: 'AI_INVALID_INPUT',
  AI_PROCESSING_TIMEOUT: 'AI_PROCESSING_TIMEOUT',
  
  // Time tracking errors
  TIME_ENTRY_OVERLAP: 'TIME_ENTRY_OVERLAP',
  INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export type ErrorCodeType = typeof ErrorCodes[keyof typeof ErrorCodes];