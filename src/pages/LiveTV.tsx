import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileLayout from "@/components/mobile/MobileLayout";
import ReactPlayer from "react-player";
import { Loader2, Radio, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
}

interface LiveSegment {
  type: 'show' | 'ad' | 'idle';
  videoUrl: string;
  offsetSeconds: number;
  nowPlaying: {
    title: string;
    thumbnail: string | null;
    duration: number;
    type: string;
  };
  upNext: Array<{
    title: string;
    thumbnail: string | null;
    startsIn: number;
  }>;
  channel: {
    name: string;
    logo: string | null;
    slug: string;
  };
  message?: string;
}

export default function LiveTV() {
  const { channelSlug } = useParams();
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const isMobile = useIsMobile();
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [liveSegment, setLiveSegment] = useState<LiveSegment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const playerRef = useRef<ReactPlayer>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all channels
  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('live_channels')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setChannels(data);
        // If we have a slug param, select that channel
        if (channelSlug) {
          const channel = data.find(c => c.slug === channelSlug);
          if (channel) {
            setSelectedChannel(channel);
          } else if (data.length > 0) {
            setSelectedChannel(data[0]);
          }
        } else if (data.length > 0) {
          setSelectedChannel(data[0]);
        }
      }
      setIsLoading(false);
    };

    fetchChannels();
  }, [channelSlug]);

  // Fetch current segment for selected channel
  const fetchLiveSegment = useCallback(async () => {
    if (!selectedChannel) return;

    try {
      // Use query params approach to pass channel slug
      const funcUrl = `https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/get-live-segment?channel=${selectedChannel.slug}`;
      const session = await supabase.auth.getSession();
      
      const res = await fetch(funcUrl, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token || ''}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLiveSegment(data);
        
        // Seek to offset if we have a player
        if (data.offsetSeconds && playerRef.current) {
          setTimeout(() => {
            playerRef.current?.seekTo(data.offsetSeconds, 'seconds');
          }, 500);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.log('Live segment response:', res.status, errorData);
        
        // If it's an idle response, still set it
        if (errorData.type === 'idle') {
          setLiveSegment(errorData);
        }
      }
    } catch (error) {
      console.error('Error fetching live segment:', error);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (selectedChannel) {
      fetchLiveSegment();
      
      // Poll every 30 seconds to stay in sync
      pollIntervalRef.current = setInterval(fetchLiveSegment, 30000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedChannel, fetchLiveSegment]);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setLiveSegment(null);
    navigate(`/live/${channel.slug}`, { replace: true });
  };

  const handleVideoEnd = () => {
    // When video ends, immediately fetch next segment
    fetchLiveSegment();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs}h ${remainMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const content = (
    <div className="min-h-screen bg-background">
      {/* Channel Selector Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 p-3">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  "border hover:bg-primary/10",
                  selectedChannel?.id === channel.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground"
                )}
              >
                {channel.logo_url ? (
                  <img src={channel.logo_url} alt={channel.name} className="h-5 w-auto" />
                ) : (
                  <Radio className="h-4 w-4" />
                )}
                <span className="font-medium text-sm">{channel.name}</span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !selectedChannel ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Radio className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Channels Available</h2>
            <p className="text-muted-foreground">Check back later for live content</p>
          </div>
        ) : liveSegment?.type === 'idle' ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Radio className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{selectedChannel.name}</h2>
            <p className="text-muted-foreground">{liveSegment.message || 'No active broadcast'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              {/* LIVE Badge */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
              </div>

              {/* Channel Logo */}
              {liveSegment?.channel?.logo && (
                <img
                  src={liveSegment.channel.logo}
                  alt={liveSegment.channel.name}
                  className="absolute top-4 right-4 z-20 h-10 w-auto drop-shadow-lg"
                />
              )}

              {/* Mute/Unmute Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              {liveSegment?.videoUrl ? (
                <ReactPlayer
                  ref={playerRef}
                  url={liveSegment.videoUrl}
                  playing={isPlaying}
                  muted={isMuted}
                  width="100%"
                  height="100%"
                  onEnded={handleVideoEnd}
                  config={{
                    vimeo: {
                      playerOptions: {
                        background: true,
                        autoplay: true,
                        quality: 'auto',
                      },
                    },
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Now Playing & Up Next */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Now Playing */}
              <div className="md:col-span-2 bg-card rounded-xl p-5 border border-border">
                <div className="flex items-start gap-4">
                  {liveSegment?.nowPlaying?.thumbnail && (
                    <img
                      src={liveSegment.nowPlaying.thumbnail}
                      alt={liveSegment.nowPlaying.title}
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                      Now Playing
                    </p>
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {liveSegment?.nowPlaying?.title || 'Loading...'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {liveSegment?.nowPlaying?.type === 'ad' ? 'Advertisement' : selectedChannel.name}
                    </p>
                    {liveSegment?.nowPlaying?.duration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Duration: {formatTime(liveSegment.nowPlaying.duration)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Up Next */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-3">
                  Up Next
                </p>
                <div className="space-y-3">
                  {liveSegment?.upNext && liveSegment.upNext.length > 0 ? (
                    liveSegment.upNext.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                            <Radio className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            in {formatTime(item.startsIn)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming content</p>
                  )}
                </div>
              </div>
            </div>

            {/* Channel Info */}
            {selectedChannel.description && (
              <div className="bg-card/50 rounded-xl p-5 border border-border">
                <h4 className="font-semibold text-foreground mb-2">About {selectedChannel.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ExpandingSidebar />
      <main className="ml-16">
        {content}
      </main>
    </div>
  );
}
