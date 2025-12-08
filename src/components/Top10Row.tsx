import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ContentLockBadge } from "@/components/ContentLockBadge";
import { Button } from "@/components/ui/button";
import { Play, Plus, Check, ThumbsUp, Info } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactPlayer from "react-player";

interface Top10Item {
  id: string;
  title: string;
  posterUrl: string;
  rank: number;
  requiredPlans?: string[];
  trailerUrl?: string;
  videoUrl?: string;
  rating?: string;
  year?: string;
  genre?: string;
}

interface Top10RowProps {
  title: string;
  items: Top10Item[];
  userPlan?: string;
  onMoreInfo?: (id: string) => void;
}

const Top10Row = ({ title, items, userPlan = 'free', onMoreInfo }: Top10RowProps) => {
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [myListItems, setMyListItems] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial favorites and likes state
  useEffect(() => {
    if (!currentProfile?.id || items.length === 0) return;

    const fetchUserData = async () => {
      const contentIds = items.map(i => i.id);
      
      const { data: favorites } = await supabase
        .from("favorites")
        .select("content_id")
        .eq("profile_id", currentProfile.id)
        .in("content_id", contentIds);

      if (favorites) {
        setMyListItems(new Set(favorites.map(f => f.content_id)));
      }

      const { data: likes } = await supabase
        .from("likes")
        .select("content_id")
        .eq("profile_id", currentProfile.id)
        .in("content_id", contentIds);

      if (likes) {
        setLikedItems(new Set(likes.map(l => l.content_id)));
      }
    };

    fetchUserData();
  }, [currentProfile?.id, items]);

  const handleMouseEnter = (id: string) => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId(id);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredId(null);
  };

  const handleVideoError = (id: string) => {
    setVideoErrors(prev => new Set(prev).add(id));
  };

  const handlePlay = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${id}`);
  };

  const handleMoreInfo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMoreInfo) {
      onMoreInfo(id);
    }
  };

  const toggleMyList = async (e: React.MouseEvent, contentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile) {
      toast.error("Please select a profile first");
      return;
    }

    const isInList = myListItems.has(contentId);
    const contentTitle = items.find(i => i.id === contentId)?.title || "Item";

    try {
      if (isInList) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("profile_id", currentProfile.id)
          .eq("content_id", contentId);
        
        if (error) throw error;
        setMyListItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });
        toast.success(`Removed "${contentTitle}" from My List`);
      } else {
        const { error } = await supabase.from("favorites").insert({
          profile_id: currentProfile.id,
          content_id: contentId,
        });
        
        if (error) throw error;
        setMyListItems(prev => new Set(prev).add(contentId));
        toast.success(`Added "${contentTitle}" to My List`);
      }
    } catch (error) {
      console.error("Error updating My List:", error);
      toast.error("Failed to update My List");
    }
  };

  const toggleLike = async (e: React.MouseEvent, contentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile) {
      toast.error("Please select a profile first");
      return;
    }

    const isLiked = likedItems.has(contentId);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("profile_id", currentProfile.id)
          .eq("content_id", contentId);
        
        if (error) throw error;
        setLikedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });
      } else {
        const { error } = await supabase.from("likes").insert({
          profile_id: currentProfile.id,
          content_id: contentId,
        });
        
        if (error) throw error;
        setLikedItems(prev => new Set(prev).add(contentId));
        toast.success("Liked!");
      }
    } catch (error) {
      console.error("Error updating likes:", error);
      toast.error("Failed to update likes");
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-4">
          {items.map((item) => {
            const isHovered = hoveredId === item.id;
            const videoUrl = item.trailerUrl || item.videoUrl;
            const hasVideoError = videoErrors.has(item.id);
            const showVideo = isHovered && videoUrl && !hasVideoError;
            const isInList = myListItems.has(item.id);
            const isLiked = likedItems.has(item.id);

            return (
              <div
                key={item.id}
                className="relative flex-shrink-0 group flex items-end"
                style={{ minWidth: '180px' }}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Large Rank Number */}
                <div className="absolute left-0 bottom-0 z-0 select-none pointer-events-none">
                  <span 
                    className="text-[140px] md:text-[180px] font-black leading-none"
                    style={{
                      color: 'transparent',
                      WebkitTextStroke: '3px hsl(180 60% 45%)',
                      textShadow: '0 0 30px hsl(180 60% 45% / 0.4)',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {item.rank}
                  </span>
                </div>
                
              {/* Card Container */}
                <div 
                  className={`relative ml-12 md:ml-16 rounded-lg overflow-hidden bg-card z-10 shadow-xl transition-all duration-300 ease-out ${
                    isHovered 
                      ? 'w-56 md:w-72 shadow-2xl scale-105' 
                      : 'w-28 md:w-36 h-40 md:h-52'
                  }`}
                >
                  {/* Video/Poster Section - Top */}
                  <Link 
                    to={`/watch/${item.id}`} 
                    className={`block relative ${isHovered ? 'h-32 md:h-40' : 'h-full'}`}
                  >
                    {showVideo ? (
                      <ReactPlayer
                        url={videoUrl}
                        playing
                        muted
                        loop
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                        onError={() => handleVideoError(item.id)}
                        config={{
                          file: {
                            attributes: {
                              style: { objectFit: 'cover', width: '100%', height: '100%' }
                            }
                          }
                        }}
                      />
                    ) : (
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Gradient overlay at bottom of video */}
                    {isHovered && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                    )}
                  </Link>
                  
                  {/* Content Section - Bottom (only on hover) */}
                  {isHovered && (
                    <div className="bg-card p-3 space-y-3">
                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          className="h-9 w-9 rounded-full bg-white hover:bg-white/90 text-black"
                          onClick={(e) => handlePlay(e, item.id)}
                        >
                          <Play className="h-4 w-4 fill-current" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className={`h-9 w-9 rounded-full border-muted-foreground/50 bg-background/50 hover:bg-background/80 ${isInList ? 'border-primary text-primary' : ''}`}
                          onClick={(e) => toggleMyList(e, item.id)}
                        >
                          {isInList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className={`h-9 w-9 rounded-full border-muted-foreground/50 bg-background/50 hover:bg-background/80 ${isLiked ? 'text-primary border-primary' : ''}`}
                          onClick={(e) => toggleLike(e, item.id)}
                        >
                          <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                        </Button>
                        {onMoreInfo && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-full border-muted-foreground/50 bg-background/50 hover:bg-background/80 ml-auto"
                            onClick={(e) => handleMoreInfo(e, item.id)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Title */}
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</p>
                      
                      {/* Metadata Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.rating && (
                          <span className="px-1.5 py-0.5 text-xs font-medium border border-muted-foreground/40 text-muted-foreground rounded">
                            {item.rating}
                          </span>
                        )}
                        {item.year && (
                          <span className="text-xs text-muted-foreground">{item.year}</span>
                        )}
                        {item.genre && (
                          <span className="text-xs text-muted-foreground">• {item.genre.split(',')[0]}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {item.requiredPlans && item.requiredPlans.length > 0 && (
                    <ContentLockBadge 
                      requiredPlans={item.requiredPlans} 
                      userPlan={userPlan} 
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default Top10Row;
