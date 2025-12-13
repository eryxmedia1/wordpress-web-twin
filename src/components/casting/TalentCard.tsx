import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TalentCategory = 'actor' | 'model' | 'singer' | 'dancer' | 'extra' | 'voice_artist' | 'host' | 'influencer' | 'other';

interface Talent {
  id: string;
  name: string;
  category: TalentCategory;
  city: string | null;
  state: string | null;
  country: string | null;
  height: string | null;
  primary_photo_url: string | null;
  is_featured: boolean;
  age_range: string | null;
}

interface TalentCardProps {
  talent: Talent;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  featured?: boolean;
}

const CATEGORY_COLORS: Record<TalentCategory, string> = {
  actor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  model: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  singer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  dancer: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  voice_artist: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  host: "bg-green-500/20 text-green-400 border-green-500/30",
  influencer: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  extra: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const formatCategory = (category: TalentCategory): string => {
  const labels: Record<TalentCategory, string> = {
    actor: "Actor",
    model: "Model",
    singer: "Singer",
    dancer: "Dancer",
    voice_artist: "Voice Artist",
    host: "Host",
    influencer: "Influencer",
    extra: "Extra",
    other: "Other",
  };
  return labels[category] || category;
};

export function TalentCard({ talent, onMouseEnter, onMouseLeave, featured }: TalentCardProps) {
  const location = [talent.city, talent.state, talent.country].filter(Boolean).join(", ");

  return (
    <Link 
      to={`/talent/${talent.id}`}
      className="group relative block"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`
        relative overflow-hidden rounded-xl bg-card border transition-all duration-300
        ${featured 
          ? "border-primary/50 ring-2 ring-primary/20" 
          : "border-border/50 hover:border-primary/30"
        }
        group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/20
      `}>
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
              <Star className="h-3 w-3" />
              Featured
            </Badge>
          </div>
        )}

        {/* Photo */}
        <div className="aspect-[3/4] bg-muted">
          {talent.primary_photo_url ? (
            <img 
              src={talent.primary_photo_url} 
              alt={talent.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-6xl font-bold text-primary/30">
                {talent.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent p-4">
          <Badge className={`mb-2 ${CATEGORY_COLORS[talent.category]}`}>
            {formatCategory(talent.category)}
          </Badge>
          
          <h3 className="text-lg font-semibold text-foreground truncate">
            {talent.name}
          </h3>
          
          {location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {location}
            </p>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  );
}
