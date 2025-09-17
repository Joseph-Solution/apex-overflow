import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  Search, 
  X, 
  Calendar, 
  Flag, 
  Tag, 
  FolderOpen, 
  Palette,
  Save,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { TagFilter } from './TagFilter';
import { ProjectFilter } from './ProjectFilter';
import { useCategories } from '@/hooks/useCategories';

export interface FilterOptions {
  search: string;
  priority: 'all' | 'low' | 'medium' | 'high';
  status: 'all' | 'completed' | 'pending' | 'overdue';
  category: string | null;
  tags: string[];
  projects: string[];
  dueDateRange: 'all' | 'today' | 'week' | 'month' | 'overdue';
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterOptions;
  created_at: string;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

const defaultFilters: FilterOptions = {
  search: '',
  priority: 'all',
  status: 'all',
  category: null,
  tags: [],
  projects: [],
  dueDateRange: 'all',
};

export const FilterPanel = ({ filters, onFiltersChange, className }: FilterPanelProps) => {
  const { categories } = useCategories();
  const [isExpanded, setIsExpanded] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  // Load saved presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('filter-presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error('Error loading filter presets:', error);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresets = (newPresets: FilterPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem('filter-presets', JSON.stringify(newPresets));
  };

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.search !== '' ||
      filters.priority !== 'all' ||
      filters.status !== 'all' ||
      filters.category !== null ||
      filters.tags.length > 0 ||
      filters.projects.length > 0 ||
      filters.dueDateRange !== 'all'
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.priority !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.category) count++;
    if (filters.tags.length > 0) count++;
    if (filters.projects.length > 0) count++;
    if (filters.dueDateRange !== 'all') count++;
    return count;
  };

  const saveCurrentFilters = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters },
      created_at: new Date().toISOString(),
    };

    const updatedPresets = [...presets, newPreset];
    savePresets(updatedPresets);
    setPresetName('');
    setShowPresetInput(false);
  };

  const loadPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
  };

  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    savePresets(updatedPresets);
  };

  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {hasActiveFilters() && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 px-2"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick filters - always visible */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.priority}
            onValueChange={(value) => updateFilter('priority', value as FilterOptions['priority'])}
          >
            <SelectTrigger className="w-32">
              <Flag className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => updateFilter('status', value as FilterOptions['status'])}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.dueDateRange}
            onValueChange={(value) => updateFilter('dueDateRange', value as FilterOptions['dueDateRange'])}
          >
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <>
            <Separator />
            
            {/* Category filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Category
              </label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => updateFilter('category', value === 'all' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.category && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <div
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: getCategoryById(filters.category)?.color }}
                    />
                    {getCategoryById(filters.category)?.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => updateFilter('category', null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </div>
              )}
            </div>

            {/* Tag filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <TagFilter
                selectedTags={filters.tags}
                onTagsChange={(tags) => updateFilter('tags', tags)}
              />
            </div>

            {/* Project filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Projects
              </label>
              <ProjectFilter
                selectedProjects={filters.projects}
                onProjectsChange={(projects) => updateFilter('projects', projects)}
              />
            </div>

            <Separator />

            {/* Filter presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Filter Presets
                </label>
                {hasActiveFilters() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPresetInput(!showPresetInput)}
                    className="h-7 px-2 text-xs"
                  >
                    Save Current
                  </Button>
                )}
              </div>

              {showPresetInput && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Preset name..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveCurrentFilters();
                      } else if (e.key === 'Escape') {
                        setShowPresetInput(false);
                        setPresetName('');
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={saveCurrentFilters}
                    disabled={!presetName.trim()}
                    className="h-8 px-3"
                  >
                    Save
                  </Button>
                </div>
              )}

              {presets.length > 0 && (
                <div className="space-y-1">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/50"
                    >
                      <button
                        onClick={() => loadPreset(preset)}
                        className="flex-1 text-left text-sm hover:text-primary transition-colors"
                      >
                        {preset.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};