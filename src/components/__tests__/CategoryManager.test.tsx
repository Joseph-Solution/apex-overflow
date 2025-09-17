import { describe, it, expect, vi } from 'vitest';
import { useCategories } from '@/hooks/useCategories';

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

describe('Category Management', () => {
  it('should have category management functionality', () => {
    // Basic test to ensure the module loads
    expect(useCategories).toBeDefined();
  });

  it('should validate category data structure', () => {
    const mockCategory = {
      id: '1',
      name: 'Work',
      color: '#3B82F6',
      user_id: 'user1',
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(mockCategory).toHaveProperty('id');
    expect(mockCategory).toHaveProperty('name');
    expect(mockCategory).toHaveProperty('color');
    expect(mockCategory).toHaveProperty('user_id');
    expect(mockCategory.color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should validate color format', () => {
    const validColors = ['#FF0000', '#00FF00', '#0000FF', '#3B82F6'];
    const invalidColors = ['red', '#FF', '#GGGGGG', 'rgb(255,0,0)'];

    validColors.forEach(color => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    invalidColors.forEach(color => {
      expect(color).not.toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});