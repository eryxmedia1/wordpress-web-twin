
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import GenresList from "@/components/GenresList";

// Mock data that would come from your backend in production
const genreMoviesMap = {
  action: [
    { 
      id: "1", 
      title: "John Wick 4", 
      posterUrl: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
      rating: "8.2",
      year: "2023",
      category: "Action/Thriller"
    },
    { 
      id: "12", 
      title: "The White House Down", 
      posterUrl: "https://image.tmdb.org/t/p/w500/1jcLMx9U5yChTrMPzGRVF2iw4CL.jpg",
      rating: "7.3",
      year: "2023",
      category: "Action/Thriller"
    },
  ],
  comedy: [
    { 
      id: "3", 
      title: "The White Lotus", 
      posterUrl: "https://image.tmdb.org/t/p/w500/cBl6XTth52P9Rib0cCaPG0r1EGT.jpg",
      rating: "8.7",
      year: "2022",
      category: "Drama/Comedy"
    },
    { 
      id: "10", 
      title: "The Holdovers", 
      posterUrl: "https://image.tmdb.org/t/p/w500/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg",
      rating: "8.5",
      year: "2023",
      category: "Drama/Comedy"
    },
  ],
  drama: [
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
  ],
  horror: [
    { 
      id: "101", 
      title: "The Silent Path", 
      posterUrl: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd1.jpg",
      year: "2024",
      category: "Horror/Thriller",
      rating: "7.8"
    },
  ],
  thriller: [
    { 
      id: "14", 
      title: "The Sleeping Angel", 
      posterUrl: "https://image.tmdb.org/t/p/w500/8xV47NDrjdZDpYUtcKYNLvbGTrI.jpg",
      rating: "6.9",
      year: "2023",
      category: "Thriller/Mystery"
    },
  ],
};

// Default genres for all other categories not specified above
const defaultGenreMovies = [
  { 
    id: "22", 
    title: "Oppenheimer", 
    posterUrl: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    rating: "9.0",
    year: "2023",
    category: "Drama/Historical"
  },
  { 
    id: "31", 
    title: "Shogun", 
    posterUrl: "https://image.tmdb.org/t/p/w500/x15pCJmxmJ9fK7VwFzXyGbQpVYQ.jpg",
    rating: "9.1",
    year: "2024",
    category: "Drama/Historical"
  },
];

const GenreView = () => {
  const { genreId } = useParams<{ genreId: string }>();
  const [movies, setMovies] = useState<any[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  useEffect(() => {
    if (genreId && genreId in genreMoviesMap) {
      setMovies(genreMoviesMap[genreId as keyof typeof genreMoviesMap]);
    } else {
      setMovies(defaultGenreMovies);
    }
  }, [genreId]);
  
  return (
    <div className="min-h-screen bg-[#0F0F1F] text-white">
      <Navbar />
      
      <main className="pt-32 pb-16 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 capitalize">
          {genreId || "All Genres"}
        </h1>
        
        <GenresList className="mb-10" />
        
        {movies.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">{genreId ? `${genreId.charAt(0).toUpperCase()}${genreId.slice(1)}` : 'Featured'} Movies</h2>
            <div className="relative">
              <div className="flex flex-wrap gap-6">
                {movies.map((movie) => (
                  <div 
                    key={movie.id}
                    className={`transition-all duration-300 ease-in-out ${
                      hoveredId === movie.id ? "w-[350px]" : "w-[180px]"
                    }`}
                    onMouseEnter={() => setHoveredId(movie.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {hoveredId === movie.id ? (
                      <div className="h-full w-full bg-black/90 rounded-lg overflow-hidden border border-gray-800 shadow-xl animate-fade-in">
                        <div className="relative h-full">
                          <img 
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                          
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/70">
                            <h3 className="font-bold text-white truncate mb-1">{movie.title}</h3>
                            <div className="text-xs text-gray-300 mb-3 flex items-center">
                              {movie.year} {movie.category && `• ${movie.category}`}
                              {movie.rating && 
                                <span className="ml-auto bg-purple-600 text-white px-1.5 py-0.5 rounded-sm">
                                  {movie.rating}
                                </span>
                              }
                            </div>
                            
                            <div className="flex space-x-2">
                              <Link to={`/watch/${movie.id}?trailer=true`}>
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 rounded-full px-4">
                                  <Play className="h-4 w-4 mr-1" />
                                  Trailer
                                </Button>
                              </Link>
                              <Link to={`/watch/${movie.id}`}>
                                <Button variant="outline" size="sm" className="rounded-full border-white/40 hover:bg-white/10 px-4">
                                  <Info className="h-4 w-4 mr-1" />
                                  Detail
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="block relative cursor-pointer overflow-hidden">
                        <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2">
                          <img 
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                          />
                          {movie.rating && (
                            <div className="absolute top-2 right-2 bg-purple-600 text-white px-1.5 py-0.5 text-xs rounded-sm">
                              {movie.rating}
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-medium truncate">{movie.title}</h3>
                        <div className="text-xs text-gray-400">
                          {movie.year} {movie.category && `• ${movie.category}`}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">No movies found in this genre.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GenreView;
