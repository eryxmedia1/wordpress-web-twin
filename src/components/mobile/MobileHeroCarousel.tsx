import { useState, useEffect, useCallback } from "react";
import { Play, Plus, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";

interface Content {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  logo_url: string | null;
  video_url: string | null;
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
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const toggleMyList = async (contentId: string, contentTitle: string) => {
    if (!currentProfile?.id) {
      toast.error("Please select a profile first");
      return;
    }

    setIsLoading((prev) => ({ ...prev, [contentId]: true }));

    const isInList = favorites.has(contentId);

    try {
      if (isInList) {
        // Remove from favorites
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
        // Add to favorites
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

  if (contents.length === 0) return null;

  return (
    <div className="relative pt-14 pb-4">
      {/* Embla Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {contents.map((content, index) => {
            const isInList = favorites.has(content.id);
            const loading = isLoading[content.id];

            return (
              <div
                key={content.id}
                className="flex-[0_0_85%] min-w-0 pl-3 first:pl-4 last:pr-4"
              >
                <div
                  className={cn(
                    "relative aspect-[16/10] rounded-2xl overflow-hidden bg-card transition-transform duration-300",
                    index === currentIndex ? "scale-100" : "scale-95 opacity-80"
                  )}
                  onClick={() => onMoreInfo(content.id)}
                >
                  {/* Background Image */}
                  <img
                    src={content.backdrop_url || content.poster_url || "/placeholder.svg"}
                    alt={content.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/watch/${content.id}`);
                        }}
                        className="flex-1 bg-foreground text-background hover:bg-foreground/90 h-9 text-sm font-semibold"
                      >
                        <Play className="w-4 h-4 mr-1 fill-current" />
                        WATCH NOW
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMyList(content.id, content.title);
                        }}
                        variant="outline"
                        disabled={loading}
                        className={cn(
                          "h-9 px-4 border-foreground/30 transition-all",
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
