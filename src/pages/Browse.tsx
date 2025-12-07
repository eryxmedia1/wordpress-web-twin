import { useState, useEffect } from "react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import MyListRow from "@/components/MyListRow";
import ContentRow from "@/components/ContentRow";
import Top10Row from "@/components/Top10Row";
import BrowseFooter from "@/components/BrowseFooter";
import ContentDetailModal from "@/components/ContentDetailModal";
import GenresList from "@/components/GenresList";
import PromoBanner from "@/components/PromoBanner";
import CategoryCircles from "@/components/CategoryCircles";
import ExclusiveVideos from "@/components/ExclusiveVideos";
import TopNews from "@/components/TopNews";
import BecauseYouWatchedRow from "@/components/BecauseYouWatchedRow";
import NewOnZoeRow from "@/components/NewOnZoeRow";
import WeThinkYoullLoveRow from "@/components/WeThinkYoullLoveRow";
import NextToWatchRow from "@/components/NextToWatchRow";
import ChannelRow from "@/components/ChannelRow";

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
}

// Channel names for network rows
const CHANNELS = [
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
  const [featuredContents, setFeaturedContents] = useState<Content[]>([]);
  const [movies, setMovies] = useState<Content[]>([]);
  const [tvShows, setTvShows] = useState<Content[]>([]);
  const [zoeOriginals, setZoeOriginals] = useState<Content[]>([]);
  const [top10, setTop10] = useState<Content[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      // Fetch all featured content for hero carousel
      const { data: featured } = await supabase
        .from("contents")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false });

      if (featured && featured.length > 0) {
        setFeaturedContents(featured as Content[]);
      } else {
        // Fallback to latest content if none featured
        const { data: fallback } = await supabase
          .from("contents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);
        if (fallback) setFeaturedContents(fallback as Content[]);
      }

      // Fetch movies
      const { data: moviesData } = await supabase
        .from("contents")
        .select("*")
        .eq("type", "movie")
        .order("created_at", { ascending: false })
        .limit(20);

      if (moviesData) {
        setMovies(moviesData as Content[]);
      }

      // Fetch TV shows
      const { data: showsData } = await supabase
        .from("contents")
        .select("*")
        .eq("type", "show")
        .order("created_at", { ascending: false })
        .limit(20);

      if (showsData) {
        setTvShows(showsData as Content[]);
      }

      // Fetch Zoe Originals
      const { data: originalsData } = await supabase
        .from("contents")
        .select("*")
        .eq("is_zoe_original", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (originalsData) {
        setZoeOriginals(originalsData as Content[]);
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
    }));

  // Sample data for components
  const newsItems = [
    { id: "1", title: "New Season Coming", excerpt: "Get ready...", imageUrl: "/placeholder.svg", date: "Dec 5, 2025", category: "News" },
    { id: "2", title: "Interview with Director", excerpt: "Behind the scenes...", imageUrl: "/placeholder.svg", date: "Dec 4, 2025", category: "Interview" },
  ];

  const categories = [
    { id: "reality", name: "Reality", imageUrl: "/placeholder.svg", color: "#d4af37" },
    { id: "drama", name: "Drama", imageUrl: "/placeholder.svg", color: "#d4af37" },
    { id: "comedy", name: "Comedy", imageUrl: "/placeholder.svg", color: "#d4af37" },
    { id: "action", name: "Action", imageUrl: "/placeholder.svg", color: "#d4af37" },
  ];

  const exclusiveVideos = [
    { id: "1", title: "Behind the Scenes", description: "Exclusive look...", thumbnailUrl: "/placeholder.svg", duration: "5:30" },
    { id: "2", title: "Cast Interviews", description: "Meet the stars...", thumbnailUrl: "/placeholder.svg", duration: "8:45" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ExpandingSidebar />

      {/* Hero Section - Full width, no sidebar offset */}
      {featuredContents.length > 0 && (
        <FeaturedCarousel
          contents={featuredContents}
          onMoreInfo={handleMoreInfo}
        />
      )}

      {/* Content Sections - offset for sidebar */}
      <div className="ml-16">
        <main className="relative z-10 px-4 md:px-8 lg:px-12 py-8 space-y-10 -mt-20">
          {/* Genre Badges */}
          <GenresList />

          {/* Continue Watching for {ProfileName} */}
          <ContinueWatchingRow onMoreInfo={handleMoreInfo} />

          {/* My List */}
          <MyListRow onMoreInfo={handleMoreInfo} />

          {/* Because You Watched Row */}
          <BecauseYouWatchedRow onMoreInfo={handleMoreInfo} />

          {/* We Think You'll Love These */}
          <WeThinkYoullLoveRow onMoreInfo={handleMoreInfo} />

          {/* New on Zoe RatedTV */}
          <NewOnZoeRow onMoreInfo={handleMoreInfo} />

          {/* Next To Watch */}
          <NextToWatchRow onMoreInfo={handleMoreInfo} />

          {/* Top 10 Shows on Zoe RatedTV */}
          {top10.length > 0 && (
            <Top10Row
              title="Top 10 on Zoe RatedTV Today"
              items={mapToTop10(top10)}
            />
          )}

          {/* Only on Zoe RatedTV */}
          {zoeOriginals.length > 0 && (
            <ContentRow
              title="Only on Zoe RatedTV"
              contents={mapToContentRow(zoeOriginals)}
              onMoreInfo={handleMoreInfo}
            />
          )}

          {/* Promo Banner */}
          <PromoBanner 
            title="PIECES OF HER"
            subtitle="Now Available"
            date="Stream Now"
            imageUrl="/placeholder.svg"
          />

          {/* Network / Channel Rows */}
          {CHANNELS.map((channel) => (
            <ChannelRow
              key={channel}
              channelName={channel}
              onMoreInfo={handleMoreInfo}
            />
          ))}

          {/* TV Series */}
          {tvShows.length > 0 && (
            <ContentRow
              title="TV Series"
              contents={mapToContentRow(tvShows)}
              seeAllLink="/genre/tv-shows"
              onMoreInfo={handleMoreInfo}
            />
          )}

          {/* Category Circles */}
          <CategoryCircles title="TV Show Categories" categories={categories} />

          {/* Movies */}
          {movies.length > 0 && (
            <ContentRow
              title="Movies"
              contents={mapToContentRow(movies)}
              seeAllLink="/genre/movies"
              onMoreInfo={handleMoreInfo}
            />
          )}

          {/* Exclusive Videos */}
          <ExclusiveVideos title="Exclusive Videos" videos={exclusiveVideos} />

          {/* Top News */}
          <TopNews title="Top News" news={newsItems} />
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
