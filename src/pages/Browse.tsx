
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import HeroBanner from "@/components/HeroBanner";
import ContentCarousel from "@/components/ContentCarousel";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Mock data - this would come from your backend in production
const trendingMovies = [
  { 
    id: "1", 
    title: "John Wick 4", 
    posterUrl: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
    rating: "8.2",
    year: "2023",
    category: "Action/Thriller"
  },
  { 
    id: "2", 
    title: "Marvel The Marvels", 
    posterUrl: "https://image.tmdb.org/t/p/w500/Ag3D9qXjhJ2FUkrlJ0Cv1pgxqYQ.jpg",
    rating: "7.4", 
    year: "2023",
    category: "Action/Sci-Fi"
  },
  { 
    id: "3", 
    title: "The White Lotus", 
    posterUrl: "https://image.tmdb.org/t/p/w500/cBl6XTth52P9Rib0cCaPG0r1EGT.jpg",
    rating: "8.7",
    year: "2022",
    category: "Drama/Comedy"
  },
  { 
    id: "4", 
    title: "The Post", 
    posterUrl: "https://image.tmdb.org/t/p/w500/qyRwj5VvuTRdJ76o2grP93grNxt.jpg",
    rating: "7.5",
    year: "2018",
    category: "Drama/Historical"
  },
  { 
    id: "5", 
    title: "In the Air", 
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    rating: "8.0",
    year: "2021",
    category: "Drama"
  },
  { 
    id: "6", 
    title: "The Last Emperor", 
    posterUrl: "https://image.tmdb.org/t/p/w500/saZGHmEyGPJSbT3oyJlNyNQbatD.jpg",
    rating: "8.8",
    year: "1987",
    category: "Drama/Historical"
  }
];

const exclusiveMovies = [
  { 
    id: "10", 
    title: "The Holdovers", 
    posterUrl: "https://image.tmdb.org/t/p/w500/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg",
    rating: "8.5",
    year: "2023",
    category: "Drama/Comedy"
  },
  { 
    id: "11", 
    title: "The Bikeriders", 
    posterUrl: "https://image.tmdb.org/t/p/w500/qpyaW4xUPeIiYA5ckg5zAZFHvsb.jpg",
    rating: "7.9",
    year: "2023",
    category: "Crime/Drama"
  },
  { 
    id: "12", 
    title: "The White House Down", 
    posterUrl: "https://image.tmdb.org/t/p/w500/1jcLMx9U5yChTrMPzGRVF2iw4CL.jpg",
    rating: "7.3",
    year: "2023",
    category: "Action/Thriller"
  },
  { 
    id: "13", 
    title: "City Hunter", 
    posterUrl: "https://image.tmdb.org/t/p/w500/jOGPnX9Ufb3XyT8YW19G7TLrRRU.jpg",
    rating: "7.7",
    year: "2023",
    category: "Action/Comedy"
  },
  { 
    id: "14", 
    title: "The Sleeping Angel", 
    posterUrl: "https://image.tmdb.org/t/p/w500/8xV47NDrjdZDpYUtcKYNLvbGTrI.jpg",
    rating: "6.9",
    year: "2023",
    category: "Thriller/Mystery"
  }
];

const topRatedMovies = [
  { 
    id: "20", 
    title: "City Hunter", 
    posterUrl: "https://image.tmdb.org/t/p/w500/jOGPnX9Ufb3XyT8YW19G7TLrRRU.jpg",
    rating: "7.7",
    year: "2023",
    category: "Action/Comedy"
  },
  { 
    id: "21", 
    title: "Gatlopp", 
    posterUrl: "https://image.tmdb.org/t/p/w500/6hLaPTJhuebYcTqGwVkQtTHsY2S.jpg",
    rating: "8.3",
    year: "2022",
    category: "Fantasy/Comedy"
  },
  { 
    id: "22", 
    title: "Oppenheimer", 
    posterUrl: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    rating: "9.0",
    year: "2023",
    category: "Drama/Historical"
  },
  { 
    id: "23", 
    title: "The Post", 
    posterUrl: "https://image.tmdb.org/t/p/w500/qyRwj5VvuTRdJ76o2grP93grNxt.jpg",
    rating: "7.5",
    year: "2018",
    category: "Drama/Historical"
  }
];

