import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ContentRow from "./ContentRow";

interface AfricanMoviesRowProps {
  onMoreInfo: (contentId: string) => void;
}

interface Content {
  id: string;
  title: string;
  poster_url: string | null;
  rating: string | null;
  release_year: number | null;
  genre: string | null;
  video_url: string | null;
  trailer_url: string | null;
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

const AfricanMoviesRow = ({ onMoreInfo }: AfricanMoviesRowProps) => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAfricanMovies = async () => {
      // Get the movie-channel indie channel
      const { data: channel } = await supabase
        .from("indie_channels")
        .select("id")
        .eq("slug", "movie-channel")
        .eq("is_active", true)
        .single();

      if (!channel) {
        setLoading(false);
        return;
      }

      // Fetch movies with Drama/Romance genres (common for African/Nigerian films)
      // Also filter out any content with UUID-like genres
      const { data: movies } = await supabase
        .from("contents")
        .select("id, title, poster_url, rating, release_year, genre, video_url, trailer_url")
        .eq("indie_channel_id", channel.id)
        .or("genre.ilike.%Drama%,genre.ilike.%Romance%")
        .order("created_at", { ascending: false })
        .limit(30);

      if (movies) {
        // Filter out any movies with UUID-like genres
        const validMovies = movies.filter(m => {
          if (!m.genre) return false;
          // UUID pattern check - exclude if genre looks like a UUID
          const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
          return !uuidPattern.test(m.genre);
        });
        setContents(shuffleArray(validMovies));
      }

      setLoading(false);
    };

    fetchAfricanMovies();
  }, []);

  if (loading || contents.length === 0) {
    return null;
  }

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
      title="African Movies"
      contents={mappedContents}
      seeAllLink="/category/african-movies"
      onMoreInfo={onMoreInfo}
    />
  );
};

export default AfricanMoviesRow;
