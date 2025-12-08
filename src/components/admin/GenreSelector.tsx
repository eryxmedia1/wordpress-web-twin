import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const GENRES = [
  "Action",
  "Adventure", 
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Dramatic Videos",
  "Educational",
  "Family",
  "Fantasy",
  "Funny",
  "Funny Videos",
  "History",
  "Horror",
  "Inspirational",
  "Mother Nature",
  "Music",
  "Mystery",
  "News",
  "Reality",
  "Romance",
  "Sci-Fi",
  "Sports",
  "Talk Show",
  "Thriller",
  "War",
  "Western"
];

interface GenreSelectorProps {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  label?: string;
}

export const GenreSelector = ({ selectedGenres, onGenresChange, label = "Categories" }: GenreSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter(g => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const filteredGenres = GENRES.filter(genre =>
    genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-foreground font-medium">{label}</Label>
        {selectedGenres.length > 0 && (
          <span className="text-xs text-primary">{selectedGenres.length} selected</span>
        )}
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-card/50 border-border"
        />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
        {filteredGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <div
              key={genre}
              className={`flex items-center justify-center p-2.5 rounded-lg transition-all cursor-pointer text-sm font-medium border ${
                isSelected 
                  ? 'bg-primary/20 border-primary text-primary' 
                  : 'bg-card/50 border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </div>
          );
        })}
        {filteredGenres.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground text-sm py-4">
            No categories found
          </p>
        )}
      </div>
    </div>
  );
};

export { GENRES };
