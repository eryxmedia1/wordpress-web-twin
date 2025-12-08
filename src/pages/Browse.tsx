import { useState, useEffect } from "react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import ComingSoonRow from "@/components/ComingSoonRow";
import MyListRow from "@/components/MyListRow";
import ContentRow from "@/components/ContentRow";
import Top10Row from "@/components/Top10Row";
import BrowseFooter from "@/components/BrowseFooter";
import ContentDetailModal from "@/components/ContentDetailModal";
import GenresList from "@/components/GenresList";
import PromoBanner from "@/components/PromoBanner";
import BecauseYouWatchedRow from "@/components/BecauseYouWatchedRow";
import NewOnZoeRow from "@/components/NewOnZoeRow";
import WeThinkYoullLoveRow from "@/components/WeThinkYoullLoveRow";
import NextToWatchRow from "@/components/NextToWatchRow";
import ChannelRow from "@/components/ChannelRow";
import LiveTVRow from "@/components/LiveTVRow";
import MobileLayout from "@/components/mobile/MobileLayout";
import MobileHeroCarousel from "@/components/mobile/MobileHeroCarousel";
import MobileContentRow from "@/components/mobile/MobileContentRow";
import MobileContinueWatchingRow from "@/components/mobile/MobileContinueWatchingRow";
import MobileMyListRow from "@/components/mobile/MobileMyListRow";
import MobileTop10Row from "@/components/mobile/MobileTop10Row";
import MobileChannelRow from "@/components/mobile/MobileChannelRow";
import MobileContentDetailModal from "@/components/mobile/MobileContentDetailModal";
import MobileLiveTVRow from "@/components/mobile/MobileLiveTVRow";

interface Content {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  logo_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  genre: string | null;
  rating: string | null;
  release_year: number | null;
  type: string;
  featured: boolean | null;
  is_zoe_original: boolean | null;
  top_rank: number | null;
  maturity_rating: string | null;
  created_at?: string;
}

// Fisher-Yates shuffle algorithm for randomizing content order
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Channel names for network rows - ordered after TV Series
const CHANNELS = [
  "Boss Mogul TV",
  "Caught On Camera",
  "Cap Village Media",
  "Zoe RatedTV",
  "MadFaceTV",
  "AyiTV",
  "MyPureTV",
  "Yard MonTV",
  "Indie Films",
  "More Networks"
];

