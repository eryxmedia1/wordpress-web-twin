import { useState } from "react";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
  };
  onMoreInfo: () => void;
}

const HeroAutoplay = ({ content, onMoreInfo }: HeroAutoplayProps) => {
  const [videoError, setVideoError] = useState(false);
  const videoUrl = content.trailer_url || content.video_url;

  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Video Background */}
      {videoUrl && !videoError ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setVideoError(true)}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : content.backdrop_url ? (
        <img
          src={content.backdrop_url}
          alt={content.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 space-y-4">
        {/* Title Logo or Text */}
        {content.logo_url ? (
          <img
            src={content.logo_url}
            alt={content.title}
            className="max-w-[300px] md:max-w-[400px] h-auto mb-4"
          />
        ) : (
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-2xl">
            {content.title}
          </h1>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {content.release_year && <span>{content.release_year}</span>}
          {content.maturity_rating && (
            <span className="px-2 py-0.5 border border-muted-foreground/50 rounded text-xs">
              {content.maturity_rating}
            </span>
          )}
          {content.genre && <span>{content.genre}</span>}
        </div>

        {/* Description */}
        {content.description && (
          <p className="text-sm md:text-base text-muted-foreground max-w-xl line-clamp-3">
            {content.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Link to={`/watch/${content.id}`}>
              <Play className="w-5 h-5 fill-current" />
              Play
            </Link>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2"
            onClick={onMoreInfo}
          >
            <Info className="w-5 h-5" />
            More Info
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroAutoplay;
