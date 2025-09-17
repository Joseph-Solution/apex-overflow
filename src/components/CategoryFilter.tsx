import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Filter, Palette, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  className?: string;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange, className }: CategoryFilterProps) => {
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectCategory = (categoryId: string) => {
    onCategoryChange(categoryId);
    setSearchValue('');
    setOpen(false);
  };

  const clearCategory = () => {
    onCategoryChange(null);
  };

  const selectedCategoryData = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)
    : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Selected category */}
      {selectedCategoryData && (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs">
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: selectedCategoryData.color }}
            />
            {selectedCategoryData.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1 hover:bg-transparent"
              onClick={clearCategory}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        </div>
      )}

      {/* Category selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="w-4 h-4 mr-2" />
            Filter by category
            {selectedCategory && (
              <Badge variant="secondary" className="ml-2 text-xs">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search categories..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {filteredCategories.length === 0 ? (
                <CommandEmpty>
                  {searchValue ? 'No categories found.' : 'No categories available.'}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      clearCategory();
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear category
                  </CommandItem>
                  {filteredCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      onSelect={() => selectCategory(category.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};