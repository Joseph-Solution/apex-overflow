import { useMemo } from 'react';
import { Task } from './useTasks';
import { FilterOptions } from '@/components/FilterPanel';

export const useTaskFilters = (tasks: Task[], filters: FilterOptions) => {
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter - search across title, description, and tags
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchTerm);
        const matchesDescription = task.description?.toLowerCase().includes(searchTerm) || false;
        const matchesTags = task.tags?.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        ) || false;
        
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const now = new Date();
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const isOverdue = dueDate && dueDate < now && !task.completed;

        switch (filters.status) {
          case 'completed':
            if (!task.completed) return false;
            break;
          case 'pending':
            if (task.completed || isOverdue) return false;
            break;
          case 'overdue':
            if (!isOverdue) return false;
            break;
        }
      }

      // Category filter
      if (filters.category && task.category_id !== filters.category) {
        return false;
      }

      // Tags filter - task must have ALL selected tags
      if (filters.tags.length > 0) {
        const taskTags = task.tags || [];
        const hasAllTags = filters.tags.every(filterTag => 
          taskTags.includes(filterTag)
        );
        if (!hasAllTags) return false;
      }

      // Projects filter - task must be in one of the selected projects
      if (filters.projects.length > 0) {
        if (!task.project_id || !filters.projects.includes(task.project_id)) {
          return false;
        }
      }

      // Due date range filter
      if (filters.dueDateRange !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDate = task.due_date ? new Date(task.due_date) : null;

        switch (filters.dueDateRange) {
          case 'today':
            if (!dueDate) return false;
            const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            if (taskDate.getTime() !== today.getTime()) return false;
            break;
          case 'week':
            if (!dueDate) return false;
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            if (dueDate < today || dueDate > weekFromNow) return false;
            break;
          case 'month':
            if (!dueDate) return false;
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            if (dueDate < today || dueDate > monthFromNow) return false;
            break;
          case 'overdue':
            if (!dueDate || dueDate >= now || task.completed) return false;
            break;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  // Calculate filter statistics
  const filterStats = useMemo(() => {
    const total = tasks.length;
    const filtered = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.completed).length;
    const pending = filteredTasks.filter(t => !t.completed).length;
    const overdue = filteredTasks.filter(t => {
      const dueDate = t.due_date ? new Date(t.due_date) : null;
      return dueDate && dueDate < new Date() && !t.completed;
    }).length;

    return {
      total,
      filtered,
      completed,
      pending,
      overdue,
      completionRate: filtered > 0 ? Math.round((completed / filtered) * 100) : 0,
    };
  }, [tasks, filteredTasks]);

  return {
    filteredTasks,
    filterStats,
  };
};

export default useTaskFilters;