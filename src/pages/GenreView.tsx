import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import GenresList from "@/components/GenresList";
import { supabase } from "@/integrations/supabase/client";
import HoverPreviewCard from "@/components/HoverPreviewCard";
import ContentDetailModal from "@/components/ContentDetailModal";

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
  duration: string | null;
}

const GenreView = () => {
  const { genreId } = useParams<{ genreId: string }>();
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchGenreContent = async () => {
      setLoading(true);
      
      let query = supabase
        .from('contents')
        .select('id, title, poster_url, backdrop_url, genre, release_year, rating, type, description, trailer_url, video_url, duration')
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
                    className={`relative transition-all duration-300 ease-in-out ${
                      hoveredId === movie.id ? "w-[350px] z-50" : "w-[180px]"
                    }`}
                    onMouseEnter={() => setHoveredId(movie.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {hoveredId === movie.id ? (
                      <HoverPreviewCard
                        content={{
                          id: movie.id,
                          title: movie.title,
                          posterUrl: movie.poster_url || '/placeholder.svg',
                          videoUrl: movie.video_url,
                          trailerUrl: movie.trailer_url,
                          year: movie.release_year?.toString(),
                          rating: movie.rating || undefined,
                          genre: movie.genre || undefined,
                          duration: movie.duration || undefined,
                        }}
                        onMoreInfo={(id) => setSelectedContentId(id)}
                      />
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
      
      <ContentDetailModal
        contentId={selectedContentId}
        isOpen={!!selectedContentId}
        onClose={() => setSelectedContentId(null)}
      />
    </div>
  );
};

export default GenreView;
