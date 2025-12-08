import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";

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
  const [inMyList, setInMyList] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    loop: true,
    dragFree: false,
  });

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

  const toggleMyList = (id: string) => {
    setInMyList((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (contents.length === 0) return null;

  return (
    <div className="relative pt-14 pb-4">
      {/* Embla Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {contents.map((content, index) => (
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
                        toggleMyList(content.id);
                      }}
                      variant="outline"
                      className="h-9 px-4 border-foreground/30 bg-foreground/10 hover:bg-foreground/20"
                    >
                      {inMyList[content.id] ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span className="ml-1 text-xs">MY LIST</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
