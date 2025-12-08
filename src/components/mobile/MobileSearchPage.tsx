import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import MobileLayout from "./MobileLayout";

interface Content {
  id: string;
  title: string;
  poster_url: string | null;
  rating: string | null;
  release_year: number | null;
  type: string;
  genre: string | null;
}

interface MobileSearchPageProps {
  onItemClick: (id: string) => void;
}

const quickFilters = ["Movies", "TV Shows", "Drama", "Comedy", "Action", "Documentary"];

const MobileSearchPage = ({ onItemClick }: MobileSearchPageProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const [results, setResults] = useState<Content[]>([]);
  const [trendingContent, setTrendingContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query, activeFilter]);

  const fetchTrending = async () => {
    const { data } = await supabase
      .from("contents")
      .select("id, title, poster_url, rating, release_year, type, genre")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setTrendingContent(data);
    }
  };

  const performSearch = async (term: string) => {
    setIsLoading(true);

    let queryBuilder = supabase
      .from("contents")
      .select("id, title, poster_url, rating, release_year, type, genre")
      .ilike("title", `%${term}%`);

    if (activeFilter) {
      if (activeFilter === "Movies") {
        queryBuilder = queryBuilder.eq("type", "movie");
      } else if (activeFilter === "TV Shows") {
        queryBuilder = queryBuilder.eq("type", "show");
      } else {
        queryBuilder = queryBuilder.ilike("genre", `%${activeFilter}%`);
      }
    }

    const { data } = await queryBuilder.limit(50);

    if (data) {
      setResults(data);
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchParams({});
    setResults([]);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const displayContent = query ? results : trendingContent;
  const displayTitle = query
    ? isLoading
      ? "Searching..."
      : `${results.length} results`
    : "Trending Now";

  return (
    <MobileLayout hideHeader>
      <div className="min-h-screen bg-background pt-4 pb-24">
        {/* Search Header */}
        <div className="px-4 mb-4">
          <form onSubmit={handleSearch} className="relative">
            <div
              className={cn(
                "flex items-center gap-3 bg-card rounded-xl px-4 py-3 border-2 transition-colors",
                isFocused ? "border-primary" : "border-transparent"
              )}
            >
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search movies, shows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
              />
              {searchTerm && (
                <button type="button" onClick={clearSearch} className="text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              )}
              <button type="button" className="text-muted-foreground">
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Quick Filters */}
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Results Title */}
        <div className="px-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground">{displayTitle}</h2>
        </div>

        {/* Results Grid */}
        {displayContent.length > 0 ? (
          <div className="px-4 grid grid-cols-3 gap-2">
            {displayContent.map((content) => (
              <button
                key={content.id}
                onClick={() => onItemClick(content.id)}
                className="text-left"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card">
                  <img
                    src={content.poster_url || "/placeholder.svg"}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {content.rating && (
                    <div className="absolute top-1 left-1 bg-background/80 px-1 py-0.5 rounded text-[10px] font-medium text-foreground">
                      {content.rating}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-foreground line-clamp-2">{content.title}</p>
              </button>
            ))}
          </div>
        ) : query && !isLoading ? (
          <div className="px-4 text-center py-12">
            <p className="text-muted-foreground mb-2">No results for "{query}"</p>
            <p className="text-sm text-muted-foreground">Try different keywords or browse trending content below</p>
          </div>
        ) : null}

        {/* Show trending if no results and has query */}
        {query && results.length === 0 && !isLoading && trendingContent.length > 0 && (
          <div className="px-4 mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Trending Now</h3>
            <div className="grid grid-cols-3 gap-2">
              {trendingContent.slice(0, 9).map((content) => (
                <button
                  key={content.id}
                  onClick={() => onItemClick(content.id)}
                  className="text-left"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card">
                    <img
                      src={content.poster_url || "/placeholder.svg"}
                      alt={content.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-1 text-xs text-foreground line-clamp-2">{content.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileSearchPage;
