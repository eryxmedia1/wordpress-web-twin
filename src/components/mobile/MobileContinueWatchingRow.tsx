import { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";

interface WatchHistoryItem {
  id: string;
  content_id: string;
  progress_percent: number;
  episode_id: string | null;
  contents: {
    id: string;
    title: string;
    poster_url: string | null;
    duration: string | null;
    type: string;
  };
  episodes?: {
    id: string;
    title: string;
    episode_number: number;
    season_id: string;
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
          contents (
            id,
            title,
            poster_url,
            duration,
            type
          ),
          episodes (
            id,
            title,
            episode_number,
            season_id,
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

  const handleRemove = async (e: React.MouseEvent, historyId: string) => {
    e.stopPropagation();
    await supabase.from("watch_history").delete().eq("id", historyId);
    setItems((prev) => prev.filter((item) => item.id !== historyId));
  };

  const getRemainingTime = (progress: number, duration: string | null) => {
    if (!duration) return null;
    const match = duration.match(/(\d+)/);
    if (!match) return null;
    const totalMinutes = parseInt(match[1]);
    const remaining = Math.round(totalMinutes * (1 - progress / 100));
    return `${remaining}m left`;
  };

  if (isLoading || items.length === 0) return null;

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-semibold text-foreground">
          Continue Watching for {currentProfile?.name}
        </h2>
        <button className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          See All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4">
        {items.map((item) => {
          const content = item.contents;
          if (!content) return null;

          const episode = item.episodes;
          const episodeLabel = episode
            ? `S${episode.seasons?.season_number || 1}E${episode.episode_number}`
            : null;

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(content.id)}
              className="flex-shrink-0 w-[140px] cursor-pointer group relative"
            >
              {/* Poster Card */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-card">
                <img
                  src={content.poster_url || "/placeholder.svg"}
                  alt={content.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Remove Button */}
                <button
                  onClick={(e) => handleRemove(e, item.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-foreground" />
                </button>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.progress_percent}%` }}
                  />
                </div>
              </div>

              {/* Title & Info */}
              <div className="mt-1.5">
                <p className="text-xs text-foreground line-clamp-1 leading-tight font-medium">
                  {content.title}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  {episodeLabel && <span>{episodeLabel}</span>}
                  {getRemainingTime(item.progress_percent, content.duration) && (
                    <span>
                      {episodeLabel && "• "}
                      {getRemainingTime(item.progress_percent, content.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileContinueWatchingRow;
