import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MobileContentRow from "./MobileContentRow";

interface MobileYardMonTVRowProps {
  onItemClick: (id: string) => void;
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

const MobileYardMonTVRow = ({ onItemClick }: MobileYardMonTVRowProps) => {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      // Fetch from Yard MonTV indie channel
      const { data: channel } = await supabase
        .from("indie_channels")
        .select("id")
        .eq("slug", "yard-montv")
        .single();

      let allMovies: any[] = [];

      // Get movies from the Yard MonTV channel
      if (channel) {
        const { data: channelMovies } = await supabase
          .from("contents")
          .select("id, title, poster_url, rating, release_year, genre, video_url, trailer_url")
          .eq("indie_channel_id", channel.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (channelMovies) {
          allMovies = [...channelMovies];
        }
      }

      // Also fetch any movies with "Jamaican" in genre from all content
      const { data: jamaicanMovies } = await supabase
        .from("contents")
        .select("id, title, poster_url, rating, release_year, genre, video_url, trailer_url")
        .ilike("genre", "%Jamaican%")
        .order("created_at", { ascending: false })
        .limit(20);

      if (jamaicanMovies) {
        // Merge and deduplicate by id
        const existingIds = new Set(allMovies.map(m => m.id));
        jamaicanMovies.forEach(movie => {
          if (!existingIds.has(movie.id)) {
            allMovies.push(movie);
          }
        });
      }

      setContents(shuffleArray(allMovies));
      setLoading(false);
    };

    fetchContent();
  }, []);

  if (loading || contents.length === 0) return null;

  const items = contents.map(content => ({
    id: content.id,
    title: content.title,
    posterUrl: content.poster_url || "/placeholder.svg",
    rating: content.rating,
    year: content.release_year?.toString(),
  }));

  return (
    <MobileContentRow
      title="Yard MonTV"
      items={items}
      onItemClick={onItemClick}
      seeAllLink="/indie-channel/yard-montv"
    />
  );
};

export default MobileYardMonTVRow;
