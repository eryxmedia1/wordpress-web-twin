import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ContentRow from "./ContentRow";

interface IndieChannelContentRowProps {
  channelSlug: string;
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

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

const IndieChannelContentRow = ({ channelSlug, onMoreInfo }: IndieChannelContentRowProps) => {
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
        setContents(contentData);
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
    <ContentRow
      title={channel.name}
      contents={mappedContents}
      seeAllLink={`/indie-channel/${channel.slug}`}
      onMoreInfo={onMoreInfo}
    />
  );
};

export default IndieChannelContentRow;
