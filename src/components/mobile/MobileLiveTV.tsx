import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactPlayer from "react-player";
import { Loader2, Radio, Volume2, VolumeX, Maximize, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { useAds } from "@/hooks/useAds";
import { AdBreakOverlay } from "@/components/AdBreakOverlay";
import { useProfile } from "@/context/ProfileContext";
import { useLiveViewerTracking } from "@/hooks/useLiveViewerTracking";

interface Channel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  playback_url: string | null;
  is_live_streaming: boolean;
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

export default function MobileLiveTV() {
  const { channelSlug } = useParams();
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [liveSegment, setLiveSegment] = useState<LiveSegment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const muxPollRef = useRef<NodeJS.Timeout | null>(null);
  const targetOffsetRef = useRef<number>(0);

  // Mid-roll ad timer state
  const [watchTimeSeconds, setWatchTimeSeconds] = useState(0);
  const [preRollPlayed, setPreRollPlayed] = useState(false);
  const [isUserInitiatedChannel, setIsUserInitiatedChannel] = useState(false);
  const midrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
  });

  // Ad system hook
  const {
    currentAd,
    isAdPlaying,
    showCountdown,
    countdownSeconds,
    adQueueLength,
    currentAdIndex,
    podConfig,
    canRequestMidRoll,
    onAdComplete,
    skipAd,
    requestPreRoll,
    requestMidRoll,
  } = useAds({
    channelId: selectedChannel?.id,
    membershipTier: 'free',
    deviceType: 'mobile',
  });

  // Real-time viewer tracking for analytics
  useLiveViewerTracking(selectedChannel?.id || null, isPlaying && !isAdPlaying);

  // Calculate next ad break countdown - 15 minutes for 4 breaks per hour
  const midrollIntervalSeconds = 15 * 60; // 15 minutes = 900 seconds
  const nextAdBreakIn = midrollIntervalSeconds > 0 
    ? midrollIntervalSeconds - (watchTimeSeconds % midrollIntervalSeconds)
    : 0;

  // Mid-roll timer effect
  useEffect(() => {
    if (!isPlaying || isAdPlaying || isLiveStreaming) {
      if (midrollTimerRef.current) {
        clearInterval(midrollTimerRef.current);
        midrollTimerRef.current = null;
      }
      return;
    }

    midrollTimerRef.current = setInterval(() => {
      setWatchTimeSeconds(prev => {
        const newTime = prev + 1;
        // Check if it's time for a mid-roll break AND we haven't exceeded max (4 per hour)
        if (newTime > 0 && midrollIntervalSeconds > 0 && newTime % midrollIntervalSeconds === 0 && canRequestMidRoll()) {
          console.log('[MobileLiveTV] Triggering mid-roll ad break (every 15 min, max 4 per hour)');
          requestMidRoll(10); // 10 second countdown
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (midrollTimerRef.current) {
        clearInterval(midrollTimerRef.current);
        midrollTimerRef.current = null;
      }
    };
  }, [isPlaying, isAdPlaying, isLiveStreaming, midrollIntervalSeconds, requestMidRoll, canRequestMidRoll]);

  // Pre-roll ads disabled for Live TV - only mid-roll ads are used

  // Track view to channel_views when playback starts
  const viewTrackedRef = useRef<string | null>(null);
  const viewRecordIdRef = useRef<string | null>(null);
  const viewStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const trackView = async () => {
      if (!selectedChannel?.id || !isPlaying || isAdPlaying) return;
      
      // Only track once per channel session
      if (viewTrackedRef.current === selectedChannel.id) return;
      viewTrackedRef.current = selectedChannel.id;
      viewStartTimeRef.current = Date.now();

      try {
        // Get geo data
        const funcUrl = `https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/detect-geo`;
        const session = await supabase.auth.getSession();
        
        let geoData = {
          country: null as string | null,
          region: null as string | null,
          city: null as string | null,
          postal: null as string | null,
          timezone: null as string | null,
        };

        try {
          const geoRes = await fetch(funcUrl, {
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token || ''}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
            },
          });
          if (geoRes.ok) {
            const geo = await geoRes.json();
            geoData = {
              country: geo.country || null,
              region: geo.region || null,
              city: geo.city || null,
              postal: geo.postal || null,
              timezone: geo.timezone || null,
            };
          }
        } catch (e) {
          console.error('Error fetching geo data:', e);
        }

        // Insert view record
        const { data: viewRecord } = await supabase.from('channel_views').insert({
          live_channel_id: selectedChannel.id,
          user_id: session.data.session?.user?.id || null,
          profile_id: currentProfile?.id || null,
          device_type: 'mobile',
          geo_country: geoData.country,
          geo_region: geoData.region,
          geo_city: geoData.city,
          geo_postal: geoData.postal,
          time_zone: geoData.timezone,
          duration_seconds: 0,
          progress_percent: 0,
        }).select('id').single();

        if (viewRecord) {
          viewRecordIdRef.current = viewRecord.id;
          console.log('[MobileLiveTV] View tracked:', viewRecord.id);
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
  }, [selectedChannel?.id, isPlaying, isAdPlaying, currentProfile?.id]);

  // Update view duration periodically - fixed to properly track cumulative duration
  const cumulativeDurationRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (!viewRecordIdRef.current) return;

    const updateDuration = async () => {
      if (!viewRecordIdRef.current || !isPlaying) return;
      
      const now = Date.now();
      if (lastUpdateTimeRef.current > 0) {
        // Add time since last update to cumulative duration
        cumulativeDurationRef.current += Math.floor((now - lastUpdateTimeRef.current) / 1000);
      }
      lastUpdateTimeRef.current = now;
      
      console.log('[MobileLiveTV] Updating duration:', cumulativeDurationRef.current, 'seconds');
      
      await supabase
        .from('channel_views')
        .update({ duration_seconds: cumulativeDurationRef.current })
        .eq('id', viewRecordIdRef.current);
    };

    // Initialize tracking when playing starts
    if (isPlaying && lastUpdateTimeRef.current === 0) {
      lastUpdateTimeRef.current = Date.now();
    }

    // Update every 15 seconds for more accurate tracking
    const interval = setInterval(updateDuration, 15000);

    return () => {
      clearInterval(interval);
      // Final update on unmount/pause
      if (viewRecordIdRef.current && isPlaying) {
        const now = Date.now();
        if (lastUpdateTimeRef.current > 0) {
          cumulativeDurationRef.current += Math.floor((now - lastUpdateTimeRef.current) / 1000);
        }
        supabase
          .from('channel_views')
          .update({ duration_seconds: cumulativeDurationRef.current })
          .eq('id', viewRecordIdRef.current);
      }
    };
  }, [isPlaying]);

  // Reset view tracking when channel changes
  useEffect(() => {
    return () => {
      viewTrackedRef.current = null;
      viewRecordIdRef.current = null;
      cumulativeDurationRef.current = 0;
      lastUpdateTimeRef.current = 0;
    };
  }, [selectedChannel?.id]);

  // Check Mux stream status for a channel
  const checkMuxStreamStatus = useCallback(async (channel: Channel) => {
    if (!channel.playback_url || !channel.id) return false;
    
    try {
      const funcUrl = `https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/mux-live-stream`;
      
      const res = await fetch(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
        },
        body: JSON.stringify({ action: 'status', channelId: channel.id }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Mux stream status:', data);
        const isActive = data.status === 'active' || data.isLive === true;
        setIsLiveStreaming(isActive);
        return isActive;
      }
    } catch (error) {
      console.error('Error checking Mux stream status:', error);
    }
    return false;
  }, []);

  // Fetch all channels
  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('live_channels_public')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setChannels(data);
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

  // Loading error state
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch current segment for selected channel (playlist-based fallback)
  const fetchLiveSegment = useCallback(async (isInitialLoad = false) => {
    if (!selectedChannel) return;
    
    // If we're live streaming via Mux, skip playlist segment fetch
    if (isLiveStreaming && selectedChannel.playback_url) {
      setLoadError(null);
      return;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const funcUrl = `https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/get-live-segment?channel=${selectedChannel.slug}`;
      
      const res = await fetch(funcUrl, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setLoadError(null);
      setRetryCount(0);

      if (res.ok) {
        const data = await res.json();
        console.log('[MobileLiveTV] Segment data:', { 
          videoUrl: data.videoUrl?.substring(0, 50),
          offsetSeconds: data.offsetSeconds,
          title: data.nowPlaying?.title 
        });
        setLiveSegment(data);
        
        if (isInitialLoad && data.videoUrl && data.offsetSeconds > 0) {
          // Store target offset for seeking - critical for join-in-progress
          targetOffsetRef.current = data.offsetSeconds;
          console.log('[MobileLiveTV] Setting up seek to offset:', data.offsetSeconds);
          setIsSeeking(true);
          setIsPlaying(false); // Don't play until seek completes
        } else if (isInitialLoad && data.videoUrl) {
          // No offset needed, start from beginning
          console.log('[MobileLiveTV] No offset needed, starting from beginning');
          targetOffsetRef.current = 0;
          setIsSeeking(false);
          setIsPlaying(true);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.type === 'idle') {
          setLiveSegment(errorData);
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('[MobileLiveTV] Request timed out');
        setLoadError('Connection timed out. Tap to retry.');
      } else {
        console.error('Error fetching live segment:', error);
        setLoadError('Failed to load stream. Tap to retry.');
      }
      
      // Auto-retry up to 3 times
      if (isInitialLoad && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[MobileLiveTV] Auto-retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchLiveSegment(true);
        }, delay);
      }
    }
  }, [selectedChannel, isLiveStreaming, retryCount]);

  // Manual retry function
  const handleRetry = useCallback(() => {
    setLoadError(null);
    setRetryCount(0);
    setIsLoading(true);
    fetchLiveSegment(true);
  }, [fetchLiveSegment]);

  // Check for Mux stream first, then fall back to playlist
  useEffect(() => {
    if (selectedChannel) {
      setIsPlaying(false);
      setIsSeeking(false);
      setIsLiveStreaming(false);
      targetOffsetRef.current = 0;
      
      const initChannel = async () => {
        if (selectedChannel.playback_url) {
          const isLive = await checkMuxStreamStatus(selectedChannel);
          if (isLive) {
            console.log('Mux stream is LIVE, playing HLS:', selectedChannel.playback_url);
            setIsPlaying(true);
          } else {
            fetchLiveSegment(true);
          }
        } else {
          fetchLiveSegment(true);
        }
      };
      
      initChannel();
      
      if (selectedChannel.playback_url) {
        muxPollRef.current = setInterval(() => {
          checkMuxStreamStatus(selectedChannel);
        }, 10000);
      }
      
      pollIntervalRef.current = setInterval(() => {
        if (!isLiveStreaming) {
          fetchLiveSegment(false);
        }
      }, 30000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (muxPollRef.current) {
        clearInterval(muxPollRef.current);
      }
    };
  }, [selectedChannel, fetchLiveSegment, checkMuxStreamStatus, isLiveStreaming]);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setLiveSegment(null);
    setIsPlaying(false);
    setIsSeeking(false);
    setPreRollPlayed(false); // Reset pre-roll for new channel
    setWatchTimeSeconds(0); // Reset watch time
    setIsUserInitiatedChannel(true); // Mark as user-initiated selection
    targetOffsetRef.current = 0;
    navigate(`/live/${channel.slug}`, { replace: true });
  };

  const handleVideoEnd = () => {
    fetchLiveSegment(true);
  };

  // Handle player ready - perform seek for join-in-progress
  const handlePlayerReady = () => {
    console.log('[MobileLiveTV] Player ready. isSeeking:', isSeeking, 'targetOffset:', targetOffsetRef.current, 'isLiveStreaming:', isLiveStreaming);
    
    // For live Mux streams, start playing immediately
    if (isLiveStreaming && selectedChannel?.playback_url) {
      setIsPlaying(true);
      return;
    }
    
    // If we need to seek to a specific offset (join-in-progress)
    if (isSeeking && targetOffsetRef.current > 0) {
      console.log('[MobileLiveTV] Seeking to offset:', targetOffsetRef.current, 'seconds');
      playerRef.current?.seekTo(targetOffsetRef.current, 'seconds');
      setTimeout(() => {
        console.log('[MobileLiveTV] Seek complete, starting playback');
        setIsSeeking(false);
        setIsPlaying(true);
      }, 500);
    } else if (!isSeeking && (liveSegment?.videoUrl || selectedChannel?.playback_url)) {
      console.log('[MobileLiveTV] No seek needed, starting playback');
      setIsPlaying(true);
    }
  };

  const toggleFullscreen = async () => {
    if (!playerContainerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
        // Force landscape on mobile
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {}
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      }
    } catch (e) {
      console.error('Fullscreen error:', e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs}h ${remainMins}m`;
    }
    return `${mins}m`;
  };

  // Get the video URL - prioritize Mux HLS playback URL if live streaming
  const getVideoUrl = () => {
    if (isLiveStreaming && selectedChannel?.playback_url) {
      return selectedChannel.playback_url;
    }
    return liveSegment?.videoUrl;
  };

  const videoUrl = getVideoUrl();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Video Player Section */}
      <div 
        ref={playerContainerRef}
        className={cn(
          "relative bg-black",
          isFullscreen ? "fixed inset-0 z-50" : "aspect-video"
        )}
      >
        {/* Live Badge and Ad Break Timer */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {isLiveStreaming ? '🔴 LIVE' : 'LIVE'}
          </span>
          {/* Ad Break Countdown - only show the 10-second pre-ad countdown */}
          {showCountdown && countdownSeconds > 0 && (
            <span className="bg-black/70 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Ad Break in {countdownSeconds}s
            </span>
          )}
        </div>

        {/* Channel Logo */}
        {(liveSegment?.channel?.logo || selectedChannel?.logo_url) && (
          <img
            src={liveSegment?.channel?.logo || selectedChannel?.logo_url || ''}
            alt={selectedChannel?.name || ''}
            className="absolute top-3 right-3 z-20 h-6 w-auto drop-shadow-lg"
          />
        )}

        {/* Controls */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            {isFullscreen ? <X className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>

        {/* Loading/Error Overlay */}
        {loadError ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
            <Radio className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-white text-sm mb-3">{loadError}</p>
            <Button onClick={handleRetry} variant="default" size="sm">
              Tap to Retry
            </Button>
          </div>
        ) : (isSeeking || (!isPlaying && videoUrl)) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-white text-sm">Joining live stream...</p>
          </div>
        )}

        {/* Video Player */}
        {videoUrl ? (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={isPlaying}
            muted={isMuted}
            width="100%"
            height="100%"
            playsinline
            onEnded={isLiveStreaming ? undefined : handleVideoEnd}
            onReady={handlePlayerReady}
            onError={(e) => console.error('Player error:', e)}
            config={{
              file: {
                forceHLS: videoUrl.includes('.m3u8'),
                attributes: {
                  crossOrigin: 'anonymous',
                },
                hlsOptions: {
                  enableWorker: true,
                  lowLatencyMode: true,
                  liveSyncDurationCount: 3,
                  liveMaxLatencyDurationCount: 10,
                },
              },
              vimeo: {
                playerOptions: {
                  background: true,
                  autoplay: false,
                  quality: 'auto',
                },
              },
            }}
          />
        ) : liveSegment?.type === 'idle' ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Radio className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-white text-sm">{liveSegment.message || 'No active broadcast'}</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {/* Ad Break Overlay */}
        {(isAdPlaying || showCountdown) && (
          <AdBreakOverlay
            ad={currentAd}
            position="mid"
            showCountdown={showCountdown}
            countdownSeconds={countdownSeconds}
            adQueueLength={adQueueLength}
            currentAdIndex={currentAdIndex}
            canSkip={false}
            onAdComplete={onAdComplete}
            onSkip={skipAd}
          />
        )}
      </div>

      {/* Channel Carousel */}
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-500" />
          Channels
        </h2>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel)}
                className={cn(
                  "flex-shrink-0 w-24 rounded-xl overflow-hidden border-2 transition-all",
                  selectedChannel?.id === channel.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border"
                )}
              >
                <div className="aspect-square bg-gradient-to-br from-card to-muted relative flex items-center justify-center">
                  {channel.logo_url ? (
                    <img src={channel.logo_url} alt={channel.name} className="h-10 w-auto" />
                  ) : (
                    <Radio className="h-8 w-8 text-muted-foreground" />
                  )}
                  {channel.is_live_streaming && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="p-2 bg-card">
                  <p className="text-xs font-medium text-foreground truncate text-center">
                    {channel.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Now Playing */}
      {liveSegment?.nowPlaying && (
        <div className="px-4 mb-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex gap-3">
              {liveSegment.nowPlaying.thumbnail && (
                <img
                  src={liveSegment.nowPlaying.thumbnail}
                  alt={liveSegment.nowPlaying.title}
                  className="w-20 h-12 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-semibold uppercase mb-0.5">
                  {isLiveStreaming ? '🔴 Live Broadcast' : 'Now Playing'}
                </p>
                <h3 className="text-sm font-bold text-foreground truncate">
                  {liveSegment.nowPlaying.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedChannel?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Up Next */}
      {!isLiveStreaming && liveSegment?.upNext && liveSegment.upNext.length > 0 && (
        <div className="px-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Up Next</h3>
          <div className="space-y-2">
            {liveSegment.upNext.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-card/50 rounded-lg p-2 border border-border">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-14 h-8 object-cover rounded"
                  />
                ) : (
                  <div className="w-14 h-8 bg-muted rounded flex items-center justify-center">
                    <Radio className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">in {formatTime(item.startsIn)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}