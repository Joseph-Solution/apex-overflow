import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskCard = ({ task, onToggleComplete, onDelete, onEdit }: TaskCardProps) => {
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
    <Card className={`transition-all duration-200 ${task.completed ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
            />
            <CardTitle className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Badge className={priorityColors[task.priority]}>
              {task.priority}
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
      </CardHeader>
      {(task.description || task.due_date) && (
        <CardContent className="pt-0">
          {task.description && (
            <p className={`text-sm mb-2 ${task.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
              {task.description}
            </p>
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