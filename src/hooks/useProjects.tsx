import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Project, ProjectInsert, ProjectUpdate } from '@/integrations/supabase/enhanced-types';

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueTasks: number;
  upcomingTasks: number;
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<ProjectInsert, 'owner_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setProjects(prev => [...prev, data as Project].sort((a, b) => a.name.localeCompare(b.name)));
      return { data, error: null };
    } catch (error) {
      console.error('Error creating project:', error);
      return { data: null, error };
    }
  };

  const updateProject = async (id: string, updates: ProjectUpdate) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      setProjects(prev => 
        prev.map(project => project.id === id ? data as Project : project)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return { data, error: null };
    } catch (error) {
      console.error('Error updating project:', error);
      return { data: null, error };
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('owner_id', user?.id);

      if (error) throw error;
      setProjects(prev => prev.filter(project => project.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { error };
    }
  };

  const getProjectById = (id: string) => {
    return projects.find(project => project.id === id);
  };

  const getProjectStats = async (projectId: string): Promise<ProjectStats> => {
    if (!user) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        overdueTasks: 0,
        upcomingTasks: 0,
      };
    }

    try {
      // Get all tasks for this project
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('completed, due_date')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(task => task.completed).length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const now = new Date();
      const overdueTasks = tasks?.filter(task => 
        !task.completed && 
        task.due_date && 
        new Date(task.due_date) < now
      ).length || 0;

      const upcomingTasks = tasks?.filter(task => 
        !task.completed && 
        task.due_date && 
        new Date(task.due_date) >= now &&
        new Date(task.due_date) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      ).length || 0;

      return {
        totalTasks,
        completedTasks,
        completionRate: Math.round(completionRate),
        overdueTasks,
        upcomingTasks,
      };
    } catch (error) {
      console.error('Error getting project stats:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        overdueTasks: 0,
        upcomingTasks: 0,
      };
    }
  };

  const getProjectProgress = async (projectId: string): Promise<{ completed: number; total: number }> => {
    if (!user) return { completed: 0, total: 0 };

    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('completed')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      const total = tasks?.length || 0;
      const completed = tasks?.filter(task => task.completed).length || 0;

      return { completed, total };
    } catch (error) {
      console.error('Error getting project progress:', error);
      return { completed: 0, total: 0 };
    }
  };

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectStats,
    getProjectProgress,
    refetch: fetchProjects,
  };
};