import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Play, Info, X } from "lucide-react";
import ContentDetailModal from "@/components/ContentDetailModal";
import MobileSearchPage from "@/components/mobile/MobileSearchPage";
import MobileContentDetailModal from "@/components/mobile/MobileContentDetailModal";

interface Content {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  genre: string | null;
  rating: string | null;
  release_year: number | null;
  type: string;
}

const genres = [
  "Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", 
  "Documentary", "Thriller", "Animation", "Family", "Mystery", "Adventure"
];

const contentTypes = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "show", label: "TV Shows" },
];

const Search = () => {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const [results, setResults] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [trendingContent, setTrendingContent] = useState<Content[]>([]);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      fetchTrending();
    }
  }, [query, selectedGenre, selectedType]);

  const fetchTrending = async () => {
    const { data } = await supabase
      .from("contents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12);
    
    if (data) {
      setTrendingContent(data as Content[]);
    }
  };

  const performSearch = async (term: string) => {
    setIsLoading(true);
    
    let queryBuilder = supabase
      .from("contents")
      .select("*")
      .ilike("title", `%${term}%`);

    if (selectedGenre) {
      queryBuilder = queryBuilder.ilike("genre", `%${selectedGenre}%`);
    }

    if (selectedType !== "all") {
      queryBuilder = queryBuilder.eq("type", selectedType as "movie" | "show");
    }

    const { data, error } = await queryBuilder.limit(50);

    if (data && !error) {
      setResults(data as Content[]);
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre);
  };

  const handleTypeClick = (type: string) => {
    setSelectedType(type);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchParams({});
    setResults([]);
  };

  const displayContent = query ? results : trendingContent;

  // Mobile layout
  if (isMobile) {
    return (
      <>
        <MobileSearchPage onItemClick={(id) => setSelectedContentId(id)} />
        <MobileContentDetailModal
          contentId={selectedContentId}
          isOpen={!!selectedContentId}
          onClose={() => setSelectedContentId(null)}
        />
      </>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 px-4 md:px-8 lg:px-12 pb-12">
        {/* Search Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search movies, TV shows, genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-6 text-lg bg-card border-border focus:border-secondary rounded-lg"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Content Type Filter */}
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeClick(type.id)}
                className={selectedType === type.id 
                  ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" 
                  : "border-border hover:border-secondary/50"
                }
              >
                {type.label}
              </Button>
            ))}
          </div>

          {/* Genre Filter */}
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                className={`cursor-pointer px-3 py-1.5 transition-all ${
                  selectedGenre === genre
                    ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary"
                    : "bg-card hover:bg-muted text-foreground border-border hover:border-secondary/50"
                }`}
                onClick={() => handleGenreClick(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          {query ? (
            <h2 className="text-xl font-semibold text-foreground">
              {isLoading ? "Searching..." : `${results.length} results for "${query}"`}
            </h2>
          ) : (
            <h2 className="text-xl font-semibold text-foreground">Trending Now</h2>
          )}
        </div>

        {/* Results Grid */}
        {displayContent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayContent.map((content) => (
              <div
                key={content.id}
                className="group relative cursor-pointer overflow-hidden rounded-lg bg-card transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:z-10"
              >
                <div className="aspect-[2/3] overflow-hidden">
                  <img
                    src={content.poster_url || "/placeholder.svg"}
                    alt={content.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  {content.rating && (
                    <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-1.5 py-0.5 text-xs font-medium rounded">
                      {content.rating}
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                          asChild
                        >
                          <Link to={`/watch/${content.id}`}>
                            <Play className="w-4 h-4 mr-1 fill-current" />
                            Play
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-muted-foreground/50"
                          onClick={() => setSelectedContentId(content.id)}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="text-sm font-medium truncate text-foreground">
                    {content.title}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {content.release_year} {content.genre && `• ${content.genre}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : query && !isLoading ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              No results found for "{query}"
            </p>
            <p className="text-muted-foreground mb-8">
              Try adjusting your search or filters
            </p>
            {trendingContent.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Popular Right Now
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
                  {trendingContent.slice(0, 6).map((content) => (
                    <Link
                      key={content.id}
                      to={`/watch/${content.id}`}
                      className="group"
                    >
                      <div className="aspect-[2/3] overflow-hidden rounded-md bg-card">
                        <img
                          src={content.poster_url || "/placeholder.svg"}
                          alt={content.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-sm mt-2 truncate text-foreground">{content.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Content Detail Modal */}
      <ContentDetailModal
        contentId={selectedContentId}
        isOpen={!!selectedContentId}
        onClose={() => setSelectedContentId(null)}
      />
    </div>
  );
};

export default Search;
