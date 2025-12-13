import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TalentCard } from "@/components/casting/TalentCard";
import { TalentHoverPreview } from "@/components/casting/TalentHoverPreview";
import Navbar from "@/components/Navbar";
import { CastingSubNav } from "@/components/casting/CastingSubNav";
import BrowseFooter from "@/components/BrowseFooter";
import { Loader2, Star, Users, Film, Music, Mic, Camera } from "lucide-react";

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

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  button_url: string | null;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  all: { label: "All Talents", icon: <Users className="h-4 w-4" /> },
  actor: { label: "Actors", icon: <Film className="h-4 w-4" /> },
  model: { label: "Models", icon: <Camera className="h-4 w-4" /> },
  singer: { label: "Singers", icon: <Music className="h-4 w-4" /> },
  dancer: { label: "Dancers", icon: <Music className="h-4 w-4" /> },
  voice_artist: { label: "Voice Artists", icon: <Mic className="h-4 w-4" /> },
  host: { label: "Hosts", icon: <Mic className="h-4 w-4" /> },
  influencer: { label: "Influencers", icon: <Star className="h-4 w-4" /> },
  extra: { label: "Extras", icon: <Users className="h-4 w-4" /> },
  other: { label: "Other", icon: <Users className="h-4 w-4" /> },
};

export default function Casting() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hoveredTalent, setHoveredTalent] = useState<Talent | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch hero banner
    const { data: banners } = await supabase
      .from('casting_hero_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1);
    
    if (banners && banners.length > 0) {
      setHeroBanner(banners[0]);
    }

    // Fetch talents
    const { data: talentsData } = await supabase
      .from('talents')
      .select('id, name, category, city, state, country, height, primary_photo_url, is_featured, age_range')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (talentsData) {
      setTalents(talentsData as Talent[]);
    }
    
    setLoading(false);
  };

  const filteredTalents = selectedCategory === "all" 
    ? talents 
    : talents.filter(t => t.category === selectedCategory);

  const featuredTalents = filteredTalents.filter(t => t.is_featured);
  const regularTalents = filteredTalents.filter(t => !t.is_featured);

  const handleMouseEnter = (talent: Talent, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredTalent(talent);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CastingSubNav />
      
      {/* Spacer for fixed navbars */}
      <div className="pt-32" />
      
      {/* Hero Banner */}
      <div 
        className="relative h-[500px] w-full bg-cover bg-center"
        style={{ 
          backgroundImage: heroBanner?.image_url 
            ? `url(${heroBanner.image_url})` 
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--background)) 100%)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4">
            {heroBanner?.title || "Discover Premier Talent"}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8">
            {heroBanner?.subtitle || "Connect with exceptional actors, models, singers, and performers for your next production"}
          </p>
          <div className="flex gap-4">
            <Link to={heroBanner?.button_url || "/talent/signup"}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                {heroBanner?.button_text || "Become a Talent"}
              </Button>
            </Link>
            <Link to="/casting-calls">
              <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10">
                View Casting Calls
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="bg-card/50 border border-border/50 p-1 flex-wrap h-auto gap-1">
            {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
              >
                {icon}
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Talents Grid */}
      <div className="container mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredTalents.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary" />
                  Featured Talents
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {featuredTalents.map((talent) => (
                    <TalentCard
                      key={talent.id}
                      talent={talent}
                      onMouseEnter={(e) => handleMouseEnter(talent, e)}
                      onMouseLeave={() => setHoveredTalent(null)}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Talents */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {selectedCategory === "all" ? "All Talents" : CATEGORY_LABELS[selectedCategory]?.label}
              </h2>
              {regularTalents.length === 0 && featuredTalents.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No talents found in this category</p>
                  <Link to="/talent/signup">
                    <Button className="mt-4">Be the First to Join</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {regularTalents.map((talent) => (
                    <TalentCard
                      key={talent.id}
                      talent={talent}
                      onMouseEnter={(e) => handleMouseEnter(talent, e)}
                      onMouseLeave={() => setHoveredTalent(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hover Preview */}
      {hoveredTalent && (
        <TalentHoverPreview 
          talent={hoveredTalent} 
          position={hoverPosition}
        />
      )}

      <BrowseFooter />
    </div>
  );
}
