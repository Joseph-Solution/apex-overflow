import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

interface SubtaskListProps {
  parentTask: Task;
  subtasks: Task[];
  onCreateSubtask: (subtaskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateSubtask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onToggleSubtaskComplete: (id: string, completed: boolean) => Promise<void>;
  className?: string;
}

const SubtaskList = ({
  parentTask,
  subtasks,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onToggleSubtaskComplete,
  className = '',
}: SubtaskListProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = subtasks.length;
  const completionPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Subtask title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onCreateSubtask({
        title: newSubtaskTitle.trim(),
        description: '',
        completed: false,
        priority: parentTask.priority,
        parent_task_id: parentTask.id,
        category_id: parentTask.category_id,
        project_id: parentTask.project_id,
        tags: [],
      });
      
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
      toast({
        title: 'Success',
        description: 'Subtask created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create subtask',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSubtask = async (subtaskId: string) => {
    if (!editingTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Subtask title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onUpdateSubtask(subtaskId, { title: editingTitle.trim() });
      setEditingSubtaskId(null);
      setEditingTitle('');
      toast({
        title: 'Success',
        description: 'Subtask updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subtask',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await onDeleteSubtask(subtaskId);
      toast({
        title: 'Success',
        description: 'Subtask deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subtask',
        variant: 'destructive',
      });
    }
  };

  const handleToggleComplete = async (subtaskId: string, completed: boolean) => {
    try {
      await onToggleSubtaskComplete(subtaskId, completed);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subtask',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (subtask: Task) => {
    setEditingSubtaskId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const cancelEditing = () => {
    setEditingSubtaskId(null);
    setEditingTitle('');
  };

  if (totalSubtasks === 0 && !isAddingSubtask) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingSubtask(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subtask
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Subtask Header with Progress */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 p-0 h-auto"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            Subtasks ({completedSubtasks}/{totalSubtasks})
          </span>
        </Button>
        
        {totalSubtasks > 0 && (
          <div className="flex items-center space-x-2">
            <Progress value={completionPercentage} className="w-20 h-2" />
            <Badge variant="outline" className="text-xs">
              {Math.round(completionPercentage)}%
            </Badge>
          </div>
        )}
      </div>

      {/* Subtask List */}
      {isExpanded && (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center space-x-2 p-2 rounded-md bg-muted/30"
            >
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={(checked) =>
                  handleToggleComplete(subtask.id, checked as boolean)
                }
              />
              
              {editingSubtaskId === subtask.id ? (
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateSubtask(subtask.id);
                      } else if (e.key === 'Escape') {
                        cancelEditing();
                      }
                    }}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdateSubtask(subtask.id)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    className={`flex-1 text-sm ${
                      subtask.completed
                        ? 'line-through text-muted-foreground'
                        : ''
                    }`}
                  >
                    {subtask.title}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(subtask)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add New Subtask */}
          {isAddingSubtask ? (
            <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/30">
              <div className="w-4 h-4" /> {/* Spacer for checkbox alignment */}
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Enter subtask title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateSubtask();
                  } else if (e.key === 'Escape') {
                    setIsAddingSubtask(false);
                    setNewSubtaskTitle('');
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <Button size="sm" onClick={handleCreateSubtask}>
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingSubtask(false);
                  setNewSubtaskTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingSubtask(true)}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subtask
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubtaskList;