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
}

export const GenreSelector = ({ selectedGenres, onGenresChange }: GenreSelectorProps) => {
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter(g => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-white font-medium">Genres</Label>
      <p className="text-xs text-gray-400 mb-2">
        Select one or more genres for this content
      </p>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {GENRES.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <div
              key={genre}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer text-sm ${
                isSelected ? 'bg-primary/20 border border-primary text-white' : 'bg-muted/50 hover:bg-muted text-gray-300'
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
