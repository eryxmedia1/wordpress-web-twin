import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";

interface FavoriteItem {
  id: string;
  content_id: string;
  contents: {
    id: string;
    title: string;
    poster_url: string | null;
    rating: string | null;
    release_year: number | null;
  };
}

interface MobileMyListRowProps {
  onItemClick: (id: string) => void;
}

const MobileMyListRow = ({ onItemClick }: MobileMyListRowProps) => {
  const { currentProfile } = useProfile();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyList = async () => {
      if (!currentProfile?.id) return;

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          content_id,
          contents (
            id,
            title,
            poster_url,
            rating,
            release_year
          )
        `)
        .eq("profile_id", currentProfile.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (!error && data) {
        setItems(data as unknown as FavoriteItem[]);
      }
      setIsLoading(false);
    };

    fetchMyList();
  }, [currentProfile?.id]);

  if (isLoading || items.length === 0) return null;

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-semibold text-foreground">My List</h2>
        <button className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          See All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4">
        {items.map((item) => {
          const content = item.contents;
          if (!content) return null;

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(content.id)}
              className="flex-shrink-0 w-[110px] cursor-pointer group"
            >
              {/* Poster Card */}
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card">
                <img
                  src={content.poster_url || "/placeholder.svg"}
                  alt={content.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Rating Badge */}
                {content.rating && (
                  <div className="absolute top-1.5 left-1.5 bg-background/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground">
                    {content.rating}
                  </div>
                )}
              </div>

              {/* Title */}
              <p className="mt-1.5 text-xs text-foreground line-clamp-2 leading-tight">
                {content.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileMyListRow;
