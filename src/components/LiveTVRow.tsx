import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Radio, Play } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Channel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
}

interface LiveSegmentPreview {
  nowPlaying?: {
    title: string;
    thumbnail: string | null;
  };
}

export default function LiveTVRow() {
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
        
        // Fetch preview for each channel
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Live TV</h2>
          </div>
        </div>
        <Link to="/live">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            See All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Channel Cards */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {channels.map((channel) => {
            const preview = channelPreviews[channel.slug];
            
            return (
              <Link
                key={channel.id}
                to={`/live/${channel.slug}`}
                className="group flex-shrink-0 w-[280px] bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:scale-[1.02]"
              >
                {/* Thumbnail/Preview */}
                <div className="relative aspect-video bg-muted">
                  {preview?.nowPlaying?.thumbnail ? (
                    <img
                      src={preview.nowPlaying.thumbnail}
                      alt={preview.nowPlaying.title}
                      className="w-full h-full object-cover"
                    />
                  ) : channel.logo_url ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
                      <img src={channel.logo_url} alt={channel.name} className="h-12 w-auto" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Radio className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* LIVE Badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>

                  {/* Play Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Play className="h-6 w-6 text-primary-foreground fill-current" />
                    </div>
                  </div>
                </div>

                {/* Channel Info */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {channel.logo_url && (
                      <img src={channel.logo_url} alt={channel.name} className="h-5 w-auto" />
                    )}
                    <h3 className="font-semibold text-foreground text-sm">{channel.name}</h3>
                  </div>
                  {preview?.nowPlaying?.title && (
                    <p className="text-xs text-muted-foreground truncate">
                      Now: {preview.nowPlaying.title}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
