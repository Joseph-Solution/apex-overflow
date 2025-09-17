import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Filter, FolderOpen, X } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';

interface ProjectFilterProps {
  selectedProjects: string[];
  onProjectsChange: (projects: string[]) => void;
  className?: string;
}

export const ProjectFilter = ({ selectedProjects, onProjectsChange, className }: ProjectFilterProps) => {
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const availableProjects = projects.filter(project => !selectedProjects.includes(project.id));
  const filteredProjects = availableProjects.filter(project =>
    project.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const addProject = (projectId: string) => {
    onProjectsChange([...selectedProjects, projectId]);
    setSearchValue('');
  };

  const removeProject = (projectToRemove: string) => {
    onProjectsChange(selectedProjects.filter(id => id !== projectToRemove));
  };

  const clearAllProjects = () => {
    onProjectsChange([]);
  };

  const getProjectById = (id: string) => {
    return projects.find(p => p.id === id);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Selected projects */}
      {selectedProjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedProjects.map((projectId) => {
            const project = getProjectById(projectId);
            if (!project) return null;
            
            return (
              <Badge key={projectId} variant="default" className="text-xs">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeProject(projectId)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllProjects}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Project selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="w-4 h-4 mr-2" />
            Filter by projects
            {selectedProjects.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {selectedProjects.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search projects..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {filteredProjects.length === 0 ? (
                <CommandEmpty>
                  {searchValue ? 'No projects found.' : 'No more projects available.'}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredProjects.map((project) => (
                    <CommandItem
                      key={project.id}
                      onSelect={() => addProject(project.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
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