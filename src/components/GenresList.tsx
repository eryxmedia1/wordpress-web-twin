import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Film, Tv, Music, Book, Video, Drama } from "lucide-react";

export interface Genre {
  id: string;
  name: string;
  icon: keyof typeof genreIcons;
}

// Only use available icons from lucide-react
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
  { id: "sci-fi", name: "Sci-Fi", icon: "tv" },
  { id: "documentary", name: "Documentary", icon: "video" },
  { id: "thriller", name: "Thriller", icon: "film" },
  { id: "animation", name: "Animation", icon: "video" },
  { id: "family", name: "Family", icon: "tv" },
  { id: "mystery", name: "Mystery", icon: "book" },
  { id: "adventure", name: "Adventure", icon: "drama" }
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
    <div className={`${className}`}>
      <h2 className="text-xl font-semibold mb-4">Genres</h2>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => {
          const GenreIcon = genreIcons[genre.icon];
          const isSelected = selectedGenre === genre.id;
          
          return (
            <Badge 
              key={genre.id}
              variant={isSelected ? "default" : "outline"} 
              className={`
                cursor-pointer px-3 py-2 text-sm flex items-center gap-1
                transition-colors
                ${isSelected 
                  ? "bg-purple-600 hover:bg-purple-700 text-white" 
                  : "bg-gray-900 text-gray-300 hover:bg-gray-800"}
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
