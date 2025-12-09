import { useState, useEffect, useRef } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Volume2, VolumeX, RotateCcw } from "lucide-react";
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

const PREVIEW_DURATION = 60; // 60 seconds max for non-trailer videos

const FeaturedCarousel = ({ contents, onMoreInfo }: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(PREVIEW_DURATION);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<ReactPlayer>(null);

  const currentContent = contents[currentIndex];
  const hasTrailer = !!currentContent?.trailer_url;
  const videoUrl = currentContent?.trailer_url || currentContent?.video_url;
  const hasMultiple = contents.length > 1;
  const showPreviewTimer = !hasTrailer && videoUrl && isPlaying && isVideoReady && !previewEnded;

  // Reset video state when content changes
  useEffect(() => {
    setVideoError(false);
    setIsVideoReady(false);
    setIsPlaying(true);
    setPreviewEnded(false);
    setTimeRemaining(PREVIEW_DURATION);
    
    // Clear any existing timers
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [currentIndex]);

  // 60-second limit for full videos (no trailer) with countdown
  useEffect(() => {
    if (!isVideoReady || !isPlaying || previewEnded) return;
    
    // Only apply 60-second limit if using full video (no trailer)
    if (!hasTrailer && videoUrl) {
      // Start countdown timer
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
  }, [isVideoReady, isPlaying, hasTrailer, videoUrl, previewEnded]);

  // Auto-advance every 60 seconds if multiple items (matches PREVIEW_DURATION)
  useEffect(() => {
    if (!hasMultiple) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contents.length);
    }, PREVIEW_DURATION * 1000); // 60 seconds

    return () => clearInterval(timer);
  }, [contents.length, hasMultiple]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const handleReplay = () => {
    setTimeRemaining(PREVIEW_DURATION);
    setPreviewEnded(false);
    setIsPlaying(true);
    // Seek to beginning if possible
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + contents.length) % contents.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % contents.length);
  };

  if (!currentContent) return null;

  return (
    <section className="relative w-[100vw] h-[85vh] md:h-[90vh] overflow-hidden" style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)', maxWidth: 'none' }}>
      {/* Video Background - Full bleed cover */}
      {videoUrl && !videoError ? (
        <>
        <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                playing={isPlaying}
                muted={isMuted}
                loop={hasTrailer}
                playsinline
                width="177.78vh"
                height="100vh"
                style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  minWidth: '100vw',
                  minHeight: '56.25vw',
                }}
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

      {/* Gradient Overlays - Subtle for text readability only */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-transparent" />

      {/* Navigation Arrows - only show if multiple items */}
      {hasMultiple && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 bg-background/30 hover:bg-background/60 text-foreground rounded-full backdrop-blur-sm"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 bg-background/30 hover:bg-background/60 text-foreground rounded-full backdrop-blur-sm"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Preview Timer - shows countdown for non-trailer videos */}
      {showPreviewTimer && (
        <div className="absolute bottom-32 right-24 z-20 flex items-center gap-2">
          <div className="bg-background/50 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
            <div className="w-16 h-1 bg-foreground/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${(timeRemaining / PREVIEW_DURATION) * 100}%` }}
              />
            </div>
            <span className="text-xs text-foreground/80 font-medium min-w-[24px]">
              {timeRemaining}s
            </span>
          </div>
        </div>
      )}

      {/* Replay Button - appears after preview ends */}
      {previewEnded && !hasTrailer && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-32 right-24 z-20 h-10 w-10 bg-background/50 hover:bg-background/70 text-foreground rounded-full backdrop-blur-sm border border-foreground/30"
          onClick={handleReplay}
          title="Replay preview"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      )}

      {/* Sound Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-32 right-8 z-20 h-10 w-10 bg-background/30 hover:bg-background/60 text-foreground rounded-full backdrop-blur-sm border border-foreground/30"
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
                  : 'w-2 bg-foreground/50 hover:bg-foreground/70'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Content - offset from left to account for sidebar */}
      <div className="absolute bottom-0 left-0 right-0 pl-20 md:pl-24 lg:pl-28 pr-6 md:pr-12 pb-6 md:pb-12 lg:pb-16 pt-6 space-y-4 animate-slide-up">
        {/* "Featured on Zoe RatedTV" label */}
        <div className="flex items-center gap-2 text-secondary text-sm font-medium">
          <span className="uppercase tracking-wider drop-shadow-md">Featured on Zoe RatedTV</span>
          {currentContent.release_year && <span className="drop-shadow-md">• {currentContent.release_year}</span>}
        </div>

        {/* Title Logo or Text */}
        {currentContent.logo_url ? (
          <img
            src={currentContent.logo_url}
            alt={currentContent.title}
            className="max-w-[280px] md:max-w-[400px] lg:max-w-[500px] h-auto mb-4 drop-shadow-lg"
          />
        ) : (
          <h1 
            className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground max-w-3xl"
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.5)' }}
          >
            {currentContent.title}
          </h1>
        )}

        {/* Metadata Pills */}
        <div className="flex items-center gap-3 text-sm">
          {currentContent.maturity_rating && (
            <span className="px-2 py-1 bg-secondary/30 border border-secondary/60 text-secondary rounded text-xs font-medium backdrop-blur-sm">
              {currentContent.maturity_rating}
            </span>
          )}
          {currentContent.release_year && (
            <span className="text-foreground/80 drop-shadow-md">{currentContent.release_year}</span>
          )}
          {currentContent.duration && (
            <span className="text-foreground/80 drop-shadow-md">{currentContent.duration}</span>
          )}
          {currentContent.genre && (
            <span className="text-secondary drop-shadow-md">{currentContent.genre}</span>
          )}
        </div>

        {/* Description */}
        {currentContent.description && (
          <p 
            className="text-sm md:text-base text-foreground/90 max-w-xl line-clamp-3 leading-relaxed"
            style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.6)' }}
          >
            {currentContent.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            asChild 
            size="lg" 
            className="bg-foreground hover:bg-foreground/90 text-background gap-2 px-6 font-semibold shadow-lg"
          >
            <Link to={`/watch/${currentContent.id}`}>
              <Play className="w-5 h-5 fill-current" />
              Watch Now
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 px-6 border-foreground/50 bg-background/30 hover:bg-background/50 backdrop-blur-sm text-foreground"
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
