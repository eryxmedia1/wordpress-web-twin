import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Play, Info, Plus, Check, ThumbsUp, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import ReactPlayer from "react-player";
import { ContentLockBadge } from "@/components/ContentLockBadge";
import { toast } from "sonner";

interface Content {
  id: string;
  title: string;
  posterUrl: string;
  rating?: string;
  year?: string;
  category?: string;
  videoUrl?: string | null;
  trailerUrl?: string | null;
  requiredPlans?: string[];
}

interface ContentRowProps {
  title: string;
  contents: Content[];
  seeAllLink?: string;
  onMoreInfo?: (contentId: string) => void;
  userPlan?: string;
}

const ContentRow = ({ title, contents, seeAllLink, onMoreInfo, userPlan = 'free' }: ContentRowProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<'left' | 'center' | 'right'>('center');
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const [myListItems, setMyListItems] = useState<Record<string, boolean>>({});
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { currentProfile } = useProfile();

  // Fetch initial favorites and likes state
  useEffect(() => {
    if (!currentProfile?.id || contents.length === 0) return;

    const fetchUserData = async () => {
      const contentIds = contents.map(c => c.id);
      
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
  }, [currentProfile?.id, contents]);

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [contents]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 800;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseEnter = (id: string, cardElement: HTMLDivElement | null) => {
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
    const contentTitle = contents.find(c => c.id === contentId)?.title || "Item";
    
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
    onMoreInfo?.(contentId);
  };

  if (contents.length === 0) return null;

  return (
    <section className="space-y-4 relative group/row">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">{title}</h2>
        {seeAllLink && (
          <Link 
            to={seeAllLink} 
            className="flex items-center text-sm text-secondary hover:text-secondary/80 transition-colors"
          >
            See All <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background p-2 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background p-2 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-6 w-6 text-foreground" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide pb-16 pt-4 gap-2 md:gap-3"
        >
          {contents.map((content) => {
            const previewUrl = content.trailerUrl || content.videoUrl;
            const hasVideoError = videoError[content.id];
            const isHovered = hoveredId === content.id;
            
            const getExpandedCardStyle = () => {
              const baseStyle = { width: '320px' };
              switch (hoverPosition) {
                case 'left':
                  return { ...baseStyle, left: '0px', top: '-20px' };
                case 'right':
                  return { ...baseStyle, right: '0px', top: '-20px' };
                default:
                  return { ...baseStyle, left: '-80px', top: '-20px' };
              }
            };
            
            return (
              <div 
                key={content.id}
                ref={el => cardRefs.current[content.id] = el}
                className="flex-none relative"
                onMouseEnter={() => handleMouseEnter(content.id, cardRefs.current[content.id])}
                onMouseLeave={handleMouseLeave}
              >
                <div 
                  className={`transition-all duration-300 ease-out cursor-pointer ${
                    isHovered ? "opacity-0" : "opacity-100"
                  }`}
                  style={{ width: '160px' }}
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-card">
                    <img 
                      src={content.posterUrl}
                      alt={content.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                    {content.rating && !content.requiredPlans?.length && (
                      <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-1.5 py-0.5 text-xs font-medium rounded-sm">
                        {content.rating}
                      </div>
                    )}
                    {content.requiredPlans && content.requiredPlans.length > 0 && (
                      <ContentLockBadge 
                        requiredPlans={content.requiredPlans} 
                        userPlan={userPlan} 
                      />
                    )}
                  </div>
                  <h3 className="text-sm font-medium truncate text-foreground mt-2">{content.title}</h3>
                  <div className="text-xs text-muted-foreground">
                    {content.year} {content.category && `• ${content.category}`}
                  </div>
                </div>

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
                            onError={() => setVideoError(prev => ({ ...prev, [content.id]: true }))}
                          />
                        ) : (
                          <img 
                            src={content.posterUrl}
                            alt={content.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="rounded-full w-10 h-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                            asChild
                          >
                            <Link to={`/watch/${content.id}`}>
                              <Play className="w-5 h-5 fill-current" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`rounded-full w-10 h-10 p-0 border-muted-foreground/50 hover:border-foreground ${
                              myListItems[content.id] ? "border-primary text-primary" : ""
                            }`}
                            onClick={(e) => toggleMyList(e, content.id)}
                          >
                            {myListItems[content.id] ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`rounded-full w-10 h-10 p-0 border-muted-foreground/50 hover:border-foreground ${
                              likedItems[content.id] ? "text-primary border-primary" : ""
                            }`}
                            onClick={(e) => toggleLike(e, content.id)}
                          >
                            <ThumbsUp className="w-5 h-5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full w-10 h-10 p-0 border-muted-foreground/50 hover:border-foreground ml-auto"
                            onClick={(e) => handleMoreInfo(e, content.id)}
                          >
                            <Info className="w-5 h-5" />
                          </Button>
                        </div>

                        <h3 className="font-bold text-lg text-foreground truncate">{content.title}</h3>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {content.rating && (
                            <span className="px-2 py-0.5 border border-secondary/50 text-secondary rounded text-xs">
                              {content.rating}
                            </span>
                          )}
                          {content.year && <span>{content.year}</span>}
                          {content.category && <span>• {content.category}</span>}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                            asChild
                          >
                            <Link to={`/watch/${content.id}`}>
                              <Play className="w-4 h-4 mr-1" />
                              Trailer
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-muted-foreground/50"
                            onClick={(e) => handleMoreInfo(e, content.id)}
                          >
                            Details
                          </Button>
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
    </section>
  );
};

export default ContentRow;
