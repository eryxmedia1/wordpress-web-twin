import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Content {
  id: string;
  title: string;
  poster_url: string | null;
  rating: string | null;
}

interface MobileChannelRowProps {
  channelName: string;
  onItemClick: (id: string) => void;
}

const MobileChannelRow = ({ channelName, onItemClick }: MobileChannelRowProps) => {
  const [items, setItems] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannelContent = async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, poster_url, rating, channels")
        .contains("channels", [channelName])
        .order("created_at", { ascending: false })
        .limit(15);

      if (!error && data) {
        setItems(data);
      }
      setIsLoading(false);
    };

    fetchChannelContent();
  }, [channelName]);

  if (isLoading || items.length === 0) return null;

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-semibold text-foreground">{channelName}</h2>
        <button className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          See All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className="flex-shrink-0 w-[110px] cursor-pointer group"
          >
            {/* Poster Card */}
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card">
              <img
                src={item.poster_url || "/placeholder.svg"}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Rating Badge */}
              {item.rating && (
                <div className="absolute top-1.5 left-1.5 bg-background/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground">
                  {item.rating}
                </div>
              )}
            </div>

            {/* Title */}
            <p className="mt-1.5 text-xs text-foreground line-clamp-2 leading-tight">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileChannelRow;
