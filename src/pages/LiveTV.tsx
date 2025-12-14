import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileLiveTV from "@/components/mobile/MobileLiveTV";
import MobileLayout from "@/components/mobile/MobileLayout";
import ReactPlayer from "react-player";
import { Loader2, Radio, Volume2, VolumeX, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAds } from "@/hooks/useAds";
import { AdBreakOverlay } from "@/components/AdBreakOverlay";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [preRollPlayed, setPreRollPlayed] = useState(false);
  const [isUserInitiatedChannel, setIsUserInitiatedChannel] = useState(false);
  const [watchTimeSeconds, setWatchTimeSeconds] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const muxPollRef = useRef<NodeJS.Timeout | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const midrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const targetOffsetRef = useRef<number>(0);

  // Ad system integration
  const {
    currentAd,
    isAdPlaying,
    adPosition,
    countdownSeconds,
    showCountdown,
    adQueueLength,
    podConfig,
    canRequestMidRoll,
    requestPreRoll,
    requestMidRoll,
    onAdComplete,
    skipAd,
  } = useAds({
    channelId: selectedChannel?.id,
    membershipTier: 'free', // Live TV uses free tier ads by default
    deviceType: isMobile ? 'mobile' : 'desktop',
    onAdStart: () => setIsPlaying(false),
    onAdEnd: () => setIsPlaying(true),
  });

  // Real-time viewer tracking for analytics
  useLiveViewerTracking(selectedChannel?.id || null, isPlaying && !isAdPlaying);

  // Mid-roll ad timer - triggers ad breaks at 15-minute intervals (4 breaks per hour)
  // Using 15 minutes (900 seconds) for 4 mid-rolls per 60-minute period
  const midrollIntervalSeconds = 15 * 60; // 15 minutes = 900 seconds
  
  useEffect(() => {
    // Don't run timer if not playing, ad is playing, or no video
    if (!isPlaying || isAdPlaying || !selectedChannel) {
      if (midrollTimerRef.current) {
        clearInterval(midrollTimerRef.current);
        midrollTimerRef.current = null;
      }
      return;
    }
    
    // Start the watch time timer
    midrollTimerRef.current = setInterval(() => {
      setWatchTimeSeconds(prev => {
        const newTime = prev + 1;
        // Check if it's time for a mid-roll break AND we haven't exceeded max (4 per hour)
        if (newTime > 0 && newTime % midrollIntervalSeconds === 0 && canRequestMidRoll()) {
          console.log(`[LiveTV Ads] Mid-roll triggered at ${newTime}s (break every 15 min, max 4 per hour)`);
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
  }, [isPlaying, isAdPlaying, selectedChannel, midrollIntervalSeconds, requestMidRoll, canRequestMidRoll]);

  // Reset watch time when changing channels
  useEffect(() => {
    setWatchTimeSeconds(0);
  }, [selectedChannel?.id]);

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
          device_type: 'desktop',
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
          console.log('[LiveTV] View tracked:', viewRecord.id);
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
  
  // Initialize tracking start time when playback begins
  useEffect(() => {
    if (isPlaying && viewRecordIdRef.current && lastUpdateTimeRef.current === 0) {
      lastUpdateTimeRef.current = Date.now();
      console.log('[LiveTV] Duration tracking started at:', new Date().toISOString());
    }
  }, [isPlaying]);
  
  useEffect(() => {
    if (!viewRecordIdRef.current || !isPlaying) return;

    const updateDuration = async () => {
      if (!viewRecordIdRef.current) return;
      
      const now = Date.now();
      if (lastUpdateTimeRef.current > 0) {
        // Add time since last update to cumulative duration
        const elapsed = Math.floor((now - lastUpdateTimeRef.current) / 1000);
        cumulativeDurationRef.current += elapsed;
        console.log('[LiveTV] Adding', elapsed, 'seconds. Total:', cumulativeDurationRef.current, 'seconds');
      }
      lastUpdateTimeRef.current = now;
      
      const { error } = await supabase
        .from('channel_views')
        .update({ duration_seconds: cumulativeDurationRef.current })
        .eq('id', viewRecordIdRef.current);
      
      if (error) {
        console.error('[LiveTV] Error updating duration:', error);
      }
    };

    // Update every 10 seconds for more accurate tracking
    const interval = setInterval(updateDuration, 10000);

    return () => {
      clearInterval(interval);
      // Final update on cleanup - capture time since last update
      if (viewRecordIdRef.current && lastUpdateTimeRef.current > 0) {
        const now = Date.now();
        const elapsed = Math.floor((now - lastUpdateTimeRef.current) / 1000);
        cumulativeDurationRef.current += elapsed;
        console.log('[LiveTV] Final update:', cumulativeDurationRef.current, 'seconds');
        
        // Use .then() instead of await since this is cleanup
        supabase
          .from('channel_views')
          .update({ duration_seconds: cumulativeDurationRef.current })
          .eq('id', viewRecordIdRef.current)
          .then(({ error }) => {
            if (error) console.error('[LiveTV] Error on final update:', error);
          });
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

  // Fetch follow status and follower count for selected channel
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!selectedChannel?.id || !currentProfile?.id) {
        setIsFollowing(false);
        return;
      }

      const { data } = await supabase
        .from("live_channel_favorites")
        .select("id")
        .eq("profile_id", currentProfile.id)
        .eq("live_channel_id", selectedChannel.id)
        .single();

      setIsFollowing(!!data);
    };

    const fetchFollowerCount = async () => {
      if (!selectedChannel?.id) return;

      const { count } = await supabase
        .from("live_channel_favorites")
        .select("*", { count: "exact", head: true })
        .eq("live_channel_id", selectedChannel.id);

      setFollowerCount(count || 0);
    };

    fetchFollowStatus();
    fetchFollowerCount();
  }, [selectedChannel?.id, currentProfile?.id]);

  const toggleFollow = async () => {
    if (!currentProfile?.id || !selectedChannel?.id) return;

    if (isFollowing) {
      await supabase
        .from("live_channel_favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("live_channel_id", selectedChannel.id);
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from("live_channel_favorites").insert({
        profile_id: currentProfile.id,
        live_channel_id: selectedChannel.id,
      });
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
    }
  };

  // Check if channel has active Mux stream using database value (no API polling to avoid rate limits)
  const checkMuxStreamStatus = useCallback((channel: Channel): boolean => {
    if (!channel.playback_url) return false;
    // Use the is_live_streaming value from database - no API call needed
    const isActive = channel.is_live_streaming === true;
    setIsLiveStreaming(isActive);
    return isActive;
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

  // Loading state with error handling
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Track current video URL to prevent unnecessary re-renders
  const currentVideoUrlRef = useRef<string | null>(null);

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
      const session = await supabase.auth.getSession();
      
      const res = await fetch(funcUrl, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token || ''}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setLoadError(null);
      setRetryCount(0);

      if (res.ok) {
        const data = await res.json();
        console.log('[LiveTV] Segment data:', { 
          videoUrl: data.videoUrl?.substring(0, 50),
          offsetSeconds: data.offsetSeconds,
          title: data.nowPlaying?.title,
          isInitialLoad 
        });
        
        // For polling (non-initial loads), only update if video URL changed
        // This prevents freezing when polling finds the same video still playing
        if (!isInitialLoad && currentVideoUrlRef.current === data.videoUrl) {
          // Same video still playing, just update metadata (upNext, etc) without triggering seek
          setLiveSegment(prev => prev ? {
            ...prev,
            upNext: data.upNext,
            nowPlaying: data.nowPlaying,
          } : data);
          return;
        }
        
        // Track the new video URL
        currentVideoUrlRef.current = data.videoUrl;
        setLiveSegment(data);
        
        if (isInitialLoad && data.videoUrl && data.offsetSeconds > 0) {
          // Store target offset for seeking - this is critical for join-in-progress
          targetOffsetRef.current = data.offsetSeconds;
          console.log('[LiveTV] Setting up seek to offset:', data.offsetSeconds);
          // Mark as needing to seek, player will handle it when ready
          setIsSeeking(true);
          setIsPlaying(false); // Don't play until seek completes
        } else if (isInitialLoad && data.videoUrl) {
          // No offset needed (beginning of video), can start immediately
          console.log('[LiveTV] No offset needed, starting from beginning');
          targetOffsetRef.current = 0;
          setIsSeeking(false);
          setIsPlaying(true);
        } else if (!isInitialLoad && data.videoUrl) {
          // Video changed during polling - smooth transition
          console.log('[LiveTV] Video changed, transitioning to:', data.nowPlaying?.title);
          targetOffsetRef.current = data.offsetSeconds || 0;
          // For short videos, seek immediately without stopping playback
          if (playerRef.current && data.offsetSeconds > 0) {
            playerRef.current.seekTo(data.offsetSeconds, 'seconds');
          }
          // Keep playing - don't reset isPlaying state
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.log('Live segment response:', res.status, errorData);
        
        if (errorData.type === 'idle') {
          setLiveSegment(errorData);
          currentVideoUrlRef.current = null;
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('[LiveTV] Request timed out');
        setLoadError('Connection timed out. Tap to retry.');
      } else {
        console.error('Error fetching live segment:', error);
        setLoadError('Failed to load stream. Tap to retry.');
      }
      
      // Auto-retry up to 3 times with exponential backoff
      if (isInitialLoad && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[LiveTV] Auto-retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
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

  // Countdown timer (no longer used for seeking - keeping for backwards compatibility)
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null && prev > 1) ? prev - 1 : null);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  // Check for Mux stream first, then fall back to playlist
  useEffect(() => {
    if (selectedChannel) {
      // Reset player state when switching channels
      setIsPlaying(false);
      setIsSeeking(false);
      setCountdown(null);
      setIsLiveStreaming(false);
      targetOffsetRef.current = 0;
      currentVideoUrlRef.current = null; // Reset video URL tracking
      
      // Check if this channel has an active Mux stream using database value
      const initChannel = () => {
        if (selectedChannel.playback_url && selectedChannel.is_live_streaming) {
          // Channel is live streaming via Mux - play immediately
          console.log('Mux stream is LIVE, playing HLS:', selectedChannel.playback_url);
          setIsLiveStreaming(true);
          setIsPlaying(true);
        } else {
          // Not live streaming, fall back to playlist
          fetchLiveSegment(true);
        }
      };
      
      initChannel();
      
      // Subscribe to realtime updates for this channel's live status
      const channelSubscription = supabase
        .channel(`live-channel-${selectedChannel.id}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'live_channels', filter: `id=eq.${selectedChannel.id}` },
          (payload) => {
            const newData = payload.new as any;
            if (newData.is_live_streaming !== undefined) {
              setIsLiveStreaming(newData.is_live_streaming);
              if (newData.is_live_streaming && newData.playback_url) {
                console.log('Stream went LIVE, switching to HLS');
                setIsPlaying(true);
              }
            }
          }
        )
        .subscribe();
      
      // Poll playlist every 15 seconds for smoother transitions with short videos
      // The fetchLiveSegment function now handles same-video detection to prevent freezing
      pollIntervalRef.current = setInterval(() => {
        if (!isLiveStreaming) {
          fetchLiveSegment(false);
        }
      }, 15000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (muxPollRef.current) {
        clearInterval(muxPollRef.current);
      }
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      // Cleanup realtime subscription
      supabase.channel(`live-channel-${selectedChannel?.id}`).unsubscribe();
    };
  }, [selectedChannel, fetchLiveSegment, isLiveStreaming]);

  const handleChannelSelect = async (channel: Channel) => {
    setSelectedChannel(channel);
    setLiveSegment(null);
    setIsPlaying(false);
    setIsSeeking(false);
    setCountdown(null);
    setPreRollPlayed(true); // Pre-roll disabled for live TV
    setIsUserInitiatedChannel(true); // Mark as user-initiated selection
    setWatchTimeSeconds(0); // Reset watch time for new channel
    targetOffsetRef.current = 0;
    currentVideoUrlRef.current = null; // Reset video URL tracking
    navigate(`/live/${channel.slug}`, { replace: true });
    
    // Pre-roll ads disabled for live TV - start playing immediately
    setIsPlaying(true);
  };

  const handleVideoEnd = () => {
    // When video ends, immediately fetch next segment
    fetchLiveSegment(true);
  };

  // Handle player ready - this is where we perform the seek for join-in-progress
  const handlePlayerReady = () => {
    console.log('[LiveTV] Player ready. isSeeking:', isSeeking, 'targetOffset:', targetOffsetRef.current, 'isLiveStreaming:', isLiveStreaming);
    
    // For live Mux streams, start playing immediately
    if (isLiveStreaming && selectedChannel?.playback_url) {
      setIsPlaying(true);
      return;
    }
    
    // If we need to seek to a specific offset (join-in-progress)
    if (isSeeking && targetOffsetRef.current > 0) {
      console.log('[LiveTV] Seeking to offset:', targetOffsetRef.current, 'seconds');
      // Perform the seek
      playerRef.current?.seekTo(targetOffsetRef.current, 'seconds');
      // Wait for seek to complete, then start playing
      seekTimeoutRef.current = setTimeout(() => {
        console.log('[LiveTV] Seek complete, starting playback');
        setIsSeeking(false);
        setIsPlaying(true);
      }, 500); // Give more time for seek to complete
    } else if (!isSeeking && liveSegment?.videoUrl) {
      // No seeking needed, start playing from beginning
      console.log('[LiveTV] No seek needed, starting playback');
      setIsPlaying(true);
    }
  };

  // Get the video URL - prioritize Mux HLS playback URL if live streaming
  const getVideoUrl = () => {
    if (isLiveStreaming && selectedChannel?.playback_url) {
      return selectedChannel.playback_url;
    }
    return liveSegment?.videoUrl;
  };

  const videoUrl = getVideoUrl();

  // Pre-roll ads enabled for Live TV when user selects a channel

  // Calculate next ad break time
  const getNextAdBreakIn = () => {
    if (midrollIntervalSeconds <= 0) return null;
    const remaining = midrollIntervalSeconds - (watchTimeSeconds % midrollIntervalSeconds);
    return remaining;
  };

  const nextAdBreakIn = getNextAdBreakIn();

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

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const content = (
    <div className="min-h-screen bg-background pt-16">
      {/* Ad Break Overlay */}
      <AdBreakOverlay
        ad={currentAd}
        position={adPosition}
        countdownSeconds={countdownSeconds}
        showCountdown={showCountdown}
        adQueueLength={adQueueLength}
        canSkip={false}
        onAdComplete={onAdComplete}
        onSkip={skipAd}
      />
      
      {/* Channel Selector Bar */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border">
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
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Radio className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Connection Issue</h2>
            <p className="text-muted-foreground mb-4">{loadError}</p>
            <Button onClick={handleRetry} variant="default">
              Tap to Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !selectedChannel ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Radio className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Channels Available</h2>
            <p className="text-muted-foreground">Check back later for live content</p>
          </div>
        ) : liveSegment?.type === 'idle' && !isLiveStreaming ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Radio className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{selectedChannel.name}</h2>
            <p className="text-muted-foreground">{liveSegment.message || 'No active broadcast'}</p>
          </div>
        ) : (videoUrl || isLiveStreaming) ? (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              {/* LIVE Badge and Ad Break Timer */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <span className={cn(
                  "text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1.5",
                  isLiveStreaming ? "bg-red-600" : "bg-red-600/80"
                )}>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  {isLiveStreaming ? '🔴 LIVE STREAM' : 'LIVE'}
                </span>
                {/* Ad Break Countdown - only show the 10-second pre-ad countdown */}
                {showCountdown && countdownSeconds > 0 && (
                  <span className="bg-black/70 text-white/80 px-2 py-1 rounded text-xs flex items-center gap-1.5">
                    Ad Break in {countdownSeconds}s
                  </span>
                )}
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

              {/* Loading Overlay - Don't show for live Mux streams */}
              {!isLiveStreaming && (isSeeking || (!isPlaying && liveSegment?.videoUrl)) && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-white">Syncing to live position...</p>
                  {liveSegment?.nowPlaying?.title && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {liveSegment.nowPlaying.title}
                    </p>
                  )}
                </div>
              )}

              {videoUrl ? (
                <ReactPlayer
                  ref={playerRef}
                  url={videoUrl}
                  playing={isPlaying}
                  muted={isMuted}
                  width="100%"
                  height="100%"
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
                  {!isLiveStreaming && liveSegment?.nowPlaying?.thumbnail && (
                    <img
                      src={liveSegment.nowPlaying.thumbnail}
                      alt={liveSegment.nowPlaying.title}
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                  )}
                  {isLiveStreaming && selectedChannel?.logo_url && (
                    <img
                      src={selectedChannel.logo_url}
                      alt={selectedChannel.name}
                      className="w-32 h-20 object-contain rounded-lg bg-muted p-2"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                      {isLiveStreaming ? '🔴 Live Broadcast' : 'Now Playing'}
                    </p>
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {isLiveStreaming ? selectedChannel.name : (liveSegment?.nowPlaying?.title || 'Loading...')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isLiveStreaming ? 'Live from Switcher Studio' : (liveSegment?.nowPlaying?.type === 'ad' ? 'Advertisement' : selectedChannel.name)}
                    </p>
                    {!isLiveStreaming && liveSegment?.nowPlaying?.duration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Duration: {formatTime(liveSegment.nowPlaying.duration)}
                      </p>
                    )}
                    {/* Follow Button */}
                    <Button
                      variant={isFollowing ? "secondary" : "outline"}
                      size="sm"
                      onClick={toggleFollow}
                      className="mt-3 gap-2"
                    >
                      <Heart className={`h-4 w-4 ${isFollowing ? "fill-primary text-primary" : ""}`} />
                      {isFollowing ? "Following" : "Follow"}
                      <span className="text-muted-foreground">({followerCount})</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Up Next - Hide for live Mux streams */}
              {!isLiveStreaming && (
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
              )}
            </div>

            {/* Channel Info */}
            {selectedChannel.description && (
              <div className="bg-card/50 rounded-xl p-5 border border-border">
                <h4 className="font-semibold text-foreground mb-2">About {selectedChannel.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileLayout hideHeader>
        <MobileLiveTV />
      </MobileLayout>
    );
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
