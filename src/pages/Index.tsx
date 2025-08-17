import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, Task } from '@/hooks/useTasks';
import TaskCard from '@/components/TaskCard';
import TaskDialog from '@/components/TaskDialog';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { user, signOut } = useAuth();
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await createTask(taskData);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create task",
      });
    } else {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    }
  };

  const handleUpdateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingTask) return;
    
    const { error } = await updateTask(editingTask.id, taskData);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task",
      });
    } else {
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    }
    setEditingTask(undefined);
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    const { error } = await updateTask(id, { completed });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await deleteTask(id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task",
      });
    } else {
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(undefined);
    setDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Apex Overflow</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Tasks</h2>
            <p className="text-muted-foreground">
              Manage your tasks and stay organized
            </p>
          </div>
          <Button onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No tasks yet. Create your first task!</p>
            <Button onClick={handleNewTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        )}

        <TaskDialog
          task={editingTask}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
        />
      </main>
    </div>
  );
};

export default Index;
