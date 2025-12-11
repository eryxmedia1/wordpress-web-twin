import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MobileContentRow from "./MobileContentRow";

interface MobileIndieChannelContentRowProps {
  channelSlug: string;
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

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
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

const MobileIndieChannelContentRow = ({ channelSlug, onItemClick }: MobileIndieChannelContentRowProps) => {
  const [channel, setChannel] = useState<IndieChannel | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannelContent = async () => {
      // First get the channel
      const { data: channelData } = await supabase
        .from("indie_channels")
        .select("id, name, slug, logo_url")
        .eq("slug", channelSlug)
        .eq("is_active", true)
        .single();

      if (!channelData) {
        setLoading(false);
        return;
      }

      setChannel(channelData);

      // Then get content for this channel
      const { data: contentData } = await supabase
        .from("contents")
        .select("id, title, poster_url, rating, release_year, genre, video_url, trailer_url")
        .eq("indie_channel_id", channelData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (contentData) {
        setContents(shuffleArray(contentData));
      }

      setLoading(false);
    };

    fetchChannelContent();
  }, [channelSlug]);

  if (loading || !channel || contents.length === 0) {
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
      title={channel.name}
      items={mappedContents}
      onItemClick={onItemClick}
      seeAllLink={`/indie-channel/${channel.slug}`}
    />
  );
};

export default MobileIndieChannelContentRow;
