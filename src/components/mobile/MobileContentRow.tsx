import { useState, useRef, useEffect } from "react";
import { ChevronRight, Play, Info, Plus, Check, ThumbsUp } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import ContentLockBadge from "@/components/ContentLockBadge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import ReactPlayer from "react-player";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  title: string;
  posterUrl: string;
  rating?: string;
  year?: string;
  progress?: number;
  requiredPlans?: string[];
  videoUrl?: string | null;
  trailerUrl?: string | null;
  genre?: string;
}

interface MobileContentRowProps {
  title: string;
  items: ContentItem[];
  onItemClick: (id: string) => void;
  seeAllLink?: string;
  showProgress?: boolean;
  userPlan?: string;
}

const MobileContentRow = ({
  title,
  items,
  onItemClick,
  seeAllLink,
  showProgress = false,
  userPlan = 'free',
}: MobileContentRowProps) => {
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<'left' | 'center' | 'right'>('center');
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const [myListItems, setMyListItems] = useState<Record<string, boolean>>({});
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial favorites and likes state
  useEffect(() => {
    if (!currentProfile?.id || items.length === 0) return;

    const fetchUserData = async () => {
      const contentIds = items.map(c => c.id);
      
      // Fetch favorites
      const { data: favorites } = await supabase
        .from("favorites")
        .select("content_id")
        .eq("profile_id", currentProfile.id)
        .in("content_id", contentIds);

      if (favorites) {
        const favMap: Record<string, boolean> = {};
        favorites.forEach(f => { favMap[f.content_id] = true; });
        setMyListItems(favMap);
      }

      // Fetch likes
      const { data: likes } = await supabase
        .from("likes")
        .select("content_id")
        .eq("profile_id", currentProfile.id)
        .in("content_id", contentIds);

      if (likes) {
        const likeMap: Record<string, boolean> = {};
        likes.forEach(l => { likeMap[l.content_id] = true; });
        setLikedItems(likeMap);
      }
    };

    fetchUserData();
  }, [currentProfile?.id, items]);
  
  if (items.length === 0) return null;

  const handleSeeAll = () => {
    if (seeAllLink) {
      navigate(seeAllLink);
    }
  };

  const handleMouseEnter = (id: string, cardElement: HTMLDivElement | null) => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const expandedWidth = 280;
        const cardCenter = rect.left + rect.width / 2;
        
        if (cardCenter - expandedWidth / 2 < 16) {
          setHoverPosition('left');
        } else if (cardCenter + expandedWidth / 2 > viewportWidth - 16) {
          setHoverPosition('right');
        } else {
          setHoverPosition('center');
        }
      }
      setHoveredId(id);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredId(null);
  };

  const toggleMyList = async (e: React.MouseEvent, contentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile?.id) {
      toast.error("Please select a profile first");
      return;
    }

    const isInList = myListItems[contentId];
    const contentTitle = items.find(c => c.id === contentId)?.title || "Item";
    
    try {
      if (isInList) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("profile_id", currentProfile.id)
          .eq("content_id", contentId);
        
        if (error) throw error;
        setMyListItems(prev => ({ ...prev, [contentId]: false }));
        toast.success(`Removed "${contentTitle}" from My List`);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ profile_id: currentProfile.id, content_id: contentId });
        
        if (error) throw error;
        setMyListItems(prev => ({ ...prev, [contentId]: true }));
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
    if (!currentProfile?.id) {
      toast.error("Please select a profile first");
      return;
    }

    const isLiked = likedItems[contentId];
    
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("profile_id", currentProfile.id)
          .eq("content_id", contentId);
        
        if (error) throw error;
        setLikedItems(prev => ({ ...prev, [contentId]: false }));
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ profile_id: currentProfile.id, content_id: contentId });
        
        if (error) throw error;
        setLikedItems(prev => ({ ...prev, [contentId]: true }));
        toast.success("Added to your likes");
      }
    } catch (error) {
      console.error("Error updating likes:", error);
      toast.error("Failed to update likes");
    }
  };

  const handleMoreInfo = (e: React.MouseEvent, contentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onItemClick(contentId);
  };

  const getExpandedCardStyle = () => {
    const baseStyle = { width: '280px' };
    switch (hoverPosition) {
      case 'left':
        return { ...baseStyle, left: '0px', top: '-20px' };
      case 'right':
        return { ...baseStyle, right: '0px', top: '-20px' };
      default:
        return { ...baseStyle, left: '-85px', top: '-20px' };
    }
  };

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {seeAllLink && (
          <button 
            onClick={handleSeeAll}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-12">
        {items.map((item) => {
          const previewUrl = item.trailerUrl || item.videoUrl;
          const hasVideoError = videoError[item.id];
          const isHovered = hoveredId === item.id;

          return (
            <div
              key={item.id}
              ref={el => cardRefs.current[item.id] = el}
              className="flex-shrink-0 w-[110px] cursor-pointer group relative"
              onMouseEnter={() => handleMouseEnter(item.id, cardRefs.current[item.id])}
              onMouseLeave={handleMouseLeave}
            >
              {/* Base Card */}
              <div 
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "transition-all duration-300",
                  isHovered ? "opacity-0" : "opacity-100"
                )}
              >
                {/* Poster Card */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card">
                  {item.requiredPlans && (
                    <ContentLockBadge 
                      requiredPlans={item.requiredPlans} 
                      userPlan={userPlan} 
                      size="sm" 
                    />
                  )}
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Rating Badge */}
                  {item.rating && (
                    <div className="absolute top-1.5 left-1.5 bg-background/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground">
                      {item.rating}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {showProgress && item.progress !== undefined && item.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Title */}
                <p className="mt-1.5 text-xs text-foreground line-clamp-2 leading-tight">
                  {item.title}
                </p>
              </div>

              {/* Expanded Hover Card */}
              {isHovered && (
                <div 
                  className="absolute z-30 animate-scale-in"
                  style={getExpandedCardStyle()}
                >
                  <div className="bg-card rounded-lg overflow-hidden border border-border shadow-2xl">
                    <div className="relative aspect-video">
                      {previewUrl && !hasVideoError ? (
                        <ReactPlayer
                          url={previewUrl}
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
                          onError={() => setVideoError(prev => ({ ...prev, [item.id]: true }))}
                        />
                      ) : (
                        <img 
                          src={item.posterUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    </div>
                    
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-full w-8 h-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                          asChild
                        >
                          <Link to={`/watch/${item.id}`}>
                            <Play className="w-4 h-4 fill-current" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "rounded-full w-8 h-8 p-0 border-muted-foreground/50 hover:border-foreground",
                            myListItems[item.id] && "border-primary text-primary"
                          )}
                          onClick={(e) => toggleMyList(e, item.id)}
                        >
                          {myListItems[item.id] ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "rounded-full w-8 h-8 p-0 border-muted-foreground/50 hover:border-foreground",
                            likedItems[item.id] && "text-primary border-primary"
                          )}
                          onClick={(e) => toggleLike(e, item.id)}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full w-8 h-8 p-0 border-muted-foreground/50 hover:border-foreground ml-auto"
                          onClick={(e) => handleMoreInfo(e, item.id)}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>

                      <h3 className="font-bold text-sm text-foreground truncate">{item.title}</h3>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.rating && (
                          <span className="px-1.5 py-0.5 border border-secondary/50 text-secondary rounded text-[10px]">
                            {item.rating}
                          </span>
                        )}
                        {item.year && <span>{item.year}</span>}
                        {item.genre && <span>• {item.genre}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileContentRow;
