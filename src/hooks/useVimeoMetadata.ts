import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VimeoMetadata {
  title: string | null;
  thumbnail_url: string | null;
  thumbnail_large: string | null;
  duration: string | null;
  duration_seconds: number | null;
  description: string | null;
  author_name: string | null;
  author_url: string | null;
  video_id: string | null;
  video_url: string;
  embed_url: string | null;
  provider: string;
  width: number | null;
  height: number | null;
  is_direct_url?: boolean;
}

export const useVimeoMetadata = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<VimeoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async (url: string): Promise<VimeoMetadata | null> => {
    if (!url || !url.includes('vimeo')) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('vimeo-metadata', {
        body: { url }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setMetadata(data);
      
      if (data.is_direct_url) {
        toast.info('Direct video URL detected. Enter thumbnail manually or paste a regular Vimeo URL.');
      } else {
        toast.success('Vimeo metadata fetched successfully!');
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch Vimeo metadata';
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
