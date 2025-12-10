import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VimeoMetadata } from './useVimeoMetadata';

export type YouTubeMetadata = VimeoMetadata;

export const useYouTubeMetadata = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async (url: string): Promise<YouTubeMetadata | null> => {
    if (!url || (!url.includes('youtube') && !url.includes('youtu.be'))) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-metadata', {
        body: { url }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setMetadata(data);
      toast.success('YouTube metadata fetched successfully!');
      
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch YouTube metadata';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMetadata = useCallback(() => {
    setMetadata(null);
    setError(null);
  }, []);

  return {
    fetchMetadata,
    clearMetadata,
    metadata,
    isLoading,
    error
  };
};
