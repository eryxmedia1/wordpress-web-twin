import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Play, Plus, Check, ThumbsUp, Info } from "lucide-react";
import ContentLockBadge from "@/components/ContentLockBadge";
import { Button } from "@/components/ui/button";
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
}

interface MobileTop10RowProps {
  title: string;
  items: Top10Item[];
  onItemClick: (id: string) => void;
  userPlan?: string;
}

const MobileTop10Row = ({ title, items, onItemClick, userPlan = 'free' }: MobileTop10RowProps) => {
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [myListItems, setMyListItems] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVideoError = (id: string) => {
    setVideoErrors(prev => new Set(prev).add(id));
  };

  const handleItemTap = (id: string) => {
    if (expandedId === id) {
      // If already expanded, navigate to watch
      navigate(`/watch/${id}`);
    } else {
      // Expand this item
      setExpandedId(id);
      // Auto-collapse after 8 seconds
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
      }
      expandTimeoutRef.current = setTimeout(() => {
        setExpandedId(null);
      }, 8000);
    }
  };

  const handlePlay = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/watch/${id}`);
  };

  const handleMoreInfo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onItemClick(id);
  };

  const toggleMyList = async (e: React.MouseEvent, contentId: string) => {
    e.stopPropagation();
    if (!currentProfile) {
      toast.error("Please select a profile first");
      return;
    }

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
      await supabase.from("favorites").insert({
        profile_id: currentProfile.id,
        content_id: contentId,
      });
      setMyListItems(prev => new Set(prev).add(contentId));
      toast.success("Added to My List");
    }
  };

  const toggleLike = async (e: React.MouseEvent, contentId: string) => {
    e.stopPropagation();
    if (!currentProfile) {
      toast.error("Please select a profile first");
      return;
    }

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
      toast.success("Removed like");
    } else {
      await supabase.from("likes").insert({
        profile_id: currentProfile.id,
        content_id: contentId,
      });
      setLikedItems(prev => new Set(prev).add(contentId));
      toast.success("Liked!");
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <button className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          See All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const videoUrl = item.trailerUrl || item.videoUrl;
          const hasVideoError = videoErrors.has(item.id);
          const showVideo = isExpanded && videoUrl && !hasVideoError;
          const isInList = myListItems.has(item.id);
          const isLiked = likedItems.has(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleItemTap(item.id)}
              className={`flex-shrink-0 cursor-pointer group relative transition-all duration-300 ${
                isExpanded ? 'z-20' : ''
              }`}
            >
              {/* Large Rank Number */}
              <div className="absolute -left-3 bottom-0 z-10 pointer-events-none">
                <span
                  className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground/80 to-foreground/20"
                  style={{
                    WebkitTextStroke: "2px hsl(var(--primary))",
                  }}
                >
                  {item.rank}
                </span>
              </div>

              {/* Poster Card */}
              <div 
                className={`relative ml-6 rounded-lg overflow-hidden bg-card shadow-lg transition-all duration-300 ${
                  isExpanded 
                    ? 'w-[160px] h-[240px] shadow-2xl' 
                    : 'w-[90px] aspect-[2/3]'
                }`}
              >
                {item.requiredPlans && (
                  <ContentLockBadge 
                    requiredPlans={item.requiredPlans} 
                    userPlan={userPlan} 
                    size="sm" 
                  />
                )}
                
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
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                )}

                {/* Gradient overlay when expanded */}
                {isExpanded && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
                )}

                {/* Action buttons when expanded */}
                {isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        className="h-7 w-7 rounded-full bg-white hover:bg-white/90 text-black"
                        onClick={(e) => handlePlay(e, item.id)}
                      >
                        <Play className="h-3 w-3 fill-current" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full border-muted-foreground/50 bg-background/50"
                        onClick={(e) => toggleMyList(e, item.id)}
                      >
                        {isInList ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className={`h-7 w-7 rounded-full border-muted-foreground/50 bg-background/50 ${isLiked ? 'text-primary' : ''}`}
                        onClick={(e) => toggleLike(e, item.id)}
                      >
                        <ThumbsUp className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full border-muted-foreground/50 bg-background/50"
                        onClick={(e) => handleMoreInfo(e, item.id)}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs font-semibold text-foreground text-center line-clamp-2">{item.title}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTop10Row;
