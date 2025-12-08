import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";

interface WatchedContent {
  id: string;
  title: string;
  genre: string | null;
}

interface RecommendedContent {
  id: string;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  genre: string | null;
}

interface BecauseYouWatchedRowProps {
  onMoreInfo: (contentId: string) => void;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const BecauseYouWatchedRow = ({ onMoreInfo }: BecauseYouWatchedRowProps) => {
  const { currentProfile } = useProfile();
  const [watchedTitle, setWatchedTitle] = useState<WatchedContent | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchRecommendations = async () => {
      // Get recent watch history with high progress
      const { data: historyData } = await supabase
        .from("watch_history")
        .select(`
          content_id,
          progress_percent,
          content:contents(id, title, genre)
        `)
        .eq("profile_id", currentProfile.id)
        .gte("progress_percent", 50)
        .order("last_watched_at", { ascending: false })
        .limit(1);

      if (!historyData || historyData.length === 0) {
        setIsLoading(false);
        return;
      }

      const watchedItem = historyData[0].content as unknown as WatchedContent;
      if (!watchedItem) {
        setIsLoading(false);
        return;
      }

      setWatchedTitle(watchedItem);

      // Get tags for the watched content
      const { data: watchedTags } = await supabase
        .from("content_tags")
        .select("tag_id")
        .eq("content_id", watchedItem.id);

      const tagIds = (watchedTags || []).map(t => t.tag_id);

      let similarContentIds = new Set<string>();

      // Find content with matching tags
      if (tagIds.length > 0) {
        const { data: contentWithTags } = await supabase
          .from("content_tags")
          .select("content_id")
          .in("tag_id", tagIds)
          .neq("content_id", watchedItem.id);

        if (contentWithTags) {
          contentWithTags.forEach(ct => similarContentIds.add(ct.content_id));
        }
      }

      // Build query for similar content
      let query = supabase
        .from("contents")
        .select("id, title, poster_url, release_year, genre")
        .neq("id", watchedItem.id)
        .limit(15);

      // Prioritize content with matching tags, then fall back to genre
      if (similarContentIds.size > 0) {
        query = query.in("id", Array.from(similarContentIds));
      } else if (watchedItem.genre) {
        query = query.ilike("genre", `%${watchedItem.genre.split(",")[0].trim()}%`);
      }

      const { data: similarData } = await query;

      if (similarData && similarData.length > 0) {
        setRecommendations(shuffleArray(similarData));
      } else if (watchedItem.genre) {
        // Fallback to genre-based if no tag matches
        const { data: genreData } = await supabase
          .from("contents")
          .select("id, title, poster_url, release_year, genre")
          .neq("id", watchedItem.id)
          .ilike("genre", `%${watchedItem.genre.split(",")[0].trim()}%`)
          .limit(15);

        if (genreData) {
          setRecommendations(shuffleArray(genreData));
        }
      }

      setIsLoading(false);
    };

    fetchRecommendations();
  }, [currentProfile?.id]);

  if (isLoading || !watchedTitle || recommendations.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">
        Because you watched <span className="text-primary">{watchedTitle.title}</span>
      </h2>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {recommendations.map((item) => (
            <div
              key={item.id}
              className="relative flex-shrink-0 w-36 md:w-44 group cursor-pointer"
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={item.poster_url || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link
                    to={`/watch/${item.id}`}
                    className="p-2 rounded-full bg-primary text-primary-foreground"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </Link>
                  <button
                    onClick={() => onMoreInfo(item.id)}
                    className="p-2 rounded-full bg-secondary text-secondary-foreground"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.release_year} • {item.genre}
              </p>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default BecauseYouWatchedRow;
