import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Plus, ThumbsUp, Info, Check } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactPlayer from "react-player";

interface WatchHistoryItem {
  id: string;
  content_id: string;
  progress_percent: number;
  episode_id: string | null;
  content: {
    id: string;
    title: string;
    poster_url: string | null;
    type: string;
    duration: string | null;
    trailer_url: string | null;
    video_url: string | null;
    maturity_rating: string | null;
    genre: string | null;
    release_year: number | null;
  };
  episode?: {
    id: string;
    title: string;
    episode_number: number;
    season: {
      season_number: number;
    };
  } | null;
}

interface ContinueWatchingRowProps {
  onMoreInfo: (contentId: string) => void;
}

// Parse duration string (e.g., "1h 45m", "45 min", "2h") to minutes
const parseDurationToMinutes = (duration: string | null): number => {
  if (!duration) return 0;
  
  let totalMinutes = 0;
  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minMatch = duration.match(/(\d+)\s*m/i);
  
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1]);
  
  // If just a number, assume minutes
  if (!hourMatch && !minMatch) {
    const numMatch = duration.match(/(\d+)/);
    if (numMatch) totalMinutes = parseInt(numMatch[1]);
  }
  
  return totalMinutes;
};

// Format minutes to readable string (e.g., "1h 23m" or "45 min")
const formatRemainingTime = (minutes: number): string => {
  if (minutes <= 0) return "Almost done";
  if (minutes < 60) return `${Math.round(minutes)} min remaining`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h remaining`;
  return `${hours}h ${mins}m remaining`;
};

const ContinueWatchingRow = ({ onMoreInfo }: ContinueWatchingRowProps) => {
  const { currentProfile } = useProfile();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cardPositions, setCardPositions] = useState<Record<string, 'left' | 'center' | 'right'>>({});
  const [myList, setMyList] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchData = async () => {
      // Fetch watch history with episode info, favorites, and likes in parallel
      const [historyResult, favoritesResult, likesResult] = await Promise.all([
        supabase
          .from("watch_history")
          .select(`
            id,
            content_id,
            progress_percent,
            episode_id,
            content:contents(id, title, poster_url, type, duration, trailer_url, video_url, maturity_rating, genre, release_year)
          `)
          .eq("profile_id", currentProfile.id)
          .gt("progress_percent", 0)
          .lt("progress_percent", 100)
          .order("last_watched_at", { ascending: false })
          .limit(20),
        supabase
          .from("favorites")
          .select("content_id")
          .eq("profile_id", currentProfile.id),
        supabase
          .from("likes")
          .select("content_id")
          .eq("profile_id", currentProfile.id)
      ]);

      if (!historyResult.error && historyResult.data) {
        // For items with episode_id, fetch episode details
        const itemsWithEpisodes = await Promise.all(
          historyResult.data.filter(item => item.content).map(async (item) => {
            if (item.episode_id) {
              const { data: episodeData } = await supabase
                .from("episodes")
                .select(`
                  id,
                  title,
                  episode_number,
                  season:seasons(season_number)
                `)
                .eq("id", item.episode_id)
                .single();
              
              return {
                ...item,
                episode: episodeData ? {
                  ...episodeData,
                  season: Array.isArray(episodeData.season) ? episodeData.season[0] : episodeData.season
                } : null
              };
            }
            return { ...item, episode: null };
          })
        );
        setItems(itemsWithEpisodes as unknown as WatchHistoryItem[]);
      }
      if (!favoritesResult.error && favoritesResult.data) {
        setMyList(new Set(favoritesResult.data.map(f => f.content_id)));
      }
      if (!likesResult.error && likesResult.data) {
        setLikedItems(new Set(likesResult.data.map(l => l.content_id)));
      }
      setIsLoading(false);
    };

    fetchData();
  }, [currentProfile?.id]);

  const calculateCardPosition = useCallback((cardId: string) => {
    const cardElement = cardRefs.current[cardId];
    if (!cardElement) return 'center';

    const rect = cardElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const cardCenter = rect.left + rect.width / 2;
    const expandedWidth = 320;
    const halfExpanded = expandedWidth / 2;

    if (cardCenter - halfExpanded < 80) return 'left';
    if (cardCenter + halfExpanded > viewportWidth - 20) return 'right';
    return 'center';
  }, []);

  const handleMouseEnter = useCallback((itemId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    hoverTimeoutRef.current = setTimeout(() => {
      const position = calculateCardPosition(itemId);
      setCardPositions(prev => ({ ...prev, [itemId]: position }));
      setHoveredId(itemId);
    }, 400);
  }, [calculateCardPosition]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredId(null);
  }, []);

  const toggleMyList = async (contentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile?.id) return;

    const isInList = myList.has(contentId);
    
    if (isInList) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
      
      if (!error) {
        setMyList(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });
        toast.success("Removed from My List");
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ profile_id: currentProfile.id, content_id: contentId });
      
      if (!error) {
        setMyList(prev => new Set(prev).add(contentId));
        toast.success("Added to My List");
      }
    }
  };

  const toggleLike = async (contentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile?.id) return;

    const isLiked = likedItems.has(contentId);
    
    if (isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
      
      if (!error) {
        setLikedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ profile_id: currentProfile.id, content_id: contentId });
      
      if (!error) {
        setLikedItems(prev => new Set(prev).add(contentId));
      }
    }
  };

  // Removed removeFromHistory - users cannot delete continue watching items

  const getPositionStyles = (position: 'left' | 'center' | 'right') => {
    switch (position) {
      case 'left':
        return { left: 0, right: 'auto', transformOrigin: 'left center' };
      case 'right':
        return { left: 'auto', right: 0, transformOrigin: 'right center' };
      default:
        return { left: '50%', transform: 'translateX(-50%)', transformOrigin: 'center center' };
    }
  };

  if (isLoading || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">
        Continue Watching for {currentProfile?.name}
      </h2>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {items.map((item) => {
            const isHovered = hoveredId === item.id;
            const position = cardPositions[item.id] || 'center';
            const positionStyles = getPositionStyles(position);
            const isInList = myList.has(item.content_id);
            const isLiked = likedItems.has(item.content_id);
            
            // Calculate remaining time
            const totalMinutes = parseDurationToMinutes(item.content.duration);
            const watchedMinutes = totalMinutes * (item.progress_percent / 100);
            const remainingMinutes = totalMinutes - watchedMinutes;
            const remainingTimeText = formatRemainingTime(remainingMinutes);

            // Episode info display
            const episodeInfo = item.episode 
              ? `S${item.episode.season?.season_number || 1}E${item.episode.episode_number}`
              : null;

            // Video URL - prefer trailer, fall back to video_url
            const videoUrl = item.content.trailer_url || item.content.video_url;

            return (
              <div
                key={item.id}
                ref={(el) => { cardRefs.current[item.id] = el; }}
                className="relative flex-shrink-0 w-48 md:w-56"
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Base Card - Always clickable */}
                <Link to={`/watch/${item.content.id}`} className="block relative z-10">
                  <div className="relative rounded-lg overflow-hidden cursor-pointer group">
                    <img
                      src={item.content.poster_url || "/placeholder.svg"}
                      alt={item.content.title}
                      className="w-full aspect-video object-cover"
                    />
                    
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/80">
                      <div
                        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300"
                        style={{ width: `${item.progress_percent}%` }}
                      />
                    </div>
                    
                    {/* Remaining Time Badge */}
                    <div className="absolute bottom-3 right-2 bg-background/90 px-2 py-0.5 rounded text-xs font-medium text-foreground">
                      {remainingTimeText}
                    </div>

                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <Play className="w-10 h-10 text-foreground fill-current" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm text-foreground truncate">
                      {item.content.title}
                    </p>
                    {/* Episode Info */}
                    {episodeInfo && (
                      <p className="text-xs text-muted-foreground">
                        {episodeInfo}: {item.episode?.title}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Expanded Hover Card */}
                {isHovered && (
                  <div
                    className="absolute z-50 w-[280px] md:w-[320px] bg-card rounded-lg overflow-hidden shadow-2xl border border-border animate-scale-in"
                    style={{
                      top: '-10px',
                      ...positionStyles,
                    }}
                  >

                    {/* Video/Image Preview with ReactPlayer */}
                    <div className="relative aspect-video bg-black">
                      {videoUrl ? (
                        <ReactPlayer
                          url={videoUrl}
                          playing
                          muted
                          loop
                          playsinline
                          width="100%"
                          height="100%"
                          config={{
                            vimeo: {
                              playerOptions: {
                                background: true,
                                quality: '720p',
                              }
                            }
                          }}
                        />
                      ) : (
                        <img
                          src={item.content.poster_url || "/placeholder.svg"}
                          alt={item.content.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Progress Bar on Hover */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/80">
                        <div
                          className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                          style={{ width: `${item.progress_percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-4 space-y-3">
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Resume Button */}
                        <Link to={`/watch/${item.content.id}`} className="flex-1">
                          <Button className="w-full rounded-full bg-foreground hover:bg-foreground/90 text-background gap-2">
                            <Play className="h-4 w-4 fill-current" />
                            Resume
                          </Button>
                        </Link>
                        
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-full border-muted-foreground/50 hover:border-foreground h-10 w-10"
                          onClick={(e) => toggleMyList(item.content_id, e)}
                        >
                          {isInList ? (
                            <Check className="h-5 w-5 text-primary" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-full border-muted-foreground/50 hover:border-foreground h-10 w-10"
                          onClick={(e) => toggleLike(item.content_id, e)}
                        >
                          <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-primary text-primary' : ''}`} />
                        </Button>

                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-full border-muted-foreground/50 hover:border-foreground h-10 w-10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onMoreInfo(item.content_id);
                          }}
                        >
                          <Info className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Title & Episode Info */}
                      <div>
                        <h3 className="font-bold text-foreground truncate">{item.content.title}</h3>
                        {episodeInfo && (
                          <p className="text-sm text-muted-foreground">
                            {episodeInfo}: {item.episode?.title}
                          </p>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs">
                        {item.content.maturity_rating && (
                          <span className="border border-muted-foreground/50 px-1.5 py-0.5 rounded text-muted-foreground">
                            {item.content.maturity_rating}
                          </span>
                        )}
                        {item.content.release_year && (
                          <span className="text-muted-foreground">{item.content.release_year}</span>
                        )}
                        {item.content.duration && (
                          <span className="text-muted-foreground">{item.content.duration}</span>
                        )}
                      </div>

                      {/* Remaining Time */}
                      <p className="text-sm font-medium text-primary">
                        {remainingTimeText}
                      </p>

                      {/* Genre */}
                      {item.content.genre && (
                        <p className="text-xs text-muted-foreground">
                          {item.content.genre}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default ContinueWatchingRow;