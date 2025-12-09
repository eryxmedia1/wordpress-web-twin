import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Play } from "lucide-react";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  backdrop_url: string | null;
  description: string | null;
}

interface ChannelWithFirstVideo extends IndieChannel {
  firstVideoId?: string;
  firstVideoPoster?: string;
}

const IndieChannelsRow = () => {
  const [channels, setChannels] = useState<ChannelWithFirstVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChannels = async () => {
      // Fetch active indie channels
      const { data: channelsData, error } = await supabase
        .from("indie_channels")
        .select("id, name, slug, logo_url, backdrop_url, description")
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
    // Navigate to the channel page - clicking on card takes to channel
    navigate(`/indie-channel/${channel.slug}`);
  };

  if (loading || channels.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">
          Indie Channels
        </h2>
        <Link
          to="/indie-channels"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          See All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {channels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleChannelClick(channel)}
            className="flex-shrink-0 cursor-pointer group"
          >
            <div className="w-40 md:w-48 space-y-2">
              {/* Channel Name Above Poster */}
              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {channel.name}
              </p>
              
              {/* Poster with Play Button Overlay */}
              <div className="relative aspect-[2/3] rounded-lg bg-card border border-border overflow-hidden group-hover:border-primary transition-colors">
                {channel.firstVideoPoster || channel.logo_url ? (
                  <img
                    src={channel.firstVideoPoster || channel.logo_url || ""}
                    alt={channel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-4xl font-bold text-primary">
                      {channel.name.charAt(0)}
                    </span>
                  </div>
                )}
                
                {/* Play button overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default IndieChannelsRow;