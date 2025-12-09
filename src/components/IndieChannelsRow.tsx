import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
}

const IndieChannelsRow = () => {
  const [channels, setChannels] = useState<IndieChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from("indie_channels")
        .select("id, name, slug, logo_url, description")
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
          <Link
            key={channel.id}
            to={`/indie-channel/${channel.slug}`}
            className="flex-shrink-0 group"
          >
            <div className="w-40 md:w-48 space-y-2">
              <div className="aspect-square rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary transition-colors">
                {channel.logo_url ? (
                  <img
                    src={channel.logo_url}
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
              </div>
              <p className="text-sm font-medium text-foreground text-center truncate group-hover:text-primary transition-colors">
                {channel.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default IndieChannelsRow;
