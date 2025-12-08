import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star, Info, Play, Plus, Check, ThumbsUp, ListVideo } from "lucide-react";
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

interface UserPlaylist {
  id: string;
  name: string;
}

const Watch = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
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
  const [recommendedContent, setRecommendedContent] = useState<ContentData[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [adBreakCount, setAdBreakCount] = useState(0);
  
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

  // Reset seek flag when navigating to new content or episode
  useEffect(() => {
    hasInitialSeek.current = false;
    setPlayerReady(false);
    setShowVideo(false);
    setIsPlaying(false);
  }, [id, episodeId]);

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

  // Handle video progress updates
  const handleProgress = useCallback((state: { played: number; playedSeconds: number }) => {
    const progressPercent = state.played * 100;
    setProgress(progressPercent);
    
    // Save progress every 5 seconds worth of progress or significant jumps
    saveProgress(progressPercent);
  }, [saveProgress]);

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

  const playVideo = () => {
    // Check access before playing
    if (!hasAccess && contentPlans.length > 0) {
      setShowUpgradeGate(true);
      return;
    }
    setShowVideo(true);
    setIsPlaying(true);
  };

  // Get ad configuration based on user's plan
  const adConfig = getAdConfig();

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
      
      {/* Upgrade Gate Modal */}
      {showUpgradeGate && content && (
        <UpgradeGate
          requiredPlans={contentPlans}
          currentPlan={userPlan}
          contentTitle={content.title}
          onClose={() => setShowUpgradeGate(false)}
        />
      )}
      {showVideo ? (
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
                  console.log("Player ready, saved progress:", progress);
                  setPlayerReady(true);
                  
                  // Delay seek slightly to ensure player is fully initialized
                  // This is especially important for Vimeo which needs a moment after onReady
                  if (progress > 0 && progress < 95 && !hasInitialSeek.current && playerRef.current) {
                    setTimeout(() => {
                      if (playerRef.current && !hasInitialSeek.current) {
                        const seekPosition = progress / 100;
                        console.log("Seeking to position after delay:", seekPosition);
                        playerRef.current.seekTo(seekPosition, 'fraction');
                        hasInitialSeek.current = true;
                      }
                    }, 500); // Small delay for Vimeo to be fully ready
                  }
                  
                  setIsPlaying(true);
                }}
                onError={(e) => console.error("Player error:", e)}
                onBuffer={() => console.log("Buffering...")}
                onBufferEnd={() => console.log("Buffering complete")}
                progressInterval={1000}
                config={{
                  vimeo: {
                    playerOptions: {
                      responsive: true,
                      playsinline: true,
                      autoplay: true,
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
                      autoPlay: true,
                      preload: "auto",
                    },
                    forceVideo: true,
                  }
                }}
              />
            </div>
          </div>
          
          {/* Back button */}
          <div className="absolute top-20 left-4 z-20">
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
          </div>

          {/* Progress Bar Overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
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
            {/* Episode indicator */}
            {episode && (
              <div className="mb-2">
                <span className="text-primary font-medium">Episode {episode.episode_number}</span>
                <span className="text-muted-foreground mx-2">•</span>
                <Link to={`/watch/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {content.title}
                </Link>
              </div>
            )}
            
            <h1 className="text-4xl font-bold mb-4">{episode ? episode.title : content.title}</h1>
            
            {/* Action Buttons Row */}
            <div className="flex items-center gap-3 mb-6">
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