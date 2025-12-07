import { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ReactPlayer from "react-player";

interface FeaturedContent {
  id: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  video_url?: string | null;
  trailer_url?: string | null;
  backdrop_url?: string | null;
  logo_url?: string | null;
  maturity_rating?: string | null;
  release_year?: number | null;
  duration?: string | null;
  rating?: string | null;
}

interface FeaturedCarouselProps {
  contents: FeaturedContent[];
  onMoreInfo: (id: string) => void;
}

const FeaturedCarousel = ({ contents, onMoreInfo }: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const currentContent = contents[currentIndex];
  const videoUrl = currentContent?.trailer_url || currentContent?.video_url;
  const hasMultiple = contents.length > 1;

  // Reset video state when content changes
  useEffect(() => {
    setVideoError(false);
    setIsVideoReady(false);
  }, [currentIndex]);

  // Auto-advance every 15 seconds if multiple items
  useEffect(() => {
    if (!hasMultiple) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contents.length);
    }, 15000);

    return () => clearInterval(timer);
  }, [contents.length, hasMultiple]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + contents.length) % contents.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % contents.length);
  };

  if (!currentContent) return null;

  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Video Background */}
      {videoUrl && !videoError ? (
        <>
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}>
            <ReactPlayer
              url={videoUrl}
              playing
              muted={isMuted}
              loop
              playsinline
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
              config={{
                vimeo: {
                  playerOptions: {
                    background: true,
                    quality: '1080p',
                  }
                }
              }}
              onReady={() => setIsVideoReady(true)}
              onError={() => setVideoError(true)}
            />
          </div>
          {/* Fallback image while video loads */}
          {!isVideoReady && currentContent.backdrop_url && (
            <img
              src={currentContent.backdrop_url}
              alt={currentContent.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </>
      ) : currentContent.backdrop_url ? (
        <img
          src={currentContent.backdrop_url}
          alt={currentContent.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-background to-background" />
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />

      {/* Navigation Arrows - only show if multiple items */}
      {hasMultiple && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 bg-background/50 hover:bg-background/80 text-foreground rounded-full backdrop-blur-sm"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 bg-background/50 hover:bg-background/80 text-foreground rounded-full backdrop-blur-sm"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Sound Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-32 right-8 z-20 h-10 w-10 bg-background/50 hover:bg-background/80 text-foreground rounded-full backdrop-blur-sm border border-muted-foreground/30"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>

      {/* Pagination Dots */}
      {hasMultiple && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {contents.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-muted-foreground/50 hover:bg-muted-foreground'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 space-y-4 animate-slide-up">
        {/* "New on Zoe RatedTV" label */}
        <div className="flex items-center gap-2 text-secondary text-sm font-medium">
          <span className="uppercase tracking-wider">Featured on Zoe RatedTV</span>
          {currentContent.release_year && <span>• {currentContent.release_year}</span>}
        </div>

        {/* Title Logo or Text */}
        {currentContent.logo_url ? (
          <img
            src={currentContent.logo_url}
            alt={currentContent.title}
            className="max-w-[280px] md:max-w-[400px] lg:max-w-[500px] h-auto mb-4"
          />
        ) : (
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground max-w-3xl drop-shadow-lg">
            {currentContent.title}
          </h1>
        )}

        {/* Metadata Pills */}
        <div className="flex items-center gap-3 text-sm">
          {currentContent.maturity_rating && (
            <span className="px-2 py-1 bg-secondary/20 border border-secondary/50 text-secondary rounded text-xs font-medium">
              {currentContent.maturity_rating}
            </span>
          )}
          {currentContent.release_year && (
            <span className="text-muted-foreground">{currentContent.release_year}</span>
          )}
          {currentContent.duration && (
            <span className="text-muted-foreground">{currentContent.duration}</span>
          )}
          {currentContent.genre && (
            <span className="text-secondary">{currentContent.genre}</span>
          )}
        </div>

        {/* Description */}
        {currentContent.description && (
          <p className="text-sm md:text-base text-muted-foreground max-w-xl line-clamp-3 leading-relaxed">
            {currentContent.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            asChild 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-6 font-semibold shadow-lg"
          >
            <Link to={`/watch/${currentContent.id}`}>
              <Play className="w-5 h-5 fill-current" />
              Watch Now
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 px-6 border-muted-foreground/50 hover:bg-muted/50 backdrop-blur-sm"
            onClick={() => onMoreInfo(currentContent.id)}
          >
            <Info className="w-5 h-5" />
            Details
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;
