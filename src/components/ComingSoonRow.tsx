import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Play, Plus, Check, ThumbsUp, Info } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";
import ReactPlayer from "react-player";

interface ComingSoonContent {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  description: string | null;
  release_year: number | null;
  genre: string | null;
  video_url: string | null;
  trailer_url: string | null;
  maturity_rating: string | null;
  duration: string | null;
}

interface ComingSoonRowProps {
  onMoreInfo: (contentId: string) => void;
}

const ComingSoonRow = ({ onMoreInfo }: ComingSoonRowProps) => {
  const { currentProfile } = useProfile();
  const navigate = useNavigate();
  const [items, setItems] = useState<ComingSoonContent[]>([]);
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
    const fetchComingSoon = async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, poster_url, backdrop_url, description, release_year, genre, video_url, trailer_url, maturity_rating, duration")
        .eq("is_coming_soon", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setItems(data);
      }
      setIsLoading(false);
    };

    fetchComingSoon();
  }, []);

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

  if (isLoading || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          Coming Soon To Zoe RatedTV
        </h2>
      </div>

      <ScrollArea className="w-full">
        <div ref={scrollContainerRef} className="flex gap-4 pb-4">
          {items.map((item) => {
            const isHovered = hoveredId === item.id;
            const isInMyList = myListItems.has(item.id);
            const isLiked = likedItems.has(item.id);
            const videoUrl = item.trailer_url || item.video_url;

            return (
              <div
                key={item.id}
                ref={(el) => { cardRefs.current[item.id] = el; }}
                className="relative flex-shrink-0 w-40 md:w-48"
                onMouseEnter={() => handleMouseEnter(item.id, cardRefs.current[item.id])}
                onMouseLeave={handleMouseLeave}
              >
                {/* Base Card */}
                <div 
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                  onClick={() => onMoreInfo(item.id)}
                >
                  <img
                    src={item.poster_url || item.backdrop_url || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-primary px-2 py-1 rounded text-xs font-bold text-primary-foreground">
                    COMING SOON
                  </div>
                </div>

                <div className={`mt-2 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                  <p className="text-sm text-foreground truncate">{item.title}</p>
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
                      <div className="absolute top-2 left-2 bg-primary px-2 py-1 rounded text-xs font-bold text-primary-foreground">
                        COMING SOON
                      </div>
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

export default ComingSoonRow;
