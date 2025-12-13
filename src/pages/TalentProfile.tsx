import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BrowseFooter from "@/components/BrowseFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, MapPin, Ruler, Calendar, User, Instagram, 
  Youtube, Globe, Play, Camera, Briefcase, Share2, Heart,
  Mail, Phone
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type TalentCategory = 'actor' | 'model' | 'singer' | 'dancer' | 'extra' | 'voice_artist' | 'host' | 'influencer' | 'other';

interface Talent {
  id: string;
  name: string;
  bio: string | null;
  category: TalentCategory;
  country: string | null;
  city: string | null;
  state: string | null;
  height: string | null;
  bust: string | null;
  waist: string | null;
  hips: string | null;
  shoe_size: string | null;
  weight: string | null;
  hair_color: string | null;
  eye_color: string | null;
  ethnicity: string | null;
  age_range: string | null;
  primary_photo_url: string | null;
  video_reel_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  is_featured: boolean;
}

interface TalentPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
}

interface WorkHistory {
  id: string;
  project_title: string;
  role: string | null;
  project_type: string | null;
  year: string | null;
  director: string | null;
  description: string | null;
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

export default function TalentProfile() {
  const { id } = useParams<{ id: string }>();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [photos, setPhotos] = useState<TalentPhoto[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchTalent();
  }, [id]);

  const fetchTalent = async () => {
    setLoading(true);
    
    const { data: talentData, error } = await supabase
      .from('talents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !talentData) {
      toast.error("Talent not found");
      setLoading(false);
      return;
    }

    setTalent(talentData as Talent);

    // Fetch photos
    const { data: photosData } = await supabase
      .from('talent_photos')
      .select('*')
      .eq('talent_id', id)
      .order('sort_order', { ascending: true });

    if (photosData) setPhotos(photosData);

    // Fetch work history
    const { data: workData } = await supabase
      .from('talent_work_history')
      .select('*')
      .eq('talent_id', id)
      .order('year', { ascending: false });

    if (workData) setWorkHistory(workData);

    setLoading(false);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: talent?.name,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Talent Not Found</h1>
          <Link to="/casting">
            <Button>Back to Talents</Button>
          </Link>
        </div>
      </div>
    );
  }

  const location = [talent.city, talent.state, talent.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Link to="/casting" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Talents
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Photo & Stats */}
          <div className="space-y-6">
            {/* Main Photo */}
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border/50">
              {talent.primary_photo_url ? (
                <img 
                  src={talent.primary_photo_url} 
                  alt={talent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-8xl font-bold text-primary/30">
                    {talent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats Card */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" />
                  Physical Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {talent.height && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Height</span>
                    <span className="font-medium">{talent.height}</span>
                  </div>
                )}
                {talent.bust && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bust</span>
                    <span className="font-medium">{talent.bust}</span>
                  </div>
                )}
                {talent.waist && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Waist</span>
                    <span className="font-medium">{talent.waist}</span>
                  </div>
                )}
                {talent.hips && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hips</span>
                    <span className="font-medium">{talent.hips}</span>
                  </div>
                )}
                {talent.shoe_size && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shoe Size</span>
                    <span className="font-medium">{talent.shoe_size}</span>
                  </div>
                )}
                {talent.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{talent.weight}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-primary hover:bg-primary/90">
                <Mail className="h-4 w-4 mr-2" />
                Book Now
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Column - Details & Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="text-primary border-primary/30 text-sm px-3 py-1">
                  {formatCategory(talent.category)}
                </Badge>
                {talent.is_featured && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    Featured
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl font-bold text-foreground mb-4">{talent.name}</h1>
              
              {location && (
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {location}
                </p>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="bg-card/50 border border-border/50 p-1 w-full justify-start">
                <TabsTrigger value="about" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <User className="h-4 w-4 mr-2" />
                  About
                </TabsTrigger>
                <TabsTrigger value="gallery" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Camera className="h-4 w-4 mr-2" />
                  Gallery
                </TabsTrigger>
                <TabsTrigger value="reel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Play className="h-4 w-4 mr-2" />
                  Video Reel
                </TabsTrigger>
                <TabsTrigger value="work" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Work History
                </TabsTrigger>
                <TabsTrigger value="social" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Globe className="h-4 w-4 mr-2" />
                  Social
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                {talent.bio && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle>Biography</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-line">{talent.bio}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle>General Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {talent.age_range && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Age Range</span>
                          <span className="font-medium">{talent.age_range}</span>
                        </div>
                      )}
                      {talent.ethnicity && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ethnicity</span>
                          <span className="font-medium">{talent.ethnicity}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle>Physical Attributes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {talent.hair_color && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hair Color</span>
                          <span className="font-medium">{talent.hair_color}</span>
                        </div>
                      )}
                      {talent.eye_color && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Eye Color</span>
                          <span className="font-medium">{talent.eye_color}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="mt-6">
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div 
                        key={photo.id}
                        className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                        onClick={() => setSelectedPhoto(photo.photo_url)}
                      >
                        <img 
                          src={photo.photo_url} 
                          alt={photo.caption || "Gallery photo"}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No gallery photos yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Video Reel Tab */}
              <TabsContent value="reel" className="mt-6">
                {talent.video_reel_url ? (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <video 
                      src={talent.video_reel_url} 
                      controls 
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No video reel available</p>
                  </div>
                )}
              </TabsContent>

              {/* Work History Tab */}
              <TabsContent value="work" className="mt-6">
                {workHistory.length > 0 ? (
                  <div className="space-y-4">
                    {workHistory.map((work) => (
                      <Card key={work.id} className="bg-card/50 border-border/50">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{work.project_title}</h3>
                              {work.role && (
                                <p className="text-primary">{work.role}</p>
                              )}
                            </div>
                            {work.year && (
                              <Badge variant="outline">{work.year}</Badge>
                            )}
                          </div>
                          {work.director && (
                            <p className="text-sm text-muted-foreground">Director: {work.director}</p>
                          )}
                          {work.description && (
                            <p className="text-sm text-muted-foreground mt-2">{work.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No work history added yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Social Tab */}
              <TabsContent value="social" className="mt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {talent.instagram_url && (
                    <a href={talent.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Instagram className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Instagram</p>
                            <p className="text-sm text-muted-foreground">View Profile</p>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  )}
                  
                  {talent.youtube_url && (
                    <a href={talent.youtube_url} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                            <Youtube className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">YouTube</p>
                            <p className="text-sm text-muted-foreground">View Channel</p>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  )}

                  {talent.tiktok_url && (
                    <a href={talent.tiktok_url} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                            <span className="text-white font-bold">TT</span>
                          </div>
                          <div>
                            <p className="font-medium">TikTok</p>
                            <p className="text-sm text-muted-foreground">View Profile</p>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  )}

                  {talent.website_url && (
                    <a href={talent.website_url} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <Globe className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Website</p>
                            <p className="text-sm text-muted-foreground">Visit Site</p>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  )}

                  {!talent.instagram_url && !talent.youtube_url && !talent.tiktok_url && !talent.website_url && (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No social links added yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img 
            src={selectedPhoto} 
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      <BrowseFooter />
    </div>
  );
}
