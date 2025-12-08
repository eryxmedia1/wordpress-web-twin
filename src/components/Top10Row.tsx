import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ContentLockBadge } from "@/components/ContentLockBadge";
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

interface Top10RowProps {
  title: string;
  items: Top10Item[];
  userPlan?: string;
}

const Top10Row = ({ title, items, userPlan = 'free' }: Top10RowProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (id: string) => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId(id);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredId(null);
  };

  const handleVideoError = (id: string) => {
    setVideoErrors(prev => new Set(prev).add(id));
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-4">
          {items.map((item) => {
            const isHovered = hoveredId === item.id;
            const videoUrl = item.trailerUrl || item.videoUrl;
            const hasVideoError = videoErrors.has(item.id);
            const showVideo = isHovered && videoUrl && !hasVideoError;

            return (
              <Link
                key={item.id}
                to={`/watch/${item.id}`}
                className="relative flex-shrink-0 group flex items-end"
                style={{ minWidth: '180px' }}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Large Rank Number - Behind the poster */}
                <div className="absolute left-0 bottom-0 z-0 select-none pointer-events-none">
                  <span 
                    className="text-[140px] md:text-[180px] font-black leading-none"
                    style={{
                      color: 'transparent',
                      WebkitTextStroke: '3px hsl(180 60% 45%)',
                      textShadow: '0 0 30px hsl(180 60% 45% / 0.4)',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {item.rank}
                  </span>
                </div>
                
                {/* Poster - In front of the number */}
                <div 
                  className={`relative ml-12 md:ml-16 rounded-lg overflow-hidden bg-card z-10 shadow-xl transition-all duration-300 ease-out ${
                    isHovered 
                      ? 'w-44 md:w-56 h-56 md:h-72 scale-110 shadow-2xl' 
                      : 'w-28 md:w-36 h-40 md:h-52'
                  }`}
                >
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
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                  
                  {/* Title on hover */}
                  {isHovered && (
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-semibold text-foreground line-clamp-2">{item.title}</p>
                    </div>
                  )}
                  
                  {/* Lock Badge for restricted content */}
                  {item.requiredPlans && item.requiredPlans.length > 0 && (
                    <ContentLockBadge 
                      requiredPlans={item.requiredPlans} 
                      userPlan={userPlan} 
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default Top10Row;