const tvSeries = [
  { 
    id: "30", 
    title: "Ripley", 
    posterUrl: "https://image.tmdb.org/t/p/w500/2NUuZzOIyZCdm0zAOOvtOGmIFKL.jpg",
    rating: "8.4",
    year: "2023",
    category: "Drama/Thriller"
  },
  { 
    id: "31", 
    title: "Shogun", 
    posterUrl: "https://image.tmdb.org/t/p/w500/x15pCJmxmJ9fK7VwFzXyGbQpVYQ.jpg",
    rating: "9.1",
    year: "2024",
    category: "Drama/Historical"
  },
  { 
    id: "32", 
    title: "The Last of Us", 
    posterUrl: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
    rating: "8.7",
    year: "2023",
    category: "Drama/Action"
  },
  { 
    id: "33", 
    title: "Fallout", 
    posterUrl: "https://image.tmdb.org/t/p/w500/6oNm06TPz2vGiPc2I52oXW3JwPS.jpg",
    rating: "8.6",
    year: "2024",
    category: "Sci-Fi/Adventure"
  }
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
  const [isLoggedIn, setIsLoggedIn] = useState(true); // For demo purposes

  return (
    <div className="min-h-screen bg-[#0F0F1F] text-white">
      <Navbar />
      
      <main className="pb-16">
        <HeroBanner content={featuredContent} />
        
        <div className="px-4 md:px-8 space-y-12 mt-8">
          <ContentRow title="Trending Movies" contents={trendingMovies} />
          
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
          
          <ContentRow title="Top of the Week" contents={topRatedMovies} />
          
          <div className="mt-12 mb-16 relative h-[250px] w-full overflow-hidden rounded-lg">
            <div className="absolute inset-0">
              <img 
                src="https://image.tmdb.org/t/p/original/5bunYe8EL2SH8lQxhC0pXobcaRL.jpg" 
                alt="Pieces of Her" 
                className="w-full h-full object-cover opacity-50"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent">
              <div className="flex h-full items-center px-6 md:px-12">
                <div className="max-w-md">
                  <h3 className="text-xs uppercase tracking-wider mb-1">A NETFLIX ORIGINAL</h3>
                  <h2 className="text-3xl font-bold mb-3">PIECES OF HER</h2>
                  <p className="text-sm mb-4">Now Available</p>
                  <Button className="bg-white text-black hover:bg-gray-200">
                    Watch Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <ContentRow title="TV Series" contents={tvSeries} />
          
          <div className="mt-12 py-8 border-t border-gray-800">
            <h2 className="text-xl font-semibold mb-6">Recommended TV Shows</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-md overflow-hidden">
                  <img 
                    src={`https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED${i}.jpg`}
                    alt={`Recommended show ${i}`}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2">
                    <h3 className="text-sm font-medium truncate">Recommended Show {i}</h3>
                    <p className="text-xs text-gray-400">2023 • Drama</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="py-8 border-t border-gray-800">
            <h2 className="text-xl font-semibold mb-6">Top Artists</h2>
            <div className="flex overflow-x-auto gap-4 pb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <img 
                      src={`https://randomuser.me/api/portraits/men/${i+20}.jpg`}
                      alt={`Artist ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="py-8 border-t border-gray-800">
            <h2 className="text-xl font-semibold mb-6">New Arrivals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-24 h-16 rounded overflow-hidden">
                    <img 
                      src={`https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd${i}.jpg`}
                      alt={`New arrival ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">New Movie Title {i}</h3>
                    <p className="text-xs text-gray-400">2024 • Thriller/Action</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Browse;
