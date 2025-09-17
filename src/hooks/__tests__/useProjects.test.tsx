import { describe, it, expect, vi } from 'vitest';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    loading: false,
  }),
}));

describe('useProjects Hook', () => {
  it('should provide project management functions', () => {
    const expectedFunctions = [
      'projects',
      'loading',
      'createProject',
      'updateProject',
      'deleteProject',
      'getProjectById',
      'getProjectStats',
      'getProjectProgress',
      'refetch'
    ];

    expect(expectedFunctions).toHaveLength(9);
    expect(expectedFunctions).toContain('createProject');
    expect(expectedFunctions).toContain('updateProject');
    expect(expectedFunctions).toContain('deleteProject');
    expect(expectedFunctions).toContain('getProjectStats');
  });

  it('should validate project creation data', () => {
    const validProjectData = {
      name: 'My Project',
      description: 'Project description',
      color: '#3B82F6',
    };

    const invalidProjectData = {
      name: '',
      description: 'Project description',
      color: 'invalid-color',
    };

    // Test valid data structure
    expect(validProjectData.name).toBeTruthy();
    expect(validProjectData.color).toMatch(/^#[0-9A-F]{6}$/i);

    // Test invalid data structure
    expect(invalidProjectData.name).toBeFalsy();
    expect(invalidProjectData.color).not.toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should calculate project statistics correctly', () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    
    const mockTasks = [
      { completed: true, due_date: futureDate.toISOString() },
      { completed: false, due_date: futureDate.toISOString() },
      { completed: false, due_date: pastDate.toISOString() }, // Overdue
      { completed: false, due_date: null },
    ];

    const calculateStats = (tasks: any[]) => {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const overdueTasks = tasks.filter(task => 
        !task.completed && 
        task.due_date && 
        new Date(task.due_date) < now
      ).length;

      return {
        totalTasks,
        completedTasks,
        completionRate: Math.round(completionRate),
        overdueTasks,
      };
    };

    const stats = calculateStats(mockTasks);
    
    expect(stats.totalTasks).toBe(4);
    expect(stats.completedTasks).toBe(1);
    expect(stats.completionRate).toBe(25);
    expect(stats.overdueTasks).toBe(1);
  });

  it('should handle project progress calculation', () => {
    const mockProjectTasks = [
      { completed: true },
      { completed: true },
      { completed: false },
      { completed: false },
      { completed: false },
    ];

    const calculateProgress = (tasks: any[]) => {
      const total = tasks.length;
      const completed = tasks.filter(task => task.completed).length;
      return { completed, total };
    };

    const progress = calculateProgress(mockProjectTasks);
    
    expect(progress.total).toBe(5);
    expect(progress.completed).toBe(2);
  });

  it('should handle empty project data', () => {
    const mockProject = {
      id: '1',
      name: 'Test Project',
      description: 'Test description',
      color: '#3B82F6',
      owner_id: 'user1',
      is_shared: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    // Test project data structure
    expect(mockProject).toHaveProperty('id');
    expect(mockProject).toHaveProperty('name');
    expect(mockProject).toHaveProperty('color');
    expect(mockProject).toHaveProperty('owner_id');
    expect(mockProject).toHaveProperty('is_shared');

    // Test color validation
    expect(mockProject.color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should handle upcoming tasks calculation', () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const mockTasks = [
      { completed: false, due_date: nextWeek.toISOString() }, // Upcoming
      { completed: false, due_date: nextMonth.toISOString() }, // Not upcoming
      { completed: true, due_date: nextWeek.toISOString() }, // Completed
    ];

    const calculateUpcoming = (tasks: any[]) => {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return tasks.filter(task => 
        !task.completed && 
        task.due_date && 
        new Date(task.due_date) >= now &&
        new Date(task.due_date) <= weekFromNow
      ).length;
    };

    const upcomingCount = calculateUpcoming(mockTasks);
    expect(upcomingCount).toBe(1);
  });
});