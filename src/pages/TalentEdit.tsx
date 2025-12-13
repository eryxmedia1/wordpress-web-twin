import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, User, Camera, Briefcase, Globe, Plus, Trash2, Upload } from "lucide-react";

type TalentCategory = 'actor' | 'model' | 'singer' | 'dancer' | 'extra' | 'voice_artist' | 'host' | 'influencer' | 'other';

interface TalentForm {
  name: string;
  bio: string;
  category: TalentCategory;
  country: string;
  city: string;
  state: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  shoe_size: string;
  weight: string;
  hair_color: string;
  eye_color: string;
  ethnicity: string;
  age_range: string;
  primary_photo_url: string;
  video_reel_url: string;
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
  website_url: string;
}

interface WorkHistory {
  id?: string;
  project_title: string;
  role: string;
  project_type: string;
  year: string;
  director: string;
  description: string;
}

interface TalentPhoto {
  id?: string;
  photo_url: string;
  caption: string;
}

const CATEGORIES: { value: TalentCategory; label: string }[] = [
  { value: "actor", label: "Actor/Actress" },
  { value: "model", label: "Model" },
  { value: "singer", label: "Singer" },
  { value: "dancer", label: "Dancer" },
  { value: "voice_artist", label: "Voice Artist" },
  { value: "host", label: "Host/Presenter" },
  { value: "influencer", label: "Influencer" },
  { value: "extra", label: "Extra/Background" },
  { value: "other", label: "Other" },
];

