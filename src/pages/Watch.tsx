import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star, Info, Play, Plus, Check, ThumbsUp, ListVideo, ChevronDown, SkipForward, Zap, Subtitles } from "lucide-react";
import { useSubtitles, Subtitle } from "@/hooks/useSubtitles";
import { ClosedCaptionButton } from "@/components/ClosedCaptionButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import ReactPlayer from "react-player";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { useMembershipAccess } from "@/hooks/useMembershipAccess";
import { UpgradeGate } from "@/components/UpgradeGate";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAds } from "@/hooks/useAds";
import { AdBreakOverlay } from "@/components/AdBreakOverlay";

interface MidrollConfig {
  enabled: boolean;
  count: number;
  startAfterMinutes: number;
  intervalMinutes: number;
}

interface ContentData {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  rating: string | null;
  release_year: number | null;
  duration: string | null;
  genre: string | null;
  maturity_rating: string | null;
  cast_members: string[] | null;
  creator: string | null;
  vast_ad_preroll: string | null;
  vast_ad_midroll: string | null;
  vast_ad_postroll: string | null;
  type?: string;
  midroll_config?: MidrollConfig;
  // subtitles stored as JSON in DB, parsed to Subtitle[] at runtime
  subtitles?: unknown;
}

interface EpisodeData {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  duration: string | null;
  episode_number: number;
  season_id: string;
}

interface SeasonWithEpisodes {
  id: string;
  season_number: number;
  title: string | null;
  episodes: EpisodeData[];
}

interface UserPlaylist {
  id: string;
  name: string;
}

