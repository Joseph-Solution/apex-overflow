import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, Settings, FolderOpen, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useProjects, ProjectStats } from '@/hooks/useProjects';
import { Project } from '@/integrations/supabase/enhanced-types';
import { ColorPicker } from './ColorPicker';
import { useToast } from '@/hooks/use-toast';

interface ProjectManagerProps {
  trigger?: React.ReactNode;
}

const ProjectManager = ({ trigger }: ProjectManagerProps) => {
  const { projects, loading, createProject, updateProject, deleteProject, getProjectStats } = useProjects();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6', // Default blue color
  });

  useEffect(() => {
    if (open && projects.length > 0) {
      loadProjectStats();
    }
  }, [open, projects]);

  const loadProjectStats = async () => {
    const stats: Record<string, ProjectStats> = {};
    for (const project of projects) {
      stats[project.id] = await getProjectStats(project.id);
    }
    setProjectStats(stats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProject) {
        const { error } = await updateProject(editingProject.id, formData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        const { error } = await createProject(formData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      }
      
      resetForm();
      loadProjectStats(); // Refresh stats
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color,
    });
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This will also remove the project assignment from all tasks. This action cannot be undone.`)) {
      try {
        const { error } = await deleteProject(project.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
        loadProjectStats(); // Refresh stats
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    });
    setEditingProject(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const getProgressColor = (completionRate: number) => {
    if (completionRate >= 80) return 'bg-green-500';
    if (completionRate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage Projects
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Create/Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Name</Label>
                    <Input
                      id="project-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <ColorPicker
                      color={formData.color}
                      onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter project description (optional)"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  {editingProject && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit">
                    {editingProject ? 'Update' : 'Create'} Project
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Projects List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <div className="mb-2">No projects yet</div>
                  <div className="text-sm">Create your first project to organize your tasks</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => {
                    const stats = projectStats[project.id];
                    return (
                      <div
                        key={project.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: project.color }}
                            />
                            <div>
                              <h3 className="font-medium">{project.name}</h3>
                              {project.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(project)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(project)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Project Statistics */}
                        {stats && (
                          <div className="space-y-3">
                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{stats.completionRate}%</span>
                              </div>
                              <Progress 
                                value={stats.completionRate} 
                                className="h-2"
                              />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{stats.completedTasks}/{stats.totalTasks} tasks</span>
                              </div>
                              
                              {stats.overdueTasks > 0 && (
                                <div className="flex items-center space-x-2">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span>{stats.overdueTasks} overdue</span>
                                </div>
                              )}
                              
                              {stats.upcomingTasks > 0 && (
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-blue-500" />
                                  <span>{stats.upcomingTasks} upcoming</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectManager;