import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, Plus, Check, ThumbsUp, Info, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";

interface ComingSoonContent {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  description: string | null;
  release_year: number | null;
  genre: string | null;
  video_url: string | null;
  trailer_url: string | null;
  maturity_rating: string | null;
  duration: string | null;
}

interface MobileComingSoonRowProps {
  onItemClick: (contentId: string) => void;
  seeAllLink?: string;
}

const MobileComingSoonRow = ({ onItemClick, seeAllLink }: MobileComingSoonRowProps) => {
  const { currentProfile } = useProfile();
  const [items, setItems] = useState<ComingSoonContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myListItems, setMyListItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchComingSoon = async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, poster_url, backdrop_url, description, release_year, genre, video_url, trailer_url, maturity_rating, duration")
        .eq("is_coming_soon", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setItems(data);
      }
      setIsLoading(false);
    };

    fetchComingSoon();
  }, []);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchUserData = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("content_id")
        .eq("profile_id", currentProfile.id);

      if (data) {
        setMyListItems(new Set(data.map(f => f.content_id)));
      }
    };

    fetchUserData();
  }, [currentProfile?.id]);

  const toggleMyList = async (contentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile?.id) return;

    const isInList = myListItems.has(contentId);

    if (isInList) {
      await supabase
        .from("favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
      setMyListItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
      toast.success("Removed from My List");
    } else {
      await supabase
        .from("favorites")
        .insert({ profile_id: currentProfile.id, content_id: contentId });
      setMyListItems(prev => new Set(prev).add(contentId));
      toast.success("Added to My List");
    }
  };

  if (isLoading || items.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Coming Soon</h2>
        </div>
        {seeAllLink && (
          <Link to={seeAllLink} className="flex items-center text-xs text-primary">
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2">
          {items.map((item) => {
            const isInMyList = myListItems.has(item.id);

            return (
              <div
                key={item.id}
                className="relative flex-shrink-0 w-28"
                onClick={() => onItemClick(item.id)}
              >
                {/* Card */}
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={item.poster_url || item.backdrop_url || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  {/* Coming Soon Badge */}
                  <div className="absolute top-1 left-1 bg-primary px-1.5 py-0.5 rounded text-[8px] font-bold text-primary-foreground">
                    COMING SOON
                  </div>
                  {/* Add to List Button */}
                  <button
                    onClick={(e) => toggleMyList(item.id, e)}
                    className={`absolute bottom-2 right-2 flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                      isInMyList 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-black/60 text-white'
                    }`}
                  >
                    {isInMyList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Title */}
                <p className="mt-1.5 text-xs text-foreground line-clamp-2 leading-tight">
                  {item.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MobileComingSoonRow;
