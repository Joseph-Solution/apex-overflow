import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useTaskFilters } from '../useTaskFilters';
import { Task } from '../useTasks';
import { FilterOptions } from '@/components/FilterPanel';

describe('useTaskFilters', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Complete project proposal',
      description: 'Write detailed proposal for new client',
      completed: false,
      priority: 'high',
      due_date: '2024-01-15',
      category_id: 'cat1',
      project_id: 'proj1',
      tags: ['work', 'urgent'],
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: '2',
      title: 'Buy groceries',
      description: 'Milk, bread, eggs',
      completed: true,
      priority: 'low',
      due_date: '2024-01-10',
      category_id: 'cat2',
      project_id: 'proj2',
      tags: ['personal', 'shopping'],
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
    {
      id: '3',
      title: 'Review code',
      description: 'Review pull request #123',
      completed: false,
      priority: 'medium',
      due_date: '2024-01-05', // Overdue
      category_id: 'cat1',
      project_id: 'proj1',
      tags: ['work', 'review'],
      created_at: '2024-01-03',
      updated_at: '2024-01-03',
    },
    {
      id: '4',
      title: 'Plan vacation',
      description: 'Research destinations and book flights',
      completed: false,
      priority: 'low',
      due_date: '2024-02-01',
      category_id: 'cat2',
      project_id: null,
      tags: ['personal', 'travel'],
      created_at: '2024-01-04',
      updated_at: '2024-01-04',
    },
    {
      id: '5',
      title: 'Subtask example',
      description: 'This is a subtask',
      completed: false,
      priority: 'medium',
      parent_task_id: '1',
      tags: ['work'],
      created_at: '2024-01-05',
      updated_at: '2024-01-05',
    },
  ];

  const defaultFilters: FilterOptions = {
    search: '',
    priority: 'all',
    status: 'all',
    category: null,
    tags: [],
    projects: [],
    dueDateRange: 'all',
  };

  it('returns all tasks when no filters are applied', () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks, defaultFilters));

    expect(result.current.filteredTasks).toHaveLength(5);
    expect(result.current.filterStats.total).toBe(5);
    expect(result.current.filterStats.filtered).toBe(5);
  });

  it('filters tasks by search term in title', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      search: 'project',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('Complete project proposal');
  });

  it('filters tasks by search term in description', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      search: 'pull request',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('Review code');
  });

  it('filters tasks by search term in tags', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      search: 'urgent',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('Complete project proposal');
  });

  it('filters tasks by priority', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      priority: 'high',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].priority).toBe('high');
  });

  it('filters tasks by completed status', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      status: 'completed',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].completed).toBe(true);
  });

  it('filters tasks by pending status', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      status: 'pending',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    // Should exclude completed and overdue tasks
    const pendingTasks = result.current.filteredTasks;
    expect(pendingTasks.every(task => !task.completed)).toBe(true);
    
    // Should not include the overdue task (id: '3' with due_date: '2024-01-05')
    const hasOverdueTask = pendingTasks.some(task => 
      task.due_date && new Date(task.due_date) < new Date() && !task.completed
    );
    expect(hasOverdueTask).toBe(false);
  });

  it('filters tasks by overdue status', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      status: 'overdue',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].id).toBe('3'); // The overdue task
  });

  it('filters tasks by category', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      category: 'cat1',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(2);
    expect(result.current.filteredTasks.every(task => task.category_id === 'cat1')).toBe(true);
  });

  it('filters tasks by tags (must have all selected tags)', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      tags: ['work', 'urgent'],
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('Complete project proposal');
  });

  it('filters tasks by single tag', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      tags: ['personal'],
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(2);
    expect(result.current.filteredTasks.every(task => 
      task.tags?.includes('personal')
    )).toBe(true);
  });

  it('filters tasks by project', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      projects: ['proj1'],
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(2);
    expect(result.current.filteredTasks.every(task => task.project_id === 'proj1')).toBe(true);
  });

  it('filters tasks by multiple projects', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      projects: ['proj1', 'proj2'],
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(3);
    expect(result.current.filteredTasks.every(task => 
      task.project_id === 'proj1' || task.project_id === 'proj2'
    )).toBe(true);
  });

  it('applies multiple filters simultaneously', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      search: 'project',
      priority: 'high',
      status: 'pending',
      tags: ['work'],
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('Complete project proposal');
  });

  it('calculates filter statistics correctly', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      tags: ['work'],
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    const stats = result.current.filterStats;
    expect(stats.total).toBe(5);
    expect(stats.filtered).toBe(3); // 3 tasks with 'work' tag
    expect(stats.completed).toBe(0); // No completed tasks with 'work' tag
    expect(stats.pending).toBe(3); // All work tasks are pending
    expect(stats.overdue).toBe(1); // One overdue work task
    expect(stats.completionRate).toBe(0); // 0% completion rate
  });

  it('handles tasks without optional fields', () => {
    const tasksWithMissingFields: Task[] = [
      {
        id: '1',
        title: 'Simple task',
        completed: false,
        priority: 'medium',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    const filters: FilterOptions = {
      ...defaultFilters,
      search: 'simple',
    };

    const { result } = renderHook(() => useTaskFilters(tasksWithMissingFields, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('Simple task');
  });

  it('handles empty task list', () => {
    const { result } = renderHook(() => useTaskFilters([], defaultFilters));

    expect(result.current.filteredTasks).toHaveLength(0);
    expect(result.current.filterStats.total).toBe(0);
    expect(result.current.filterStats.filtered).toBe(0);
    expect(result.current.filterStats.completionRate).toBe(0);
  });

  it('filters by due date range - today', () => {
    // Mock current date to be 2024-01-15
    const originalDate = Date;
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super('2024-01-15T12:00:00Z');
        } else {
          super(...args);
        }
      }
      static now() {
        return new Date('2024-01-15T12:00:00Z').getTime();
      }
    } as any;

    const filters: FilterOptions = {
      ...defaultFilters,
      dueDateRange: 'today',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].due_date).toBe('2024-01-15');

    // Restore original Date
    global.Date = originalDate;
  });

  it('filters by due date range - overdue', () => {
    const filters: FilterOptions = {
      ...defaultFilters,
      dueDateRange: 'overdue',
    };

    const { result } = renderHook(() => useTaskFilters(mockTasks, filters));

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].id).toBe('3'); // The overdue task
  });
});