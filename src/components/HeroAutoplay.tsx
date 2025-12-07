import { useState } from "react";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ReactPlayer from "react-player";

interface HeroAutoplayProps {
  content: {
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
  };
  onMoreInfo: () => void;
}

const HeroAutoplay = ({ content, onMoreInfo }: HeroAutoplayProps) => {
  const [videoError, setVideoError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoUrl = content.trailer_url || content.video_url;

  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Video Background */}
      {videoUrl && !videoError ? (
        <>
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}>
            <ReactPlayer
              url={videoUrl}
              playing
              muted
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
          {!isVideoReady && content.backdrop_url && (
            <img
              src={content.backdrop_url}
              alt={content.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </>
      ) : content.backdrop_url ? (
        <img
          src={content.backdrop_url}
          alt={content.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-background to-background" />
      )}

      {/* Gradient Overlays - Dark navy/purple theme */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 space-y-4 animate-slide-up">
        {/* "New on Zoe RatedTV" label */}
        <div className="flex items-center gap-2 text-secondary text-sm font-medium">
          <span className="uppercase tracking-wider">New on Zoe RatedTV</span>
          {content.release_year && <span>• {content.release_year}</span>}
        </div>

        {/* Title Logo or Text */}
        {content.logo_url ? (
          <img
            src={content.logo_url}
            alt={content.title}
            className="max-w-[280px] md:max-w-[400px] lg:max-w-[500px] h-auto mb-4"
          />
        ) : (
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground max-w-3xl drop-shadow-lg">
            {content.title}
          </h1>
        )}

        {/* Metadata Pills */}
        <div className="flex items-center gap-3 text-sm">
          {content.maturity_rating && (
            <span className="px-2 py-1 bg-secondary/20 border border-secondary/50 text-secondary rounded text-xs font-medium">
              {content.maturity_rating}
            </span>
          )}
          {content.release_year && (
            <span className="text-muted-foreground">{content.release_year}</span>
          )}
          {content.duration && (
            <span className="text-muted-foreground">{content.duration}</span>
          )}
          {content.genre && (
            <span className="text-secondary">{content.genre}</span>
          )}
        </div>

        {/* Description */}
        {content.description && (
          <p className="text-sm md:text-base text-muted-foreground max-w-xl line-clamp-3 leading-relaxed">
            {content.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            asChild 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-6 font-semibold shadow-lg"
          >
            <Link to={`/watch/${content.id}`}>
              <Play className="w-5 h-5 fill-current" />
              Watch Now
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 px-6 border-muted-foreground/50 hover:bg-muted/50 backdrop-blur-sm"
            onClick={onMoreInfo}
          >
            <Info className="w-5 h-5" />
            Details
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroAutoplay;