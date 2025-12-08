import { Label } from "@/components/ui/label";

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
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter(g => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-foreground font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground mb-2">
        Select one or more {label.toLowerCase()} for this content
      </p>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {GENRES.map((genre) => {
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
      </div>
    </div>
  );
};

export { GENRES };
