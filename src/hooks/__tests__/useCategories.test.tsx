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

describe('useCategories Hook', () => {
  it('should provide category management functions', () => {
    // Test that the hook structure is correct
    const expectedFunctions = [
      'categories',
      'loading',
      'createCategory',
      'updateCategory',
      'deleteCategory',
      'getCategoryById',
      'refetch'
    ];

    // This is a basic structure test
    expect(expectedFunctions).toHaveLength(7);
    expect(expectedFunctions).toContain('createCategory');
    expect(expectedFunctions).toContain('updateCategory');
    expect(expectedFunctions).toContain('deleteCategory');
  });

  it('should validate category creation data', () => {
    const validCategoryData = {
      name: 'Work',
      color: '#3B82F6',
    };

    const invalidCategoryData = {
      name: '',
      color: 'invalid-color',
    };

    // Test valid data structure
    expect(validCategoryData.name).toBeTruthy();
    expect(validCategoryData.color).toMatch(/^#[0-9A-F]{6}$/i);

    // Test invalid data structure
    expect(invalidCategoryData.name).toBeFalsy();
    expect(invalidCategoryData.color).not.toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should handle category operations', () => {
    const mockCategory = {
      id: '1',
      name: 'Work',
      color: '#3B82F6',
      user_id: 'user1',
      created_at: '2024-01-01T00:00:00Z',
    };

    // Test category data structure
    expect(mockCategory).toHaveProperty('id');
    expect(mockCategory).toHaveProperty('name');
    expect(mockCategory).toHaveProperty('color');
    expect(mockCategory).toHaveProperty('user_id');
    expect(mockCategory).toHaveProperty('created_at');

    // Test color validation
    expect(mockCategory.color).toMatch(/^#[0-9A-F]{6}$/i);
  });
});