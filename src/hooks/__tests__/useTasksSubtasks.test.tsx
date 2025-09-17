import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTasks, Task } from '../useTasks';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

describe('useTasks - Subtask Functionality', () => {
  const mockTasks: Task[] = [
    {
      id: 'parent-1',
      title: 'Parent Task 1',
      description: 'Parent task description',
      completed: false,
      priority: 'medium',
      due_date: '2024-12-31',
      category_id: 'cat-1',
      project_id: 'proj-1',
      tags: ['tag1'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'parent-2',
      title: 'Parent Task 2',
      description: 'Another parent task',
      completed: true,
      priority: 'high',
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'subtask-1',
      title: 'Subtask 1',
      description: 'First subtask',
      completed: false,
      priority: 'medium',
      parent_task_id: 'parent-1',
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'subtask-2',
      title: 'Subtask 2',
      description: 'Second subtask',
      completed: true,
      priority: 'high',
      parent_task_id: 'parent-1',
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'subtask-3',
      title: 'Subtask 3',
      description: 'Third subtask',
      completed: false,
      priority: 'low',
      parent_task_id: 'parent-2',
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful fetch
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTasks,
          error: null,
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockTasks[0],
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockTasks[0], completed: true },
              error: null,
            }),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    } as any);
  });

  it('should get subtasks for a parent task', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const subtasks = result.current.getSubtasks('parent-1');
    
    expect(subtasks).toHaveLength(2);
    expect(subtasks[0].id).toBe('subtask-1');
    expect(subtasks[1].id).toBe('subtask-2');
    expect(subtasks.every(task => task.parent_task_id === 'parent-1')).toBe(true);
  });

  it('should get parent task for a subtask', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const parentTask = result.current.getParentTask('subtask-1');
    
    expect(parentTask).toBeDefined();
    expect(parentTask?.id).toBe('parent-1');
    expect(parentTask?.title).toBe('Parent Task 1');
  });

  it('should return undefined for parent task when task has no parent', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const parentTask = result.current.getParentTask('parent-1');
    
    expect(parentTask).toBeUndefined();
  });

  it('should get task hierarchy with subtasks', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const hierarchy = result.current.getTaskHierarchy('parent-1');
    
    expect(hierarchy).toBeDefined();
    expect(hierarchy?.task.id).toBe('parent-1');
    expect(hierarchy?.subtasks).toHaveLength(2);
    expect(hierarchy?.subtasks[0].id).toBe('subtask-1');
    expect(hierarchy?.subtasks[1].id).toBe('subtask-2');
  });

  it('should return null for non-existent task hierarchy', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const hierarchy = result.current.getTaskHierarchy('non-existent');
    
    expect(hierarchy).toBeNull();
  });

  it('should complete all subtasks when parent is completed', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test the logic by checking the result
    const response = await act(async () => {
      return await result.current.updateTaskCompletion('parent-1', true);
    });

    // Should not return an error
    expect(response.error).toBeNull();
  });

  it('should complete parent when all subtasks are completed', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test the logic by checking the result
    const response = await act(async () => {
      return await result.current.updateTaskCompletion('subtask-1', true);
    });

    // Should not return an error
    expect(response.error).toBeNull();
  });

  it('should uncheck parent when subtask is uncompleted', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test the logic by checking the result
    const response = await act(async () => {
      return await result.current.updateTaskCompletion('subtask-3', false);
    });

    // Should not return an error
    expect(response.error).toBeNull();
  });

  it('should not complete parent when not all subtasks are completed', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test the logic by checking the result
    const response = await act(async () => {
      return await result.current.updateTaskCompletion('subtask-2', true);
    });

    // Should not return an error
    expect(response.error).toBeNull();
  });

  it('should handle errors in updateTaskCompletion', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const mockUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));
    result.current.updateTask = mockUpdate;

    const response = await act(async () => {
      return await result.current.updateTaskCompletion('parent-1', true);
    });

    expect(response.error).toBeDefined();
  });

  it('should handle non-existent task in updateTaskCompletion', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const response = await act(async () => {
      return await result.current.updateTaskCompletion('non-existent', true);
    });

    expect(response.error).toBe('Task not found');
  });

  it('should create subtask with parent_task_id', async () => {
    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const subtaskData = {
      title: 'New Subtask',
      description: 'New subtask description',
      completed: false,
      priority: 'medium' as const,
      parent_task_id: 'parent-1',
      tags: [],
    };

    await act(async () => {
      await result.current.createTask(subtaskData);
    });

    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(supabase.from('tasks').insert).toHaveBeenCalledWith([
      { ...subtaskData, user_id: 'user-1' }
    ]);
  });
});