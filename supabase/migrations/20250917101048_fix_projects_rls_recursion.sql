-- Fix infinite recursion in projects RLS policies

-- Drop the problematic shared projects policy
DROP POLICY IF EXISTS "Users can view shared projects they are members of" ON public.projects;

-- Create a simpler policy for projects that doesn't cause recursion
-- For now, users can only see their own projects
-- We'll add shared project functionality back later with a different approach
CREATE POLICY "Users can view their own projects only" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = owner_id);