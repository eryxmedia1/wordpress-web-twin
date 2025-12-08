import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface ComingSoonContent {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  description: string | null;
  release_year: number | null;
  genre: string | null;
}

interface ComingSoonRowProps {
  onMoreInfo: (contentId: string) => void;
}

const ComingSoonRow = ({ onMoreInfo }: ComingSoonRowProps) => {
  const [items, setItems] = useState<ComingSoonContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComingSoon = async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, poster_url, backdrop_url, description, release_year, genre")
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

  if (isLoading || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          Coming Soon To Zoe RatedTV
        </h2>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex-shrink-0 w-40 md:w-48 cursor-pointer group"
              onClick={() => onMoreInfo(item.id)}
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={item.poster_url || item.backdrop_url || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Coming Soon Badge */}
                <div className="absolute top-2 left-2 bg-primary px-2 py-1 rounded text-xs font-bold text-primary-foreground">
                  COMING SOON
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Title on Hover */}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-semibold text-foreground line-clamp-2">
                    {item.title}
                  </p>
                  {item.genre && (
                    <p className="text-xs text-muted-foreground mt-1">{item.genre}</p>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm text-foreground truncate">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default ComingSoonRow;
