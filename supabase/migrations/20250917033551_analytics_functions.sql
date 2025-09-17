-- Analytics Functions for Enhanced Task Management

-- Function to bulk update task positions (for drag and drop)
CREATE OR REPLACE FUNCTION public.bulk_update_task_positions(updates JSONB)
RETURNS void AS $$
DECLARE
  update_record JSONB;
BEGIN
  FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE public.tasks 
    SET position = (update_record->>'position')::INTEGER
    WHERE id = (update_record->>'id')::UUID;
  END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = '';

-- Function to get productivity statistics for a user
CREATE OR REPLACE FUNCTION public.get_productivity_stats(
  user_id UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  completion_rate DECIMAL;
  avg_completion_time DECIMAL;
  current_streak INTEGER;
  longest_streak INTEGER;
  tasks_by_priority JSONB;
  tasks_by_category JSONB;
  result JSONB;
BEGIN
  -- Set default date range if not provided
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE - INTERVAL '30 days';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := CURRENT_DATE + INTERVAL '1 day';
  END IF;

  -- Get total and completed tasks
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_tasks, completed_tasks
  FROM public.tasks 
  WHERE tasks.user_id = get_productivity_stats.user_id
    AND created_at >= start_date 
    AND created_at < end_date;

  -- Calculate completion rate
  completion_rate := CASE 
    WHEN total_tasks > 0 THEN (completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100
    ELSE 0
  END;

  -- Calculate average completion time (in minutes)
  SELECT COALESCE(AVG(actual_duration), 0)
  INTO avg_completion_time
  FROM public.tasks 
  WHERE tasks.user_id = get_productivity_stats.user_id
    AND completed = true
    AND actual_duration IS NOT NULL
    AND created_at >= start_date 
    AND created_at < end_date;

  -- Calculate current streak (consecutive days with completed tasks)
  WITH daily_completions AS (
    SELECT 
      DATE(updated_at) as completion_date,
      COUNT(*) as completed_count
    FROM public.tasks 
    WHERE tasks.user_id = get_productivity_stats.user_id
      AND completed = true
      AND updated_at >= CURRENT_DATE - INTERVAL '365 days'
    GROUP BY DATE(updated_at)
    ORDER BY completion_date DESC
  ),
  streak_calculation AS (
    SELECT 
      completion_date,
      ROW_NUMBER() OVER (ORDER BY completion_date DESC) as row_num,
      completion_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1) as expected_date
    FROM daily_completions
  )
  SELECT COUNT(*)
  INTO current_streak
  FROM streak_calculation
  WHERE completion_date = expected_date;

  -- Calculate longest streak (simplified version)
  longest_streak := GREATEST(current_streak, 0);

  -- Get tasks by priority
  SELECT COALESCE(
    jsonb_object_agg(
      priority, 
      task_count
    ), 
    '{}'::jsonb
  )
  INTO tasks_by_priority
  FROM (
    SELECT 
      COALESCE(priority, 'medium') as priority,
      COUNT(*) as task_count
    FROM public.tasks 
    WHERE tasks.user_id = get_productivity_stats.user_id
      AND created_at >= start_date 
      AND created_at < end_date
    GROUP BY priority
  ) priority_counts;

  -- Get tasks by category
  SELECT COALESCE(
    jsonb_object_agg(
      COALESCE(c.name, 'Uncategorized'), 
      task_count
    ), 
    '{}'::jsonb
  )
  INTO tasks_by_category
  FROM (
    SELECT 
      t.category_id,
      COUNT(*) as task_count
    FROM public.tasks t
    WHERE t.user_id = get_productivity_stats.user_id
      AND t.created_at >= start_date 
      AND t.created_at < end_date
    GROUP BY t.category_id
  ) category_counts
  LEFT JOIN public.categories c ON c.id = category_counts.category_id;

  -- Build result JSON
  result := jsonb_build_object(
    'total_tasks', total_tasks,
    'completed_tasks', completed_tasks,
    'completion_rate', completion_rate,
    'average_completion_time', avg_completion_time,
    'current_streak', current_streak,
    'longest_streak', longest_streak,
    'tasks_by_priority', tasks_by_priority,
    'tasks_by_category', tasks_by_category
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = '';

-- Function to get task completion trends over time
CREATE OR REPLACE FUNCTION public.get_completion_trends(
  user_id UUID,
  days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '1 day' * days,
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE as date
  ),
  daily_completions AS (
    SELECT 
      DATE(updated_at) as completion_date,
      COUNT(*) as completed_count
    FROM public.tasks 
    WHERE tasks.user_id = get_completion_trends.user_id
      AND completed = true
      AND updated_at >= CURRENT_DATE - INTERVAL '1 day' * days
    GROUP BY DATE(updated_at)
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.date,
      'value', COALESCE(dc.completed_count, 0)
    ) ORDER BY ds.date
  )
  INTO result
  FROM date_series ds
  LEFT JOIN daily_completions dc ON ds.date = dc.completion_date;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = '';

-- Function to get time tracking summary
CREATE OR REPLACE FUNCTION public.get_time_tracking_summary(
  user_id UUID,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH time_summary AS (
    SELECT 
      t.title as task_title,
      c.name as category_name,
      p.name as project_name,
      SUM(te.duration) as total_seconds,
      COUNT(te.id) as entry_count
    FROM public.time_entries te
    JOIN public.tasks t ON t.id = te.task_id
    LEFT JOIN public.categories c ON c.id = t.category_id
    LEFT JOIN public.projects p ON p.id = t.project_id
    WHERE te.user_id = get_time_tracking_summary.user_id
      AND te.start_time >= start_date
      AND te.start_time < end_date
      AND te.duration IS NOT NULL
    GROUP BY t.id, t.title, c.name, p.name
  )
  SELECT jsonb_build_object(
    'total_time_seconds', COALESCE(SUM(total_seconds), 0),
    'total_entries', COALESCE(SUM(entry_count), 0),
    'by_task', jsonb_agg(
      jsonb_build_object(
        'task_title', task_title,
        'category_name', category_name,
        'project_name', project_name,
        'total_seconds', total_seconds,
        'entry_count', entry_count
      )
    )
  )
  INTO result
  FROM time_summary;

  RETURN COALESCE(result, jsonb_build_object(
    'total_time_seconds', 0,
    'total_entries', 0,
    'by_task', '[]'::jsonb
  ));
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = '';

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.bulk_update_task_positions(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_productivity_stats(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_completion_trends(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_time_tracking_summary(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;