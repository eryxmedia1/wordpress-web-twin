import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Radio, Play } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface LiveSegmentPreview {
  nowPlaying?: {
    title: string;
    thumbnail: string | null;
  };
}

export default function MobileLiveTVRow() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelPreviews, setChannelPreviews] = useState<Record<string, LiveSegmentPreview>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('live_channels')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .limit(10);

      if (!error && data) {
        setChannels(data);
        
        for (const channel of data) {
          fetchChannelPreview(channel.slug);
        }
      }
      setIsLoading(false);
    };

    fetchChannels();
  }, []);

  const fetchChannelPreview = async (slug: string) => {
    try {
      const funcUrl = `https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/get-live-segment?channel=${slug}`;
      const res = await fetch(funcUrl, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.nowPlaying) {
          setChannelPreviews(prev => ({
            ...prev,
            [slug]: { nowPlaying: data.nowPlaying }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching channel preview:', error);
    }
  };

  if (isLoading || channels.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <h2 className="text-lg font-bold text-foreground">Live TV</h2>
        </div>
        <Link to="/live" className="text-xs text-muted-foreground flex items-center">
          See All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Channel Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {channels.map((channel) => {
          const preview = channelPreviews[channel.slug];
          
          return (
            <Link
              key={channel.id}
              to={`/live/${channel.slug}`}
              className="flex-shrink-0 w-[200px] bg-card border border-border rounded-lg overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted">
                {preview?.nowPlaying?.thumbnail ? (
                  <img
                    src={preview.nowPlaying.thumbnail}
                    alt={preview.nowPlaying.title}
                    className="w-full h-full object-cover"
                  />
                ) : channel.logo_url ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
                    <img src={channel.logo_url} alt={channel.name} className="h-8 w-auto" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Radio className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* LIVE Badge */}
                <div className="absolute top-1.5 left-1.5 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-current" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <h3 className="font-medium text-foreground text-xs truncate">{channel.name}</h3>
                {preview?.nowPlaying?.title && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {preview.nowPlaying.title}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
