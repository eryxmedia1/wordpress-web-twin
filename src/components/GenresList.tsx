import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Film, Tv, Music, Book, Video, Drama } from "lucide-react";

export interface Genre {
  id: string;
  name: string;
  icon: keyof typeof genreIcons;
}

const genreIcons = {
  "film": Film,
  "tv": Tv,
  "music": Music,
  "book": Book,
  "video": Video,
  "drama": Drama
};

const genres: Genre[] = [
  { id: "action", name: "Action", icon: "film" },
  { id: "comedy", name: "Comedy", icon: "tv" },
  { id: "drama", name: "Drama", icon: "drama" },
  { id: "horror", name: "Horror", icon: "film" },
  { id: "romance", name: "Romance", icon: "book" },
  { id: "documentary", name: "Documentary", icon: "video" },
  { id: "thriller", name: "Thriller", icon: "film" },
  { id: "family", name: "Family", icon: "tv" },
  { id: "crime", name: "Crime", icon: "film" },
  { id: "reality", name: "Reality", icon: "video" },
  { id: "music", name: "Music", icon: "music" },
  { id: "educational", name: "Educational", icon: "book" },
  { id: "gospel", name: "Gospel", icon: "music" },
  { id: "adventure", name: "Adventure", icon: "drama" },
  { id: "animation", name: "Animation", icon: "video" },
  { id: "history", name: "History", icon: "book" }
];

interface GenresListProps {
  className?: string;
}

const GenresList = ({ className }: GenresListProps) => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenreClick = (genreId: string) => {
    setSelectedGenre(genreId);
    navigate(`/browse/genres/${genreId}`);
  };

  return (
    <div className={`pt-4 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-foreground">Genres</h2>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => {
          const GenreIcon = genreIcons[genre.icon];
          const isSelected = selectedGenre === genre.id;
          
          return (
            <Badge 
              key={genre.id}
              variant={isSelected ? "default" : "outline"} 
              className={`
                cursor-pointer px-3 py-2 text-sm flex items-center gap-1.5
                transition-all duration-200
                ${isSelected 
                  ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary" 
                  : "bg-card hover:bg-muted text-foreground border-border hover:border-secondary/50"}
              `}
              onClick={() => handleGenreClick(genre.id)}
            >
              <GenreIcon className="h-4 w-4" />
              <span>{genre.name}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default GenresList;
