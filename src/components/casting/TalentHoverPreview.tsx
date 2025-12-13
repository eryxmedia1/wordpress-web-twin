import { MapPin, Ruler, Calendar, User } from "lucide-react";
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

interface TalentHoverPreviewProps {
  talent: Talent;
  position: { x: number; y: number };
}

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

export function TalentHoverPreview({ talent, position }: TalentHoverPreviewProps) {
  const location = [talent.city, talent.state, talent.country].filter(Boolean).join(", ");

  // Calculate position to prevent overflow
  const cardWidth = 320;
  const cardHeight = 200;
  let left = position.x - cardWidth / 2;
  let top = position.y - cardHeight - 20;

  // Adjust if going off screen
  if (left < 20) left = 20;
  if (left + cardWidth > window.innerWidth - 20) left = window.innerWidth - cardWidth - 20;
  if (top < 20) top = position.y + 250;

  return (
    <div 
      className="fixed z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
      style={{ left, top }}
    >
      <div className="bg-card border border-border/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden w-80">
        {/* Header with photo */}
        <div className="flex gap-4 p-4 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            {talent.primary_photo_url ? (
              <img 
                src={talent.primary_photo_url} 
                alt={talent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/20">
                <span className="text-2xl font-bold text-primary/50">
                  {talent.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">{talent.name}</h3>
            <Badge variant="outline" className="mt-1 text-primary border-primary/30">
              {formatCategory(talent.category)}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 pt-2 space-y-2">
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{location}</span>
            </div>
          )}
          
          {talent.height && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ruler className="h-4 w-4 text-primary" />
              <span>Height: {talent.height}</span>
            </div>
          )}
          
          {talent.age_range && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Age Range: {talent.age_range}</span>
            </div>
          )}

          {talent.is_featured && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Featured Talent</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 text-center">
            Click to view full profile
          </div>
        </div>
      </div>
    </div>
  );
}
