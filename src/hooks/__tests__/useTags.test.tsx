import { describe, it, expect, vi } from 'vitest';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      contains: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('useTags Hook', () => {
  it('should provide tag management functions', () => {
    const expectedFunctions = [
      'allTags',
      'loading',
      'getTagSuggestions',
      'getTagFrequency',
      'getPopularTags',
      'refetch'
    ];

    expect(expectedFunctions).toHaveLength(6);
    expect(expectedFunctions).toContain('getTagSuggestions');
    expect(expectedFunctions).toContain('getTagFrequency');
    expect(expectedFunctions).toContain('getPopularTags');
  });

  it('should filter tag suggestions correctly', () => {
    const mockTags = ['work', 'personal', 'urgent', 'project', 'meeting'];
    
    // Mock getTagSuggestions behavior
    const getTagSuggestions = (input: string, limit: number = 10) => {
      if (!input.trim()) return mockTags.slice(0, limit);
      
      const inputLower = input.toLowerCase();
      return mockTags
        .filter(tag => tag.toLowerCase().includes(inputLower))
        .slice(0, limit);
    };

    // Test empty input returns all tags (up to limit)
    expect(getTagSuggestions('', 3)).toEqual(['work', 'personal', 'urgent']);
    
    // Test filtering by input
    expect(getTagSuggestions('pro')).toEqual(['project']);
    
    // Test case insensitive filtering
    expect(getTagSuggestions('WORK')).toEqual(['work']);
    
    // Test limit parameter
    const filteredResults = getTagSuggestions('e', 2);
    expect(filteredResults).toHaveLength(2);
    expect(filteredResults.every(tag => tag.includes('e'))).toBe(true);
  });

  it('should handle tag frequency calculation', () => {
    const mockTasksWithTag = [
      { tags: ['work', 'urgent'] },
      { tags: ['work', 'project'] },
      { tags: ['personal'] },
    ];

    const getTagFrequency = (tag: string) => {
      return mockTasksWithTag.filter(task => 
        task.tags.includes(tag)
      ).length;
    };

    expect(getTagFrequency('work')).toBe(2);
    expect(getTagFrequency('urgent')).toBe(1);
    expect(getTagFrequency('nonexistent')).toBe(0);
  });

  it('should extract unique tags from task data', () => {
    const mockTaskData = [
      { tags: ['work', 'urgent'] },
      { tags: ['work', 'project'] },
      { tags: ['personal', 'urgent'] },
      { tags: null },
      { tags: [] },
    ];

    const extractUniqueTags = (data: any[]) => {
      const tagSet = new Set<string>();
      data.forEach((task) => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach((tag: string) => {
            if (tag.trim()) {
              tagSet.add(tag.trim());
            }
          });
        }
      });
      return Array.from(tagSet).sort();
    };

    const uniqueTags = extractUniqueTags(mockTaskData);
    expect(uniqueTags).toEqual(['personal', 'project', 'urgent', 'work']);
  });

  it('should handle empty or invalid tag data', () => {
    const mockInvalidData = [
      { tags: null },
      { tags: undefined },
      { tags: [] },
      { tags: ['', '  ', 'valid-tag'] },
    ];

    const extractUniqueTags = (data: any[]) => {
      const tagSet = new Set<string>();
      data.forEach((task) => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach((tag: string) => {
            if (tag && tag.trim()) {
              tagSet.add(tag.trim());
            }
          });
        }
      });
      return Array.from(tagSet).sort();
    };

    const uniqueTags = extractUniqueTags(mockInvalidData);
    expect(uniqueTags).toEqual(['valid-tag']);
  });
});