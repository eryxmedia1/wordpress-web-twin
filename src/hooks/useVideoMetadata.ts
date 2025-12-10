import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VideoMetadata {
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
  provider: 'vimeo' | 'youtube' | 'unknown';
  width: number | null;
  height: number | null;
  is_direct_url?: boolean;
}

type VideoProvider = 'vimeo' | 'youtube' | 'unknown';

function detectProvider(url: string): VideoProvider {
  if (url.includes('vimeo')) return 'vimeo';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

export const useVideoMetadata = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<VideoProvider>('unknown');

  const fetchMetadata = useCallback(async (url: string): Promise<VideoMetadata | null> => {
    if (!url) return null;

    const detectedProvider = detectProvider(url);
    setProvider(detectedProvider);

    if (detectedProvider === 'unknown') {
      setMetadata(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const functionName = detectedProvider === 'vimeo' ? 'vimeo-metadata' : 'youtube-metadata';
      
      const { data, error: fnError } = await supabase.functions.invoke(functionName, {
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
        toast.info('Direct video URL detected. Enter thumbnail manually or paste a regular video URL.');
      } else {
        toast.success(`${detectedProvider === 'vimeo' ? 'Vimeo' : 'YouTube'} metadata fetched successfully!`);
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = err.message || `Failed to fetch ${detectedProvider} metadata`;
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
    setProvider('unknown');
  }, []);

  return {
    fetchMetadata,
    clearMetadata,
    metadata,
    isLoading,
    error,
    provider
  };
};
