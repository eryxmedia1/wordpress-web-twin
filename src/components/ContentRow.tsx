import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Play, Info, Plus, Check, ThumbsUp, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";

interface Content {
  id: string;
  title: string;
  posterUrl: string;
  rating?: string;
  year?: string;
  category?: string;
  videoUrl?: string | null;
  trailerUrl?: string | null;
}

interface ContentRowProps {
  title: string;
  contents: Content[];
  seeAllLink?: string;
  onMoreInfo?: (contentId: string) => void;
}

const ContentRow = ({ title, contents, seeAllLink, onMoreInfo }: ContentRowProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const [myListItems, setMyListItems] = useState<Record<string, boolean>>({});
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { currentProfile } = useProfile();

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

  const handleMouseEnter = (id: string) => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId(id);
    }, 500); // Delay before expanding
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
    if (!currentProfile?.id) return;

    const isInList = myListItems[contentId];
    if (isInList) {
      await supabase
        .from("favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
    } else {
      await supabase
        .from("favorites")
        .insert({ profile_id: currentProfile.id, content_id: contentId });
    }
    setMyListItems(prev => ({ ...prev, [contentId]: !isInList }));
  };

  const toggleLike = async (e: React.MouseEvent, contentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile?.id) return;

    const isLiked = likedItems[contentId];
    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
    } else {
      await supabase
        .from("likes")
        .insert({ profile_id: currentProfile.id, content_id: contentId });
    }
    setLikedItems(prev => ({ ...prev, [contentId]: !isLiked }));
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
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background p-2 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
        )}

        {/* Scroll Right Button */}
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
          className="flex overflow-x-auto scrollbar-hide pb-4 gap-3 md:gap-4"
        >
          {contents.map((content, index) => {
            const previewUrl = content.trailerUrl || content.videoUrl;
            const hasVideoError = videoError[content.id];
            const isHovered = hoveredId === content.id;
            
            return (
              <div 
                key={content.id}
                className={`flex-none transition-all duration-300 ease-out ${
                  isHovered ? "w-[320px] md:w-[400px] z-20 scale-105" : "w-[140px] md:w-[180px]"
                }`}
                style={{ 
                  transitionDelay: isHovered ? '0ms' : `${index * 20}ms`,
                  marginLeft: isHovered && index === 0 ? '0' : undefined,
                  marginRight: isHovered && index === contents.length - 1 ? '0' : undefined
                }}
                onMouseEnter={() => handleMouseEnter(content.id)}
                onMouseLeave={handleMouseLeave}
              >
                {isHovered ? (
                  <div className="h-full w-full bg-card rounded-lg overflow-hidden border border-border shadow-2xl animate-scale-in">
                    <div className="relative">
                      {/* Video Preview */}
                      {previewUrl && !hasVideoError ? (
                        <video
                          ref={el => videoRefs.current[content.id] = el}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full aspect-video object-cover"
                          onError={() => setVideoError(prev => ({ ...prev, [content.id]: true }))}
                        >
                          <source src={previewUrl} type="video/mp4" />
                        </video>
                      ) : (
                        <img 
                          src={content.posterUrl}
                          alt={content.title}
                          className="w-full aspect-video object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {/* Action Buttons */}
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
                          className="rounded-full w-10 h-10 p-0 border-muted-foreground/50 hover:border-foreground"
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

                      {/* Title and Metadata */}
                      <div>
                        <h3 className="font-bold text-lg text-foreground truncate">{content.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          {content.rating && (
                            <span className="px-2 py-0.5 border border-secondary/50 text-secondary rounded text-xs">
                              {content.rating}
                            </span>
                          )}
                          {content.year && <span>{content.year}</span>}
                          {content.category && <span>• {content.category}</span>}
                        </div>
                      </div>

                      {/* Trailer & Play Buttons */}
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
                ) : (
                  <div className="group block relative cursor-pointer overflow-hidden">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2 bg-card">
                      <img 
                        src={content.posterUrl}
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {content.rating && (
                        <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-1.5 py-0.5 text-xs font-medium rounded-sm">
                          {content.rating}
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
                    </div>
                    <h3 className="text-sm font-medium truncate text-foreground">{content.title}</h3>
                    <div className="text-xs text-muted-foreground">
                      {content.year} {content.category && `• ${content.category}`}
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
