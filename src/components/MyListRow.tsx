import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus, Check, ThumbsUp, Info, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactPlayer from "react-player";

interface FavoriteItem {
  id: string;
  content_id: string;
  content: {
    id: string;
    title: string;
    poster_url: string | null;
    backdrop_url: string | null;
    type: string;
    release_year: number | null;
    genre: string | null;
    video_url: string | null;
    trailer_url: string | null;
    maturity_rating: string | null;
    duration: string | null;
  };
}

interface MyListRowProps {
  onMoreInfo: (contentId: string) => void;
  seeAllLink?: string;
}

const MyListRow = ({ onMoreInfo, seeAllLink = "/category/my-list" }: MyListRowProps) => {
  const { currentProfile } = useProfile();
  const navigate = useNavigate();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<'left' | 'center' | 'right'>('center');
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!currentProfile?.id) return;

    const { data, error } = await supabase
      .from("favorites")
      .select(`
        id,
        content_id,
        content:contents(id, title, poster_url, backdrop_url, type, release_year, genre, video_url, trailer_url, maturity_rating, duration)
      `)
      .eq("profile_id", currentProfile.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setItems(data.filter(item => item.content) as unknown as FavoriteItem[]);
    }
    setIsLoading(false);
  }, [currentProfile?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Fetch likes
  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchLikes = async () => {
      const { data } = await supabase
        .from("likes")
        .select("content_id")
        .eq("profile_id", currentProfile.id);

      if (data) {
        setLikedItems(new Set(data.map(l => l.content_id)));
      }
    };

    fetchLikes();
  }, [currentProfile?.id]);

  // Real-time subscription for favorites changes
  useEffect(() => {
    if (!currentProfile?.id) return;

    const channel = supabase
      .channel('my-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `profile_id=eq.${currentProfile.id}`
        },
        () => {
          fetchFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfile?.id, fetchFavorites]);

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

  const removeFromList = async (contentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile?.id) return;

    await supabase
      .from("favorites")
      .delete()
      .eq("profile_id", currentProfile.id)
      .eq("content_id", contentId);
    toast.success("Removed from My List");
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

  if (isLoading) return null;
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">My List</h2>
        <button
          onClick={() => navigate(seeAllLink)}
          className="flex items-center text-sm text-secondary hover:text-secondary/80 transition-colors"
        >
          See All <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="w-full">
        <div ref={scrollContainerRef} className="flex gap-4 pb-4">
          {items.map((item) => {
            const isHovered = hoveredId === item.content.id;
            const isLiked = likedItems.has(item.content.id);
            const videoUrl = item.content.trailer_url || item.content.video_url;

            return (
              <div
                key={item.id}
                ref={(el) => { cardRefs.current[item.content.id] = el; }}
                className="relative flex-shrink-0 w-36 md:w-44"
                onMouseEnter={() => handleMouseEnter(item.content.id, cardRefs.current[item.content.id])}
                onMouseLeave={handleMouseLeave}
              >
                {/* Base Card */}
                <div 
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                  onClick={() => onMoreInfo(item.content.id)}
                >
                  <img
                    src={item.content.poster_url || "/placeholder.svg"}
                    alt={item.content.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                </div>

                <div className={`mt-2 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                  <p className="text-sm text-foreground truncate">{item.content.title}</p>
                </div>

                {/* Expanded Hover Card */}
                {isHovered && (
                  <div 
                    className={`absolute top-0 z-50 w-72 md:w-80 bg-card rounded-lg overflow-hidden shadow-2xl transform transition-all duration-300 ${getPositionStyles()}`}
                    style={{ minHeight: '320px' }}
                  >
                    {/* Video Preview Section - Top 45% */}
                    <div className="relative h-40">
                      {videoUrl && !videoError[item.content.id] ? (
                        <ReactPlayer
                          url={videoUrl}
                          playing
                          muted
                          loop
                          width="100%"
                          height="100%"
                          style={{ position: 'absolute', top: 0, left: 0 }}
                          onError={() => setVideoError(prev => ({ ...prev, [item.content.id]: true }))}
                          config={{
                            file: { attributes: { crossOrigin: 'anonymous' } }
                          }}
                        />
                      ) : (
                        <img
                          src={item.content.backdrop_url || item.content.poster_url || "/placeholder.svg"}
                          alt={item.content.title}
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
                          to={`/watch/${item.content.id}`}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Play className="w-5 h-5 fill-current" />
                        </Link>
                        <button
                          onClick={(e) => removeFromList(item.content.id, e)}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary border-primary text-primary-foreground border-2 transition-colors"
                          title="Remove from My List"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => toggleLike(item.content.id, e)}
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
                            onMoreInfo(item.content.id);
                          }}
                          className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-muted-foreground/50 text-foreground hover:border-foreground transition-colors ml-auto"
                        >
                          <Info className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-foreground text-base mb-2 line-clamp-1">
                        {item.content.title}
                      </h3>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {item.content.maturity_rating && (
                          <span className="px-1.5 py-0.5 border border-muted-foreground/50 rounded text-[10px]">
                            {item.content.maturity_rating}
                          </span>
                        )}
                        {item.content.release_year && <span>{item.content.release_year}</span>}
                        {item.content.duration && <span>{item.content.duration}</span>}
                      </div>

                      {item.content.genre && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
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

export default MyListRow;
