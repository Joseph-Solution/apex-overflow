-- Complete Enhanced Schema Migration
-- This migration ensures ALL enhanced features are present in the cloud database

-- Add missing columns to tasks table if they don't exist
DO $$ 
BEGIN
    -- Add estimated_duration column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'estimated_duration') THEN
        ALTER TABLE public.tasks ADD COLUMN estimated_duration INTEGER;
    END IF;
    
    -- Add actual_duration column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'actual_duration') THEN
        ALTER TABLE public.tasks ADD COLUMN actual_duration INTEGER;
    END IF;
    
    -- Add recurrence_pattern column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'recurrence_pattern') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence_pattern JSONB;
    END IF;
    
    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.tasks ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
    END IF;
END $$;

-- Create project_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create time_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}',
  ai_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_suggestions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('priority', 'breakdown', 'scheduling', 'similar_task', 'optimization')),
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON public.time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_task_id ON public.ai_suggestions(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON public.ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON public.ai_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);

-- Enable RLS on new tables
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_members
DROP POLICY IF EXISTS "Users can view project members for projects they own" ON public.project_members;
CREATE POLICY "Users can view project members for projects they own" 
ON public.project_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view their own project memberships" ON public.project_members;
CREATE POLICY "Users can view their own project memberships" 
ON public.project_members 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Project owners can manage project members" ON public.project_members;
CREATE POLICY "Project owners can manage project members" 
ON public.project_members 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND owner_id = auth.uid()
  )
);

-- RLS Policies for time_entries
DROP POLICY IF EXISTS "Users can view their own time entries" ON public.time_entries;
CREATE POLICY "Users can view their own time entries" 
ON public.time_entries 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own time entries" ON public.time_entries;
CREATE POLICY "Users can create their own time entries" 
ON public.time_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own time entries" ON public.time_entries;
CREATE POLICY "Users can update their own time entries" 
ON public.time_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own time entries" ON public.time_entries;
CREATE POLICY "Users can delete their own time entries" 
ON public.time_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own user profile" ON public.user_profiles;
CREATE POLICY "Users can view their own user profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own user profile" ON public.user_profiles;
CREATE POLICY "Users can create their own user profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own user profile" ON public.user_profiles;
CREATE POLICY "Users can update their own user profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for ai_suggestions
DROP POLICY IF EXISTS "Users can view their own AI suggestions" ON public.ai_suggestions;
CREATE POLICY "Users can view their own AI suggestions" 
ON public.ai_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own AI suggestions" ON public.ai_suggestions;
CREATE POLICY "Users can create their own AI suggestions" 
ON public.ai_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own AI suggestions" ON public.ai_suggestions;
CREATE POLICY "Users can update their own AI suggestions" 
ON public.ai_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own AI suggestions" ON public.ai_suggestions;
CREATE POLICY "Users can delete their own AI suggestions" 
ON public.ai_suggestions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for task_comments
DROP POLICY IF EXISTS "Users can view comments on their own tasks" ON public.task_comments;
CREATE POLICY "Users can view comments on their own tasks" 
ON public.task_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = task_id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create comments on their own tasks" ON public.task_comments;
CREATE POLICY "Users can create comments on their own tasks" 
ON public.task_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = task_id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.task_comments;
CREATE POLICY "Users can update their own comments" 
ON public.task_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.task_comments;
CREATE POLICY "Users can delete their own comments" 
ON public.task_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update tasks policy to handle assigned tasks
DROP POLICY IF EXISTS "Users can view their own tasks and assigned tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks and assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() = assigned_to
);

-- Create missing functions
CREATE OR REPLACE FUNCTION public.calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = '';

CREATE OR REPLACE FUNCTION public.update_task_actual_duration()
RETURNS TRIGGER AS $$
DECLARE
  total_duration INTEGER;
BEGIN
  SELECT COALESCE(SUM(duration), 0) INTO total_duration
  FROM public.time_entries 
  WHERE task_id = COALESCE(NEW.task_id, OLD.task_id) AND duration IS NOT NULL;
  
  UPDATE public.tasks 
  SET actual_duration = (total_duration / 60)::INTEGER
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, preferences, ai_settings)
  VALUES (
    NEW.id,
    '{
      "theme": "system",
      "notifications": {
        "email": true,
        "push": true,
        "reminder_intervals": [15, 60, 1440]
      },
      "dashboard_layout": "default",
      "default_priority": "medium",
      "work_hours": {
        "start": "09:00",
        "end": "17:00"
      }
    }'::jsonb,
    '{
      "enabled": true,
      "preferred_models": ["gpt-3.5-turbo"],
      "suggestion_frequency": "medium",
      "auto_apply_suggestions": false
    }'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS calculate_time_entry_duration_trigger ON public.time_entries;
CREATE TRIGGER calculate_time_entry_duration_trigger
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_time_entry_duration();

DROP TRIGGER IF EXISTS update_task_actual_duration_trigger ON public.time_entries;
CREATE TRIGGER update_task_actual_duration_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_actual_duration();

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();