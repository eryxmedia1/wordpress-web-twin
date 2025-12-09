import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAds } from "@/hooks/useAds";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import ContentRow from "@/components/ContentRow";
import MobileContentRow from "@/components/mobile/MobileContentRow";
import ContentDetailModal from "@/components/ContentDetailModal";
import MobileContentDetailModal from "@/components/mobile/MobileContentDetailModal";
import { AdBreakOverlay } from "@/components/AdBreakOverlay";
import { Button } from "@/components/ui/button";
import { Heart, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import ReactPlayer from "react-player";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  trailer_url: string | null;
  backdrop_url: string | null;
}

interface Content {
  id: string;
  title: string;
  poster_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  rating: string | null;
  release_year: number | null;
  genre: string | null;
}

const IndieChannelPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const isMobile = useIsMobile();

  const [channel, setChannel] = useState<IndieChannel | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);

  // Ad system integration
  const {
    currentAd,
    isAdPlaying,
    adPosition,
    currentAdIndex,
    showCountdown,
    countdownSeconds,
    adQueueLength,
    requestPreRoll,
    onAdComplete,
    skipAd,
  } = useAds({
    contentId: channel?.id,
  });

  useEffect(() => {
    if (slug) {
      fetchChannel();
    }
  }, [slug]);

  useEffect(() => {
    if (channel?.id && currentProfile?.id) {
      fetchFavoriteStatus();
      fetchContents();
    }
  }, [channel?.id, currentProfile?.id]);

  const fetchChannel = async () => {
    const { data, error } = await supabase
      .from("indie_channels")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.error("Error fetching channel:", error);
      navigate("/indie-channels");
      return;
    }

    setChannel(data);
    setLoading(false);
  };

  const fetchFavoriteStatus = async () => {
    if (!currentProfile?.id || !channel?.id) return;

    const { data } = await supabase
      .from("indie_channel_favorites")
      .select("id")
      .eq("profile_id", currentProfile.id)
      .eq("indie_channel_id", channel.id)
      .single();

    setIsFavorite(!!data);
  };

  const fetchContents = async () => {
    if (!channel?.id) return;

    const { data, error } = await supabase
      .from("contents")
      .select("id, title, poster_url, video_url, trailer_url, rating, release_year, genre")
      .eq("indie_channel_id", channel.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contents:", error);
    } else {
      setContents(data || []);
    }
  };

  const toggleFavorite = async () => {
    if (!currentProfile?.id || !channel?.id) {
      toast.error("Please select a profile first");
      return;
    }

    if (isFavorite) {
      await supabase
        .from("indie_channel_favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("indie_channel_id", channel.id);

      setIsFavorite(false);
      toast.success("Removed from favorites");
    } else {
      await supabase.from("indie_channel_favorites").insert({
        profile_id: currentProfile.id,
        indie_channel_id: channel.id,
      });

      setIsFavorite(true);
      toast.success("Added to favorites");
    }
  };

  const handlePlayTrailer = async () => {
    // Request pre-roll ad before playing trailer
    await requestPreRoll();
    setIsPlayingTrailer(true);
  };

  const handleMoreInfo = (contentId: string) => {
    setSelectedContentId(contentId);
  };

  const mapToContentRow = (items: Content[]) =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      posterUrl: item.poster_url || "/placeholder.svg",
      rating: item.rating || undefined,
      year: item.release_year?.toString() || undefined,
      category: item.genre || undefined,
      videoUrl: item.video_url,
      trailerUrl: item.trailer_url,
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!channel) return null;

  const heroContent = (
    <div className="relative">
      {/* Backdrop */}
      <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
        {channel.backdrop_url || channel.logo_url ? (
          <img
            src={channel.backdrop_url || channel.logo_url || ""}
            alt={channel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Channel Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <div className="flex items-end gap-6">
          {/* Logo */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-card border border-border overflow-hidden flex-shrink-0">
            {channel.logo_url ? (
              <img
                src={channel.logo_url}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-3xl md:text-4xl font-bold text-primary">
                  {channel.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              {channel.name}
            </h1>
            {channel.description && (
              <p className="text-muted-foreground max-w-2xl line-clamp-3">
                {channel.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {channel.trailer_url && (
                <Button
                  onClick={handlePlayTrailer}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Watch Trailer
                </Button>
              )}
              <Button
                variant="outline"
                onClick={toggleFavorite}
                className="gap-2"
              >
                <Heart
                  className={`w-4 h-4 ${isFavorite ? "fill-primary text-primary" : ""}`}
                />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const contentRows = contents.length > 0 && (
    <div className="space-y-8 p-4 md:p-8">
      {isMobile ? (
        <MobileContentRow
          title={`All Videos from ${channel.name}`}
          items={mapToContentRow(contents)}
          onItemClick={handleMoreInfo}
        />
      ) : (
        <ContentRow
          title={`All Videos from ${channel.name}`}
          contents={mapToContentRow(contents)}
          onMoreInfo={handleMoreInfo}
        />
      )}
    </div>
  );

  // Trailer Player Modal
  const trailerPlayer = isPlayingTrailer && channel.trailer_url && !isAdPlaying && (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <Button
        variant="ghost"
        className="absolute top-4 right-4 text-white z-10"
        onClick={() => setIsPlayingTrailer(false)}
      >
        Close
      </Button>
      <ReactPlayer
        url={channel.trailer_url}
        playing
        controls
        width="100%"
        height="100%"
        style={{ maxWidth: "100vw", maxHeight: "100vh" }}
        onEnded={() => setIsPlayingTrailer(false)}
      />
    </div>
  );

  // Ad overlay
  const adOverlay = (showCountdown || isAdPlaying) && (
    <AdBreakOverlay
      showCountdown={showCountdown}
      countdownSeconds={countdownSeconds}
      ad={currentAd}
      position={adPosition}
      adQueueLength={adQueueLength}
      currentAdIndex={currentAdIndex}
      onAdComplete={onAdComplete}
      onSkip={skipAd}
    />
  );

  const mainContent = (
    <div className="min-h-screen bg-background">
      {heroContent}
      {contentRows}
      {contents.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No videos available from this channel yet
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <MobileLayout hideHeader>
        {mainContent}
        <MobileContentDetailModal
          contentId={selectedContentId}
          isOpen={!!selectedContentId}
          onClose={() => setSelectedContentId(null)}
        />
        {trailerPlayer}
        {adOverlay}
      </MobileLayout>
    );
  }

  return (
    <>
      <Navbar />
      <ExpandingSidebar />
      <div className="ml-16">
        {mainContent}
      </div>
      <ContentDetailModal
        contentId={selectedContentId}
        isOpen={!!selectedContentId}
        onClose={() => setSelectedContentId(null)}
      />
      {trailerPlayer}
      {adOverlay}
    </>
  );
};

export default IndieChannelPage;
