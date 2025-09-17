import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus, Tag } from 'lucide-react';
import { useTags } from '@/hooks/useTags';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

export const TagInput = ({ 
  tags, 
  onChange, 
  placeholder = "Add tags...", 
  maxTags = 10,
  disabled = false 
}: TagInputProps) => {
  const { getTagSuggestions, getPopularTags } = useTags();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      setSuggestions(getTagSuggestions(inputValue, 8));
    } else {
      setSuggestions(getPopularTags(8));
    }
  }, [inputValue, getTagSuggestions, getPopularTags]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
      setInputValue('');
      setIsOpen(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsOpen(true);
  };

  const filteredSuggestions = suggestions.filter(suggestion => 
    !tags.includes(suggestion) && 
    suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Display current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeTag(tag)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag input with autocomplete */}
      {!disabled && tags.length < maxTags && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className="pr-8"
              />
              <Plus className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                value={inputValue}
                onValueChange={handleInputChange}
                placeholder="Search tags..."
              />
              <CommandList>
                {inputValue.trim() && !tags.includes(inputValue.trim()) && (
                  <CommandGroup heading="Create new">
                    <CommandItem
                      onSelect={() => addTag(inputValue)}
                      className="cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create "{inputValue.trim()}"
                    </CommandItem>
                  </CommandGroup>
                )}
                
                {filteredSuggestions.length > 0 && (
                  <CommandGroup heading={inputValue.trim() ? "Suggestions" : "Popular tags"}>
                    {filteredSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        onSelect={() => addTag(suggestion)}
                        className="cursor-pointer"
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        {suggestion}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {filteredSuggestions.length === 0 && inputValue.trim() && (
                  <CommandEmpty>No tags found.</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Max tags warning */}
      {tags.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
};