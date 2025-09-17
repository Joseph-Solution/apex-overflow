-- Fix infinite recursion in RLS policies
-- The issue is with the tasks policy that references project_members which can cause circular references

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own tasks and assigned tasks" ON public.tasks;

-- Create a simpler policy that doesn't cause infinite recursion
CREATE POLICY "Users can view their own tasks and assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() = assigned_to
);

-- Temporarily disable the project-based access until we can fix the circular reference
-- We'll add this back in a future migration once we resolve the recursion issue

-- Also simplify the project_members policy to avoid recursion
DROP POLICY IF EXISTS "Users can view project members for projects they own or are members of" ON public.project_members;

CREATE POLICY "Users can view project members for projects they own" 
ON public.project_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own project memberships" 
ON public.project_members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Simplify task comments policy to avoid recursion
DROP POLICY IF EXISTS "Users can view comments on tasks they can access" ON public.task_comments;
DROP POLICY IF EXISTS "Users can create comments on tasks they can access" ON public.task_comments;

CREATE POLICY "Users can view comments on their own tasks" 
ON public.task_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = task_id AND user_id = auth.uid()
  )
);

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