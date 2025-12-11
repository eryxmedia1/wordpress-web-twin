import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MobileContentRow from "./MobileContentRow";

interface MobileAfricanMoviesRowProps {
  onItemClick: (contentId: string) => void;
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

const MobileAfricanMoviesRow = ({ onItemClick }: MobileAfricanMoviesRowProps) => {
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
    <MobileContentRow
      title="African Movies"
      items={mappedContents}
      onItemClick={onItemClick}
      seeAllLink="/category/african-movies"
    />
  );
};

export default MobileAfricanMoviesRow;
