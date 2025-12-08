import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tv, Trash, Play } from "lucide-react";
import { DbContent } from "@/integrations/supabase/client";
import ReactPlayer from "react-player";

type TvShowCardProps = {
  show: DbContent & { seasonCount: number };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const TvShowCard = ({ show, onEdit, onDelete }: TvShowCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Delay video playback slightly to avoid unnecessary loading
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  const thumbnailUrl = show.poster_url || show.backdrop_url;
  const videoUrl = show.trailer_url || show.video_url;

  return (
    <Card 
      className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail / Video Preview Section */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {isHovered && videoUrl ? (
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            playing={true}
            muted={true}
            loop={true}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        ) : thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={show.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Tv className="w-12 h-12 text-gray-600" />
          </div>
        )}
        
        {/* Play icon overlay when has video but not hovering */}
        {!isHovered && videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
            <Play className="w-10 h-10 text-white" fill="white" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium truncate">{show.title}</h3>
            <div className="flex items-center mt-1 text-gray-400 text-sm">
              <Tv className="w-4 h-4 mr-1 flex-shrink-0" /> 
              TV Show • {show.seasonCount} Season{show.seasonCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white h-8 px-2"
              onClick={() => onEdit(show.id)}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-red-500 hover:text-red-400 h-8 px-2"
              onClick={() => onDelete(show.id)}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TvShowCard;
