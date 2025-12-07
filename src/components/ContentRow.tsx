import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Play, Info, Plus, Check, ThumbsUp } from "lucide-react";
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
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const { currentProfile } = useProfile();

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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {seeAllLink && (
          <Link 
            to={seeAllLink} 
            className="flex items-center text-sm text-primary hover:text-primary/80"
          >
            See All <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      
      <div className="relative">
        <div className="flex overflow-x-auto scrollbar-hide pb-4 gap-4">
          {contents.map((content) => {
            const previewUrl = content.trailerUrl || content.videoUrl;
            const hasVideoError = videoError[content.id];
            
            return (
              <div 
                key={content.id}
                className={`flex-none transition-all duration-300 ease-in-out ${
                  hoveredId === content.id ? "w-[350px] z-10" : "w-[180px]"
                }`}
                onMouseEnter={() => setHoveredId(content.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {hoveredId === content.id ? (
                  <div className="h-full w-full bg-card rounded-lg overflow-hidden border border-border shadow-xl animate-fade-in">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                    
                    <div className="p-3 space-y-2">
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-full w-9 h-9 p-0 bg-primary hover:bg-primary/90"
                          asChild
                        >
                          <Link to={`/watch/${content.id}`}>
                            <Play className="w-4 h-4 fill-current" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full w-9 h-9 p-0 border-muted-foreground/50"
                          onClick={(e) => toggleMyList(e, content.id)}
                        >
                          {myListItems[content.id] ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`rounded-full w-9 h-9 p-0 border-muted-foreground/50 ${
                            likedItems[content.id] ? "text-primary border-primary" : ""
                          }`}
                          onClick={(e) => toggleLike(e, content.id)}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full w-9 h-9 p-0 border-muted-foreground/50 ml-auto"
                          onClick={(e) => handleMoreInfo(e, content.id)}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Title and Metadata */}
                      <h3 className="font-bold text-foreground truncate">{content.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {content.rating && (
                          <span className="px-1.5 py-0.5 border border-muted-foreground/50 rounded">
                            {content.rating}
                          </span>
                        )}
                        {content.year && <span>{content.year}</span>}
                        {content.category && <span>• {content.category}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="group block relative cursor-pointer overflow-hidden">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2">
                      <img 
                        src={content.posterUrl}
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {content.rating && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 text-xs rounded-sm">
                          {content.rating}
                        </div>
                      )}
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
