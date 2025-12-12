import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MobileContentRow from "./MobileContentRow";

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

interface MobileChannelRowProps {
  channelName: string;
  onItemClick: (id: string) => void;
  seeAllLink?: string;
}

const MobileChannelRow = ({ channelName, onItemClick, seeAllLink }: MobileChannelRowProps) => {
  const [items, setItems] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannelContent = async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, poster_url, rating, release_year, genre, video_url, trailer_url, channels")
        .contains("channels", [channelName])
        .order("created_at", { ascending: false })
        .limit(15);

      if (!error && data) {
        setItems(data);
      }
      setIsLoading(false);
    };

    fetchChannelContent();
  }, [channelName]);

  if (isLoading || items.length === 0) return null;

  const mappedItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    posterUrl: item.poster_url || "/placeholder.svg",
    rating: item.rating || undefined,
    year: item.release_year?.toString() || undefined,
    genre: item.genre || undefined,
    videoUrl: item.video_url,
    trailerUrl: item.trailer_url,
  }));

  return (
    <MobileContentRow
      title={channelName}
      items={mappedItems}
      onItemClick={onItemClick}
      seeAllLink={seeAllLink}
    />
  );
};

export default MobileChannelRow;
