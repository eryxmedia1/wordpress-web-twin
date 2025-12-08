import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const CategoryView = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

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
        // Channel names
        return category?.replace(/-/g, " ") || "All Content";
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      let query;

      switch (category) {
        case "movies":
          query = supabase
            .from("contents")
            .select("*")
            .eq("type", "movie")
            .order("created_at", { ascending: false });
          break;

        case "tv-shows":
          query = supabase
            .from("contents")
            .select("*")
            .eq("type", "show")
            .order("created_at", { ascending: false });
          break;

        case "my-list":
          if (!currentProfile?.id) {
            setItems([]);
            setIsLoading(false);
            return;
          }
          const { data: favorites } = await supabase
            .from("favorites")
            .select(`
              content_id,
              contents (*)
            `)
            .eq("profile_id", currentProfile.id)
            .order("created_at", { ascending: false });
          
          if (favorites) {
            const contentItems = favorites
              .map((f: any) => f.contents)
              .filter(Boolean) as ContentItem[];
            setItems(contentItems);
          }
          setIsLoading(false);
          return;

        case "continue-watching":
          if (!currentProfile?.id) {
            setItems([]);
            setIsLoading(false);
            return;
          }
          const { data: watchHistory } = await supabase
            .from("watch_history")
            .select(`
              content_id,
              progress_percent,
              contents (*)
            `)
            .eq("profile_id", currentProfile.id)
            .gt("progress_percent", 0)
            .lt("progress_percent", 95)
            .order("last_watched_at", { ascending: false });
          
          if (watchHistory) {
            const contentItems = watchHistory
              .map((w: any) => w.contents)
              .filter(Boolean) as ContentItem[];
            setItems(contentItems);
          }
          setIsLoading(false);
          return;

        case "new":
          query = supabase
            .from("contents")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
          break;

        case "originals":
          query = supabase
            .from("contents")
            .select("*")
            .eq("is_zoe_original", true)
            .order("created_at", { ascending: false });
          break;

        case "top-10":
          query = supabase
            .from("contents")
            .select("*")
            .not("top_rank", "is", null)
            .order("top_rank", { ascending: true })
            .limit(10);
          break;

        case "we-think-youll-love":
          query = supabase
            .from("contents")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(30);
          break;

        default:
          // Channel/Network name - convert slug back to channel name
          const channelName = category?.replace(/-/g, " ") || "";
          query = supabase
            .from("contents")
            .select("*")
            .contains("channels", [channelName])
            .order("created_at", { ascending: false });
          break;
      }

      if (query) {
        const { data, error } = await query;
        if (!error && data) {
          setItems(data as ContentItem[]);
        }
      }
      setIsLoading(false);
    };

    fetchContent();
  }, [category, currentProfile?.id]);

  const handleItemClick = (id: string) => {
    setSelectedContentId(id);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-primary text-xl">Loading...</div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No content found.</p>
        </div>
      );
    }

    return (
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
    );
  };

  if (isMobile) {
    return (
      <MobileLayout>
        <div className="px-4 pt-4 pb-20">
          {/* Header with back button */}
          <div className="flex items-center gap-3 mb-6">
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

          {renderContent()}
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
        <div className="flex items-center gap-4 mb-8">
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
