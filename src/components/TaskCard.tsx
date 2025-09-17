import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Trash2, Edit, Tag, FolderOpen, ChevronRight } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { useProjects } from '@/hooks/useProjects';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskCard = ({ task, onToggleComplete, onDelete, onEdit }: TaskCardProps) => {
  const { getCategoryById } = useCategories();
  const { getProjectById } = useProjects();
  const { getSubtasks } = useTasks();
  const category = task.category_id ? getCategoryById(task.category_id) : null;
  const project = task.project_id ? getProjectById(task.project_id) : null;
  const tags = task.tags || [];
  
  // Get subtasks for progress calculation
  const subtasks = getSubtasks(task.id);
  const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  
  // Check if this is a subtask
  const isSubtask = !!task.parent_task_id;
  
  const priorityColors = {
    low: 'bg-secondary text-secondary-foreground',
    medium: 'bg-primary text-primary-foreground', 
    high: 'bg-destructive text-destructive-foreground'
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className={`transition-all duration-200 ${task.completed ? 'opacity-60' : ''} ${isSubtask ? 'ml-6 border-l-4 border-l-muted' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {isSubtask && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
            />
            <CardTitle className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1 flex-wrap">
            {project && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: project.color,
                  color: project.color,
                  backgroundColor: `${project.color}10`
                }}
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                {project.name}
              </Badge>
            )}
            {category && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: category.color,
                  color: category.color,
                  backgroundColor: `${category.color}10`
                }}
              >
                {category.name}
              </Badge>
            )}
            <Badge className={priorityColors[task.priority as 'low' | 'medium' | 'high'] || priorityColors.medium}>
              {task.priority || 'medium'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Subtask Progress Indicator */}
        {totalSubtasks > 0 && !isSubtask && (
          <div className="flex items-center space-x-2 mt-2">
            <Progress value={subtaskProgress} className="flex-1 h-2" />
            <Badge variant="outline" className="text-xs">
              {completedSubtasks}/{totalSubtasks} subtasks
            </Badge>
          </div>
        )}
      </CardHeader>
      {(task.description || task.due_date || tags.length > 0) && (
        <CardContent className="pt-0">
          {task.description && (
            <p className={`text-sm mb-2 ${task.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
              {task.description}
            </p>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {task.due_date && (
            <p className="text-xs text-muted-foreground">
              Due: {formatDate(task.due_date)}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TaskCard;