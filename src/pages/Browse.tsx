import { useState, useEffect } from "react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import HeroAutoplay from "@/components/HeroAutoplay";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import MyListRow from "@/components/MyListRow";
import ContentRow from "@/components/ContentRow";
import Top10Row from "@/components/Top10Row";
import BrowseFooter from "@/components/BrowseFooter";
import ContentDetailModal from "@/components/ContentDetailModal";

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

const Browse = () => {
  const { currentProfile } = useProfile();
  const [featuredContent, setFeaturedContent] = useState<Content | null>(null);
  const [movies, setMovies] = useState<Content[]>([]);
  const [tvShows, setTvShows] = useState<Content[]>([]);
  const [zoeOriginals, setZoeOriginals] = useState<Content[]>([]);
  const [top10, setTop10] = useState<Content[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      // Fetch featured content for hero
      const { data: featured } = await supabase
        .from("contents")
        .select("*")
        .eq("featured", true)
        .limit(1)
        .maybeSingle();

      if (featured) {
        setFeaturedContent(featured as Content);
      } else {
        // Fallback to first content if none featured
        const { data: fallback } = await supabase
          .from("contents")
          .select("*")
          .limit(1)
          .maybeSingle();
        if (fallback) setFeaturedContent(fallback as Content);
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
    }));

  const mapToTop10 = (items: Content[]) =>
    items.map((item, index) => ({
      id: item.id,
      title: item.title,
      posterUrl: item.poster_url || "/placeholder.svg",
      rank: item.top_rank || index + 1,
    }));

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

      {/* Hero Section */}
      {featuredContent && (
        <HeroAutoplay
          content={featuredContent}
          onMoreInfo={() => handleMoreInfo(featuredContent.id)}
        />
      )}

      {/* Content Sections */}
      <main className="relative z-10 px-4 md:px-8 lg:px-12 py-8 space-y-10 -mt-20">
        {/* Continue Watching */}
        <ContinueWatchingRow onMoreInfo={handleMoreInfo} />

        {/* My List */}
        <MyListRow onMoreInfo={handleMoreInfo} />

        {/* Only on Zoe RatedTV */}
        {zoeOriginals.length > 0 && (
          <ContentRow
            title="Only on Zoe RatedTV"
            contents={mapToContentRow(zoeOriginals)}
          />
        )}

        {/* Top 10 */}
        {top10.length > 0 && (
          <Top10Row
            title="Top 10 on Zoe RatedTV Today"
            items={mapToTop10(top10)}
          />
        )}

        {/* Movies */}
        {movies.length > 0 && (
          <ContentRow
            title="Movies"
            contents={mapToContentRow(movies)}
            seeAllLink="/genre/movies"
          />
        )}

        {/* TV Shows */}
        {tvShows.length > 0 && (
          <ContentRow
            title="TV Shows"
            contents={mapToContentRow(tvShows)}
            seeAllLink="/genre/tv-shows"
          />
        )}
      </main>

      <BrowseFooter />

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
