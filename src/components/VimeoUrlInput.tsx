import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Video } from 'lucide-react';
import { useVimeoMetadata, VimeoMetadata } from '@/hooks/useVimeoMetadata';

interface VimeoUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onMetadataFetched?: (metadata: VimeoMetadata) => void;
  placeholder?: string;
  className?: string;
}

export const VimeoUrlInput = ({
  value,
  onChange,
  onMetadataFetched,
  placeholder = "Paste Vimeo URL (e.g., https://vimeo.com/123456789)",
  className = ""
}: VimeoUrlInputProps) => {
  const { fetchMetadata, isLoading, metadata, error } = useVimeoMetadata();
  const [localValue, setLocalValue] = useState(value);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('vimeo')) {
      setLocalValue(pastedText);
      onChange(pastedText);
      
      // Auto-fetch metadata on paste
      const meta = await fetchMetadata(pastedText);
      if (meta && onMetadataFetched) {
        onMetadataFetched(meta);
        setHasFetched(true);
      }
    }
  };

  const handleFetch = async () => {
    if (!localValue) return;
    
    const meta = await fetchMetadata(localValue);
    if (meta && onMetadataFetched) {
      onMetadataFetched(meta);
      setHasFetched(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    setHasFetched(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="url"
            value={localValue}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={`pr-10 ${className}`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : hasFetched && metadata ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : error ? (
              <X className="h-4 w-4 text-destructive" />
            ) : (
              <Video className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleFetch}
          disabled={isLoading || !localValue}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Fetch Info'
          )}
        </Button>
      </div>
      
      {/* Thumbnail Preview */}
      {metadata?.thumbnail_url && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <img 
            src={metadata.thumbnail_url} 
            alt="Video thumbnail" 
            className="w-24 h-14 object-cover rounded"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {metadata.title || 'Vimeo Video'}
            </p>
            {metadata.duration && (
              <p className="text-xs text-muted-foreground">
                Duration: {metadata.duration}
              </p>
            )}
            {metadata.author_name && (
              <p className="text-xs text-muted-foreground">
                By: {metadata.author_name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
