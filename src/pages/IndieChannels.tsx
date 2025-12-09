import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";
import { toast } from "sonner";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  backdrop_url: string | null;
}

const IndieChannels = () => {
  const { currentProfile } = useProfile();
  const isMobile = useIsMobile();
  const [channels, setChannels] = useState<IndieChannel[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
    if (currentProfile?.id) {
      fetchFavorites();
    }
  }, [currentProfile]);

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from("indie_channels")
      .select("id, name, slug, logo_url, description, backdrop_url")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching channels:", error);
    } else {
      setChannels(data || []);
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    if (!currentProfile?.id) return;

    const { data } = await supabase
      .from("indie_channel_favorites")
      .select("indie_channel_id")
      .eq("profile_id", currentProfile.id);

    if (data) {
      setFavorites(new Set(data.map((f) => f.indie_channel_id)));
    }
  };

  const toggleFavorite = async (channelId: string) => {
    if (!currentProfile?.id) {
      toast.error("Please select a profile first");
      return;
    }

    const isFavorite = favorites.has(channelId);

    if (isFavorite) {
      const { error } = await supabase
        .from("indie_channel_favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("indie_channel_id", channelId);

      if (error) {
        toast.error("Failed to remove from favorites");
      } else {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(channelId);
          return next;
        });
        toast.success("Removed from favorites");
      }
    } else {
      const { error } = await supabase.from("indie_channel_favorites").insert({
        profile_id: currentProfile.id,
        indie_channel_id: channelId,
      });

      if (error) {
        toast.error("Failed to add to favorites");
      } else {
        setFavorites((prev) => new Set([...prev, channelId]));
        toast.success("Added to favorites");
      }
    }
  };

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="min-h-screen bg-background">
      <div className={isMobile ? "p-4" : "ml-16 p-8"}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Indie Channels
          </h1>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted border-border"
            />
          </div>

          {/* Channels Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-primary text-xl">Loading...</div>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {searchTerm ? "No channels found" : "No indie channels available yet"}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {filteredChannels.map((channel) => (
                <div key={channel.id} className="group relative">
                  <Link to={`/indie-channel/${channel.slug}`}>
                    <div className="aspect-square rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20">
                      {channel.logo_url ? (
                        <img
                          src={channel.logo_url}
                          alt={channel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <span className="text-4xl md:text-5xl font-bold text-primary">
                            {channel.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Favorite Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(channel.id);
                    }}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.has(channel.id)
                          ? "fill-primary text-primary"
                          : "text-foreground"
                      }`}
                    />
                  </Button>

                  <div className="mt-2 text-center">
                    <Link
                      to={`/indie-channel/${channel.slug}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {channel.name}
                    </Link>
                    {channel.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {channel.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return (
    <>
      <Navbar />
      <ExpandingSidebar />
      {content}
    </>
  );
};

export default IndieChannels;
