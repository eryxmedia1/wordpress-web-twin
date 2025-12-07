import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import ContentCarousel from "@/components/ContentCarousel";
import GenresList from "@/components/GenresList";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import PromoBanner from "@/components/PromoBanner";
import Top10Row from "@/components/Top10Row";
import FeaturedContentCard from "@/components/FeaturedContentCard";
import CategoryCircles from "@/components/CategoryCircles";
import ExclusiveVideos from "@/components/ExclusiveVideos";
import TopNews from "@/components/TopNews";
import BrowseFooter from "@/components/BrowseFooter";

// Mock data
const trendingMovies = [
  { id: "1", title: "John Wick 4", posterUrl: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", rating: "8.2", year: "2023", category: "Action/Thriller" },
  { id: "2", title: "Marvel The Marvels", posterUrl: "https://image.tmdb.org/t/p/w500/Ag3D9qXjhJ2FUkrlJ0Cv1pgxqYQ.jpg", rating: "7.4", year: "2023", category: "Action/Sci-Fi" },
  { id: "3", title: "The White Lotus", posterUrl: "https://image.tmdb.org/t/p/w500/cBl6XTth52P9Rib0cCaPG0r1EGT.jpg", rating: "8.7", year: "2022", category: "Drama/Comedy" },
  { id: "4", title: "The Post", posterUrl: "https://image.tmdb.org/t/p/w500/qyRwj5VvuTRdJ76o2grP93grNxt.jpg", rating: "7.5", year: "2018", category: "Drama/Historical" },
  { id: "5", title: "In the Air", posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", rating: "8.0", year: "2021", category: "Drama" },
  { id: "6", title: "The Last Emperor", posterUrl: "https://image.tmdb.org/t/p/w500/saZGHmEyGPJSbT3oyJlNyNQbatD.jpg", rating: "8.8", year: "1987", category: "Drama/Historical" }
];

const exclusiveMovies = [
  { id: "10", title: "The Holdovers", posterUrl: "https://image.tmdb.org/t/p/w500/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg", rating: "8.5", year: "2023", category: "Drama/Comedy" },
  { id: "11", title: "The Bikeriders", posterUrl: "https://image.tmdb.org/t/p/w500/qpyaW4xUPeIiYA5ckg5zAZFHvsb.jpg", rating: "7.9", year: "2023", category: "Crime/Drama" },
  { id: "12", title: "The White House Down", posterUrl: "https://image.tmdb.org/t/p/w500/1jcLMx9U5yChTrMPzGRVF2iw4CL.jpg", rating: "7.3", year: "2023", category: "Action/Thriller" },
  { id: "13", title: "City Hunter", posterUrl: "https://image.tmdb.org/t/p/w500/jOGPnX9Ufb3XyT8YW19G7TLrRRU.jpg", rating: "7.7", year: "2023", category: "Action/Comedy" },
  { id: "14", title: "The Sleeping Angel", posterUrl: "https://image.tmdb.org/t/p/w500/8xV47NDrjdZDpYUtcKYNLvbGTrI.jpg", rating: "6.9", year: "2023", category: "Thriller/Mystery" }
];

const tvSeries = [
  { id: "30", title: "Ripley", posterUrl: "https://image.tmdb.org/t/p/w500/2NUuZzOIyZCdm0zAOOvtOGmIFKL.jpg", rating: "8.4", year: "2023", category: "Drama/Thriller" },
  { id: "31", title: "Shogun", posterUrl: "https://image.tmdb.org/t/p/w500/x15pCJmxmJ9fK7VwFzXyGbQpVYQ.jpg", rating: "9.1", year: "2024", category: "Drama/Historical" },
  { id: "32", title: "The Last of Us", posterUrl: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg", rating: "8.7", year: "2023", category: "Drama/Action" },
  { id: "33", title: "Fallout", posterUrl: "https://image.tmdb.org/t/p/w500/6oNm06TPz2vGiPc2I52oXW3JwPS.jpg", rating: "8.6", year: "2024", category: "Sci-Fi/Adventure" }
];

// Top 10 data with large rankings
const top10Data = [
  { id: "1", title: "John Wick 4", posterUrl: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", rank: 1 },
  { id: "2", title: "Oppenheimer", posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", rank: 2 },
  { id: "3", title: "Barbie", posterUrl: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", rank: 3 },
  { id: "4", title: "The Creator", posterUrl: "https://image.tmdb.org/t/p/w500/vBZ0qvaRxqEhZwl6LWmruJqWE8Z.jpg", rank: 4 },
  { id: "5", title: "Killers", posterUrl: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg", rank: 5 },
  { id: "6", title: "Dune: Part Two", posterUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg", rank: 6 },
  { id: "7", title: "Napoleon", posterUrl: "https://image.tmdb.org/t/p/w500/jE5o7y9K6pZtWNNMEw3IdpHuncR.jpg", rank: 7 },
  { id: "8", title: "Aquaman 2", posterUrl: "https://image.tmdb.org/t/p/w500/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg", rank: 8 },
  { id: "9", title: "Wonka", posterUrl: "https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg", rank: 9 },
  { id: "10", title: "Migration", posterUrl: "https://image.tmdb.org/t/p/w500/ldfCF9RhR40mppkzmftxapaHeTo.jpg", rank: 10 },
];

// TV Show Categories
const tvCategories = [
  { id: "reality", name: "Reality", imageUrl: "https://image.tmdb.org/t/p/w300/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg", color: "#ff6b6b" },
  { id: "drama", name: "Drama", imageUrl: "https://image.tmdb.org/t/p/w300/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg", color: "#4ecdc4" },
  { id: "comedy", name: "Comedy", imageUrl: "https://image.tmdb.org/t/p/w300/esFS0RPTDRqKdDv7JXcJYqjHHkb.jpg", color: "#ffe66d" },
  { id: "family", name: "Family", imageUrl: "https://image.tmdb.org/t/p/w300/zGLHX92Gk96O1DJvLil7ObJTbaL.jpg", color: "#95e1d3" },
  { id: "action", name: "Action", imageUrl: "https://image.tmdb.org/t/p/w300/suopoADq0k8YZr4dQXcU6pToj6s.jpg", color: "#ff8b94" },
  { id: "inspirational", name: "Inspirational", imageUrl: "https://image.tmdb.org/t/p/w300/pThyQovXQrw2m0s9x82twj48Jq4.jpg", color: "#a8e6cf" },
  { id: "talk", name: "Talk", imageUrl: "https://image.tmdb.org/t/p/w300/hVTcmWlwrAjslMcUxqakePi8zTR.jpg", color: "#dcd6f7" },
  { id: "news", name: "News", imageUrl: "https://image.tmdb.org/t/p/w300/yDWJYRAwMNKbIYT8ZB33qy84uzO.jpg", color: "#84a9ff" },
];

// Exclusive Videos
const exclusiveVideosData = [
  { id: "v1", title: "Behind the Scenes: House of the Dragon S2", description: "Exclusive look at the making of the most anticipated season", thumbnailUrl: "https://image.tmdb.org/t/p/w500/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg", duration: "12:34" },
  { id: "v2", title: "Director's Commentary: Oppenheimer", description: "Christopher Nolan breaks down key scenes", thumbnailUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", duration: "45:20" },
  { id: "v3", title: "Cast Interview: The Crown Final Season", description: "The cast reflects on the journey", thumbnailUrl: "https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg", duration: "18:45" },
  { id: "v4", title: "Making of: Avatar 3 Preview", description: "First look at the underwater world", thumbnailUrl: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", duration: "08:12" },
];

// Top News
const topNewsData = [
  { id: "n1", title: "Oscar Nominations 2024: Full List of Nominees Announced", excerpt: "The Academy has revealed the complete list of nominees for the 96th Academy Awards ceremony.", imageUrl: "https://image.tmdb.org/t/p/w500/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", date: "Jan 23, 2024", category: "Awards" },
  { id: "n2", title: "Marvel Announces Phase 6 Slate at Comic-Con", excerpt: "Kevin Feige reveals the future of the MCU with exciting new projects.", imageUrl: "https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg", date: "Jan 22, 2024", category: "Industry" },
  { id: "n3", title: "Streaming Wars: Netflix Reaches 250M Subscribers", excerpt: "The streaming giant celebrates a major milestone amid fierce competition.", imageUrl: "https://image.tmdb.org/t/p/w500/56v2KjBlU4XaOv9rVYEQypROD7P.jpg", date: "Jan 21, 2024", category: "Business" },
];

// Top Producers
const topProducers = [
  { id: "1", name: "Alex Johnson", image: "https://randomuser.me/api/portraits/men/21.jpg" },
  { id: "2", name: "Sarah Williams", image: "https://randomuser.me/api/portraits/women/21.jpg" },
  { id: "3", name: "Michael Chen", image: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: "4", name: "Emily Rodriguez", image: "https://randomuser.me/api/portraits/women/22.jpg" },
  { id: "5", name: "David Kim", image: "https://randomuser.me/api/portraits/men/23.jpg" },
  { id: "6", name: "Olivia Taylor", image: "https://randomuser.me/api/portraits/women/23.jpg" },
  { id: "7", name: "Robert Wilson", image: "https://randomuser.me/api/portraits/men/24.jpg" },
  { id: "8", name: "Jennifer Park", image: "https://randomuser.me/api/portraits/women/24.jpg" }
];

// Featured content for hero banner
const featuredContent = {
  id: "1",
  title: "John Wick 4",
  description: "John Wick uncovers a path to defeating the High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes.",
  posterUrl: "https://image.tmdb.org/t/p/original/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
  backdropUrl: "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg",
  rating: "8.2",
  year: "2023",
  length: "2h 49m",
  category: "Action/Thriller"
};

const Browse = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch movies from DB
  const { data: dbMovies = [] } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('type', 'movie')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch TV shows from DB
  const { data: dbTvShows = [] } = useQuery({
    queryKey: ['tvShows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('type', 'show')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0A0A1B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A1B] text-white">
      {/* Expanding Sidebar Navigation */}
      <ExpandingSidebar />
      
      {/* Main Content - offset for sidebar */}
      <main className="pl-16">
        {/* Hero Section */}
        <HeroBanner content={featuredContent} />
        
        {/* Content Sections */}
        <div className="px-4 md:px-8 space-y-12 mt-8">
          {/* Genres List */}
          <GenresList className="mt-8" />
          
          {/* Promo Banner */}
          <PromoBanner 
            title="House of the Dragon"
            subtitle="NEW SEASON"
            date="Streaming on Oct 15"
            imageUrl="https://image.tmdb.org/t/p/original/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg"
          />
          
          {/* Popular Shows & Movies */}
          <ContentRow 
            title="Popular Shows & Movies" 
            contents={dbMovies.length > 0 ? dbMovies.slice(0, 10).map(m => ({
              id: m.id,
              title: m.title,
              posterUrl: m.poster_url || '',
              rating: m.rating || '',
              year: m.release_year?.toString() || '',
              category: m.genre || ''
            })) : trendingMovies} 
            seeAllLink="/browse/trending" 
          />
          
          {/* Top 10 on ZoeRated TV */}
          <Top10Row 
            title="Top 10 on ZoeRated TV" 
            items={top10Data} 
          />
          
          {/* Featured Content Card */}
          <FeaturedContentCard
            id="featured-1"
            title="Friend Zone"
            description="A heartwarming comedy about friendship, love, and the thin line between them. Follow the journey of two best friends as they navigate the complexities of modern relationships."
            imageUrl="https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vREc0547VKqEv.jpg"
            rating="8.2"
            duration="1h 45m"
            genre="Comedy"
          />
          
          {/* New Release */}
          <ContentRow 
            title="New Release" 
            contents={exclusiveMovies} 
            seeAllLink="/browse/new" 
          />
          
          {/* TV Shows Categories */}
          <CategoryCircles 
            title="TV Shows Categories" 
            categories={tvCategories} 
          />
          
          {/* Trending TV Shows */}
          <ContentRow 
            title="Trending TV Shows" 
            contents={dbTvShows.length > 0 ? dbTvShows.slice(0, 10).map(s => ({
              id: s.id,
              title: s.title,
              posterUrl: s.poster_url || '',
              rating: s.rating || '',
              year: s.release_year?.toString() || '',
              category: s.genre || ''
            })) : tvSeries} 
            seeAllLink="/browse/tv" 
          />
          
          {/* Almost Adults section */}
          <div className="relative">
            <h2 className="text-2xl font-semibold mb-4">Almost Adults</h2>
            <p className="text-gray-300 max-w-2xl mb-6">
              Movies and shows that tackle growing up and figuring out who you 
              want to be, the awkwardness of youth and the important moments that shape us.
            </p>
            <Link to="/browse/almost-adults">
              <Button className="bg-purple-600 hover:bg-purple-700">
                See more <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <div className="mt-6">
              <ContentCarousel contents={exclusiveMovies} />
            </div>
          </div>
          
          {/* Exclusive Videos */}
          <ExclusiveVideos 
            title="Exclusive Videos" 
            videos={exclusiveVideosData} 
          />
          
          {/* Movies & TV */}
          <ContentRow 
            title="Movies & TV" 
            contents={[...trendingMovies, ...tvSeries].slice(0, 10)} 
            seeAllLink="/browse/all" 
          />
          
          {/* Top Producers */}
          <div className="py-8 border-t border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Top Artists</h2>
              <Link 
                to="/producers" 
                className="text-sm text-purple-400 flex items-center hover:text-purple-300"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4">
              {topProducers.map((producer) => (
                <Link key={producer.id} to={`/producer/${producer.id}`} className="flex-shrink-0 group">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-purple-500 transition-all">
                    <img 
                      src={producer.image}
                      alt={producer.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <p className="text-xs text-center mt-2 max-w-16 truncate text-gray-300">{producer.name}</p>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Top News */}
          <TopNews 
            title="Top News" 
            news={topNewsData} 
          />
        </div>
        
        {/* Footer */}
        <BrowseFooter />
      </main>
    </div>
  );
};

export default Browse;
