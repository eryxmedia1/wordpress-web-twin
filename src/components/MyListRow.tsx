import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";

interface FavoriteItem {
  id: string;
  content_id: string;
  content: {
    id: string;
    title: string;
    poster_url: string | null;
    type: string;
    release_year: number | null;
    genre: string | null;
  };
}

interface MyListRowProps {
  onMoreInfo: (contentId: string) => void;
}

const MyListRow = ({ onMoreInfo }: MyListRowProps) => {
  const { currentProfile } = useProfile();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          content_id,
          content:contents(id, title, poster_url, type, release_year, genre)
        `)
        .eq("profile_id", currentProfile.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setItems(data.filter(item => item.content) as unknown as FavoriteItem[]);
      }
      setIsLoading(false);
    };

    fetchFavorites();
  }, [currentProfile?.id]);

  if (isLoading || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">My List</h2>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex-shrink-0 w-36 md:w-44 group cursor-pointer"
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={item.content.poster_url || "/placeholder.svg"}
                  alt={item.content.title}
                  className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link
                    to={`/watch/${item.content.id}`}
                    className="p-2 rounded-full bg-primary text-primary-foreground"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </Link>
                  <button
                    onClick={() => onMoreInfo(item.content.id)}
                    className="p-2 rounded-full bg-secondary text-secondary-foreground"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-foreground truncate">
                {item.content.title}
              </p>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default MyListRow;