const Watch = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const episodeId = searchParams.get('episode');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentProfile } = useProfile();
  const { userPlan, contentPlans, hasAccess, loading: accessLoading, getAdConfig } = useMembershipAccess(id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);
  const [content, setContent] = useState<ContentData | null>(null);
  const [episode, setEpisode] = useState<EpisodeData | null>(null);
  const [seasonsWithEpisodes, setSeasonsWithEpisodes] = useState<SeasonWithEpisodes[]>([]);
  const [recommendedContent, setRecommendedContent] = useState<ContentData[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [adBreakCount, setAdBreakCount] = useState(0);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [bingeMode, setBingeMode] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  
  // My List and Playlist state
  const [isInList, setIsInList] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [playlistsWithContent, setPlaylistsWithContent] = useState<Set<string>>(new Set());
  
  // Progress tracking state
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const estimatedDuration = duration || 3600; // Default to 1 hour if duration unknown
  const lastSavedProgress = useRef(0);
  const playerRef = useRef<ReactPlayer>(null);
  const hasInitialSeek = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [preRollPlayed, setPreRollPlayed] = useState(false);
  const [lastMidrollTime, setLastMidrollTime] = useState(0);
  const viewTracked = useRef(false);
  const viewRecordId = useRef<string | null>(null);
  const watchStartTime = useRef<number | null>(null);
  const totalWatchedSeconds = useRef(0);
  const preAdPosition = useRef<number | null>(null); // Store position before ad break
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  
  // Ad-skip prevention state
  const [playedAdBreakpoints, setPlayedAdBreakpoints] = useState<Set<number>>(new Set());
  const pendingSeekPosition = useRef<number | null>(null);
  const lastKnownPosition = useRef<number>(0);
  const isProcessingSeek = useRef(false);

  // Parse subtitles from JSON
  const parsedSubtitles = useMemo((): Subtitle[] => {
    if (!content?.subtitles) return [];
    if (Array.isArray(content.subtitles)) {
      return content.subtitles as Subtitle[];
    }
    return [];
  }, [content?.subtitles]);

  // Subtitles/Closed Captions hook
  const {
    captionsEnabled,
    selectedLanguage,
    availableLanguages,
    hasSubtitles,
    toggleCaptions,
    selectLanguage,
  } = useSubtitles({ subtitles: parsedSubtitles, videoElement });

  // Get content midroll config for useAds
  const contentMidrollConfig = useMemo(() => {
    if (!content?.midroll_config) return undefined;
    return {
      enabled: content.midroll_config.enabled ?? true,
      count: content.midroll_config.count ?? 4,
      startAfterMinutes: content.midroll_config.startAfterMinutes ?? 5,
      intervalMinutes: content.midroll_config.intervalMinutes ?? 10,
    };
  }, [content?.midroll_config]);

  // Ad system integration
  const {
    currentAd,
    isAdPlaying,
    adPosition,
    countdownSeconds,
    showCountdown,
    adQueueLength,
    effectiveMidrollConfig,
    canRequestMidRoll,
    requestPreRoll,
    requestMidRoll,
    requestPostRoll,
    requestSkippedMidRolls,
    onAdComplete,
    skipAd,
  } = useAds({
    contentId: id,
    membershipTier: userPlan || 'free',
    deviceType: isMobile ? 'mobile' : 'desktop',
    contentMidrollConfig,
    onAdStart: () => {
      // Capture current playback position before ad starts
      if (playerRef.current) {
        preAdPosition.current = playerRef.current.getCurrentTime();
        console.log("Captured pre-ad position:", preAdPosition.current);
      }
      hasInitialSeek.current = false; // Reset so seek happens after ad
      setIsPlaying(false);
    },
    onAdEnd: () => {
      // Resume to pending seek position if there was a seek-triggered ad break
      if (pendingSeekPosition.current !== null && playerRef.current) {
        console.log('[Watch] Resuming to pending seek position:', pendingSeekPosition.current);
        playerRef.current.seekTo(pendingSeekPosition.current, 'seconds');
        pendingSeekPosition.current = null;
        isProcessingSeek.current = false;
      }
      setIsPlaying(true);
    },
  });

  // Get ad configuration based on user's plan
  const adConfig = getAdConfig();
  
  // Calculate ad breakpoints based on midroll config
  const adBreakpointInterval = useMemo(() => {
    return (effectiveMidrollConfig?.intervalMinutes || 10) * 60; // in seconds
  }, [effectiveMidrollConfig]);

  // Detect seek and intercept if skipping ad breakpoints
  const handleSeekIntercept = useCallback(async (targetSeconds: number) => {
    if (!adConfig.showMidroll || isProcessingSeek.current || isAdPlaying) return false;
    
    const currentSeconds = lastKnownPosition.current;
    
    // Only intercept forward seeks (fast-forward)
    if (targetSeconds <= currentSeconds) return false;
    
    // Find all breakpoints between current position and target
    const skippedBreakpoints: number[] = [];
    const startAfter = (effectiveMidrollConfig?.startAfterMinutes || 5) * 60;
    
    for (let bp = adBreakpointInterval; bp < targetSeconds; bp += adBreakpointInterval) {
      if (bp >= startAfter && bp > currentSeconds && !playedAdBreakpoints.has(bp)) {
        skippedBreakpoints.push(bp);
      }
    }
    
    if (skippedBreakpoints.length > 0) {
      console.log('[Watch] Seek intercepted! Skipped breakpoints:', skippedBreakpoints);
      isProcessingSeek.current = true;
      pendingSeekPosition.current = targetSeconds;
      
      // Mark these breakpoints as played
      setPlayedAdBreakpoints(prev => {
        const newSet = new Set(prev);
        skippedBreakpoints.forEach(bp => newSet.add(bp));
        return newSet;
      });
      
      // Request ads for all skipped breakpoints
      const hasAds = await requestSkippedMidRolls(skippedBreakpoints.length);
      
      if (!hasAds) {
        // No ads available, allow seek to proceed
        isProcessingSeek.current = false;
        pendingSeekPosition.current = null;
        return false;
      }
      
      return true; // Ads will play, seek is blocked
    }
    
    return false;
  }, [adConfig.showMidroll, isAdPlaying, effectiveMidrollConfig, adBreakpointInterval, playedAdBreakpoints, requestSkippedMidRolls]);

  // Reset seek flag when navigating to new content or episode
  useEffect(() => {
    hasInitialSeek.current = false;
    preAdPosition.current = null; // Clear pre-ad position on navigation
    viewTracked.current = false;
    viewRecordId.current = null;
    watchStartTime.current = null;
    totalWatchedSeconds.current = 0;
    pendingSeekPosition.current = null;
    isProcessingSeek.current = false;
    setPlayedAdBreakpoints(new Set());
    setPlayerReady(false);
    setShowVideo(false);
    setIsPlaying(false);
  }, [id, episodeId]);

  // Track view with geo data when video starts playing
  const trackView = useCallback(async () => {
    if (viewTracked.current || !id) return;
    viewTracked.current = true;
    watchStartTime.current = Date.now();

    try {
      // Detect geo location
      let geoData = {
        country: null as string | null,
        region: null as string | null,
        city: null as string | null,
        postal: null as string | null,
        timezone: null as string | null,
      };

      try {
        const { data: geoResponse } = await supabase.functions.invoke('detect-geo');
        if (geoResponse) {
          geoData = {
            country: geoResponse.country || null,
            region: geoResponse.region || null,
            city: geoResponse.city || null,
            postal: geoResponse.postal || null,
            timezone: geoResponse.timezone || null,
          };
        }
      } catch (geoError) {
        console.log('Geo detection failed, continuing without geo data:', geoError);
      }

      // Get user and profile info
      const { data: { user } } = await supabase.auth.getUser();

      // Find indie_channel_id if this content belongs to an indie channel
      const { data: contentData } = await supabase
        .from('contents')
        .select('indie_channel_id')
        .eq('id', id)
        .single();

      // Insert view record
      const { data: viewRecord } = await supabase.from('channel_views').insert({
        content_id: id,
        indie_channel_id: contentData?.indie_channel_id || null,
        profile_id: currentProfile?.id || null,
        user_id: user?.id || null,
        device_type: isMobile ? 'mobile' : 'desktop',
        geo_country: geoData.country,
        geo_region: geoData.region,
        geo_city: geoData.city,
        geo_postal: geoData.postal,
        time_zone: geoData.timezone,
        duration_seconds: 0,
        progress_percent: 0,
      }).select('id').single();

      if (viewRecord) {
        viewRecordId.current = viewRecord.id;
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [id, currentProfile?.id, isMobile]);

  // Update view duration when user leaves or finishes
  const updateViewDuration = useCallback(async (finalProgress?: number) => {
    if (!viewRecordId.current) return;

    const watchedSeconds = watchStartTime.current 
      ? Math.floor((Date.now() - watchStartTime.current) / 1000) 
      : 0;
    totalWatchedSeconds.current += watchedSeconds;

    console.log('[Watch] Updating duration:', totalWatchedSeconds.current, 'seconds');

    try {
      const { error } = await supabase.from('channel_views')
        .update({
          duration_seconds: totalWatchedSeconds.current,
          progress_percent: Math.round(finalProgress ?? progress),
        })
        .eq('id', viewRecordId.current);
      
      if (error) {
        console.error('[Watch] Error updating view duration:', error);
      }
    } catch (error) {
      console.error('[Watch] Exception updating view duration:', error);
    }

    // Reset the start time for next play session
    watchStartTime.current = isPlaying ? Date.now() : null;
  }, [progress, isPlaying]);

  // Track play/pause for accurate duration
  useEffect(() => {
    if (isPlaying) {
      watchStartTime.current = Date.now();
    } else if (watchStartTime.current) {
      // Paused - add to total watched
      const watchedSeconds = Math.floor((Date.now() - watchStartTime.current) / 1000);
      totalWatchedSeconds.current += watchedSeconds;
      watchStartTime.current = null;
    }
  }, [isPlaying]);

  // Periodic duration update every 10 seconds while playing
  useEffect(() => {
    if (!isPlaying || !viewRecordId.current) return;

    const interval = setInterval(async () => {
      if (!viewRecordId.current || !watchStartTime.current) return;
      
      const watchedSeconds = Math.floor((Date.now() - watchStartTime.current) / 1000);
      const total = totalWatchedSeconds.current + watchedSeconds;
      
      console.log('[Watch] Periodic update:', total, 'seconds');
      
      const { error } = await supabase.from('channel_views')
        .update({
          duration_seconds: total,
          progress_percent: Math.round(progress),
        })
        .eq('id', viewRecordId.current);
      
      if (error) {
        console.error('[Watch] Error in periodic update:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  // Update duration when leaving page
  useEffect(() => {
    const handleBeforeUnload = () => {
      updateViewDuration();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateViewDuration();
    };
  }, [updateViewDuration]);

  // Fetch all episodes for the content (for episode selector and auto-play next)
  useEffect(() => {
    const fetchAllEpisodes = async () => {
      if (!id) return;
      
      // Fetch seasons for this content
      const { data: seasons } = await supabase
        .from("seasons")
        .select("id, season_number, title")
        .eq("content_id", id)
        .order("season_number", { ascending: true });
      
      if (seasons && seasons.length > 0) {
        // Fetch all episodes for these seasons
        const { data: allEpisodes } = await supabase
          .from("episodes")
          .select("*")
          .in("season_id", seasons.map(s => s.id))
          .order("episode_number", { ascending: true });
        
        // Group episodes by season
        const grouped: SeasonWithEpisodes[] = seasons.map(season => ({
          id: season.id,
          season_number: season.season_number,
          title: season.title,
          episodes: (allEpisodes || []).filter(ep => ep.season_id === season.id) as EpisodeData[]
        }));
        
        setSeasonsWithEpisodes(grouped);
      }
    };
    
    fetchAllEpisodes();
  }, [id]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;

      setIsLoading(true);
      setEpisode(null);
      
      // Fetch main content
      const { data: contentData, error } = await supabase
        .from("contents")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !contentData) {
        console.error("Error fetching content:", error);
        toast.error("Content not found");
        navigate("/browse");
        return;
      }

      setContent(contentData as ContentData);

      // If there's an episode ID, fetch the episode data
      if (episodeId) {
        const { data: episodeData, error: episodeError } = await supabase
          .from("episodes")
          .select("*")
          .eq("id", episodeId)
          .single();
        
        if (episodeData) {
          setEpisode(episodeData as EpisodeData);
        } else {
          console.error("Episode not found:", episodeError);
        }
      }

      // Fetch existing watch progress and user rating if logged in
      if (currentProfile?.id) {
        // Get progress for this specific content/episode combination
        const progressQuery = supabase
          .from("watch_history")
          .select("progress_percent")
          .eq("profile_id", currentProfile.id)
          .eq("content_id", id);
        
        if (episodeId) {
          progressQuery.eq("episode_id", episodeId);
        }
        
        const { data: watchHistory } = await progressQuery.single();
        
        if (watchHistory) {
          setProgress(watchHistory.progress_percent || 0);
          lastSavedProgress.current = watchHistory.progress_percent || 0;
        } else {
          setProgress(0);
          lastSavedProgress.current = 0;
        }

        // Fetch user's rating for this content
        const { data: likeData } = await supabase
          .from("likes")
          .select("rating")
          .eq("profile_id", currentProfile.id)
          .eq("content_id", id)
          .single();
        
        if (likeData?.rating) {
          setUserRating(likeData.rating);
        }

        // Check if content is in My List
        const { data: favData } = await supabase
          .from("favorites")
          .select("id")
          .eq("profile_id", currentProfile.id)
          .eq("content_id", id)
          .maybeSingle();
        
        setIsInList(!!favData);

        // Check if liked
        setIsLiked(!!likeData);

        // Fetch user playlists
        const { data: playlists } = await supabase
          .from("user_playlists")
          .select("id, name")
          .eq("profile_id", currentProfile.id);
        
        setUserPlaylists(playlists || []);

        // Check which playlists already have this content
        if (playlists && playlists.length > 0) {
          const { data: playlistItems } = await supabase
            .from("user_playlist_items")
            .select("playlist_id")
            .eq("content_id", id)
            .in("playlist_id", playlists.map(p => p.id));
          
          setPlaylistsWithContent(new Set(playlistItems?.map(pi => pi.playlist_id) || []));
        }
      }

      // Fetch recommended content (same genre or type)
      const { data: recommended } = await supabase
        .from("contents")
        .select("*")
        .neq("id", id)
        .limit(6);

      if (recommended) {
        setRecommendedContent(recommended as ContentData[]);
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [id, episodeId, navigate, currentProfile?.id]);

  // Get all episodes flattened for navigation
  const allEpisodes = useMemo(() => {
    return seasonsWithEpisodes.flatMap(season => 
      season.episodes.map(ep => ({
        ...ep,
        seasonNumber: season.season_number,
        seasonTitle: season.title
      }))
    );
  }, [seasonsWithEpisodes]);

  // Find current episode index and next episode
  const currentEpisodeIndex = useMemo(() => {
    if (!episodeId) return -1;
    return allEpisodes.findIndex(ep => ep.id === episodeId);
  }, [allEpisodes, episodeId]);

  const nextEpisode = useMemo(() => {
    if (currentEpisodeIndex === -1 || currentEpisodeIndex >= allEpisodes.length - 1) return null;
    return allEpisodes[currentEpisodeIndex + 1];
  }, [allEpisodes, currentEpisodeIndex]);

  // Seek to saved progress when player is ready and progress is loaded
  useEffect(() => {
    if (playerReady && showVideo && progress > 0 && progress < 95 && !hasInitialSeek.current && playerRef.current) {
      // Add a delay to ensure Vimeo player is truly ready for seeking
      const seekTimer = setTimeout(() => {
        if (playerRef.current && !hasInitialSeek.current) {
          const seekPosition = progress / 100;
          console.log("Seeking to saved progress via effect:", seekPosition, "(" + progress + "%)");
          playerRef.current.seekTo(seekPosition, 'fraction');
          hasInitialSeek.current = true;
        }
      }, 800); // Slightly longer delay for the effect-based seek
      
      return () => clearTimeout(seekTimer);
    }
  }, [playerReady, showVideo, progress]);

  // Save progress to database
  const saveProgress = useCallback(async (progressPercent: number) => {
    if (!currentProfile?.id || !id) return;
    
    // Only save if progress changed by at least 2%
    if (Math.abs(progressPercent - lastSavedProgress.current) < 2) return;
    
    lastSavedProgress.current = progressPercent;
    
    // Build query to find existing watch history
    let existingQuery = supabase
      .from("watch_history")
      .select("id")
      .eq("profile_id", currentProfile.id)
      .eq("content_id", id);
    
    if (episodeId) {
      existingQuery = existingQuery.eq("episode_id", episodeId);
    } else {
      existingQuery = existingQuery.is("episode_id", null);
    }
    
    const { data: existing } = await existingQuery.single();

    if (existing) {
      await supabase
        .from("watch_history")
        .update({ 
          progress_percent: Math.round(progressPercent),
          last_watched_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("watch_history")
        .insert({
          profile_id: currentProfile.id,
          content_id: id,
          episode_id: episodeId || null,
          progress_percent: Math.round(progressPercent),
          last_watched_at: new Date().toISOString()
        });
    }
  }, [currentProfile?.id, id, episodeId]);

  // Handle episode end - auto-play next episode
  const handleVideoEnded = useCallback(() => {
    saveProgress(100);
    updateViewDuration(100); // Update view with final duration
    
    if ((autoPlayNext || bingeMode) && nextEpisode && nextEpisode.video_url) {
      if (bingeMode) {
        // Binge mode: immediately play next without preview
        setSearchParams({ episode: nextEpisode.id });
      } else {
        toast.success(`Playing next: ${nextEpisode.title}`);
        setSearchParams({ episode: nextEpisode.id });
      }
    } else if (!nextEpisode) {
      toast.info("You've reached the end of this series!");
      setShowVideo(false);
      setIsPlaying(false);
    }
  }, [autoPlayNext, bingeMode, nextEpisode, saveProgress, setSearchParams, updateViewDuration]);

  // Handle episode selection from dropdown
  const handleEpisodeSelect = useCallback((selectedEpisodeId: string) => {
    if (selectedEpisodeId !== episodeId) {
      saveProgress(progress);
      setSearchParams({ episode: selectedEpisodeId });
    }
  }, [episodeId, progress, saveProgress, setSearchParams]);

  // Play next episode manually
  const playNextEpisode = useCallback(() => {
    if (nextEpisode && nextEpisode.video_url) {
      saveProgress(progress);
      setSearchParams({ episode: nextEpisode.id });
    }
  }, [nextEpisode, progress, saveProgress, setSearchParams]);

  // Handle video progress updates and detect seeks
  const handleProgress = useCallback(async (state: { played: number; playedSeconds: number }) => {
    const progressPercent = state.played * 100;
    const currentSeconds = state.playedSeconds;
    
    // Detect if user seeked forward (jumped more than 5 seconds)
    const timeDelta = currentSeconds - lastKnownPosition.current;
    
    if (timeDelta > 5 && !isProcessingSeek.current && !isAdPlaying) {
      // User fast-forwarded - check if they skipped ad breakpoints
      const wasIntercepted = await handleSeekIntercept(currentSeconds);
      
      if (wasIntercepted && playerRef.current) {
        // Seek back to where they were before the fast-forward
        // Ads will play and then resume to their intended position
        playerRef.current.seekTo(lastKnownPosition.current, 'seconds');
        return; // Don't update progress while processing ads
      }
    }
    
    // Update last known position for next comparison
    lastKnownPosition.current = currentSeconds;
    
    setProgress(progressPercent);
    
    // Save progress every 5 seconds worth of progress or significant jumps
    saveProgress(progressPercent);
  }, [saveProgress, handleSeekIntercept, isAdPlaying]);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (progress > 0) {
        saveProgress(progress);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save progress when component unmounts
      if (progress > 0) {
        saveProgress(progress);
      }
    };
  }, [progress, saveProgress]);

  const playVideo = async () => {
    // Check access before playing
    if (!hasAccess && contentPlans.length > 0) {
      setShowUpgradeGate(true);
      return;
    }
    setShowVideo(true);
    
    // Track view when video starts
    trackView();
    
    // Request pre-roll ad for free/standard users
    if (!preRollPlayed && adConfig.showPreroll) {
      const hasPreRoll = await requestPreRoll();
      setPreRollPlayed(true);
      if (!hasPreRoll) {
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(true);
    }
  };

  // Handle mid-roll ads based on progress and content's midroll_config
  useEffect(() => {
    if (!isPlaying || isAdPlaying || !adConfig.showMidroll || !duration) return;
    
    // Check if midroll is enabled for this content
    if (effectiveMidrollConfig && !effectiveMidrollConfig.enabled) return;
    
    // Check if we can still request more mid-rolls
    if (!canRequestMidRoll()) return;
    
    const currentSeconds = (progress / 100) * duration;
    const midrollInterval = (effectiveMidrollConfig?.intervalMinutes || 10) * 60;
    const startAfter = (effectiveMidrollConfig?.startAfterMinutes || 5) * 60;
    
    // Calculate the current breakpoint
    const currentBreakpoint = Math.floor((currentSeconds - startAfter) / midrollInterval) * midrollInterval + startAfter;
    
    // Check if we've crossed a new breakpoint that hasn't been played
    if (currentSeconds >= startAfter && 
        currentSeconds - lastMidrollTime >= midrollInterval && 
        !playedAdBreakpoints.has(currentBreakpoint)) {
      
      // Mark this breakpoint as played
      setPlayedAdBreakpoints(prev => new Set(prev).add(currentBreakpoint));
      
      requestMidRoll(10);
      setLastMidrollTime(currentSeconds);
    }
  }, [progress, duration, isPlaying, isAdPlaying, adConfig.showMidroll, lastMidrollTime, requestMidRoll, effectiveMidrollConfig, canRequestMidRoll, playedAdBreakpoints]);

  // Handle post-roll ads when video ends
  const handleVideoEndedWithAds = useCallback(async () => {
    if (adConfig.showPostroll) {
      await requestPostRoll();
    }
    handleVideoEnded();
  }, [adConfig.showPostroll, requestPostRoll, handleVideoEnded]);

  // Get ad configuration based on user's plan

  // Handle star rating click - save to database
  const handleStarClick = async (rating: number) => {
    if (!currentProfile?.id || !id) {
      toast.error("Please select a profile to rate content");
      return;
    }

    setIsSavingRating(true);
    setUserRating(rating);

    try {
      // Check if user already has a rating
      const { data: existing } = await supabase
        .from("likes")
        .select("id")
        .eq("profile_id", currentProfile.id)
        .eq("content_id", id)
        .single();

      if (existing) {
        // Update existing rating
        const { error } = await supabase
          .from("likes")
          .update({ rating })
          .eq("id", existing.id);
        
        if (error) throw error;
      } else {
        // Insert new rating
        const { error } = await supabase
          .from("likes")
          .insert({
            profile_id: currentProfile.id,
            content_id: id,
            rating
          });
        
        if (error) throw error;
      }

      toast.success(`You rated this ${rating} star${rating > 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Error saving rating:", error);
      toast.error("Failed to save rating");
      setUserRating(0);
    } finally {
      setIsSavingRating(false);
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Content not found</p>
      </div>
    );
  }

  // Use episode video if available, otherwise fall back to content video/trailer
  const videoUrl = episode?.video_url || content.video_url || content.trailer_url;
  const displayTitle = episode ? `${content.title} - ${episode.title}` : content.title;
  const displayThumbnail = episode?.thumbnail_url || content.backdrop_url || content.poster_url;
  const categories = content.genre?.split(",").map(g => g.trim()) || [];
  const currentTime = (progress / 100) * duration;

  // Toggle My List
  const toggleMyList = async () => {
    if (!currentProfile?.id || !id) return;

    if (isInList) {
      await supabase
        .from("favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", id);
      setIsInList(false);
      toast.success("Removed from My List");
    } else {
      await supabase
        .from("favorites")
        .insert({ profile_id: currentProfile.id, content_id: id });
      setIsInList(true);
      toast.success("Added to My List");
    }
  };

  // Toggle Like
  const toggleLike = async () => {
    if (!currentProfile?.id || !id) return;

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", id);
      setIsLiked(false);
    } else {
      await supabase
        .from("likes")
        .insert({ profile_id: currentProfile.id, content_id: id, rating: 1 });
      setIsLiked(true);
    }
  };

  // Add to playlist
  const addToPlaylist = async (playlistId: string) => {
    if (!id) return;

    const isInPlaylist = playlistsWithContent.has(playlistId);
    
    if (isInPlaylist) {
      const { error } = await supabase
        .from("user_playlist_items")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("content_id", id);
      
      if (!error) {
        setPlaylistsWithContent(prev => {
          const newSet = new Set(prev);
          newSet.delete(playlistId);
          return newSet;
        });
        toast.success("Removed from playlist");
      }
    } else {
      const { error } = await supabase
        .from("user_playlist_items")
        .insert({ playlist_id: playlistId, content_id: id });
      
      if (!error) {
        setPlaylistsWithContent(prev => new Set(prev).add(playlistId));
        toast.success("Added to playlist");
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Ad Break Overlay */}
      <AdBreakOverlay
        ad={currentAd}
        position={adPosition}
        countdownSeconds={countdownSeconds}
        showCountdown={showCountdown}
        adQueueLength={adQueueLength}
        canSkip={userPlan === 'premium'}
        skipAfterSeconds={5}
        onAdComplete={onAdComplete}
        onSkip={skipAd}
      />
      
      {/* Upgrade Gate Modal */}
      {showUpgradeGate && content && (
        <UpgradeGate
          requiredPlans={contentPlans}
          currentPlan={userPlan}
          contentTitle={content.title}
          onClose={() => setShowUpgradeGate(false)}
        />
      )}
      {showVideo && !isAdPlaying ? (
        <div className="h-screen w-full bg-black relative overflow-hidden pt-16">
          <div className="absolute inset-0 bg-black z-0 flex items-center justify-center mt-16">
            <div className="w-full h-full max-h-[calc(100vh-64px)]">
              <ReactPlayer
                ref={playerRef}
                url={videoUrl || ""}
                playing={isPlaying}
                controls
                width="100%"
                height="100%"
                playsinline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onReady={() => {
                  console.log("Player ready, saved progress:", progress, "preAdPosition:", preAdPosition.current);
                  setPlayerReady(true);
                  
                  // Get video element for subtitle track injection
                  if (playerRef.current) {
                    const internalPlayer = playerRef.current.getInternalPlayer();
                    if (internalPlayer instanceof HTMLVideoElement) {
                      setVideoElement(internalPlayer);
                    } else if (internalPlayer?.getIframe) {
                      // Vimeo player - captions handled via Vimeo's API
                      console.log("Vimeo player detected - using Vimeo captions");
                    }
                  }
                  
                  // Delay seek slightly to ensure player is fully initialized
                  // CRITICAL: Do NOT start playing until after seek completes
                  setTimeout(() => {
                    if (playerRef.current && !hasInitialSeek.current) {
                      let seekPosition: number | null = null;
                      
                      // Check if returning from ad break - use pre-ad position
                      if (preAdPosition.current !== null && preAdPosition.current > 0) {
                        seekPosition = preAdPosition.current;
                        console.log("Resuming from pre-ad position (seconds):", seekPosition);
                        playerRef.current.seekTo(seekPosition, 'seconds');
                        preAdPosition.current = null; // Clear after use
                      } else if (progress > 0 && progress < 95) {
                        // Initial load - seek to saved database progress (as fraction)
                        seekPosition = progress / 100;
                        console.log("Seeking to saved progress (fraction):", seekPosition);
                        playerRef.current.seekTo(seekPosition, 'fraction');
                      }
                      
                      hasInitialSeek.current = true;
                    }
                    
                    // Start playing AFTER seek is complete to prevent restart from beginning
                    setIsPlaying(true);
                  }, 750); // Increased delay for Vimeo to be fully ready before seeking
                }}
                onEnded={handleVideoEnded}
                onSeek={async (seconds: number) => {
                  console.log('[Watch] onSeek triggered:', seconds);
                  // Handle seek through the progress callback detection
                  // This is a backup for players that support onSeek
                }}
                onError={(e) => console.error("Player error:", e)}
                onBuffer={() => console.log("Buffering...")}
                onBufferEnd={() => console.log("Buffering complete")}
                progressInterval={500}
                config={{
                  vimeo: {
                    playerOptions: {
                      responsive: true,
                      playsinline: true,
                      autoplay: false, // Disabled - we control play timing after seek
                      muted: false,
                      controls: true,
                      quality: 'auto',
                      preload: true,
                      byline: false,
                      portrait: false,
                      title: false,
                      speed: true,
                      dnt: true,
                    }
                  },
                  file: {
                    attributes: {
                      playsInline: true,
                      crossOrigin: "anonymous",
                      autoPlay: false, // Disabled - we control play timing after seek
                      preload: "auto",
                    },
                    forceVideo: true,
                    tracks: parsedSubtitles.map((sub, idx) => ({
                      kind: 'subtitles',
                      src: sub.vttUrl,
                      srcLang: sub.language.toLowerCase().slice(0, 2),
                      label: sub.language,
                      default: idx === 0 && captionsEnabled,
                    })),
                  }
                }}
              />
            </div>
          </div>
          
          {/* Top Controls - Back button, CC, and Episode Selector */}
          <div className="absolute top-20 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground bg-background/50 hover:bg-background/70"
                onClick={() => {
                  saveProgress(progress);
                  setShowVideo(false);
                }}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              
              {/* Closed Captions Button */}
              <ClosedCaptionButton
                captionsEnabled={captionsEnabled}
                selectedLanguage={selectedLanguage}
                availableLanguages={availableLanguages}
                hasSubtitles={hasSubtitles}
                onToggle={toggleCaptions}
                onSelectLanguage={selectLanguage}
              />
            </div>

            {/* Episode Selector Dropdown - Only show for episodic content */}
            {allEpisodes.length > 0 && episodeId && (
              <div className="flex items-center gap-2">
                <Select value={episodeId} onValueChange={handleEpisodeSelect}>
                  <SelectTrigger className="w-[200px] md:w-[280px] bg-background/80 border-border backdrop-blur-sm">
                    <SelectValue placeholder="Select Episode" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-[300px]">
                    {seasonsWithEpisodes.map(season => (
                      <div key={season.id}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          Season {season.season_number}{season.title ? `: ${season.title}` : ''}
                        </div>
                        {season.episodes.map(ep => (
                          <SelectItem 
                            key={ep.id} 
                            value={ep.id}
                            disabled={!ep.video_url}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-medium">E{ep.episode_number}</span>
                              <span className="truncate">{ep.title}</span>
                              {ep.id === episodeId && <span className="text-xs text-primary">(Playing)</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                {/* Next Episode Button */}
                {nextEpisode && nextEpisode.video_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playNextEpisode}
                    className="bg-background/80 border-border backdrop-blur-sm gap-1 hidden md:flex"
                  >
                    <SkipForward className="h-4 w-4" />
                    Next
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar Overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Next Episode Preview - Shows when near end (only if not in binge mode) */}
            {nextEpisode && progress > 90 && autoPlayNext && !bingeMode && (
              <div className="mb-3 bg-card/90 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {nextEpisode.thumbnail_url && (
                    <img 
                      src={nextEpisode.thumbnail_url} 
                      alt={nextEpisode.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Up Next</p>
                    <p className="text-sm font-medium">S{nextEpisode.seasonNumber} E{nextEpisode.episode_number}: {nextEpisode.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAutoPlayNext(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={playNextEpisode}
                    className="bg-primary hover:bg-primary/90 gap-1"
                  >
                    <SkipForward className="h-4 w-4" />
                    Play Now
                  </Button>
                </div>
              </div>
            )}
            
            {/* Binge Mode Toggle - Shows for episodic content */}
            {allEpisodes.length > 1 && (
              <div className="mb-2 flex items-center justify-end gap-2">
                <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Zap className={`h-4 w-4 ${bingeMode ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-medium">Binge Mode</span>
                  <Switch 
                    checked={bingeMode} 
                    onCheckedChange={setBingeMode}
                    className="scale-75"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 text-sm text-foreground">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {Math.round(progress)}% watched • Progress saved automatically
              {bingeMode && ' • Binge Mode ON'}
              {!bingeMode && autoPlayNext && nextEpisode && ' • Auto-play next enabled'}
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-24 pb-16">
          {/* Hero section */}
          <div className="relative h-[500px] w-full">
            <img 
              src={displayThumbnail || "/placeholder.svg"}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Button 
                onClick={playVideo} 
                className="bg-primary/80 hover:bg-primary h-16 w-16 rounded-full flex items-center justify-center"
              >
                <Play className="h-8 w-8 fill-current" />
              </Button>
              {progress > 0 && progress < 100 && (
                <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">
                    Resume from {formatTime((progress / 100) * (duration || estimatedDuration))}
                  </span>
                </div>
              )}
            </div>

            {/* Resume progress indicator */}
            {progress > 0 && progress < 100 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-background/90 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Resume watching</span>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Movie/Episode info */}
          <div className="container mx-auto px-4 md:px-6 mt-6">
            {/* Episode indicator and selector */}
            {episode && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary font-medium">Episode {episode.episode_number}</span>
                  <span className="text-muted-foreground">•</span>
                  <Link to={`/watch/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    {content.title}
                  </Link>
                </div>
                
                {/* Season Tabs and Episode Selector */}
                {seasonsWithEpisodes.length > 0 && (
                  <div className="space-y-4">
                    {/* Season Tabs */}
                    {seasonsWithEpisodes.length > 1 && (
                      <Tabs 
                        value={selectedSeasonId || seasonsWithEpisodes.find(s => s.episodes.some(e => e.id === episodeId))?.id || seasonsWithEpisodes[0]?.id} 
                        onValueChange={setSelectedSeasonId}
                        className="w-full"
                      >
                        <TabsList className="bg-card border border-border w-full md:w-auto flex-wrap h-auto gap-1 p-1">
                          {seasonsWithEpisodes.map(season => (
                            <TabsTrigger 
                              key={season.id} 
                              value={season.id}
                              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
                            >
                              Season {season.season_number}
                              {season.title && <span className="hidden md:inline ml-1 text-xs opacity-70">: {season.title}</span>}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    )}
                    
                    {/* Episode Grid for Selected Season */}
                    {(() => {
                      const currentSeasonId = selectedSeasonId || seasonsWithEpisodes.find(s => s.episodes.some(e => e.id === episodeId))?.id || seasonsWithEpisodes[0]?.id;
                      const currentSeason = seasonsWithEpisodes.find(s => s.id === currentSeasonId);
                      
                      if (!currentSeason) return null;
                      
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {currentSeason.episodes.map(ep => (
                            <button
                              key={ep.id}
                              onClick={() => ep.video_url && handleEpisodeSelect(ep.id)}
                              disabled={!ep.video_url}
                              className={`relative rounded-lg overflow-hidden text-left transition-all ${
                                ep.id === episodeId 
                                  ? 'ring-2 ring-primary' 
                                  : 'hover:ring-1 hover:ring-muted-foreground/50'
                              } ${!ep.video_url ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="aspect-video bg-muted relative">
                                {ep.thumbnail_url ? (
                                  <img 
                                    src={ep.thumbnail_url} 
                                    alt={ep.title} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <Play className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                                {ep.id === episodeId && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Now Playing</span>
                                  </div>
                                )}
                                {!ep.video_url && (
                                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">Coming Soon</span>
                                  </div>
                                )}
                                {ep.duration && (
                                  <span className="absolute bottom-1 right-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                                    {ep.duration}
                                  </span>
                                )}
                              </div>
                              <div className="p-2 bg-card">
                                <p className="text-xs text-primary font-medium">E{ep.episode_number}</p>
                                <p className="text-sm font-medium line-clamp-1">{ep.title}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    
                    {/* Binge Mode Toggle and Next Episode Button */}
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                      <div className="flex items-center gap-4">
                        {/* Binge Mode Toggle */}
                        <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2">
                          <Zap className={`h-4 w-4 ${bingeMode ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium">Binge Mode</span>
                          <Switch 
                            checked={bingeMode} 
                            onCheckedChange={setBingeMode}
                          />
                        </div>
                        {bingeMode && (
                          <span className="text-xs text-muted-foreground">Episodes play back-to-back without interruption</span>
                        )}
                      </div>
                      
                      {nextEpisode && nextEpisode.video_url && (
                        <Button
                          variant="outline"
                          onClick={playNextEpisode}
                          className="gap-2"
                        >
                          <SkipForward className="h-4 w-4" />
                          Next: E{nextEpisode.episode_number} - {nextEpisode.title}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <h1 className="text-4xl font-bold mb-4">{episode ? episode.title : content.title}</h1>
            
            {/* Action Buttons Row */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Button onClick={playVideo} className="bg-primary hover:bg-primary/90 gap-2">
                <Play className="w-5 h-5 fill-current" />
                Play
              </Button>
              
              <button
                onClick={toggleMyList}
                className="p-3 rounded-full border-2 border-muted-foreground/50 text-foreground hover:border-foreground transition-colors"
                title={isInList ? "Remove from My List" : "Add to My List"}
              >
                {isInList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleLike}
                className={`p-3 rounded-full border-2 transition-colors ${
                  isLiked 
                    ? "border-primary bg-primary/20 text-primary" 
                    : "border-muted-foreground/50 text-foreground hover:border-foreground"
                }`}
                title="Like"
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              </button>

              {/* Add to Playlist Button */}
              {userPlan !== 'free' && userPlaylists.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-3 rounded-full border-2 border-muted-foreground/50 text-foreground hover:border-foreground transition-colors"
                      title="Add to Playlist"
                    >
                      <ListVideo className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border-border">
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      Add to Playlist
                    </div>
                    <DropdownMenuSeparator />
                    {userPlaylists.map(playlist => (
                      <DropdownMenuItem
                        key={playlist.id}
                        onClick={() => addToPlaylist(playlist.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {playlistsWithContent.has(playlist.id) ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          <span>{playlist.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {userPlan === 'free' && (
                <Link to="/plans?upgrade=standard">
                  <button
                    className="p-3 rounded-full border-2 border-muted-foreground/50 text-foreground hover:border-foreground transition-colors"
                    title="Upgrade to create playlists"
                  >
                    <ListVideo className="w-5 h-5" />
                  </button>
                </Link>
              )}
            </div>
            
            {/* User Rating Section */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground mr-2">Rate this:</span>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  disabled={isSavingRating}
                  className="focus:outline-none touch-manipulation transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <Star 
                    className={`h-6 w-6 transition-colors ${
                      star <= userRating 
                        ? "fill-primary text-primary" 
                        : "text-muted-foreground hover:text-primary/50"
                    }`}
                  />
                </button>
              ))}
              {userRating > 0 && (
                <span className="ml-2 text-sm text-primary">Your rating: {userRating}/5</span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-6">
              {content.release_year && <span>{content.release_year}</span>}
              {(episode?.duration || content.duration) && (
                <>
                  <span>•</span>
                  <span>{episode?.duration || content.duration}</span>
                </>
              )}
              {categories.length > 0 && (
                <>
                  <span>•</span>
                  {categories.map((cat, index) => (
                    <span key={cat}>
                      {cat}{index < categories.length - 1 ? "," : ""}
                    </span>
                  ))}
                </>
              )}
              {content.maturity_rating && (
                <>
                  <span>•</span>
                  <span className="bg-muted px-2 py-0.5 rounded">{content.maturity_rating}</span>
                </>
              )}
            </div>
            
            <p className="text-muted-foreground mb-8">
              {episode?.description || content.description || "No description available."}
            </p>
            
            {(content.cast_members || content.creator) && (
              <div className="mb-8">
                {content.cast_members && content.cast_members.length > 0 && (
                  <div className="mb-2">
                    <span className="text-muted-foreground font-medium">Cast: </span>
                    <span>{content.cast_members.join(", ")}</span>
                  </div>
                )}
                {content.creator && (
                  <div>
                    <span className="text-muted-foreground font-medium">Creator: </span>
                    <span>{content.creator}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Recommended content */}
            {recommendedContent.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Recommended For You</h2>
                <div className="relative">
                  <div className="flex overflow-x-auto scrollbar-hide pb-4 gap-4">
                    {recommendedContent.map((rec) => (
                      <div 
                        key={rec.id}
                        className={`flex-none transition-all duration-300 ease-in-out ${
                          hoveredId === rec.id ? "w-[350px]" : "w-[180px]"
                        }`}
                        onMouseEnter={() => setHoveredId(rec.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {hoveredId === rec.id ? (
                          <div className="h-full w-full bg-card rounded-lg overflow-hidden border border-border shadow-xl animate-fade-in">
                            <div className="relative">
                              {rec.trailer_url || rec.video_url ? (
                                <ReactPlayer
                                  url={rec.trailer_url || rec.video_url || ""}
                                  playing
                                  muted
                                  loop
                                  width="100%"
                                  height="200px"
                                  config={{
                                    vimeo: {
                                      playerOptions: {
                                        background: true,
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <img 
                                  src={rec.poster_url || "/placeholder.svg"}
                                  alt={rec.title}
                                  className="w-full aspect-video object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                              
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="font-bold text-foreground truncate mb-3">{rec.title}</h3>
                                
                                <div className="flex space-x-2">
                                  <Link to={`/watch/${rec.id}`}>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-4">
                                      <Play className="h-4 w-4 mr-1 fill-current" />
                                      Watch
                                    </Button>
                                  </Link>
                                  <Link to={`/watch/${rec.id}`}>
                                    <Button variant="outline" size="sm" className="rounded-full border-muted-foreground/50 hover:bg-muted px-4">
                                      <Info className="h-4 w-4 mr-1" />
                                      Detail
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link to={`/watch/${rec.id}`} className="block relative cursor-pointer overflow-hidden">
                            <div className="aspect-[2/3] overflow-hidden rounded-md">
                              <img 
                                src={rec.poster_url || "/placeholder.svg"}
                                alt={rec.title}
                                className="w-full h-full object-cover hover:scale-105 transition duration-300"
                              />
                            </div>
                            <h3 className="mt-2 text-sm font-medium truncate">{rec.title}</h3>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* End of content */}
          </div>
        </div>
      )}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default Watch;