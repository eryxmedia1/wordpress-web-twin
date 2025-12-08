import { useEffect, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import ContentRow from "./ContentRow";

interface WeThinkYoullLoveRowProps {
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

const WeThinkYoullLoveRow = ({ onMoreInfo }: WeThinkYoullLoveRowProps) => {
  const { currentProfile } = useProfile();
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchRecommendations = async () => {
      // Get user's liked content, watch history, and favorites to understand preferences
      const [likesResult, historyResult, favoritesResult] = await Promise.all([
        supabase
          .from("likes")
          .select("content_id")
          .eq("profile_id", currentProfile.id),
        supabase
          .from("watch_history")
          .select("content_id")
          .eq("profile_id", currentProfile.id)
          .gt("progress_percent", 30),
        supabase
          .from("favorites")
          .select("content_id")
          .eq("profile_id", currentProfile.id)
      ]);

      // Collect all interacted content IDs
      const interactedContentIds = new Set<string>();
      const likedContentIds: string[] = [];

      if (likesResult.data) {
        likesResult.data.forEach((item) => {
          interactedContentIds.add(item.content_id);
          likedContentIds.push(item.content_id);
        });
      }

      if (historyResult.data) {
        historyResult.data.forEach((item) => {
          interactedContentIds.add(item.content_id);
        });
      }

      if (favoritesResult.data) {
        favoritesResult.data.forEach((item) => {
          interactedContentIds.add(item.content_id);
          if (!likedContentIds.includes(item.content_id)) {
            likedContentIds.push(item.content_id);
          }
        });
      }

      // Get tags from liked/favorited content
      let preferredTagIds: string[] = [];
      let preferredGenres: string[] = [];

      if (likedContentIds.length > 0) {
        // Fetch tags from liked content
        const { data: likedTags } = await supabase
          .from("content_tags")
          .select("tag_id")
          .in("content_id", likedContentIds);

        if (likedTags) {
          preferredTagIds = [...new Set(likedTags.map(t => t.tag_id))];
        }

        // Fetch genres from liked content
        const { data: likedContent } = await supabase
          .from("contents")
          .select("genre")
          .in("id", likedContentIds);

        if (likedContent) {
          likedContent.forEach((item) => {
            if (item.genre) {
              preferredGenres.push(item.genre.split(",")[0].trim());
            }
          });
          preferredGenres = [...new Set(preferredGenres)];
        }
      }

      // Find content with matching tags
      let recommendedContentIds = new Set<string>();

      if (preferredTagIds.length > 0) {
        const { data: contentWithTags } = await supabase
          .from("content_tags")
          .select("content_id")
          .in("tag_id", preferredTagIds);

        if (contentWithTags) {
          contentWithTags.forEach(ct => {
            if (!interactedContentIds.has(ct.content_id)) {
              recommendedContentIds.add(ct.content_id);
            }
          });
        }
      }

      // Build query for recommendations
      let query = supabase
        .from("contents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Prioritize content with matching tags
      if (recommendedContentIds.size > 0) {
        query = query.in("id", Array.from(recommendedContentIds));
      } else if (preferredGenres.length > 0) {
        // Fall back to genre matching
        query = query.in("genre", preferredGenres);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Filter out content user has already interacted with
        const filtered = data.filter(item => !interactedContentIds.has(item.id));
        
        if (filtered.length > 0) {
          setContents(shuffleArray(filtered));
        } else if (data.length > 0) {
          // If all filtered out, show some anyway
          setContents(shuffleArray(data.slice(0, 10)));
        } else {
          // Fallback to newest content
          const { data: fallbackData } = await supabase
            .from("contents")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(15);
          
          if (fallbackData) {
            const fallbackFiltered = fallbackData.filter(item => !interactedContentIds.has(item.id));
            setContents(shuffleArray(fallbackFiltered.length > 0 ? fallbackFiltered : fallbackData.slice(0, 10)));
          }
        }
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
