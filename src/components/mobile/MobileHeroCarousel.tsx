import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Plus, X, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import ReactPlayer from "react-player";

const PREVIEW_DURATION = 60; // 60 seconds max for non-trailer videos

interface Content {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  logo_url: string | null;
  video_url: string | null;
  trailer_url?: string | null;
  genre: string | null;
  maturity_rating: string | null;
}

interface MobileHeroCarouselProps {
  contents: Content[];
  onMoreInfo: (id: string) => void;
}

const MobileHeroCarousel = ({ contents, onMoreInfo }: MobileHeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState<{ [key: string]: boolean }>({});
  const [videoError, setVideoError] = useState<{ [key: string]: boolean }>({});
  const [isPlaying, setIsPlaying] = useState(true);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(PREVIEW_DURATION);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const playerRefs = useRef<{ [key: string]: ReactPlayer | null }>({});
  const navigate = useNavigate();
  const { currentProfile } = useProfile();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    loop: true,
    dragFree: false,
  });

  // Fetch initial favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentProfile?.id) return;

      const { data, error } = await supabase
        .from("favorites")
        .select("content_id")
        .eq("profile_id", currentProfile.id);

      if (!error && data) {
        setFavorites(new Set(data.map((f) => f.content_id)));
      }
    };

    fetchFavorites();
  }, [currentProfile?.id]);

  // Real-time subscription for favorites
  useEffect(() => {
    if (!currentProfile?.id) return;

    const channel = supabase
      .channel("mobile-hero-favorites")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
          filter: `profile_id=eq.${currentProfile.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newFavorite = payload.new as { content_id: string };
            setFavorites((prev) => new Set([...prev, newFavorite.content_id]));
          } else if (payload.eventType === "DELETE") {
            const deletedFavorite = payload.old as { content_id: string };
            setFavorites((prev) => {
              const updated = new Set(prev);
              updated.delete(deletedFavorite.content_id);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfile?.id]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      // Reset preview state when changing slides
      setPreviewEnded(false);
      setIsPlaying(true);
      setTimeRemaining(PREVIEW_DURATION);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  }, [emblaApi, currentIndex]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // 60-second countdown for non-trailer videos
  const currentContent = contents[currentIndex];
  const hasTrailer = !!currentContent?.trailer_url;
  const currentVideoUrl = currentContent?.trailer_url || currentContent?.video_url;
  const isCurrentVideoReady = videoReady[currentContent?.id];

  useEffect(() => {
    if (!isCurrentVideoReady || !isPlaying || previewEnded) return;
    
    // Only apply 60-second limit if using full video (no trailer)
    if (!hasTrailer && currentVideoUrl) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setPreviewEnded(true);
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isCurrentVideoReady, isPlaying, hasTrailer, currentVideoUrl, previewEnded, currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const handleReplay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTimeRemaining(PREVIEW_DURATION);
    setPreviewEnded(false);
    setIsPlaying(true);
    const player = playerRefs.current[currentContent?.id];
    if (player) {
      player.seekTo(0);
    }
  };

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const toggleMyList = async (e: React.MouseEvent, contentId: string, contentTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentProfile?.id) {
      toast.error("Please select a profile first");
      return;
    }

    setIsLoading((prev) => ({ ...prev, [contentId]: true }));

    const isInList = favorites.has(contentId);

    try {
      if (isInList) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("profile_id", currentProfile.id)
          .eq("content_id", contentId);

        if (error) throw error;

        setFavorites((prev) => {
          const updated = new Set(prev);
          updated.delete(contentId);
          return updated;
        });
        toast.success(`Removed "${contentTitle}" from My List`);
      } else {
        const { error } = await supabase.from("favorites").insert({
          profile_id: currentProfile.id,
          content_id: contentId,
        });

        if (error) throw error;

        setFavorites((prev) => new Set([...prev, contentId]));
        toast.success(`Added "${contentTitle}" to My List`);
      }
    } catch (error) {
      console.error("Error toggling My List:", error);
      toast.error("Failed to update My List");
    } finally {
      setIsLoading((prev) => ({ ...prev, [contentId]: false }));
    }
  };

  const handleVideoReady = (contentId: string) => {
    setVideoReady((prev) => ({ ...prev, [contentId]: true }));
  };

  const handleVideoError = (contentId: string) => {
    setVideoError((prev) => ({ ...prev, [contentId]: true }));
  };

  const getVideoUrl = (content: Content) => {
    return content.trailer_url || content.video_url;
  };

  if (contents.length === 0) return null;

  return (
    <div className="relative pt-14 pb-4">
      {/* Embla Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {contents.map((content, index) => {
            const isInList = favorites.has(content.id);
            const loading = isLoading[content.id];
            const isActive = index === currentIndex;
            const videoUrl = getVideoUrl(content);
            const isVideoReady = videoReady[content.id];
            const hasVideoError = videoError[content.id];
            const showVideo = isActive && videoUrl && !hasVideoError;

            return (
              <div
                key={content.id}
                className="flex-[0_0_85%] min-w-0 pl-3 first:pl-4 last:pr-4"
              >
                <div
                  className={cn(
                    "relative aspect-[16/10] rounded-2xl overflow-hidden bg-card transition-transform duration-300",
                    isActive ? "scale-100" : "scale-95 opacity-80"
                  )}
                  onClick={() => onMoreInfo(content.id)}
                >
                  {/* Loading Skeleton */}
                  {showVideo && !isVideoReady && (
                    <div className="absolute inset-0 z-10">
                      <Skeleton className="w-full h-full rounded-none" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                  )}

                  {/* Video Player */}
                  {showVideo && (
                    <div className={cn(
                      "absolute inset-0 z-5 transition-opacity duration-500",
                      isVideoReady ? "opacity-100" : "opacity-0"
                    )}>
                      <ReactPlayer
                        ref={(ref) => { playerRefs.current[content.id] = ref; }}
                        url={videoUrl}
                        playing={isActive && isPlaying && !previewEnded}
                        muted={isMuted}
                        loop={!!content.trailer_url}
                        playsinline
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                        onReady={() => handleVideoReady(content.id)}
                        onError={() => handleVideoError(content.id)}
                        config={{
                          vimeo: {
                            playerOptions: {
                              background: true,
                              responsive: true,
                              quality: 'auto',
                            },
                          },
                          file: {
                            attributes: {
                              playsInline: true,
                            },
                          },
                        }}
                      />
                    </div>
                  )}

                  {/* Fallback Background Image */}
                  <img
                    src={content.backdrop_url || content.poster_url || "/placeholder.svg"}
                    alt={content.title}
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                      showVideo && isVideoReady ? "opacity-0" : "opacity-100"
                    )}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                  {/* Preview Timer - shows countdown for non-trailer videos */}
                  {isActive && showVideo && isVideoReady && !content.trailer_url && isPlaying && !previewEnded && (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                      <div className="bg-background/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1.5">
                        <div className="w-10 h-1 bg-foreground/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeRemaining / PREVIEW_DURATION) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-foreground/80 font-medium min-w-[20px]">
                          {timeRemaining}s
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Replay Button - appears after preview ends */}
                  {isActive && previewEnded && !content.trailer_url && (
                    <button
                      type="button"
                      onClick={handleReplay}
                      className="absolute top-3 left-3 z-20 p-2 rounded-full bg-background/50 hover:bg-background/70 backdrop-blur-sm border border-foreground/30 touch-manipulation"
                      title="Replay preview"
                    >
                      <RotateCcw className="w-4 h-4 text-foreground" />
                    </button>
                  )}

                  {/* Mute/Unmute Button */}
                  {showVideo && isVideoReady && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="absolute top-3 right-3 z-20 p-2 rounded-full bg-background/30 backdrop-blur-sm border border-foreground/20 transition-all hover:bg-background/50 touch-manipulation"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-foreground" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-foreground" />
                      )}
                    </button>
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    {/* Logo or Title */}
                    {content.logo_url ? (
                      <img
                        src={content.logo_url}
                        alt={content.title}
                        className="h-8 w-auto mb-2 object-contain"
                      />
                    ) : (
                      <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">
                        {content.title}
                      </h3>
                    )}

                    {/* Tagline / Genre */}
                    <p className="text-xs text-primary font-medium mb-3 uppercase tracking-wide">
                      {content.genre || "NEW EPISODE NOW STREAMING"}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/watch/${content.id}`);
                        }}
                        className="flex-1 bg-foreground text-background hover:bg-foreground/90 h-9 text-sm font-semibold touch-manipulation"
                      >
                        <Play className="w-4 h-4 mr-1 fill-current" />
                        WATCH NOW
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => toggleMyList(e, content.id, content.title)}
                        variant="outline"
                        disabled={loading}
                        className={cn(
                          "h-9 px-4 border-foreground/30 transition-all touch-manipulation",
                          isInList
                            ? "bg-primary/20 border-primary text-primary hover:bg-destructive/20 hover:border-destructive hover:text-destructive"
                            : "bg-foreground/10 hover:bg-foreground/20"
                        )}
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isInList ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span className="ml-1 text-xs">
                          {isInList ? "REMOVE" : "MY LIST"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {contents.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-primary w-4"
                : "bg-foreground/30 w-1.5 hover:bg-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileHeroCarousel;
