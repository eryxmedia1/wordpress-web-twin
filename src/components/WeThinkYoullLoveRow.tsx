import { useEffect, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import ContentRow from "./ContentRow";

interface WeThinkYoullLoveRowProps {
  onMoreInfo: (contentId: string) => void;
}

const WeThinkYoullLoveRow = ({ onMoreInfo }: WeThinkYoullLoveRowProps) => {
  const { currentProfile } = useProfile();
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchRecommendations = async () => {
      // Get user's liked content and watch history to understand preferences
      const [likesResult, historyResult] = await Promise.all([
        supabase
          .from("likes")
          .select("content_id, contents(genre)")
          .eq("profile_id", currentProfile.id),
        supabase
          .from("watch_history")
          .select("content_id, contents(genre)")
          .eq("profile_id", currentProfile.id)
          .gt("progress_percent", 30)
      ]);

      // Extract genres from liked and watched content
      const likedGenres = new Set<string>();
      const watchedContentIds = new Set<string>();

      if (likesResult.data) {
        likesResult.data.forEach((item: any) => {
          if (item.contents?.genre) likedGenres.add(item.contents.genre);
          watchedContentIds.add(item.content_id);
        });
      }

      if (historyResult.data) {
        historyResult.data.forEach((item: any) => {
          if (item.contents?.genre) likedGenres.add(item.contents.genre);
          watchedContentIds.add(item.content_id);
        });
      }

      let query = supabase
        .from("contents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // If user has genre preferences, filter by those
      if (likedGenres.size > 0) {
        const genreArray = Array.from(likedGenres);
        query = query.in("genre", genreArray);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Filter out content user has already interacted with
        const filtered = data.filter(item => !watchedContentIds.has(item.id));
        setContents(filtered.length > 0 ? filtered : data.slice(0, 10));
      }
      setIsLoading(false);
    };

    fetchRecommendations();
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
      title="We Think You'll Love These"
      contents={mappedContents}
      onMoreInfo={onMoreInfo}
    />
  );
};

export default WeThinkYoullLoveRow;
