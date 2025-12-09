import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Play } from "lucide-react";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface ChannelWithFirstVideo extends IndieChannel {
  firstVideoId?: string;
  firstVideoPoster?: string;
}

const MobileIndieChannelsRow = () => {
  const [channels, setChannels] = useState<ChannelWithFirstVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChannels = async () => {
      const { data: channelsData, error } = await supabase
        .from("indie_channels")
        .select("id, name, slug, logo_url")
        .eq("is_active", true)
        .order("name")
        .limit(20);

      if (error) {
        console.error("Error fetching indie channels:", error);
        setLoading(false);
        return;
      }

      // For each channel, fetch the first video
      const channelsWithVideos: ChannelWithFirstVideo[] = await Promise.all(
        (channelsData || []).map(async (channel) => {
          const { data: firstVideo } = await supabase
            .from("contents")
            .select("id, poster_url")
            .eq("indie_channel_id", channel.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...channel,
            firstVideoId: firstVideo?.id,
            firstVideoPoster: firstVideo?.poster_url || channel.logo_url,
          };
        })
      );

      setChannels(channelsWithVideos);
      setLoading(false);
    };

    fetchChannels();
  }, []);

  const handleChannelClick = (channel: ChannelWithFirstVideo) => {
    navigate(`/indie-channel/${channel.slug}`);
  };

  if (loading || channels.length === 0) return null;

  return (
    <section className="px-4 py-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Indie Channels</h2>
        <Link
          to="/indie-channels"
          className="flex items-center gap-1 text-xs text-primary"
        >
          See All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {channels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleChannelClick(channel)}
            className="flex-shrink-0 cursor-pointer"
          >
            <div className="w-28 space-y-1">
              {/* Channel Name Above Poster */}
              <p className="text-xs font-bold text-foreground truncate">
                {channel.name}
              </p>
              
              {/* Poster */}
              <div className="relative aspect-[2/3] rounded-lg bg-card border border-border overflow-hidden">
                {channel.firstVideoPoster || channel.logo_url ? (
                  <img
                    src={channel.firstVideoPoster || channel.logo_url || ""}
                    alt={channel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-2xl font-bold text-primary">
                      {channel.name.charAt(0)}
                    </span>
                  </div>
                )}
                
                {/* Play icon overlay */}
                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MobileIndieChannelsRow;