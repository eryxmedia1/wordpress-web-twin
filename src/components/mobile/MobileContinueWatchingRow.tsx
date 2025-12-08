import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Play } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface WatchHistoryItem {
  id: string;
  content_id: string;
  progress_percent: number;
  episode_id: string | null;
  last_watched_at: string | null;
  contents: {
    id: string;
    title: string;
    poster_url: string | null;
    backdrop_url: string | null;
    duration: string | null;
    type: string;
    logo_url: string | null;
  };
  episodes?: {
    id: string;
    title: string;
    episode_number: number;
    season_id: string;
    thumbnail_url: string | null;
    seasons?: {
      season_number: number;
    };
  } | null;
}

interface MobileContinueWatchingRowProps {
  onItemClick: (id: string) => void;
}

const MobileContinueWatchingRow = ({ onItemClick }: MobileContinueWatchingRowProps) => {
  const { currentProfile } = useProfile();
  const navigate = useNavigate();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWatchHistory = async () => {
      if (!currentProfile?.id) return;

      const { data, error } = await supabase
        .from("watch_history")
        .select(`
          id,
          content_id,
          progress_percent,
          episode_id,
          last_watched_at,
          contents (
            id,
            title,
            poster_url,
            backdrop_url,
            duration,
            type,
            logo_url
          ),
          episodes (
            id,
            title,
            episode_number,
            season_id,
            thumbnail_url,
            seasons:season_id (
              season_number
            )
          )
        `)
        .eq("profile_id", currentProfile.id)
        .gt("progress_percent", 0)
        .lt("progress_percent", 95)
        .order("last_watched_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setItems(data as unknown as WatchHistoryItem[]);
      }
      setIsLoading(false);
    };

    fetchWatchHistory();
  }, [currentProfile?.id]);

  const formatWatchedDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "MM/dd/yy");
    } catch {
      return "";
    }
  };

  if (isLoading || items.length === 0) return null;

  // Handle card click - navigate to watch page
  const handleCardClick = (contentId: string) => {
    navigate(`/watch/${contentId}`);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, contentId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(contentId);
    }
  };

  return (
    <div className="py-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground">Keep Watching</h2>
        <button 
          onClick={() => navigate('/search?filter=continue')}
          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
        >
          See All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll - Landscape Cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
        {items.map((item) => {
          const content = item.contents;
          if (!content) return null;

          const episode = item.episodes;
          const seasonNum = episode?.seasons?.season_number || 1;
          const episodeNum = episode?.episode_number;
          const isShow = content.type === "show" && episode;
          
          // Use episode thumbnail, backdrop, or poster
          const imageUrl = episode?.thumbnail_url || content.backdrop_url || content.poster_url || "/placeholder.svg";
          const watchedDate = formatWatchedDate(item.last_watched_at);

          return (
            <button
              key={item.id}
              onClick={() => handleCardClick(content.id)}
              onKeyDown={(e) => handleKeyDown(e, content.id)}
              className="flex-shrink-0 w-[280px] cursor-pointer group text-left touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-xl"
              aria-label={`Resume watching ${content.title}${isShow ? ` Season ${seasonNum} Episode ${episodeNum}` : ''}`}
            >
              {/* Landscape Card */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-card">
                <img
                  src={imageUrl}
                  alt={content.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Logo overlay if available */}
                {content.logo_url && (
                  <div className="absolute top-3 left-3">
                    <img
                      src={content.logo_url}
                      alt={content.title}
                      className="h-8 w-auto object-contain drop-shadow-lg"
                    />
                  </div>
                )}

                {/* Progress Bar at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/50">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.progress_percent}%` }}
                  />
                </div>

                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                  <div className="bg-primary rounded-full p-3">
                    <Play className="w-6 h-6 text-primary-foreground fill-current" />
                  </div>
                </div>
              </div>

              {/* Info below card */}
              <div className="mt-2 px-0.5">
                {/* Season/Episode + Date Row */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isShow && (
                    <span className="font-semibold text-foreground">
                      S{seasonNum} E{episodeNum}
                    </span>
                  )}
                  {watchedDate && (
                    <span className={isShow ? "" : "font-medium text-foreground"}>
                      {watchedDate}
                    </span>
                  )}
                </div>
                
                {/* Title */}
                <p className="text-base font-medium text-foreground line-clamp-1 mt-0.5">
                  {content.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileContinueWatchingRow;
