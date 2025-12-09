import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ContentRow from "./ContentRow";

interface NewOnZoeRowProps {
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

const NewOnZoeRow = ({ onMoreInfo }: NewOnZoeRowProps) => {
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewContent = async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setContents(shuffleArray(data));
      }
      setIsLoading(false);
    };

    fetchNewContent();
  }, []);

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
      title="New on Zoe RatedTV"
      contents={mappedContents}
      seeAllLink="/category/new"
      onMoreInfo={onMoreInfo}
    />
  );
};

export default NewOnZoeRow;
