import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { useProjects } from '@/hooks/useProjects';
import CategoryManager from './CategoryManager';
import ProjectManager from './ProjectManager';
import { TagInput } from './TagInput';
import SubtaskList from './SubtaskList';

interface TaskDialogProps {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
}

const TaskDialog = ({ task, open, onOpenChange, onSave }: TaskDialogProps) => {
  // Always call hooks at the top level (React rules of hooks)
  const { categories, loading: categoriesLoading } = useCategories();
  const { projects, loading: projectsLoading } = useProjects();
  const { createTask, updateTask, deleteTask, updateTaskCompletion, getSubtasks } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority((task.priority as 'low' | 'medium' | 'high') || 'medium');
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setCategoryId(task.category_id || '');
      setProjectId(task.project_id || '');
      setTags(task.tags || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setCategoryId('');
      setProjectId('');
      setTags([]);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      title,
      description: description || null,
      completed: task?.completed || false,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      category_id: categoryId || null,
      project_id: projectId || null,
      parent_task_id: task?.parent_task_id || null,
      tags: tags.length > 0 ? tags : null,
      actual_duration: task?.actual_duration || null,
      assigned_to: task?.assigned_to || null,
      estimated_duration: task?.estimated_duration || null,
      position: task?.position || null,
      recurrence_pattern: task?.recurrence_pattern || null,
    });
    
    onOpenChange(false);
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <div className="flex space-x-2">
              <Select value={categoryId || 'none'} onValueChange={(value) => setCategoryId(value === 'none' ? '' : value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CategoryManager 
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <div className="flex space-x-2">
              <Select value={projectId || 'none'} onValueChange={(value) => setProjectId(value === 'none' ? '' : value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ProjectManager 
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="Add tags to organize your task..."
              maxTags={5}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Subtasks Section - Only show for existing tasks that are not subtasks themselves */}
          {task && !task.parent_task_id && (
            <div className="space-y-2">
              <Label>Subtasks</Label>
              <SubtaskList
                parentTask={task}
                subtasks={getSubtasks(task.id)}
                onCreateSubtask={async (subtaskData) => {
                  await createTask(subtaskData);
                }}
                onUpdateSubtask={async (id, updates) => {
                  await updateTask(id, updates);
                }}
                onDeleteSubtask={async (id) => {
                  await deleteTask(id);
                }}
                onToggleSubtaskComplete={async (id, completed) => {
                  await updateTaskCompletion(id, completed);
                }}
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;