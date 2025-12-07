import { useEffect, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import ContentRow from "./ContentRow";

interface NextToWatchRowProps {
  onMoreInfo: (contentId: string) => void;
}

const NextToWatchRow = ({ onMoreInfo }: NextToWatchRowProps) => {
  const { currentProfile } = useProfile();
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchNextToWatch = async () => {
      // Get recently completed or high-progress content to find similar ones
      const { data: recentHistory } = await supabase
        .from("watch_history")
        .select("content_id, progress_percent, contents(id, genre, creator, type)")
        .eq("profile_id", currentProfile.id)
        .gte("progress_percent", 80)
        .order("last_watched_at", { ascending: false })
        .limit(5);

      if (!recentHistory || recentHistory.length === 0) {
        setIsLoading(false);
        return;
      }

      // Extract genres and creators from recently completed content
      const genres = new Set<string>();
      const creators = new Set<string>();
      const watchedIds = new Set<string>();
      const showTypes = new Set<string>();

      recentHistory.forEach((item: any) => {
        watchedIds.add(item.content_id);
        if (item.contents?.genre) genres.add(item.contents.genre);
        if (item.contents?.creator) creators.add(item.contents.creator);
        if (item.contents?.type) showTypes.add(item.contents.type);
      });

      // Find similar content user hasn't watched
      const genreArray = Array.from(genres);
      
      let query = supabase
        .from("contents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (genreArray.length > 0) {
        query = query.in("genre", genreArray);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Filter out already watched content
        const filtered = data.filter(item => !watchedIds.has(item.id));
        setContents(filtered.slice(0, 15));
      }
      setIsLoading(false);
    };

    fetchNextToWatch();
  }, [currentProfile?.id]);

  if (isLoading || contents.length === 0) return null;

  const mappedContents = contents.map((item) => ({
    id: item.id,
    title: item.title,
    posterUrl: item.poster_url || "/placeholder.svg",
    rating: item.rating || undefined,
    year: item.release_year?.toString() || undefined,
    category: item.genre || undefined,
    videoUrl: item.video_url,
    trailerUrl: item.trailer_url,
  }));

  return (
    <ContentRow
      title="Next To Watch"
      contents={mappedContents}
      onMoreInfo={onMoreInfo}
    />
  );
};

export default NextToWatchRow;
