import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import GenresList from "@/components/GenresList";
import { supabase } from "@/integrations/supabase/client";
import ReactPlayer from "react-player";

interface ContentItem {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  genre: string | null;
  release_year: number | null;
  rating: string | null;
  type: string;
  description: string | null;
  trailer_url: string | null;
  video_url: string | null;
}

const GenreView = () => {
  const { genreId } = useParams<{ genreId: string }>();
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchGenreContent = async () => {
      setLoading(true);
      
      let query = supabase
        .from('contents')
        .select('id, title, poster_url, backdrop_url, genre, release_year, rating, type, description, trailer_url, video_url')
        .not('poster_url', 'is', null);
      
      if (genreId) {
        // Use ILIKE for case-insensitive partial match (e.g., "Action" matches "Action, Drama")
        query = query.ilike('genre', `%${genreId}%`);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) {
        console.error('Error fetching genre content:', error);
        setMovies([]);
      } else {
        setMovies(data || []);
      }
      setLoading(false);
    };
    
    fetchGenreContent();
  }, [genreId]);
  
  const formatGenreName = (id: string | undefined) => {
    if (!id) return "All Genres";
    return id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-32 pb-16 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 capitalize">
          {formatGenreName(genreId)}
        </h1>
        
        <GenresList className="mb-10" />
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : movies.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">{formatGenreName(genreId)} Content</h2>
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
                      <div className="h-full w-full bg-card rounded-lg overflow-hidden border border-border shadow-xl animate-fade-in">
                        <div className="relative h-[280px]">
                          {/* Auto-play trailer/video on hover */}
                          {(movie.trailer_url || movie.video_url) ? (
                            <ReactPlayer
                              url={movie.trailer_url || movie.video_url || ''}
                              playing={true}
                              muted={true}
                              loop={true}
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
                          ) : (
                            <img 
                              src={movie.poster_url || '/placeholder.svg'}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                          
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="font-bold text-white truncate mb-1">{movie.title}</h3>
                            <div className="text-xs text-gray-300 mb-3 flex items-center">
                              {movie.release_year} {movie.genre && `• ${movie.genre}`}
                              {movie.rating && 
                                <span className="ml-auto bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">
                                  {movie.rating}
                                </span>
                              }
                            </div>
                            
                            <div className="flex space-x-2">
                              <Link to={`/watch/${movie.id}?trailer=true`}>
                                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4">
                                  <Play className="h-4 w-4 mr-1" />
                                  Trailer
                                </Button>
                              </Link>
                              <Link to={`/watch/${movie.id}`}>
                                <Button variant="outline" size="sm" className="rounded-full border-border hover:bg-muted px-4">
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
                            src={movie.poster_url || '/placeholder.svg'}
                            alt={movie.title}
                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          {movie.rating && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 text-xs rounded-sm">
                              {movie.rating}
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-medium truncate">{movie.title}</h3>
                        <div className="text-xs text-muted-foreground">
                          {movie.release_year} {movie.type && `• ${movie.type}`}
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
            <p className="text-xl text-muted-foreground">No content found in this genre.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GenreView;