const Browse = () => {
  const { currentProfile } = useProfile();
  const isMobile = useIsMobile();
  const [featuredContents, setFeaturedContents] = useState<Content[]>([]);
  const [movies, setMovies] = useState<Content[]>([]);
  const [tvShows, setTvShows] = useState<Content[]>([]);
  const [zoeOriginals, setZoeOriginals] = useState<Content[]>([]);
  const [top10, setTop10] = useState<Content[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      // Fetch ONLY content explicitly marked as featured for hero carousel (up to 10)
      const { data: featured } = await supabase
        .from("contents")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (featured) {
        setFeaturedContents(featured as Content[]);
      }

      // Fetch movies
      const { data: moviesData } = await supabase
        .from("contents")
        .select("*")
        .eq("type", "movie")
        .order("created_at", { ascending: false })
        .limit(20);

      if (moviesData) {
        setMovies(shuffleArray(moviesData as Content[]));
      }

      // Fetch TV shows
      const { data: showsData } = await supabase
        .from("contents")
        .select("*")
        .eq("type", "show")
        .order("created_at", { ascending: false })
        .limit(20);

      if (showsData) {
        setTvShows(shuffleArray(showsData as Content[]));
      }

      // Fetch Zoe Originals
      const { data: originalsData } = await supabase
        .from("contents")
        .select("*")
        .eq("is_zoe_original", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (originalsData) {
        setZoeOriginals(shuffleArray(originalsData as Content[]));
      }

      // Fetch Top 10
      const { data: top10Data } = await supabase
        .from("contents")
        .select("*")
        .not("top_rank", "is", null)
        .order("top_rank", { ascending: true })
        .limit(10);

      if (top10Data) {
        setTop10(top10Data as Content[]);
      }

      setIsLoading(false);
    };

    fetchContent();
  }, []);

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

  const mapToTop10 = (items: Content[]) =>
    items.map((item, index) => ({
      id: item.id,
      title: item.title,
      posterUrl: item.poster_url || "/placeholder.svg",
      rank: item.top_rank || index + 1,
      trailerUrl: item.trailer_url || undefined,
      videoUrl: item.video_url || undefined,
      rating: item.maturity_rating || undefined,
      year: item.release_year?.toString() || undefined,
      genre: item.genre || undefined,
    }));


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <MobileLayout>
        {/* Mobile Hero Carousel */}
        <MobileHeroCarousel
          contents={featuredContents}
          onMoreInfo={handleMoreInfo}
        />

        {/* Mobile Content Rows */}
        <div className="space-y-2 pb-4">
          {/* Continue Watching */}
          <MobileContinueWatchingRow onItemClick={handleMoreInfo} seeAllLink="/category/continue-watching" />

          {/* My List */}
          <MobileMyListRow onItemClick={handleMoreInfo} seeAllLink="/category/my-list" />

          {/* Zoe Originals */}
          {zoeOriginals.length > 0 && (
            <MobileContentRow
              title="Only on Zoe RatedTV"
              items={mapToContentRow(zoeOriginals)}
              onItemClick={handleMoreInfo}
              seeAllLink="/category/originals"
            />
          )}

          {/* We Think You'll Love */}
          <MobileContentRow
            title="We Think You'll Love These"
            items={mapToContentRow([...movies, ...tvShows].slice(0, 10))}
            onItemClick={handleMoreInfo}
            seeAllLink="/category/we-think-youll-love"
          />

          {/* Top 10 with large numbers - Above New on Zoe RatedTV */}
          {top10.length > 0 && (
            <MobileTop10Row
              title="Top 10 on Zoe RatedTV"
              items={mapToTop10(top10)}
              onItemClick={handleMoreInfo}
              seeAllLink="/category/top-10"
            />
          )}

          {/* New on Zoe RatedTV */}
          <MobileContentRow
            title="New on Zoe RatedTV"
            items={mapToContentRow([...movies, ...tvShows].sort((a, b) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            ).slice(0, 10))}
            onItemClick={handleMoreInfo}
            seeAllLink="/category/new"
          />

          {/* Movies */}
          {movies.length > 0 && (
            <MobileContentRow
              title="Movies"
              items={mapToContentRow(movies)}
              onItemClick={handleMoreInfo}
              seeAllLink="/category/movies"
            />
          )}

          {/* Live TV Row - Above TV Series */}
          <MobileLiveTVRow />

          {/* TV Series */}
          {tvShows.length > 0 && (
            <MobileContentRow
              title="TV Series"
              items={mapToContentRow(tvShows)}
              onItemClick={handleMoreInfo}
              seeAllLink="/category/tv-shows"
            />
          )}

          {/* Network / Channel Rows */}
          {CHANNELS.map((channel) => (
            <MobileChannelRow
              key={channel}
              channelName={channel}
              onItemClick={handleMoreInfo}
              seeAllLink={`/category/${channel.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </div>

        {/* Mobile Content Detail Modal */}
        <MobileContentDetailModal
          contentId={selectedContentId}
          isOpen={!!selectedContentId}
          onClose={() => setSelectedContentId(null)}
        />
      </MobileLayout>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <ExpandingSidebar />

      {/* Hero Section - Full width breakout */}
      <div className="w-full">
        {featuredContents.length > 0 && (
          <FeaturedCarousel
            contents={featuredContents}
            onMoreInfo={handleMoreInfo}
          />
        )}
      </div>

      {/* Content Sections - offset for sidebar */}
      <div className="ml-16">
        <main className="relative z-10 px-4 md:px-8 lg:px-12 py-8 space-y-10 -mt-20">
          {/* Genre Badges */}
          <GenresList />

          {/* Continue Watching for {ProfileName} */}
          <ContinueWatchingRow onMoreInfo={handleMoreInfo} />

          {/* Coming Soon To Zoe RatedTV */}
          <ComingSoonRow onMoreInfo={handleMoreInfo} />

          {/* My List */}
          <MyListRow onMoreInfo={handleMoreInfo} />

          {/* Because You Watched Row */}
          <BecauseYouWatchedRow onMoreInfo={handleMoreInfo} />

          {/* We Think You'll Love These */}
          <WeThinkYoullLoveRow onMoreInfo={handleMoreInfo} />

          {/* Next To Watch */}
          <NextToWatchRow onMoreInfo={handleMoreInfo} />

          {/* Top 10 Shows on Zoe RatedTV - Large numbers behind posters (Above New on Zoe) */}
          {top10.length > 0 && (
            <Top10Row
              title="Top 10 on Zoe RatedTV Today"
              items={mapToTop10(top10)}
              onMoreInfo={handleMoreInfo}
              seeAllLink="/category/top-10"
            />
          )}

          {/* New on Zoe RatedTV */}
          <NewOnZoeRow onMoreInfo={handleMoreInfo} />

          {/* Only on Zoe RatedTV */}
          {zoeOriginals.length > 0 && (
            <ContentRow
              title="Only on Zoe RatedTV"
              contents={mapToContentRow(zoeOriginals)}
              seeAllLink="/category/originals"
              onMoreInfo={handleMoreInfo}
            />
          )}
          {/* Live TV Row - Above TV Series */}
          <LiveTVRow />

          {/* TV Series */}
          {tvShows.length > 0 && (
            <ContentRow
              title="TV Series"
              contents={mapToContentRow(tvShows)}
              seeAllLink="/category/tv-shows"
              onMoreInfo={handleMoreInfo}
            />
          )}

          {/* Network / Channel Rows - After TV Series */}
          {CHANNELS.map((channel) => (
            <ChannelRow
              key={channel}
              channelName={channel}
              onMoreInfo={handleMoreInfo}
            />
          ))}

          {/* Movies */}
          {movies.length > 0 && (
            <ContentRow
              title="Movies"
              contents={mapToContentRow(movies)}
              seeAllLink="/category/movies"
              onMoreInfo={handleMoreInfo}
            />
          )}

        </main>

        <BrowseFooter />
      </div>

      {/* Content Detail Modal */}
      <ContentDetailModal
        contentId={selectedContentId}
        isOpen={!!selectedContentId}
        onClose={() => setSelectedContentId(null)}
      />
    </div>
  );
};

export default Browse;
