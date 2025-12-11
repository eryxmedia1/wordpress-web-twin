import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
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
import { Heart, Play, Share2, Settings, ChevronLeft, ChevronRight, Volume2, VolumeX, Users } from "lucide-react";
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
  owner_id: string | null;
}

interface Content {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  rating: string | null;
  release_year: number | null;
  genre: string | null;
  description: string | null;
}

const IndieChannelPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const { user, isAdmin } = useAuth();
  const isMobile = useIsMobile();

  const [channel, setChannel] = useState<IndieChannel | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; items: Content[] }[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  
  // Hero carousel state
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  // Check if current user is the channel owner
  const isOwner = channel?.owner_id === user?.id;
  const canManage = isOwner || isAdmin;

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
      fetchCategories();
      fetchFollowerCount();
    }
  }, [channel?.id, currentProfile?.id]);

  // Randomize hero contents
  const [shuffledHeroContents, setShuffledHeroContents] = useState<Content[]>([]);
  
  useEffect(() => {
    if (contents.length > 0) {
      // Shuffle contents for hero
      const shuffled = [...contents].sort(() => Math.random() - 0.5).slice(0, 5);
      setShuffledHeroContents(shuffled);
    }
  }, [contents]);

  // Auto-advance hero carousel every 30 seconds
  useEffect(() => {
    if (shuffledHeroContents.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % shuffledHeroContents.length);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [shuffledHeroContents.length]);

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
      .select("id, title, poster_url, backdrop_url, video_url, trailer_url, rating, release_year, genre, description")
      .eq("indie_channel_id", channel.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contents:", error);
    } else {
      setContents((data || []) as Content[]);
    }
  };

  const fetchCategories = async () => {
    if (!channel?.id) return;

    // Fetch all contents first to have them available
    const { data: allContents } = await supabase
      .from("contents")
      .select("id, title, poster_url, backdrop_url, video_url, trailer_url, rating, release_year, genre, description")
      .eq("indie_channel_id", channel.id)
      .order("created_at", { ascending: false });

    const contentsMap = new Map((allContents || []).map(c => [c.id, c as Content]));

    const { data: cats } = await supabase
      .from("indie_channel_categories")
      .select("id, name, slug")
      .eq("indie_channel_id", channel.id)
      .order("sort_order", { ascending: true });

    if (cats && cats.length > 0) {
      const catsWithItems = await Promise.all(cats.map(async (cat) => {
        const { data: items } = await supabase
          .from("indie_channel_category_items")
          .select("content_id")
          .eq("category_id", cat.id)
          .order("sort_order", { ascending: true });

        const contentIds = items?.map(i => i.content_id) || [];
        const categoryContents = contentIds
          .map(cid => contentsMap.get(cid))
          .filter((c): c is Content => !!c);
        
        return { ...cat, items: categoryContents };
      }));
      
      // Only include categories that have content
      setCategories(catsWithItems.filter(c => c.items.length > 0));
    }
  };

  const fetchFollowerCount = async () => {
    if (!channel?.id) return;

    const { count } = await supabase
      .from("indie_channel_favorites")
      .select("*", { count: "exact", head: true })
      .eq("indie_channel_id", channel.id);

    setFollowerCount(count || 0);
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

  const handleMoreInfo = (contentId: string) => {
    setSelectedContentId(contentId);
  };

  const handlePlayVideo = async (contentId: string) => {
    await requestPreRoll();
    navigate(`/watch/${contentId}`);
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

  // Get featured content for hero (randomized, first 5 videos)
  const heroContents = shuffledHeroContents;
  const currentHeroContent = heroContents[currentHeroIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!channel) return null;

  const heroCarousel = heroContents.length > 0 ? (
    <div className="relative h-[60vh] md:h-[80vh] overflow-hidden" ref={heroRef}>
      {/* Background Video/Image */}
      {currentHeroContent?.trailer_url || currentHeroContent?.video_url ? (
        <div className="absolute inset-0">
          <ReactPlayer
            url={currentHeroContent.trailer_url || currentHeroContent.video_url || ""}
            playing
            muted={isMuted}
            loop
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            config={{
              file: {
                attributes: {
                  style: { objectFit: 'cover', width: '100%', height: '100%' }
                }
              }
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0">
          <img
            src={currentHeroContent?.backdrop_url || currentHeroContent?.poster_url || channel.backdrop_url || channel.logo_url || ""}
            alt={currentHeroContent?.title || channel.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
        <div className="max-w-2xl space-y-4">
          {/* Channel Logo/Name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-card border border-border overflow-hidden">
              {channel.logo_url ? (
                <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-lg font-bold text-primary">{channel.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-muted-foreground">{channel.name}</span>
          </div>

          {/* Video Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">
            {currentHeroContent?.title || channel.name}
          </h1>

          {/* Video Description */}
          {currentHeroContent?.description && (
            <p className="text-sm md:text-base text-muted-foreground line-clamp-3 max-w-xl">
              {currentHeroContent.description}
            </p>
          )}

          {/* Meta info */}
          {currentHeroContent && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {currentHeroContent.release_year && <span>{currentHeroContent.release_year}</span>}
              {currentHeroContent.rating && (
                <span className="px-2 py-0.5 bg-muted rounded text-xs">{currentHeroContent.rating}</span>
              )}
              {currentHeroContent.genre && <span>{currentHeroContent.genre}</span>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {currentHeroContent && (
              <Button 
                onClick={() => handlePlayVideo(currentHeroContent.id)} 
                className="gap-2"
                size="lg"
              >
                <Play className="w-5 h-5 fill-current" />
                Play
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={toggleFavorite}
              className="gap-2"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
              {isFavorite ? "Following" : "Follow"}
              <span className="ml-1 text-muted-foreground">({followerCount})</span>
            </Button>
            {canManage && (
              <Button
                variant="outline"
                size="lg"
                asChild
              >
                <Link to={`/producer/${channel.slug}`}>
                  <Settings className="w-5 h-5 mr-2" />
                  Manage Channel
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Carousel Navigation */}
        {heroContents.length > 1 && (
          <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 flex items-center gap-4">
            {/* Mute Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="bg-background/50 hover:bg-background/80"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            {/* Nav Arrows */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentHeroIndex((prev) => (prev - 1 + heroContents.length) % heroContents.length)}
              className="bg-background/50 hover:bg-background/80"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentHeroIndex((prev) => (prev + 1) % heroContents.length)}
              className="bg-background/50 hover:bg-background/80"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            {/* Dots */}
            <div className="flex gap-1.5">
              {heroContents.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentHeroIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentHeroIndex ? "bg-primary" : "bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    // Fallback hero when no content
    <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
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

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <div className="flex items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-card border border-border overflow-hidden flex-shrink-0">
            {channel.logo_url ? (
              <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-3xl md:text-4xl font-bold text-primary">{channel.name.charAt(0)}</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">{channel.name}</h1>
            {channel.description && (
              <p className="text-muted-foreground max-w-2xl line-clamp-3">{channel.description}</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={toggleFavorite} className="gap-2">
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </Button>
              {canManage && (
                <Button variant="outline" asChild>
                  <Link to={`/producer/${channel.slug}`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Channel
                  </Link>
                </Button>
              )}
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

  // Shuffle helper function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Group content by genre for genre-based rows
  const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  
  const genreGroups = contents.reduce((acc, content) => {
    if (content.genre) {
      // Split genres if they contain commas (e.g., "Action, Adventure, Drama")
      const genres = content.genre.split(',').map(g => g.trim()).filter(g => g);
      genres.forEach(genre => {
        // Skip UUID-like genres
        if (uuidPattern.test(genre)) return;
        
        if (!acc[genre]) {
          acc[genre] = [];
        }
        // Avoid duplicates
        if (!acc[genre].some(c => c.id === content.id)) {
          acc[genre].push(content);
        }
      });
    }
    return acc;
  }, {} as Record<string, Content[]>);

  // Sort genre names alphabetically and filter out empty groups
  const sortedGenres = Object.keys(genreGroups)
    .filter(genre => genreGroups[genre].length > 0)
    .sort((a, b) => a.localeCompare(b));

  // Create African Movies group (Drama + Romance for movie-channel)
  const africanMovies = slug === "movie-channel" 
    ? contents.filter(c => {
        if (!c.genre) return false;
        if (uuidPattern.test(c.genre)) return false;
        const lowerGenre = c.genre.toLowerCase();
        return lowerGenre.includes('drama') || lowerGenre.includes('romance');
      })
    : [];

  const contentRows = contents.length > 0 && (
    <div className="space-y-8 p-4 md:p-8">
      {/* Custom Category Rows */}
      {categories.map((category) => (
        isMobile ? (
          <MobileContentRow
            key={category.id}
            title={category.name}
            items={mapToContentRow(shuffleArray(category.items))}
            onItemClick={handleMoreInfo}
          />
        ) : (
          <ContentRow
            key={category.id}
            title={category.name}
            contents={mapToContentRow(shuffleArray(category.items))}
            onMoreInfo={handleMoreInfo}
          />
        )
      ))}

      {/* African Movies Row - Only for movie-channel */}
      {africanMovies.length > 0 && (
        isMobile ? (
          <MobileContentRow
            title="African Movies"
            items={mapToContentRow(shuffleArray(africanMovies))}
            onItemClick={handleMoreInfo}
            seeAllLink="/category/african-movies"
          />
        ) : (
          <ContentRow
            title="African Movies"
            contents={mapToContentRow(shuffleArray(africanMovies))}
            onMoreInfo={handleMoreInfo}
            seeAllLink="/category/african-movies"
          />
        )
      )}

      {/* Latest Videos - show randomized content */}
      {isMobile ? (
        <MobileContentRow
          title="Latest Videos"
          items={mapToContentRow(shuffleArray(contents).slice(0, 10))}
          onItemClick={handleMoreInfo}
        />
      ) : (
        <ContentRow
          title="Latest Videos"
          contents={mapToContentRow(shuffleArray(contents).slice(0, 10))}
          onMoreInfo={handleMoreInfo}
        />
      )}

      {/* Genre-based Rows */}
      {sortedGenres.map((genre) => (
        isMobile ? (
          <MobileContentRow
            key={`genre-${genre}`}
            title={genre}
            items={mapToContentRow(shuffleArray(genreGroups[genre]))}
            onItemClick={handleMoreInfo}
          />
        ) : (
          <ContentRow
            key={`genre-${genre}`}
            title={genre}
            contents={mapToContentRow(shuffleArray(genreGroups[genre]))}
            onMoreInfo={handleMoreInfo}
          />
        )
      ))}

      {/* All Videos (if more than 10) */}
      {contents.length > 10 && (
        isMobile ? (
          <MobileContentRow
            title="All Videos"
            items={mapToContentRow(shuffleArray(contents))}
            onItemClick={handleMoreInfo}
          />
        ) : (
          <ContentRow
            title="All Videos"
            contents={mapToContentRow(shuffleArray(contents))}
            onMoreInfo={handleMoreInfo}
          />
        )
      )}
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
      {heroCarousel}
      {contentRows}
      {contents.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="mb-4">No videos available from this channel yet</p>
          {canManage && (
            <Button asChild>
              <Link to={`/producer/${channel.slug}`}>Upload Your First Video</Link>
            </Button>
          )}
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
      {adOverlay}
    </>
  );
};

export default IndieChannelPage;