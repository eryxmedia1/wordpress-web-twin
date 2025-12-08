import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Filter, ChevronDown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import MobileContentDetailModal from "@/components/mobile/MobileContentDetailModal";
import ContentDetailModal from "@/components/ContentDetailModal";

interface ContentItem {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  rating: string | null;
  release_year: number | null;
  genre: string | null;
  type: string;
  description: string | null;
}

const GENRES = [
  "Action", "Comedy", "Drama", "Documentary", "Horror", "Romance", 
  "Thriller", "Sci-Fi", "Fantasy", "Animation", "Family", "Crime",
  "Mystery", "Adventure", "Music", "Biography"
];

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

const RATINGS = ["G", "PG", "PG-13", "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA", "R", "NC-17"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "year-desc", label: "Year (Newest)" },
  { value: "year-asc", label: "Year (Oldest)" },
];

const ITEMS_PER_PAGE = 24;

const CategoryView = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const isMobile = useIsMobile();
  
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  
  // Filters
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Determine page title based on category
  const getTitle = () => {
    switch (category) {
      case "movies":
        return "All Movies";
      case "tv-shows":
        return "All TV Shows";
      case "my-list":
        return "My List";
      case "continue-watching":
        return "Continue Watching";
      case "new":
        return "New on Zoe RatedTV";
      case "originals":
        return "Only on Zoe RatedTV";
      case "top-10":
        return "Top 10 on Zoe RatedTV";
      case "we-think-youll-love":
        return "We Think You'll Love These";
      default:
        // Channel names - convert slug back to title case
        return category?.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') || "All Content";
    }
  };

  // Build sort order
  const getSortOrder = () => {
    switch (sortBy) {
      case "oldest":
        return { column: "created_at", ascending: true };
      case "title-asc":
        return { column: "title", ascending: true };
      case "title-desc":
        return { column: "title", ascending: false };
      case "year-desc":
        return { column: "release_year", ascending: false };
      case "year-asc":
        return { column: "release_year", ascending: true };
      default:
        return { column: "created_at", ascending: false };
    }
  };

  const fetchContent = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    const { column, ascending } = getSortOrder();
    const offset = pageNum * ITEMS_PER_PAGE;
    let data: ContentItem[] = [];

    try {
      switch (category) {
        case "movies": {
          let query = supabase
            .from("contents")
            .select("*")
            .eq("type", "movie")
            .order(column, { ascending })
            .range(offset, offset + ITEMS_PER_PAGE - 1);
          
          if (selectedGenre) query = query.ilike("genre", `%${selectedGenre}%`);
          if (selectedYear) query = query.eq("release_year", parseInt(selectedYear));
          if (selectedRating) query = query.eq("rating", selectedRating);
          
          const result = await query;
          data = (result.data || []) as ContentItem[];
          break;
        }

        case "tv-shows": {
          let query = supabase
            .from("contents")
            .select("*")
            .eq("type", "show")
            .order(column, { ascending })
            .range(offset, offset + ITEMS_PER_PAGE - 1);
          
          if (selectedGenre) query = query.ilike("genre", `%${selectedGenre}%`);
          if (selectedYear) query = query.eq("release_year", parseInt(selectedYear));
          if (selectedRating) query = query.eq("rating", selectedRating);
          
          const result = await query;
          data = (result.data || []) as ContentItem[];
          break;
        }

        case "my-list": {
          if (!currentProfile?.id) {
            data = [];
            break;
          }
          const { data: favorites } = await supabase
            .from("favorites")
            .select(`content_id, contents (*)`)
            .eq("profile_id", currentProfile.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + ITEMS_PER_PAGE - 1);
          
          data = (favorites?.map((f: any) => f.contents).filter(Boolean) || []) as ContentItem[];
          break;
        }

        case "continue-watching": {
          if (!currentProfile?.id) {
            data = [];
            break;
          }
          const { data: watchHistory } = await supabase
            .from("watch_history")
            .select(`content_id, progress_percent, contents (*)`)
            .eq("profile_id", currentProfile.id)
            .gt("progress_percent", 0)
            .lt("progress_percent", 95)
            .order("last_watched_at", { ascending: false })
            .range(offset, offset + ITEMS_PER_PAGE - 1);
          
          data = (watchHistory?.map((w: any) => w.contents).filter(Boolean) || []) as ContentItem[];
          break;
        }

        case "new": {
          let query = supabase
            .from("contents")
            .select("*")
            .order("created_at", { ascending: false })
            .range(offset, offset + ITEMS_PER_PAGE - 1);
          
          if (selectedGenre) query = query.ilike("genre", `%${selectedGenre}%`);
          if (selectedYear) query = query.eq("release_year", parseInt(selectedYear));
          if (selectedRating) query = query.eq("rating", selectedRating);
          
          const result = await query;
          data = (result.data || []) as ContentItem[];
          break;
        }

        case "originals": {
          let query = supabase
            .from("contents")
            .select("*")
            .eq("is_zoe_original", true)
            .order(column, { ascending })
            .range(offset, offset + ITEMS_PER_PAGE - 1);
          
          if (selectedGenre) query = query.ilike("genre", `%${selectedGenre}%`);
          if (selectedYear) query = query.eq("release_year", parseInt(selectedYear));
          if (selectedRating) query = query.eq("rating", selectedRating);
          
          const result = await query;
          data = (result.data || []) as ContentItem[];
          break;
        }

        case "top-10": {
          const { data: result } = await supabase
            .from("contents")
            .select("*")
            .not("top_rank", "is", null)
            .order("top_rank", { ascending: true })
            .limit(10);
          
          data = (result || []) as ContentItem[];
          break;
        }

        case "we-think-youll-love": {
          let query = supabase
            .from("contents")
            .select("*")
            .order(column, { ascending })
            .range(offset, offset + ITEMS_PER_PAGE - 1);
          
          if (selectedGenre) query = query.ilike("genre", `%${selectedGenre}%`);
          if (selectedYear) query = query.eq("release_year", parseInt(selectedYear));
          if (selectedRating) query = query.eq("rating", selectedRating);
          
          const result = await query;
          data = (result.data || []) as ContentItem[];
          break;
        }

        default: {
          // Channel/Network name - convert slug back to channel name
          const channelName = category?.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ') || "";
          
          let query = supabase
            .from("contents")
            .select("*")
            .contains("channels", [channelName])
            .order(column, { ascending })
            .range(offset, offset + ITEMS_PER_PAGE - 1);
          
          if (selectedGenre) query = query.ilike("genre", `%${selectedGenre}%`);
          if (selectedYear) query = query.eq("release_year", parseInt(selectedYear));
          if (selectedRating) query = query.eq("rating", selectedRating);
          
          const result = await query;
          data = (result.data || []) as ContentItem[];
          break;
        }
      }

      setHasMore(data.length === ITEMS_PER_PAGE);
      
      if (append) {
        setItems(prev => [...prev, ...data]);
      } else {
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [category, currentProfile?.id, selectedGenre, selectedYear, selectedRating, sortBy]);

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(0);
    setItems([]);
    setHasMore(true);
    fetchContent(0, false);
  }, [category, selectedGenre, selectedYear, selectedRating, sortBy, currentProfile?.id]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchContent(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, isLoading, page, fetchContent]);

  const handleItemClick = (id: string) => {
    setSelectedContentId(id);
  };

  const clearFilters = () => {
    setSelectedGenre(null);
    setSelectedYear(null);
    setSelectedRating(null);
    setSortBy("newest");
  };

  const activeFilterCount = [selectedGenre, selectedYear, selectedRating].filter(Boolean).length;

  const renderFilters = () => (
    <div className={`${showFilters || !isMobile ? 'block' : 'hidden'} space-y-4`}>
      <div className="flex flex-wrap gap-3">
        {/* Genre Filter */}
        <Select value={selectedGenre || "all"} onValueChange={(v) => setSelectedGenre(v === "all" ? null : v)}>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {GENRES.map((genre) => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year Filter */}
        <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? null : v)}>
          <SelectTrigger className="w-[120px] bg-card border-border">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {YEARS.map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Rating Filter */}
        <Select value={selectedRating || "all"} onValueChange={(v) => setSelectedRating(v === "all" ? null : v)}>
          <SelectTrigger className="w-[120px] bg-card border-border">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {RATINGS.map((rating) => (
              <SelectItem key={rating} value={rating}>{rating}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGenre && (
            <Badge variant="secondary" className="gap-1">
              {selectedGenre}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedGenre(null)} />
            </Badge>
          )}
          {selectedYear && (
            <Badge variant="secondary" className="gap-1">
              {selectedYear}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedYear(null)} />
            </Badge>
          )}
          {selectedRating && (
            <Badge variant="secondary" className="gap-1">
              {selectedRating}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedRating(null)} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No content found.</p>
          {activeFilterCount > 0 && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear filters and try again
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card">
                <img
                  src={item.poster_url || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {item.rating && (
                  <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 rounded text-xs font-medium text-foreground">
                    {item.rating}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground line-clamp-2">
                {item.title}
              </p>
              {item.release_year && (
                <p className="text-xs text-muted-foreground">{item.release_year}</p>
              )}
            </div>
          ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {isLoadingMore && (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          )}
          {!hasMore && items.length > 0 && (
            <p className="text-muted-foreground text-sm">You've reached the end</p>
          )}
        </div>
      </>
    );
  };

  if (isMobile) {
    return (
      <MobileLayout>
        <div className="px-4 pt-4 pb-20">
          {/* Header with back button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">{getTitle()}</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {renderFilters()}

          <div className="mt-4">
            {renderContent()}
          </div>
        </div>

        <MobileContentDetailModal
          contentId={selectedContentId}
          isOpen={!!selectedContentId}
          onClose={() => setSelectedContentId(null)}
        />
      </MobileLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ExpandingSidebar />

      <div className="ml-16 pt-24 px-8 pb-12">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{getTitle()}</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          {renderFilters()}
        </div>

        {renderContent()}
      </div>

      <ContentDetailModal
        contentId={selectedContentId}
        isOpen={!!selectedContentId}
        onClose={() => setSelectedContentId(null)}
      />
    </div>
  );
};

export default CategoryView;
