import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Content {
  id: string;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  genre: string | null;
}

interface MoreLikeThisProps {
  contentId: string;
  genre: string | null;
  onSelect: () => void;
}

const MoreLikeThis = ({ contentId, genre, onSelect }: MoreLikeThisProps) => {
  const [items, setItems] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      let query = supabase
        .from("contents")
        .select("id, title, poster_url, release_year, genre")
        .neq("id", contentId)
        .limit(12);

      // Filter by same genre if available
      if (genre) {
        query = query.ilike("genre", `%${genre.split(",")[0].trim()}%`);
      }

      const { data } = await query;

      if (data) {
        setItems(data);
      }
      setIsLoading(false);
    };

    fetchSimilar();
  }, [contentId, genre]);

  if (isLoading || items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">More Like This</h3>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative rounded-lg overflow-hidden group cursor-pointer"
          >
            <img
              src={item.poster_url || "/placeholder.svg"}
              alt={item.title}
              className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
              <Link
                to={`/watch/${item.id}`}
                className="p-2 rounded-full bg-primary text-primary-foreground"
                onClick={onSelect}
              >
                <Play className="w-4 h-4 fill-current" />
              </Link>
              <p className="text-xs text-white text-center line-clamp-2">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoreLikeThis;
