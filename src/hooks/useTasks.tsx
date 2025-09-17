import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Task = Tables<'tasks'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type TaskUpdate = TablesUpdate<'tasks'>;

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<TaskInsert, 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [data as Task, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error creating task:', error);
      return { data: null, error };
    }
  };

  const updateTask = async (id: string, updates: TaskUpdate) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(task => task.id === id ? data as Task : task));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating task:', error);
      return { data: null, error };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(prev => prev.filter(task => task.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { error };
    }
  };

  const getSubtasks = (parentId: string): Task[] => {
    return tasks.filter(task => task.parent_task_id === parentId);
  };

  const getParentTask = (childId: string): Task | undefined => {
    const childTask = tasks.find(task => task.id === childId);
    if (!childTask?.parent_task_id) return undefined;
    return tasks.find(task => task.id === childTask.parent_task_id);
  };

  const getTaskHierarchy = (taskId: string): { task: Task; subtasks: Task[] } | null => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    const subtasks = getSubtasks(taskId);
    return { task, subtasks };
  };

  const updateTaskCompletion = async (id: string, completed: boolean) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return { error: 'Task not found' };

    try {
      // Update the task itself
      const { error: updateError } = await updateTask(id, { completed });
      if (updateError) throw updateError;

      // If this is a parent task being completed, optionally complete all subtasks
      if (completed && !task.parent_task_id) {
        const subtasks = getSubtasks(id);
        for (const subtask of subtasks) {
          if (!subtask.completed) {
            await updateTask(subtask.id, { completed: true });
          }
        }
      }

      // If this is a subtask being completed, check if all siblings are completed
      // and optionally complete the parent
      if (completed && task.parent_task_id) {
        const siblings = getSubtasks(task.parent_task_id);
        const allSiblingsCompleted = siblings.every(sibling => 
          sibling.id === id || sibling.completed
        );
        
        if (allSiblingsCompleted) {
          const parentTask = tasks.find(t => t.id === task.parent_task_id);
          if (parentTask && !parentTask.completed) {
            await updateTask(parentTask.id, { completed: true });
          }
        }
      }

      // If this is a subtask being uncompleted, uncheck the parent if it was completed
      if (!completed && task.parent_task_id) {
        const parentTask = tasks.find(t => t.id === task.parent_task_id);
        if (parentTask && parentTask.completed) {
          await updateTask(parentTask.id, { completed: false });
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating task completion:', error);
      return { error };
    }
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    updateTaskCompletion,
    getSubtasks,
    getParentTask,
    getTaskHierarchy,
    refetch: fetchTasks,
  };
};