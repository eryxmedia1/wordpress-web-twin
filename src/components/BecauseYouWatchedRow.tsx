import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Plus, Check, ThumbsUp, Info } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactPlayer from "react-player";

interface WatchedContent {
  id: string;
  title: string;
  genre: string | null;
}

interface RecommendedContent {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  genre: string | null;
  video_url: string | null;
  trailer_url: string | null;
  maturity_rating: string | null;
  duration: string | null;
}

interface BecauseYouWatchedRowProps {
  onMoreInfo: (contentId: string) => void;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const BecauseYouWatchedRow = ({ onMoreInfo }: BecauseYouWatchedRowProps) => {
  const { currentProfile } = useProfile();
  const [watchedTitle, setWatchedTitle] = useState<WatchedContent | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<'left' | 'center' | 'right'>('center');
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const [myListItems, setMyListItems] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchRecommendations = async () => {
      // Get recent watch history with high progress
      const { data: historyData } = await supabase
        .from("watch_history")
        .select(`
          content_id,
          progress_percent,
          content:contents(id, title, genre)
        `)
        .eq("profile_id", currentProfile.id)
        .gte("progress_percent", 50)
        .order("last_watched_at", { ascending: false })
        .limit(1);

      if (!historyData || historyData.length === 0) {
        setIsLoading(false);
        return;
      }

      const watchedItem = historyData[0].content as unknown as WatchedContent;
      if (!watchedItem) {
        setIsLoading(false);
        return;
      }

      setWatchedTitle(watchedItem);

      // Get tags for the watched content
      const { data: watchedTags } = await supabase
        .from("content_tags")
        .select("tag_id")
        .eq("content_id", watchedItem.id);

      const tagIds = (watchedTags || []).map(t => t.tag_id);

      let similarContentIds = new Set<string>();

      // Find content with matching tags
      if (tagIds.length > 0) {
        const { data: contentWithTags } = await supabase
          .from("content_tags")
          .select("content_id")
          .in("tag_id", tagIds)
          .neq("content_id", watchedItem.id);

        if (contentWithTags) {
          contentWithTags.forEach(ct => similarContentIds.add(ct.content_id));
        }
      }

      // Build query for similar content
      let query = supabase
        .from("contents")
        .select("id, title, poster_url, backdrop_url, release_year, genre, video_url, trailer_url, maturity_rating, duration")
        .neq("id", watchedItem.id)
        .limit(15);

      // Prioritize content with matching tags, then fall back to genre
      if (similarContentIds.size > 0) {
        query = query.in("id", Array.from(similarContentIds));
      } else if (watchedItem.genre) {
        query = query.ilike("genre", `%${watchedItem.genre.split(",")[0].trim()}%`);
      }

      const { data: similarData } = await query;

      if (similarData && similarData.length > 0) {
        setRecommendations(shuffleArray(similarData));
      } else if (watchedItem.genre) {
        // Fallback to genre-based if no tag matches
        const { data: genreData } = await supabase
          .from("contents")
          .select("id, title, poster_url, backdrop_url, release_year, genre, video_url, trailer_url, maturity_rating, duration")
          .neq("id", watchedItem.id)
          .ilike("genre", `%${watchedItem.genre.split(",")[0].trim()}%`)
          .limit(15);

        if (genreData) {
          setRecommendations(shuffleArray(genreData));
        }
      }

      setIsLoading(false);
    };

    fetchRecommendations();
  }, [currentProfile?.id]);

  // Fetch user's favorites and likes
  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchUserData = async () => {
      const [favoritesResult, likesResult] = await Promise.all([
        supabase
          .from("favorites")
          .select("content_id")
          .eq("profile_id", currentProfile.id),
        supabase
          .from("likes")
          .select("content_id")
          .eq("profile_id", currentProfile.id)
      ]);

      if (favoritesResult.data) {
        setMyListItems(new Set(favoritesResult.data.map(f => f.content_id)));
      }
      if (likesResult.data) {
        setLikedItems(new Set(likesResult.data.map(l => l.content_id)));
      }
    };

    fetchUserData();
  }, [currentProfile?.id]);

  const handleMouseEnter = useCallback((id: string, cardElement: HTMLDivElement | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const expandedWidth = 320;
        const cardCenter = rect.left + rect.width / 2;
        
        if (cardCenter - expandedWidth / 2 < 80) {
          setHoverPosition('left');
        } else if (cardCenter + expandedWidth / 2 > viewportWidth - 80) {
          setHoverPosition('right');
        } else {
          setHoverPosition('center');
        }
      }
      setHoveredId(id);
    }, 500);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredId(null);
  }, []);

  const toggleMyList = async (contentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile?.id) return;

    const isInList = myListItems.has(contentId);

    if (isInList) {
      await supabase
        .from("favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
      setMyListItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
      toast.success("Removed from My List");
    } else {
      await supabase
        .from("favorites")
        .insert({ profile_id: currentProfile.id, content_id: contentId });
      setMyListItems(prev => new Set(prev).add(contentId));
      toast.success("Added to My List");
    }
  };

  const toggleLike = async (contentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile?.id) return;

    const isLiked = likedItems.has(contentId);

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
      setLikedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
    } else {
      await supabase
        .from("likes")
        .insert({ profile_id: currentProfile.id, content_id: contentId });
      setLikedItems(prev => new Set(prev).add(contentId));
    }
  };

  const getPositionStyles = () => {
    switch (hoverPosition) {
      case 'left':
        return 'left-0';
      case 'right':
        return 'right-0';
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };

  if (isLoading || !watchedTitle || recommendations.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">
        Because you watched <span className="text-primary">{watchedTitle.title}</span>
      </h2>

      <ScrollArea className="w-full">
        <div ref={scrollContainerRef} className="flex gap-4 pb-4">
          {recommendations.map((item) => {
            const isHovered = hoveredId === item.id;
            const isInMyList = myListItems.has(item.id);
            const isLiked = likedItems.has(item.id);
            const videoUrl = item.trailer_url || item.video_url;

            return (
              <div
                key={item.id}
                ref={(el) => { cardRefs.current[item.id] = el; }}
                className="relative flex-shrink-0 w-36 md:w-44"
                onMouseEnter={() => handleMouseEnter(item.id, cardRefs.current[item.id])}
                onMouseLeave={handleMouseLeave}
              >
                {/* Base Card */}
                <div 
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                  onClick={() => onMoreInfo(item.id)}
                >
                  <img
                    src={item.poster_url || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                </div>

                <div className={`mt-2 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                  <p className="text-sm text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.release_year} • {item.genre}
                  </p>
                </div>

                {/* Expanded Hover Card */}
                {isHovered && (
                  <div 
                    className={`absolute top-0 z-50 w-72 md:w-80 bg-card rounded-lg overflow-hidden shadow-2xl transform transition-all duration-300 ${getPositionStyles()}`}
                    style={{ minHeight: '320px' }}
                  >
                    {/* Video Preview Section - Top 45% */}
                    <div className="relative h-40">
                      {videoUrl && !videoError[item.id] ? (
                        <ReactPlayer
                          url={videoUrl}
                          playing
                          muted
                          loop
                          width="100%"
                          height="100%"
                          style={{ position: 'absolute', top: 0, left: 0 }}
                          onError={() => setVideoError(prev => ({ ...prev, [item.id]: true }))}
                          config={{
                            file: { attributes: { crossOrigin: 'anonymous' } }
                          }}
                        />
                      ) : (
                        <img
                          src={item.backdrop_url || item.poster_url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
                    </div>

                    {/* Content Section - Bottom 55% */}
                    <div className="p-4 bg-card">
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mb-3">
                        <Link
                          to={`/watch/${item.id}`}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Play className="w-5 h-5 fill-current" />
                        </Link>
                        <button
                          onClick={(e) => toggleMyList(item.id, e)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                            isInMyList 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-muted-foreground/50 text-foreground hover:border-foreground'
                          }`}
                        >
                          {isInMyList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={(e) => toggleLike(item.id, e)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                            isLiked 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-muted-foreground/50 text-foreground hover:border-foreground'
                          }`}
                        >
                          <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoreInfo(item.id);
                          }}
                          className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-muted-foreground/50 text-foreground hover:border-foreground transition-colors ml-auto"
                        >
                          <Info className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-foreground text-base mb-2 line-clamp-1">
                        {item.title}
                      </h3>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {item.maturity_rating && (
                          <span className="px-1.5 py-0.5 border border-muted-foreground/50 rounded text-[10px]">
                            {item.maturity_rating}
                          </span>
                        )}
                        {item.release_year && <span>{item.release_year}</span>}
                        {item.duration && <span>{item.duration}</span>}
                      </div>

                      {item.genre && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                          {item.genre}
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

export default BecauseYouWatchedRow;
