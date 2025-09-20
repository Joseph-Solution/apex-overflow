-- Ensure Enhanced Schema Exists
-- This migration ensures that all enhanced task management tables exist in the cloud database

-- Check and create categories table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        CREATE TABLE public.categories (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          color VARCHAR(7) NOT NULL, -- hex color code
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          UNIQUE(user_id, name) -- Prevent duplicate category names per user
        );
        
        -- Enable RLS
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own categories" 
        ON public.categories 
        FOR SELECT 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can create their own categories" 
        ON public.categories 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own categories" 
        ON public.categories 
        FOR UPDATE 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own categories" 
        ON public.categories 
        FOR DELETE 
        USING (auth.uid() = user_id);
        
        -- Create index
        CREATE INDEX idx_categories_user_id ON public.categories(user_id);
    END IF;
END $$;

-- Check and create projects table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        CREATE TABLE public.projects (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- default blue color
          owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          is_shared BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own projects" 
        ON public.projects 
        FOR SELECT 
        USING (auth.uid() = owner_id);

        CREATE POLICY "Users can create their own projects" 
        ON public.projects 
        FOR INSERT 
        WITH CHECK (auth.uid() = owner_id);

        CREATE POLICY "Project owners can update their projects" 
        ON public.projects 
        FOR UPDATE 
        USING (auth.uid() = owner_id);

        CREATE POLICY "Project owners can delete their projects" 
        ON public.projects 
        FOR DELETE 
        USING (auth.uid() = owner_id);
        
        -- Create indexes
        CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_projects_updated_at
          BEFORE UPDATE ON public.projects
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Check and add new columns to tasks table if they don't exist
DO $$ 
BEGIN
    -- Add category_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'category_id') THEN
        ALTER TABLE public.tasks ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
        CREATE INDEX idx_tasks_category_id ON public.tasks(category_id);
    END IF;
    
    -- Add project_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'project_id') THEN
        ALTER TABLE public.tasks ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
        CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
    END IF;
    
    -- Add parent_task_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'parent_task_id') THEN
        ALTER TABLE public.tasks ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;
        CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'tags') THEN
        ALTER TABLE public.tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
        CREATE INDEX idx_tasks_tags ON public.tasks USING GIN(tags);
    END IF;
    
    -- Add position column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'position') THEN
        ALTER TABLE public.tasks ADD COLUMN position INTEGER DEFAULT 0;
        CREATE INDEX idx_tasks_position ON public.tasks(position);
    END IF;
END $$;