import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

const MobileIndieChannelsRow = () => {
  const [channels, setChannels] = useState<IndieChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from("indie_channels")
        .select("id, name, slug, logo_url")
        .eq("is_active", true)
        .order("name")
        .limit(20);

      if (error) {
        console.error("Error fetching indie channels:", error);
      } else {
        setChannels(data || []);
      }
      setLoading(false);
    };

    fetchChannels();
  }, []);

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
          <Link
            key={channel.id}
            to={`/indie-channel/${channel.slug}`}
            className="flex-shrink-0"
          >
            <div className="w-24 space-y-1">
              <div className="w-24 h-24 rounded-full bg-card border border-border overflow-hidden">
                {channel.logo_url ? (
                  <img
                    src={channel.logo_url}
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
              </div>
              <p className="text-xs font-medium text-foreground text-center truncate">
                {channel.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MobileIndieChannelsRow;
