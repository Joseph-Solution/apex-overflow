import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Search, Tag, Trash2 } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

interface TagManagerProps {
  trigger?: React.ReactNode;
}

const TagManager = ({ trigger }: TagManagerProps) => {
  const { allTags, loading, getTagFrequency } = useTags();
  const { tasks, updateTask } = useTasks();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFrequencies, setTagFrequencies] = useState<Record<string, number>>({});

  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadTagFrequencies = async () => {
    const frequencies: Record<string, number> = {};
    for (const tag of allTags) {
      frequencies[tag] = await getTagFrequency(tag);
    }
    setTagFrequencies(frequencies);
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    if (!window.confirm(`Are you sure you want to remove "${tagToDelete}" from all tasks? This action cannot be undone.`)) {
      return;
    }

    try {
      // Find all tasks with this tag and remove it
      const tasksWithTag = tasks.filter(task => 
        (task as any).tags?.includes(tagToDelete)
      );

      for (const task of tasksWithTag) {
        const updatedTags = ((task as any).tags || []).filter((tag: string) => tag !== tagToDelete);
        await updateTask(task.id, { tags: updatedTags });
      }

      toast({
        title: "Success",
        description: `Tag "${tagToDelete}" removed from ${tasksWithTag.length} task(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    }
  };

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    if (!newTag.trim() || oldTag === newTag.trim()) return;

    try {
      // Find all tasks with the old tag and replace it
      const tasksWithTag = tasks.filter(task => 
        (task as any).tags?.includes(oldTag)
      );

      for (const task of tasksWithTag) {
        const updatedTags = ((task as any).tags || []).map((tag: string) => 
          tag === oldTag ? newTag.trim() : tag
        );
        await updateTask(task.id, { tags: updatedTags });
      }

      toast({
        title: "Success",
        description: `Tag renamed in ${tasksWithTag.length} task(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename tag",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadTagFrequencies();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage Tags
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tags..."
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Your Tags ({filteredTags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading tags...</div>
              ) : filteredTags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-2">
                    {searchTerm ? 'No tags found matching your search' : 'No tags yet'}
                  </div>
                  <div className="text-sm">
                    {searchTerm ? 'Try a different search term' : 'Tags will appear here as you add them to tasks'}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-3">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{tag}</span>
                        {tagFrequencies[tag] && (
                          <Badge variant="outline" className="text-xs">
                            {tagFrequencies[tag]} task{tagFrequencies[tag] !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newTag = prompt(`Rename tag "${tag}" to:`, tag);
                            if (newTag) {
                              handleRenameTag(tag, newTag);
                            }
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tag Statistics */}
          {filteredTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tag Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{allTags.length}</div>
                    <div className="text-sm text-muted-foreground">Total Tags</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Object.values(tagFrequencies).reduce((sum, count) => sum + count, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Usage</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(Object.values(tagFrequencies).reduce((sum, count) => sum + count, 0) / allTags.length) || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg per Tag</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.max(...Object.values(tagFrequencies), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Most Used</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagManager;