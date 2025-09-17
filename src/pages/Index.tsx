import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, Task } from "@/hooks/useTasks";
import TaskCard from "@/components/TaskCard";
import TaskDialog from "@/components/TaskDialog";
import { FilterPanel, FilterOptions } from "@/components/FilterPanel";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    updateTaskCompletion,
  } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    priority: 'all',
    status: 'all',
    category: null,
    tags: [],
    projects: [],
    dueDateRange: 'all',
  });

  const { filteredTasks, filterStats } = useTaskFilters(tasks, filters);

  console.log(
    "Index page - User:",
    user?.email || "No user",
    "Loading:",
    loading
  );

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    console.log("No user, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  const handleCreateTask = async (
    taskData: Omit<Task, "id" | "created_at" | "updated_at" | "user_id">
  ) => {
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

  const handleUpdateTask = async (
    taskData: Omit<Task, "id" | "created_at" | "updated_at" | "user_id">
  ) => {
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
    const { error } = await updateTaskCompletion(id, completed);
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
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            Apex Overflow
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-foreground">
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
        <div className="mb-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">
              Tasks
            </h2>
            <div className="flex items-center gap-4">
              <p className="text-foreground">
                Manage your tasks and stay organized
              </p>
              {filterStats.filtered !== filterStats.total && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-4 h-4" />
                  Showing {filterStats.filtered} of {filterStats.total} tasks
                  {filterStats.completionRate > 0 && (
                    <span className="text-green-600">
                      ({filterStats.completionRate}% complete)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="mb-6">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {tasksLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No tasks yet. Create your first task using the button in the bottom right corner!
            </p>
          </div>
        ) : filteredTasks.filter((task) => !task.parent_task_id).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No tasks match your current filters.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                search: '',
                priority: 'all',
                status: 'all',
                category: null,
                tags: [],
                projects: [],
                dueDateRange: 'all',
              })}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks
              .filter((task) => !task.parent_task_id) // Only show parent tasks, subtasks are shown within TaskDialog
              .map((task) => (
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

      {/* Floating Action Button */}
      <Button
        onClick={handleNewTask}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Index;
