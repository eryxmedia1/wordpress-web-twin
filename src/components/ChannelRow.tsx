import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ContentRow from "./ContentRow";

interface ChannelRowProps {
  channelName: string;
  onMoreInfo: (contentId: string) => void;
  seeAllLink?: string;
}

const ChannelRow = ({ channelName, onMoreInfo, seeAllLink }: ChannelRowProps) => {
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannelContent = async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .contains("channels", [channelName])
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setContents(data);
      }
      setIsLoading(false);
    };

    fetchChannelContent();
  }, [channelName]);

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

  // Generate seeAllLink if not provided
  const linkToUse = seeAllLink || `/category/${channelName.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <ContentRow
      title={channelName}
      contents={mappedContents}
      seeAllLink={linkToUse}
      onMoreInfo={onMoreInfo}
    />
  );
};

export default ChannelRow;
