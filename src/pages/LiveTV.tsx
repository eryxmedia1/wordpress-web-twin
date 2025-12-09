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

  // Mid-roll ad timer - triggers ad breaks at configured intervals
  const midrollIntervalSeconds = (podConfig.midrollIntervalMinutes || 10) * 60;
  
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
        // Check if it's time for a mid-roll break
        if (newTime > 0 && newTime % midrollIntervalSeconds === 0) {
          console.log(`[LiveTV Ads] Mid-roll triggered at ${newTime}s (interval: ${midrollIntervalSeconds}s)`);
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
  }, [isPlaying, isAdPlaying, selectedChannel, midrollIntervalSeconds, requestMidRoll]);

  // Reset watch time when changing channels
  useEffect(() => {
    setWatchTimeSeconds(0);
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

  // Check Mux stream status for a channel
  const checkMuxStreamStatus = useCallback(async (channel: Channel) => {
    if (!channel.playback_url || !channel.id) return false;
    
    try {
      const funcUrl = `https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/mux-live-stream`;
      const session = await supabase.auth.getSession();
      
      const res = await fetch(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token || ''}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
        },
        body: JSON.stringify({ action: 'status', channelId: channel.id }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Mux stream status:', data);
        // Check if stream is active
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

  // Fetch current segment for selected channel (playlist-based fallback)
  const fetchLiveSegment = useCallback(async (isInitialLoad = false) => {
    if (!selectedChannel) return;
    
    // If we're live streaming via Mux, skip playlist segment fetch
    if (isLiveStreaming && selectedChannel.playback_url) {
      return;
    }

    try {
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
        
        if (isInitialLoad && data.videoUrl && data.offsetSeconds > 0) {
          // Store target offset for seeking
          targetOffsetRef.current = data.offsetSeconds;
          // Show countdown while we prepare to seek
          setCountdown(3);
          setIsSeeking(true);
        } else if (isInitialLoad && data.videoUrl) {
          // No offset needed, can start immediately
          setIsSeeking(false);
          setIsPlaying(true);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.log('Live segment response:', res.status, errorData);
        
        if (errorData.type === 'idle') {
          setLiveSegment(errorData);
        }
      }
    } catch (error) {
      console.error('Error fetching live segment:', error);
    }
  }, [selectedChannel, isLiveStreaming]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null && prev > 1) ? prev - 1 : null);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  // When countdown finishes, trigger the seek
  useEffect(() => {
    if (countdown === 0 || countdown === null) {
      if (isSeeking && playerRef.current && targetOffsetRef.current > 0) {
        // Perform the seek
        playerRef.current.seekTo(targetOffsetRef.current, 'seconds');
        // Wait a brief moment then start playing
        seekTimeoutRef.current = setTimeout(() => {
          setIsSeeking(false);
          setIsPlaying(true);
        }, 300);
      }
    }
  }, [countdown, isSeeking]);

  // Check for Mux stream first, then fall back to playlist
  useEffect(() => {
    if (selectedChannel) {
      // Reset player state when switching channels
      setIsPlaying(false);
      setIsSeeking(false);
      setCountdown(null);
      setIsLiveStreaming(false);
      targetOffsetRef.current = 0;
      
      // First check if this channel has an active Mux stream
      const initChannel = async () => {
        if (selectedChannel.playback_url) {
          const isLive = await checkMuxStreamStatus(selectedChannel);
          if (isLive) {
            // Channel is live streaming via Mux - play immediately
            console.log('Mux stream is LIVE, playing HLS:', selectedChannel.playback_url);
            setIsPlaying(true);
          } else {
            // Not live streaming, fall back to playlist
            fetchLiveSegment(true);
          }
        } else {
          // No Mux URL, use playlist
          fetchLiveSegment(true);
        }
      };
      
      initChannel();
      
      // Poll Mux status every 10 seconds to detect when streaming starts/stops
      if (selectedChannel.playback_url) {
        muxPollRef.current = setInterval(() => {
          checkMuxStreamStatus(selectedChannel);
        }, 10000);
      }
      
      // Poll playlist every 30 seconds (only if not live streaming)
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
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, [selectedChannel, fetchLiveSegment, checkMuxStreamStatus, isLiveStreaming]);

  const handleChannelSelect = async (channel: Channel) => {
    setSelectedChannel(channel);
    setLiveSegment(null);
    setIsPlaying(false);
    setIsSeeking(false);
    setCountdown(null);
    setPreRollPlayed(false); // Reset pre-roll for new channel
    targetOffsetRef.current = 0;
    navigate(`/live/${channel.slug}`, { replace: true });
    
    // Request pre-roll ad when switching channels
    if (!isLiveStreaming) {
      const hasPreRoll = await requestPreRoll();
      setPreRollPlayed(true);
      if (!hasPreRoll) {
        setIsPlaying(true);
      }
    }
  };

  const handleVideoEnd = () => {
    // When video ends, immediately fetch next segment
    fetchLiveSegment(true);
  };

  // Handle player ready
  const handlePlayerReady = () => {
    // For live Mux streams, start playing immediately
    if (isLiveStreaming && selectedChannel?.playback_url) {
      setIsPlaying(true);
      return;
    }
    
    if (isSeeking && countdown === null && targetOffsetRef.current > 0) {
      // Player is ready and countdown finished, perform seek
      playerRef.current?.seekTo(targetOffsetRef.current, 'seconds');
      setTimeout(() => {
        setIsSeeking(false);
        setIsPlaying(true);
      }, 300);
    } else if (!isSeeking && liveSegment?.videoUrl) {
      // No seeking needed, start playing
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

  // Request pre-roll on initial channel load (not just channel switch)
  useEffect(() => {
    if (selectedChannel && !preRollPlayed && isPlaying && !isAdPlaying) {
      const requestInitialPreRoll = async () => {
        console.log('[LiveTV Ads] Requesting pre-roll on initial load');
        await requestPreRoll();
        setPreRollPlayed(true);
      };
      requestInitialPreRoll();
    }
  }, [selectedChannel, preRollPlayed, isPlaying, isAdPlaying, requestPreRoll]);

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

              {/* Countdown/Loading Overlay - Don't show for live Mux streams */}
              {!isLiveStreaming && (isSeeking || (!isPlaying && liveSegment?.videoUrl)) && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
                  {countdown !== null && countdown > 0 ? (
                    <>
                      <div className="text-6xl font-bold text-primary mb-4">{countdown}</div>
                      <p className="text-lg text-white">Joining live stream...</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {liveSegment?.nowPlaying?.title}
                      </p>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="text-white">Syncing to live position...</p>
                    </>
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
