import { supabase } from './client';
import type {
  Task,
  Category,
  Project,
  ProjectMember,
  TimeEntry,
  UserProfile,
  AISuggestion,
  TaskComment,
  TaskWithRelations,
  ProjectWithMembers,
  CategoryInsert,
  ProjectInsert,
  ProjectMemberInsert,
  TimeEntryInsert,
  UserProfileInsert,
  AISuggestionInsert,
  TaskCommentInsert,
  TaskInsert,
  CategoryUpdate,
  ProjectUpdate,
  ProjectMemberUpdate,
  TimeEntryUpdate,
  UserProfileUpdate,
  AISuggestionUpdate,
  TaskCommentUpdate,
  TaskUpdate,
  ProjectRoleType,
  AISuggestionTypeType,
} from './enhanced-types';

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

export const categoryOperations = {
  // Get all categories for a user
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Create a new category
  async create(category: CategoryInsert): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a category
  async update(id: string, updates: CategoryUpdate): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a category
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
};

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export const projectOperations = {
  // Get all projects for a user (owned or member)
  async getAll(userId: string): Promise<ProjectWithMembers[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        members:project_members(
          *,
          user:profiles(*)
        )
      `)
      .or(`owner_id.eq.${userId},project_members.user_id.eq.${userId}`)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get projects owned by user
  async getOwned(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Create a new project
  async create(project: ProjectInsert): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a project
  async update(id: string, updates: ProjectUpdate): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a project
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get project by ID with members
  async getById(id: string): Promise<ProjectWithMembers | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        members:project_members(
          *,
          user:profiles(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Add member to project
  async addMember(projectId: string, userId: string, role: ProjectRoleType = 'viewer'): Promise<ProjectMember> {
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update member role
  async updateMemberRole(memberId: string, role: ProjectRoleType): Promise<ProjectMember> {
    const { data, error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove member from project
  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

  // Get project members
  async getMembers(projectId: string): Promise<(ProjectMember & { user?: any })[]> {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('project_id', projectId);

    if (error) throw error;
    return data || [];
  },
};

// ============================================================================
// ENHANCED TASK OPERATIONS
// ============================================================================

export const enhancedTaskOperations = {
  // Get all tasks with relations
  async getAllWithRelations(userId: string): Promise<TaskWithRelations[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*),
        project:projects(*),
        parent_task:tasks!parent_task_id(*),
        subtasks:tasks!parent_task_id(*),
        time_entries(*),
        ai_suggestions(*),
        comments:task_comments(
          *,
          user:profiles(*)
        ),
        assigned_user:profiles(*)
      `)
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
      .order('position');

    if (error) throw error;
    return data || [];
  },

  // Get tasks by project
  async getByProject(projectId: string): Promise<TaskWithRelations[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*),
        project:projects(*),
        parent_task:tasks!parent_task_id(*),
        subtasks:tasks!parent_task_id(*),
        time_entries(*),
        ai_suggestions(*),
        comments:task_comments(
          *,
          user:profiles(*)
        ),
        assigned_user:profiles(*)
      `)
      .eq('project_id', projectId)
      .order('position');

    if (error) throw error;
    return data || [];
  },

  // Get tasks by category
  async getByCategory(categoryId: string): Promise<TaskWithRelations[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*),
        project:projects(*),
        parent_task:tasks!parent_task_id(*),
        subtasks:tasks!parent_task_id(*),
        time_entries(*),
        ai_suggestions(*),
        comments:task_comments(
          *,
          user:profiles(*)
        ),
        assigned_user:profiles(*)
      `)
      .eq('category_id', categoryId)
      .order('position');

    if (error) throw error;
    return data || [];
  },

  // Get subtasks
  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('position');

    if (error) throw error;
    return data || [];
  },

  // Search tasks
  async search(userId: string, query: string): Promise<TaskWithRelations[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*),
        project:projects(*),
        parent_task:tasks!parent_task_id(*),
        subtasks:tasks!parent_task_id(*),
        time_entries(*),
        ai_suggestions(*),
        comments:task_comments(
          *,
          user:profiles(*)
        ),
        assigned_user:profiles(*)
      `)
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('position');

    if (error) throw error;
    return data || [];
  },

  // Update task position (for drag and drop)
  async updatePosition(taskId: string, newPosition: number): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ position: newPosition })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bulk update positions
  async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
    const { error } = await supabase.rpc('bulk_update_task_positions', {
      updates: updates,
    });

    if (error) throw error;
  },
};

// ============================================================================
// TIME TRACKING OPERATIONS
// ============================================================================

export const timeTrackingOperations = {
  // Start time tracking
  async start(taskId: string, userId: string, description?: string): Promise<TimeEntry> {
    // First, stop any active time entries
    await this.stopActive(userId);

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        task_id: taskId,
        user_id: userId,
        start_time: new Date().toISOString(),
        description,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Stop time tracking
  async stop(entryId: string): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        end_time: new Date().toISOString(),
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Stop all active time entries for user
  async stopActive(userId: string): Promise<void> {
    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .is('end_time', null);

    if (error) throw error;
  },

  // Get active time entry for user
  async getActive(userId: string): Promise<TimeEntry | null> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('end_time', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Get time entries for task
  async getByTask(taskId: string): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get time entries for user in date range
  async getByDateRange(userId: string, startDate: string, endDate: string): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Delete time entry
  async delete(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  },

  // Update time entry
  async update(entryId: string, updates: TimeEntryUpdate): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================================================
// AI SUGGESTIONS OPERATIONS
// ============================================================================

export const aiSuggestionsOperations = {
  // Get suggestions for task
  async getByTask(taskId: string): Promise<AISuggestion[]> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get suggestions for user
  async getByUser(userId: string, limit = 10): Promise<AISuggestion[]> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('applied', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Create suggestion
  async create(suggestion: AISuggestionInsert): Promise<AISuggestion> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert(suggestion)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark suggestion as applied
  async markApplied(suggestionId: string): Promise<AISuggestion> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .update({ applied: true })
      .eq('id', suggestionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete suggestion
  async delete(suggestionId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_suggestions')
      .delete()
      .eq('id', suggestionId);

    if (error) throw error;
  },

  // Get suggestions by type
  async getByType(userId: string, type: AISuggestionTypeType): Promise<AISuggestion[]> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ============================================================================
// TASK COMMENTS OPERATIONS
// ============================================================================

export const taskCommentsOperations = {
  // Get comments for task
  async getByTask(taskId: string): Promise<(TaskComment & { user?: any })[]> {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('task_id', taskId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  // Create comment
  async create(comment: TaskCommentInsert): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update comment
  async update(commentId: string, content: string): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .update({ content })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete comment
  async delete(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  },
};

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

export const userProfileOperations = {
  // Get user profile
  async get(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Create or update user profile
  async upsert(profile: UserProfileInsert): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update preferences
  async updatePreferences(userId: string, preferences: any): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ preferences })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update AI settings
  async updateAISettings(userId: string, aiSettings: any): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ai_settings: aiSettings })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const realtimeSubscriptions = {
  // Subscribe to task changes
  subscribeToTasks(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to project changes
  subscribeToProject(projectId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`project-${projectId}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to time entries
  subscribeToTimeEntries(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('time-entries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to AI suggestions
  subscribeToAISuggestions(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('ai-suggestions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

export const analyticsOperations = {
  // Get productivity stats for user
  async getProductivityStats(userId: string, startDate?: string, endDate?: string) {
    const { data, error } = await supabase.rpc('get_productivity_stats', {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;
    return data;
  },

  // Get task completion trends
  async getCompletionTrends(userId: string, days = 30) {
    const { data, error } = await supabase.rpc('get_completion_trends', {
      user_id: userId,
      days: days,
    });

    if (error) throw error;
    return data;
  },

  // Get time tracking summary
  async getTimeTrackingSummary(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('get_time_tracking_summary', {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;
    return data;
  },
};

// Export all operations as a single object for convenience
export const enhancedSupabaseClient = {
  categories: categoryOperations,
  projects: projectOperations,
  tasks: enhancedTaskOperations,
  timeTracking: timeTrackingOperations,
  aiSuggestions: aiSuggestionsOperations,
  taskComments: taskCommentsOperations,
  userProfiles: userProfileOperations,
  realtime: realtimeSubscriptions,
  analytics: analyticsOperations,
};