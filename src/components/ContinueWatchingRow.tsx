import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";

interface WatchHistoryItem {
  id: string;
  content_id: string;
  progress_percent: number;
  content: {
    id: string;
    title: string;
    poster_url: string | null;
    type: string;
  };
}

interface ContinueWatchingRowProps {
  onMoreInfo: (contentId: string) => void;
}

const ContinueWatchingRow = ({ onMoreInfo }: ContinueWatchingRowProps) => {
  const { currentProfile } = useProfile();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchWatchHistory = async () => {
      const { data, error } = await supabase
        .from("watch_history")
        .select(`
          id,
          content_id,
          progress_percent,
          content:contents(id, title, poster_url, type)
        `)
        .eq("profile_id", currentProfile.id)
        .gt("progress_percent", 0)
        .lt("progress_percent", 100)
        .order("last_watched_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setItems(data.filter(item => item.content) as unknown as WatchHistoryItem[]);
      }
      setIsLoading(false);
    };

    fetchWatchHistory();
  }, [currentProfile?.id]);

  if (isLoading || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">
        Continue Watching for {currentProfile?.name}
      </h2>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex-shrink-0 w-48 md:w-56 group cursor-pointer"
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={item.content.poster_url || "/placeholder.svg"}
                  alt={item.content.title}
                  className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.progress_percent}%` }}
                  />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link
                    to={`/watch/${item.content.id}`}
                    className="p-3 rounded-full bg-primary text-primary-foreground"
                  >
                    <Play className="w-6 h-6 fill-current" />
                  </Link>
                </div>
              </div>

              <p className="mt-2 text-sm text-foreground truncate">
                {item.content.title}
              </p>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default ContinueWatchingRow;
