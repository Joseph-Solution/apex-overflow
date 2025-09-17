import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { FilterPanel, FilterOptions } from '../FilterPanel';

// Mock the hooks
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      { id: '1', name: 'Work', color: '#3b82f6', user_id: 'user1', created_at: '2024-01-01' },
      { id: '2', name: 'Personal', color: '#ef4444', user_id: 'user1', created_at: '2024-01-01' },
    ],
  }),
}));

// Mock the filter components
vi.mock('../TagFilter', () => ({
  TagFilter: ({ selectedTags, onTagsChange }: any) => (
    <div data-testid="tag-filter">
      <div>Selected tags: {selectedTags.join(', ')}</div>
      <button onClick={() => onTagsChange([...selectedTags, 'test-tag'])}>
        Add Tag
      </button>
    </div>
  ),
}));

vi.mock('../ProjectFilter', () => ({
  ProjectFilter: ({ selectedProjects, onProjectsChange }: any) => (
    <div data-testid="project-filter">
      <div>Selected projects: {selectedProjects.join(', ')}</div>
      <button onClick={() => onProjectsChange([...selectedProjects, 'project-1'])}>
        Add Project
      </button>
    </div>
  ),
}));



describe('FilterPanel', () => {
  const defaultFilters: FilterOptions = {
    search: '',
    priority: 'all',
    status: 'all',
    category: null,
    tags: [],
    projects: [],
    dueDateRange: 'all',
  };

  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    if (typeof window !== 'undefined' && window.localStorage) {
      vi.mocked(window.localStorage.getItem).mockReturnValue(null);
    }
  });

  it('renders with default filters', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Priority')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Dates')).toBeInTheDocument();
  });

  it('updates search filter when typing', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    await user.type(searchInput, 'test search');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 'test search',
    });
  });

  it('shows active filter count when filters are applied', () => {
    const filtersWithActive: FilterOptions = {
      ...defaultFilters,
      search: 'test',
      priority: 'high',
      tags: ['tag1'],
    };

    render(
      <FilterPanel
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument(); // Badge showing count
  });

  it('shows clear button when filters are active', () => {
    const filtersWithActive: FilterOptions = {
      ...defaultFilters,
      search: 'test',
    };

    render(
      <FilterPanel
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const filtersWithActive: FilterOptions = {
      ...defaultFilters,
      search: 'test',
      priority: 'high',
    };

    render(
      <FilterPanel
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultFilters);
  });

  it('expands and collapses advanced filters', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Initially collapsed
    expect(screen.queryByText('Category')).not.toBeInTheDocument();

    // Expand
    const expandButton = screen.getByText('Expand');
    await user.click(expandButton);

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();

    // Collapse
    const collapseButton = screen.getByText('Collapse');
    await user.click(collapseButton);

    expect(screen.queryByText('Category')).not.toBeInTheDocument();
  });

  it('shows selected category badge when category is selected', () => {
    const filtersWithCategory: FilterOptions = {
      ...defaultFilters,
      category: '1',
    };

    render(
      <FilterPanel
        filters={filtersWithCategory}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand to see category section
    fireEvent.click(screen.getByText('Expand'));

    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('integrates with TagFilter component', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand to see tag filter
    await user.click(screen.getByText('Expand'));

    const tagFilter = screen.getByTestId('tag-filter');
    expect(tagFilter).toBeInTheDocument();

    // Simulate adding a tag
    const addTagButton = screen.getByText('Add Tag');
    await user.click(addTagButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      tags: ['test-tag'],
    });
  });

  it('integrates with ProjectFilter component', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand to see project filter
    await user.click(screen.getByText('Expand'));

    const projectFilter = screen.getByTestId('project-filter');
    expect(projectFilter).toBeInTheDocument();

    // Simulate adding a project
    const addProjectButton = screen.getByText('Add Project');
    await user.click(addProjectButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      projects: ['project-1'],
    });
  });

  it('saves and loads filter presets', async () => {
    const user = userEvent.setup();
    const filtersWithActive: FilterOptions = {
      ...defaultFilters,
      search: 'test',
      priority: 'high',
    };

    render(
      <FilterPanel
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand to see presets section
    await user.click(screen.getByText('Expand'));

    // Click save current
    const saveCurrentButton = screen.getByText('Save Current');
    await user.click(saveCurrentButton);

    // Enter preset name
    const presetNameInput = screen.getByPlaceholderText('Preset name...');
    await user.type(presetNameInput, 'My Preset');

    // Save preset
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'filter-presets',
      expect.stringContaining('My Preset')
    );
  });

  it('loads saved presets from localStorage', () => {
    const savedPresets = JSON.stringify([
      {
        id: '1',
        name: 'High Priority Tasks',
        filters: { ...defaultFilters, priority: 'high' },
        created_at: '2024-01-01',
      },
    ]);

    vi.mocked(window.localStorage.getItem).mockReturnValue(savedPresets);

    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand to see presets
    fireEvent.click(screen.getByText('Expand'));

    expect(screen.getByText('High Priority Tasks')).toBeInTheDocument();
  });

  it('applies preset when clicked', async () => {
    const user = userEvent.setup();
    const savedPresets = JSON.stringify([
      {
        id: '1',
        name: 'High Priority Tasks',
        filters: { ...defaultFilters, priority: 'high' },
        created_at: '2024-01-01',
      },
    ]);

    vi.mocked(window.localStorage.getItem).mockReturnValue(savedPresets);

    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand to see presets
    await user.click(screen.getByText('Expand'));

    // Click on preset
    const presetButton = screen.getByText('High Priority Tasks');
    await user.click(presetButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      priority: 'high',
    });
  });
});