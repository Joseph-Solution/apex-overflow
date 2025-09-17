import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTags = () => {
  const { user } = useAuth();
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTags();
    } else {
      setAllTags([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTags = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Get all unique tags from tasks
      const { data, error } = await supabase
        .from('tasks')
        .select('tags')
        .eq('user_id', user.id)
        .not('tags', 'is', null);

      if (error) throw error;

      // Extract and flatten all tags
      const tagSet = new Set<string>();
      data?.forEach((task: any) => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach((tag: string) => {
            if (tag.trim()) {
              tagSet.add(tag.trim());
            }
          });
        }
      });

      setAllTags(Array.from(tagSet).sort());
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagSuggestions = (input: string, limit: number = 10): string[] => {
    if (!input.trim()) return allTags.slice(0, limit);
    
    const inputLower = input.toLowerCase();
    return allTags
      .filter(tag => tag.toLowerCase().includes(inputLower))
      .slice(0, limit);
  };

  const getTagFrequency = async (tag: string): Promise<number> => {
    if (!user) return 0;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('tags')
        .eq('user_id', user.id)
        .contains('tags', [tag]);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error getting tag frequency:', error);
      return 0;
    }
  };

  const getPopularTags = (limit: number = 10): string[] => {
    // For now, return most recently used tags
    // In a real implementation, we'd track usage frequency
    return allTags.slice(0, limit);
  };

  return {
    allTags,
    loading,
    getTagSuggestions,
    getTagFrequency,
    getPopularTags,
    refetch: fetchTags,
  };
};