export default function TalentEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [talentId, setTalentId] = useState<string | null>(null);
  const [form, setForm] = useState<TalentForm>({
    name: "",
    bio: "",
    category: "actor",
    country: "",
    city: "",
    state: "",
    height: "",
    bust: "",
    waist: "",
    hips: "",
    shoe_size: "",
    weight: "",
    hair_color: "",
    eye_color: "",
    ethnicity: "",
    age_range: "",
    primary_photo_url: "",
    video_reel_url: "",
    instagram_url: "",
    tiktok_url: "",
    youtube_url: "",
    website_url: "",
  });
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [photos, setPhotos] = useState<TalentPhoto[]>([]);

  useEffect(() => {
    if (user) fetchTalentProfile();
  }, [user]);

  const fetchTalentProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data: talent } = await supabase
      .from('talents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (talent) {
      setTalentId(talent.id);
      setForm({
        name: talent.name || "",
        bio: talent.bio || "",
        category: talent.category as TalentCategory,
        country: talent.country || "",
        city: talent.city || "",
        state: talent.state || "",
        height: talent.height || "",
        bust: talent.bust || "",
        waist: talent.waist || "",
        hips: talent.hips || "",
        shoe_size: talent.shoe_size || "",
        weight: talent.weight || "",
        hair_color: talent.hair_color || "",
        eye_color: talent.eye_color || "",
        ethnicity: talent.ethnicity || "",
        age_range: talent.age_range || "",
        primary_photo_url: talent.primary_photo_url || "",
        video_reel_url: talent.video_reel_url || "",
        instagram_url: talent.instagram_url || "",
        tiktok_url: talent.tiktok_url || "",
        youtube_url: talent.youtube_url || "",
        website_url: talent.website_url || "",
      });

      // Fetch work history
      const { data: workData } = await supabase
        .from('talent_work_history')
        .select('*')
        .eq('talent_id', talent.id)
        .order('year', { ascending: false });

      if (workData) setWorkHistory(workData);

      // Fetch photos
      const { data: photosData } = await supabase
        .from('talent_photos')
        .select('*')
        .eq('talent_id', talent.id)
        .order('sort_order', { ascending: true });

      if (photosData) setPhotos(photosData);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);

    try {
      if (talentId) {
        // Update existing
        const { error } = await supabase
          .from('talents')
          .update(form)
          .eq('id', talentId);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('talents')
          .insert({ ...form, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        setTalentId(data.id);
      }

      // Save work history
      for (const work of workHistory) {
        if (work.id) {
          await supabase
            .from('talent_work_history')
            .update({
              project_title: work.project_title,
              role: work.role,
              project_type: work.project_type,
              year: work.year,
              director: work.director,
              description: work.description,
            })
            .eq('id', work.id);
        } else if (talentId && work.project_title) {
          const { data } = await supabase
            .from('talent_work_history')
            .insert({
              talent_id: talentId,
              project_title: work.project_title,
              role: work.role,
              project_type: work.project_type,
              year: work.year,
              director: work.director,
              description: work.description,
            })
            .select()
            .single();
          if (data) work.id = data.id;
        }
      }

      toast.success("Profile saved successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addWorkHistory = () => {
    setWorkHistory([...workHistory, {
      project_title: "",
      role: "",
      project_type: "",
      year: "",
      director: "",
      description: "",
    }]);
  };

  const removeWorkHistory = async (index: number) => {
    const work = workHistory[index];
    if (work.id) {
      await supabase.from('talent_work_history').delete().eq('id', work.id);
    }
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  };

  const updateWorkHistory = (index: number, field: keyof WorkHistory, value: string) => {
    const updated = [...workHistory];
    updated[index] = { ...updated[index], [field]: value };
    setWorkHistory(updated);
  };

  const addPhoto = () => {
    setPhotos([...photos, { photo_url: "", caption: "" }]);
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];
    if (photo.id) {
      await supabase.from('talent_photos').delete().eq('id', photo.id);
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const savePhoto = async (index: number) => {
    if (!talentId) {
      toast.error("Please save your profile first");
      return;
    }

    const photo = photos[index];
    if (!photo.photo_url) return;

    try {
      if (photo.id) {
        await supabase
          .from('talent_photos')
          .update({ photo_url: photo.photo_url, caption: photo.caption })
          .eq('id', photo.id);
      } else {
        const { data } = await supabase
          .from('talent_photos')
          .insert({
            talent_id: talentId,
            photo_url: photo.photo_url,
            caption: photo.caption,
            sort_order: index,
          })
          .select()
          .single();
        if (data) {
          const updated = [...photos];
          updated[index] = { ...updated[index], id: data.id };
          setPhotos(updated);
        }
      }
      toast.success("Photo saved");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8 pt-24 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Talent Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your talent profile and showcase your work</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Profile
          </Button>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="bg-card/50 border border-border/50 p-1 mb-6">
            <TabsTrigger value="basic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="physical" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Physical
            </TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Camera className="h-4 w-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="work" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Briefcase className="h-4 w-4 mr-2" />
              Work History
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Globe className="h-4 w-4 mr-2" />
              Social & Media
            </TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your public profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v: TalentCategory) => setForm({ ...form, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Biography</Label>
                  <Textarea 
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                    rows={6}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input 
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      placeholder="e.g., United States"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State/Province</Label>
                    <Input 
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g., California"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input 
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g., Los Angeles"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Primary Photo URL</Label>
                  <Input 
                    value={form.primary_photo_url}
                    onChange={(e) => setForm({ ...form, primary_photo_url: e.target.value })}
                    placeholder="https://..."
                  />
                  {form.primary_photo_url && (
                    <div className="mt-2 w-32 h-40 rounded-lg overflow-hidden bg-muted">
                      <img src={form.primary_photo_url} alt="Primary" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Physical Attributes */}
          <TabsContent value="physical">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Physical Attributes</CardTitle>
                <CardDescription>Your measurements and physical characteristics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input 
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: e.target.value })}
                      placeholder="e.g., 5'8&quot;"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Input 
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      placeholder="e.g., 150 lbs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Age Range</Label>
                    <Input 
                      value={form.age_range}
                      onChange={(e) => setForm({ ...form, age_range: e.target.value })}
                      placeholder="e.g., 25-35"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bust</Label>
                    <Input 
                      value={form.bust}
                      onChange={(e) => setForm({ ...form, bust: e.target.value })}
                      placeholder="e.g., 34"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waist</Label>
                    <Input 
                      value={form.waist}
                      onChange={(e) => setForm({ ...form, waist: e.target.value })}
                      placeholder="e.g., 26"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hips</Label>
                    <Input 
                      value={form.hips}
                      onChange={(e) => setForm({ ...form, hips: e.target.value })}
                      placeholder="e.g., 36"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shoe Size</Label>
                    <Input 
                      value={form.shoe_size}
                      onChange={(e) => setForm({ ...form, shoe_size: e.target.value })}
                      placeholder="e.g., 8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hair Color</Label>
                    <Input 
                      value={form.hair_color}
                      onChange={(e) => setForm({ ...form, hair_color: e.target.value })}
                      placeholder="e.g., Brown"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eye Color</Label>
                    <Input 
                      value={form.eye_color}
                      onChange={(e) => setForm({ ...form, eye_color: e.target.value })}
                      placeholder="e.g., Blue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ethnicity</Label>
                    <Input 
                      value={form.ethnicity}
                      onChange={(e) => setForm({ ...form, ethnicity: e.target.value })}
                      placeholder="e.g., Caucasian"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos */}
          <TabsContent value="photos">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Photo Gallery</CardTitle>
                  <CardDescription>Add photos to showcase your look</CardDescription>
                </div>
                <Button onClick={addPhoto} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No photos added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="flex gap-4 items-start p-4 border border-border/50 rounded-lg">
                        {photo.photo_url && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 space-y-3">
                          <Input 
                            value={photo.photo_url}
                            onChange={(e) => {
                              const updated = [...photos];
                              updated[index] = { ...updated[index], photo_url: e.target.value };
                              setPhotos(updated);
                            }}
                            placeholder="Photo URL"
                          />
                          <Input 
                            value={photo.caption}
                            onChange={(e) => {
                              const updated = [...photos];
                              updated[index] = { ...updated[index], caption: e.target.value };
                              setPhotos(updated);
                            }}
                            placeholder="Caption (optional)"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => savePhoto(index)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => removePhoto(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work History */}
          <TabsContent value="work">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Work History</CardTitle>
                  <CardDescription>Add your past projects and credits</CardDescription>
                </div>
                <Button onClick={addWorkHistory} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </CardHeader>
              <CardContent>
                {workHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No work history added yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {workHistory.map((work, index) => (
                      <div key={index} className="p-4 border border-border/50 rounded-lg space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Project {index + 1}</h4>
                          <Button variant="destructive" size="sm" onClick={() => removeWorkHistory(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input 
                            value={work.project_title}
                            onChange={(e) => updateWorkHistory(index, 'project_title', e.target.value)}
                            placeholder="Project Title *"
                          />
                          <Input 
                            value={work.role}
                            onChange={(e) => updateWorkHistory(index, 'role', e.target.value)}
                            placeholder="Your Role"
                          />
                          <Input 
                            value={work.project_type}
                            onChange={(e) => updateWorkHistory(index, 'project_type', e.target.value)}
                            placeholder="Project Type (Film, TV, Commercial...)"
                          />
                          <Input 
                            value={work.year}
                            onChange={(e) => updateWorkHistory(index, 'year', e.target.value)}
                            placeholder="Year"
                          />
                          <Input 
                            value={work.director}
                            onChange={(e) => updateWorkHistory(index, 'director', e.target.value)}
                            placeholder="Director"
                          />
                        </div>
                        <Textarea 
                          value={work.description}
                          onChange={(e) => updateWorkHistory(index, 'description', e.target.value)}
                          placeholder="Description"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social & Media */}
          <TabsContent value="social">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Social Media & Video Reel</CardTitle>
                <CardDescription>Link your social profiles and demo reel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Video Reel URL</Label>
                  <Input 
                    value={form.video_reel_url}
                    onChange={(e) => setForm({ ...form, video_reel_url: e.target.value })}
                    placeholder="https://vimeo.com/... or https://youtube.com/..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Instagram URL</Label>
                    <Input 
                      value={form.instagram_url}
                      onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TikTok URL</Label>
                    <Input 
                      value={form.tiktok_url}
                      onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube URL</Label>
                    <Input 
                      value={form.youtube_url}
                      onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input 
                      value={form.website_url}
                      onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
