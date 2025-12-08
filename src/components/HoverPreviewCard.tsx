import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Plus, Check, ThumbsUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import ReactPlayer from "react-player";

interface HoverPreviewCardProps {
  content: {
    id: string;
    title: string;
    posterUrl: string;
    videoUrl?: string | null;
    trailerUrl?: string | null;
    year?: string;
    rating?: string;
    genre?: string;
    duration?: string;
  };
  onMoreInfo: (contentId: string) => void;
}

const HoverPreviewCard = ({ content, onMoreInfo }: HoverPreviewCardProps) => {
  const { currentProfile } = useProfile();
  const [isInList, setIsInList] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const previewUrl = content.trailerUrl || content.videoUrl;

  const toggleMyList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProfile?.id) return;

    if (isInList) {
      await supabase
        .from("favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", content.id);
    } else {
      await supabase
        .from("favorites")
        .insert({ profile_id: currentProfile.id, content_id: content.id });
    }
    setIsInList(!isInList);
  };

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProfile?.id) return;

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", content.id);
    } else {
      await supabase
        .from("likes")
        .insert({ profile_id: currentProfile.id, content_id: content.id });
    }
    setIsLiked(!isLiked);
  };

  return (
    <div className="absolute inset-0 z-50 bg-card rounded-lg shadow-2xl overflow-hidden transform scale-110 origin-center">
      {/* Video Preview */}
      <div className="relative aspect-video bg-muted">
        {previewUrl && !videoError ? (
          <ReactPlayer
            url={previewUrl}
            playing
            muted
            loop
            playsinline
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            onError={() => setVideoError(true)}
            config={{
              vimeo: {
                playerOptions: {
                  background: true,
                  responsive: true
                }
              },
              file: {
                attributes: {
                  playsInline: true
                }
              }
            }}
          />
        ) : (
          <img
            src={content.posterUrl || "/placeholder.svg"}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content Info */}
      <div className="p-3 space-y-2">
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-full w-8 h-8 p-0 bg-primary hover:bg-primary/90"
            asChild
          >
            <Link to={`/watch/${content.id}`}>
              <Play className="w-4 h-4 fill-current" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-8 h-8 p-0 border-muted-foreground/50"
            onClick={toggleMyList}
          >
            {isInList ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`rounded-full w-8 h-8 p-0 border-muted-foreground/50 ${
              isLiked ? "text-primary" : ""
            }`}
            onClick={toggleLike}
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-8 h-8 p-0 border-muted-foreground/50 ml-auto"
            onClick={() => onMoreInfo(content.id)}
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {content.rating && (
            <span className="px-1.5 py-0.5 border border-muted-foreground/50 rounded">
              {content.rating}
            </span>
          )}
          {content.year && <span>{content.year}</span>}
          {content.duration && <span>{content.duration}</span>}
        </div>

        {/* Genre */}
        {content.genre && (
          <p className="text-xs text-muted-foreground truncate">{content.genre}</p>
        )}
      </div>
    </div>
  );
};

export default HoverPreviewCard;
