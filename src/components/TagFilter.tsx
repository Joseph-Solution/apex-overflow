import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Filter, Tag, X } from 'lucide-react';
import { useTags } from '@/hooks/useTags';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export const TagFilter = ({ selectedTags, onTagsChange, className }: TagFilterProps) => {
  const { allTags } = useTags();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const availableTags = allTags.filter(tag => !selectedTags.includes(tag));
  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchValue.toLowerCase())
  );

  const addTag = (tag: string) => {
    onTagsChange([...selectedTags, tag]);
    setSearchValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="default" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Tag selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="w-4 h-4 mr-2" />
            Filter by tags
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {selectedTags.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {filteredTags.length === 0 ? (
                <CommandEmpty>
                  {searchValue ? 'No tags found.' : 'No more tags available.'}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag}
                      onSelect={() => addTag(tag)}
                      className="cursor-pointer"
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      {tag}
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