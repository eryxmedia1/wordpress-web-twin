import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Play, Plus, Check, ThumbsUp, ChevronDown, Download, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import MobileBottomNav from "./MobileBottomNav";
import ReactPlayer from "react-player";

interface MobileContentDetailModalProps {
  contentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ContentDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  genre: string | null;
  release_year: number | null;
  duration: string | null;
  rating: string | null;
  maturity_rating: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  logo_url: string | null;
  trailer_url: string | null;
  video_url: string | null;
  cast_members: string[] | null;
  creator: string | null;
  is_zoe_original: boolean | null;
  download_enabled: boolean | null;
}

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  description: string | null;
  duration: string | null;
  thumbnail_url: string | null;
}

interface Season {
  id: string;
  season_number: number;
  title: string | null;
  episodes: Episode[];
}

const MobileContentDetailModal = ({ contentId, isOpen, onClose }: MobileContentDetailModalProps) => {
  const { currentProfile } = useProfile();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isInList, setIsInList] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (!contentId || !isOpen) return;

    const fetchContent = async () => {
      setIsLoading(true);

      // Fetch content details
      const { data: contentData } = await supabase
        .from("contents")
        .select("*")
        .eq("id", contentId)
        .single();

      if (contentData) {
        setContent(contentData as ContentDetail);

        // Fetch seasons and episodes for TV shows
        if (contentData.type === "show") {
          const { data: seasonsData } = await supabase
            .from("seasons")
            .select(`
              id,
              season_number,
              title,
              episodes (
                id,
                title,
                episode_number,
                description,
                duration,
                thumbnail_url
              )
            `)
            .eq("content_id", contentId)
            .order("season_number", { ascending: true });

          if (seasonsData) {
            setSeasons(seasonsData as Season[]);
          }
        }
      }

      // Check if in favorites
      if (currentProfile?.id) {
        const { data: favData } = await supabase
          .from("favorites")
          .select("id")
          .eq("profile_id", currentProfile.id)
          .eq("content_id", contentId)
          .maybeSingle();

        setIsInList(!!favData);

        const { data: likeData } = await supabase
          .from("likes")
          .select("id")
          .eq("profile_id", currentProfile.id)
          .eq("content_id", contentId)
          .maybeSingle();

        setIsLiked(!!likeData);
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [contentId, isOpen, currentProfile?.id]);

  const toggleMyList = async () => {
    if (!currentProfile?.id || !contentId) return;

    if (isInList) {
      await supabase.from("favorites").delete().eq("profile_id", currentProfile.id).eq("content_id", contentId);
      setIsInList(false);
    } else {
      await supabase.from("favorites").insert({ profile_id: currentProfile.id, content_id: contentId });
      setIsInList(true);
    }
  };

  const toggleLike = async () => {
    if (!currentProfile?.id || !contentId) return;

    if (isLiked) {
      await supabase.from("likes").delete().eq("profile_id", currentProfile.id).eq("content_id", contentId);
      setIsLiked(false);
    } else {
      await supabase.from("likes").insert({ profile_id: currentProfile.id, content_id: contentId, rating: 1 });
      setIsLiked(true);
    }
  };

  const currentSeasonEpisodes = seasons.find((s) => s.season_number === selectedSeason)?.episodes || [];

  if (!isOpen) return null;

  const previewUrl = content?.trailer_url || content?.video_url;

  return (
    <div className="fixed inset-0 z-50 bg-background md:hidden overflow-y-auto pb-20">
      {/* Header Video/Image */}
      <div className="relative w-full aspect-video">
        {previewUrl && !videoError ? (
          <ReactPlayer
            url={previewUrl}
            playing
            muted={isMuted}
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
                  responsive: true,
                  quality: 'auto'
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
            src={content?.backdrop_url || content?.poster_url || "/placeholder.svg"}
            alt={content?.title || ""}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-background/80 text-foreground z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mute/Unmute Button */}
        {previewUrl && !videoError && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/80 text-foreground z-10"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}

        {/* Play Button Overlay */}
        <Link
          to={`/watch/${content?.id}`}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="w-16 h-16 rounded-full bg-foreground/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-background fill-current ml-1" />
          </div>
        </Link>
      </div>

      {/* Content Info */}
      <div className="px-4 -mt-8 relative z-10">
        {/* Title */}
        {content?.logo_url ? (
          <img src={content.logo_url} alt={content.title} className="h-12 w-auto mb-3 object-contain" />
        ) : (
          <h1 className="text-2xl font-bold text-foreground mb-2">{content?.title}</h1>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
          {content?.release_year && <span className="text-primary font-semibold">{content.release_year}</span>}
          {content?.maturity_rating && (
            <span className="px-1.5 py-0.5 border border-muted-foreground/50 rounded text-xs">{content.maturity_rating}</span>
          )}
          {content?.duration && <span>{content.duration}</span>}
          {content?.type === "show" && seasons.length > 0 && <span>{seasons.length} Season{seasons.length > 1 ? "s" : ""}</span>}
          {content?.is_zoe_original && (
            <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs font-semibold">ZOE ORIGINAL</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Button asChild className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-base font-semibold">
            <Link to={`/watch/${content?.id}`}>
              <Play className="w-5 h-5 mr-2 fill-current" />
              Play
            </Link>
          </Button>

          {content?.download_enabled && (
            <Button variant="outline" className="w-full h-12 border-foreground/30 text-base">
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>
          )}

          <div className="flex gap-4 justify-center pt-2">
            <button onClick={toggleMyList} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors",
                  isInList ? "border-primary bg-primary/20" : "border-muted-foreground/50"
                )}
              >
                {isInList ? <Check className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5" />}
              </div>
              <span className="text-xs text-muted-foreground">My List</span>
            </button>

            <button onClick={toggleLike} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors",
                  isLiked ? "border-primary bg-primary/20" : "border-muted-foreground/50"
                )}
              >
                <ThumbsUp className={cn("w-5 h-5", isLiked && "text-primary fill-current")} />
              </div>
              <span className="text-xs text-muted-foreground">Rate</span>
            </button>
          </div>
        </div>

        {/* Description */}
        {content?.description && <p className="text-foreground text-sm leading-relaxed mb-4">{content.description}</p>}

        {/* Cast & Genre */}
        <div className="space-y-1 text-sm mb-6">
          {content?.cast_members && content.cast_members.length > 0 && (
            <p className="text-muted-foreground">
              <span className="text-foreground/60">Cast:</span> {content.cast_members.slice(0, 3).join(", ")}
            </p>
          )}
          {content?.creator && (
            <p className="text-muted-foreground">
              <span className="text-foreground/60">Creator:</span> {content.creator}
            </p>
          )}
          {content?.genre && (
            <p className="text-muted-foreground">
              <span className="text-foreground/60">Genres:</span> {content.genre}
            </p>
          )}
        </div>

        {/* Episodes Section (for TV shows) */}
        {content?.type === "show" && seasons.length > 0 && (
          <div className="mb-8">
            {/* Season Picker */}
            <button
              onClick={() => setShowSeasonPicker(!showSeasonPicker)}
              className="flex items-center gap-2 text-foreground font-semibold mb-4 py-2 px-3 bg-card rounded-lg"
            >
              Season {selectedSeason}
              <ChevronDown className={cn("w-4 h-4 transition-transform", showSeasonPicker && "rotate-180")} />
            </button>

            {showSeasonPicker && (
              <div className="bg-card rounded-lg mb-4 overflow-hidden">
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      setSelectedSeason(season.season_number);
                      setShowSeasonPicker(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm transition-colors",
                      selectedSeason === season.season_number ? "bg-primary/20 text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    Season {season.season_number} {season.title && `- ${season.title}`}
                  </button>
                ))}
              </div>
            )}

            {/* Episodes List */}
            <div className="space-y-3">
              {currentSeasonEpisodes.map((episode) => (
                <Link
                  key={episode.id}
                  to={`/watch/${content.id}?episode=${episode.id}`}
                  className="flex gap-3 bg-card rounded-lg overflow-hidden"
                >
                  <div className="relative w-32 aspect-video flex-shrink-0">
                    <img
                      src={episode.thumbnail_url || content.poster_url || "/placeholder.svg"}
                      alt={episode.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="w-6 h-6 text-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 py-2 pr-3">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {episode.episode_number}. {episode.title}
                    </p>
                    {episode.duration && <p className="text-xs text-muted-foreground">{episode.duration}</p>}
                    {episode.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{episode.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* More Like This placeholder */}
        <div className="pb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">More Like This</h3>
          <p className="text-muted-foreground text-sm">Similar content will appear here</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MobileContentDetailModal;
