import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { CastingSubNav } from "@/components/casting/CastingSubNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Save, User, Camera, Briefcase, Globe, Plus, Trash2, Wrench, Shield } from "lucide-react";

// Match the database enum - 'crew' is handled via applicant_type field
type TalentCategory = 'actor' | 'model' | 'singer' | 'dancer' | 'extra' | 'voice_artist' | 'host' | 'influencer' | 'other';
type ApplicantType = 'talent' | 'crew';

interface TalentForm {
  name: string;
  bio: string;
  category: TalentCategory;
  applicant_type: ApplicantType;
  country: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  gender: string;
  pronouns: string;
  languages: string[];
  union_status: string;
  availability_notes: string;
  availability_dates: string;
  skills_tags: string[];
  willing_to_travel: boolean;
  has_passport: boolean;
  // Physical - Talent
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
  clothing_size_top: string;
  clothing_size_bottom: string;
  skin_tone: string;
  has_tattoos: boolean;
  tattoo_notes: string;
  has_piercings: boolean;
  piercing_notes: string;
  distinguishing_features: string;
  // Comfort levels
  comfort_speaking: boolean;
  comfort_improv: boolean;
  comfort_romance_level: string;
  comfort_stunts: boolean;
  comfort_swimwear: boolean;
  has_drivers_license: boolean;
  // Crew fields
  crew_primary_role: string;
  crew_secondary_roles: string[];
  crew_years_experience: number;
  crew_gear_owned: string;
  crew_software: string[];
  crew_certifications: string;
  crew_work_preferences: string[];
  portfolio_url: string;
  // Media
  primary_photo_url: string;
  video_reel_url: string;
  resume_url: string;
  // Social
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
  website_url: string;
  imdb_url: string;
  facebook_url: string;
  x_twitter_url: string;
  follower_count: string;
  best_platform: string;
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

const TALENT_CATEGORIES: { value: TalentCategory; label: string }[] = [
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

const CREW_ROLES = [
  "Director", "Producer", "Director of Photography", "Camera Operator", 
  "Gaffer", "Grip", "Sound Mixer", "Boom Operator", "Editor", 
  "Colorist", "VFX Artist", "Motion Graphics", "Production Assistant",
  "Line Producer", "Production Manager", "Location Manager", "Wardrobe",
  "Hair & Makeup", "Set Designer", "Props Master", "Script Supervisor"
];

const CREW_SOFTWARE = [
  "Adobe Premiere Pro", "DaVinci Resolve", "Final Cut Pro", "Avid Media Composer",
  "After Effects", "Cinema 4D", "Pro Tools", "Logic Pro", "Photoshop",
  "Lightroom", "Nuke", "Flame", "Audition"
];

const initialForm: TalentForm = {
  name: "",
  bio: "",
  category: "actor",
  applicant_type: "talent",
  country: "",
  city: "",
  state: "",
  email: "",
  phone: "",
  gender: "",
  pronouns: "",
  languages: [],
  union_status: "",
  availability_notes: "",
  availability_dates: "",
  skills_tags: [],
  willing_to_travel: false,
  has_passport: false,
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
  clothing_size_top: "",
  clothing_size_bottom: "",
  skin_tone: "",
  has_tattoos: false,
  tattoo_notes: "",
  has_piercings: false,
  piercing_notes: "",
  distinguishing_features: "",
  comfort_speaking: true,
  comfort_improv: false,
  comfort_romance_level: "none",
  comfort_stunts: false,
  comfort_swimwear: false,
  has_drivers_license: false,
  crew_primary_role: "",
  crew_secondary_roles: [],
  crew_years_experience: 0,
  crew_gear_owned: "",
  crew_software: [],
  crew_certifications: "",
  crew_work_preferences: [],
  portfolio_url: "",
  primary_photo_url: "",
  video_reel_url: "",
  resume_url: "",
  instagram_url: "",
  tiktok_url: "",
  youtube_url: "",
  website_url: "",
  imdb_url: "",
  facebook_url: "",
  x_twitter_url: "",
  follower_count: "",
  best_platform: "",
};

export default function TalentEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [talentId, setTalentId] = useState<string | null>(null);
  const [form, setForm] = useState<TalentForm>(initialForm);
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [photos, setPhotos] = useState<TalentPhoto[]>([]);
  const [skillsInput, setSkillsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");

  const calculateCompleteness = (): number => {
    let filled = 0;
    let total = 0;
    
    // Required fields
    const requiredFields = ['name', 'email', 'phone', 'city', 'state', 'country', 'bio'];
    requiredFields.forEach(field => {
      total++;
      if (form[field as keyof TalentForm]) filled++;
    });

    // Media fields
    total += 3;
    if (form.primary_photo_url) filled++;
    if (form.video_reel_url) filled++;
    if (form.instagram_url || form.tiktok_url) filled++;

    if (form.applicant_type === 'talent') {
      // Physical attributes for talent
      const physicalFields = ['height', 'weight', 'age_range', 'hair_color', 'eye_color'];
      physicalFields.forEach(field => {
        total++;
        if (form[field as keyof TalentForm]) filled++;
      });
    } else {
      // Crew fields
      total += 3;
      if (form.crew_primary_role) filled++;
      if (form.crew_years_experience > 0) filled++;
      if (form.portfolio_url) filled++;
    }

    // Work history bonus
    total++;
    if (workHistory.length > 0) filled++;

    // Photos bonus
    total++;
    if (photos.length > 0) filled++;

    return Math.round((filled / total) * 100);
  };

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
        category: talent.category as TalentCategory || "actor",
        applicant_type: (talent.applicant_type as ApplicantType) || "talent",
        country: talent.country || "",
        city: talent.city || "",
        state: talent.state || "",
        email: talent.email || "",
        phone: talent.phone || "",
        gender: talent.gender || "",
        pronouns: talent.pronouns || "",
        languages: talent.languages || [],
        union_status: talent.union_status || "",
        availability_notes: talent.availability_notes || "",
        availability_dates: talent.availability_dates || "",
        skills_tags: talent.skills_tags || [],
        willing_to_travel: talent.willing_to_travel || false,
        has_passport: talent.has_passport || false,
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
        clothing_size_top: talent.clothing_size_top || "",
        clothing_size_bottom: talent.clothing_size_bottom || "",
        skin_tone: talent.skin_tone || "",
        has_tattoos: talent.has_tattoos || false,
        tattoo_notes: talent.tattoo_notes || "",
        has_piercings: talent.has_piercings || false,
        piercing_notes: talent.piercing_notes || "",
        distinguishing_features: talent.distinguishing_features || "",
        comfort_speaking: talent.comfort_speaking ?? true,
        comfort_improv: talent.comfort_improv || false,
        comfort_romance_level: talent.comfort_romance_level || "none",
        comfort_stunts: talent.comfort_stunts || false,
        comfort_swimwear: talent.comfort_swimwear || false,
        has_drivers_license: talent.has_drivers_license || false,
        crew_primary_role: talent.crew_primary_role || "",
        crew_secondary_roles: talent.crew_secondary_roles || [],
        crew_years_experience: talent.crew_years_experience || 0,
        crew_gear_owned: talent.crew_gear_owned || "",
        crew_software: talent.crew_software || [],
        crew_certifications: talent.crew_certifications || "",
        crew_work_preferences: talent.crew_work_preferences || [],
        portfolio_url: talent.portfolio_url || "",
        primary_photo_url: talent.primary_photo_url || "",
        video_reel_url: talent.video_reel_url || "",
        resume_url: talent.resume_url || "",
        instagram_url: talent.instagram_url || "",
        tiktok_url: talent.tiktok_url || "",
        youtube_url: talent.youtube_url || "",
        website_url: talent.website_url || "",
        imdb_url: talent.imdb_url || "",
        facebook_url: talent.facebook_url || "",
        x_twitter_url: talent.x_twitter_url || "",
        follower_count: talent.follower_count || "",
        best_platform: talent.best_platform || "",
      });
      setLanguagesInput((talent.languages || []).join(", "));
      setSkillsInput((talent.skills_tags || []).join(", "));

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
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSaving(true);

    // Parse comma-separated inputs
    const languages = languagesInput.split(',').map(s => s.trim()).filter(Boolean);
    const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);

    const dataToSave = {
      ...form,
      languages,
      skills_tags: skills,
      profile_completeness: calculateCompleteness(),
    };

    try {
      if (talentId) {
        const { error } = await supabase
          .from('talents')
          .update(dataToSave)
          .eq('id', talentId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('talents')
          .insert({ ...dataToSave, user_id: user.id })
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

  const toggleCrewSecondaryRole = (role: string) => {
    if (form.crew_secondary_roles.includes(role)) {
      setForm({ ...form, crew_secondary_roles: form.crew_secondary_roles.filter(r => r !== role) });
    } else {
      setForm({ ...form, crew_secondary_roles: [...form.crew_secondary_roles, role] });
    }
  };

  const toggleCrewSoftware = (software: string) => {
    if (form.crew_software.includes(software)) {
      setForm({ ...form, crew_software: form.crew_software.filter(s => s !== software) });
    } else {
      setForm({ ...form, crew_software: [...form.crew_software, software] });
    }
  };

  const toggleWorkPreference = (pref: string) => {
    if (form.crew_work_preferences.includes(pref)) {
      setForm({ ...form, crew_work_preferences: form.crew_work_preferences.filter(p => p !== pref) });
    } else {
      setForm({ ...form, crew_work_preferences: [...form.crew_work_preferences, pref] });
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

  const completeness = calculateCompleteness();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CastingSubNav />
      
      {/* Spacer for fixed navbars */}
      <div className="pt-32" />
      
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {form.applicant_type === 'crew' ? 'Crew Profile' : 'Talent Profile'}
            </h1>
            <p className="text-muted-foreground mt-1">Manage your professional profile</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Profile
          </Button>
        </div>

        {/* Profile Completeness */}
        <Card className="bg-card/50 border-border/50 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completeness</span>
              <span className="text-sm text-primary font-bold">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
            {completeness < 80 && (
              <p className="text-xs text-muted-foreground mt-2">
                Complete your profile to 80%+ to apply faster and stand out to casting directors
              </p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="bg-card/50 border border-border/50 p-1 mb-6 flex-wrap h-auto">
            <TabsTrigger value="basic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            {form.applicant_type === 'talent' && (
              <>
                <TabsTrigger value="physical" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Physical
                </TabsTrigger>
                <TabsTrigger value="comfort" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Shield className="h-4 w-4 mr-2" />
                  Comfort
                </TabsTrigger>
              </>
            )}
            {form.applicant_type === 'crew' && (
              <TabsTrigger value="crew" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Wrench className="h-4 w-4 mr-2" />
                Crew Skills
              </TabsTrigger>
            )}
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
                <CardDescription>Your contact and profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Applicant Type Toggle */}
                <div className="space-y-2">
                  <Label>I am a... *</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={form.applicant_type === 'talent' ? 'default' : 'outline'}
                      onClick={() => setForm({ ...form, applicant_type: 'talent', category: 'actor' })}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Talent (Actor, Model, Host, etc.)
                    </Button>
                    <Button
                      type="button"
                      variant={form.applicant_type === 'crew' ? 'default' : 'outline'}
                      onClick={() => setForm({ ...form, applicant_type: 'crew', category: 'other' })}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Crew (Camera, Sound, Editor, etc.)
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name or stage name"
                    />
                  </div>
                  {form.applicant_type === 'talent' && (
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={form.category} onValueChange={(v: TalentCategory) => setForm({ ...form, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TALENT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input 
                      type="email"
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-Binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pronouns</Label>
                    <Input 
                      value={form.pronouns}
                      onChange={(e) => setForm({ ...form, pronouns: e.target.value })}
                      placeholder="e.g., He/Him, She/Her, They/Them"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Biography *</Label>
                  <Textarea 
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                    rows={5}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Input 
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      placeholder="e.g., United States"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State/Province *</Label>
                    <Input 
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g., California"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input 
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g., Los Angeles"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Languages (comma-separated)</Label>
                    <Input 
                      value={languagesInput}
                      onChange={(e) => setLanguagesInput(e.target.value)}
                      placeholder="e.g., English, Spanish, French"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Union Status</Label>
                    <Select value={form.union_status} onValueChange={(v) => setForm({ ...form, union_status: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sag-aftra">SAG-AFTRA</SelectItem>
                        <SelectItem value="sag-eligible">SAG Eligible</SelectItem>
                        <SelectItem value="non-union">Non-Union</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Skills / Specialties (comma-separated)</Label>
                  <Input 
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g., Horseback Riding, Martial Arts, Accents, Dancing"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Availability Dates</Label>
                    <Input 
                      value={form.availability_dates}
                      onChange={(e) => setForm({ ...form, availability_dates: e.target.value })}
                      placeholder="e.g., Available Jan-Mar 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Availability Notes</Label>
                    <Input 
                      value={form.availability_notes}
                      onChange={(e) => setForm({ ...form, availability_notes: e.target.value })}
                      placeholder="e.g., Weekends only, 2 weeks notice needed"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={form.willing_to_travel}
                      onCheckedChange={(checked) => setForm({ ...form, willing_to_travel: !!checked })}
                    />
                    <Label>Willing to travel</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={form.has_passport}
                      onCheckedChange={(checked) => setForm({ ...form, has_passport: !!checked })}
                    />
                    <Label>Has valid passport</Label>
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

          {/* Physical Attributes - Talent Only */}
          {form.applicant_type === 'talent' && (
            <TabsContent value="physical">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Physical Attributes</CardTitle>
                  <CardDescription>Your measurements and physical characteristics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-4 gap-6">
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
                      <Label>Shoe Size</Label>
                      <Input 
                        value={form.shoe_size}
                        onChange={(e) => setForm({ ...form, shoe_size: e.target.value })}
                        placeholder="e.g., 8"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label>Bust/Chest</Label>
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
                      <Label>Clothing Size (Top)</Label>
                      <Input 
                        value={form.clothing_size_top}
                        onChange={(e) => setForm({ ...form, clothing_size_top: e.target.value })}
                        placeholder="e.g., M, 38"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label>Clothing Size (Bottom)</Label>
                      <Input 
                        value={form.clothing_size_bottom}
                        onChange={(e) => setForm({ ...form, clothing_size_bottom: e.target.value })}
                        placeholder="e.g., 30, M"
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

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Skin Tone</Label>
                      <Input 
                        value={form.skin_tone}
                        onChange={(e) => setForm({ ...form, skin_tone: e.target.value })}
                        placeholder="e.g., Fair, Medium, Dark"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Distinguishing Features</Label>
                      <Input 
                        value={form.distinguishing_features}
                        onChange={(e) => setForm({ ...form, distinguishing_features: e.target.value })}
                        placeholder="e.g., Birthmark, Dimples, Freckles"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={form.has_tattoos}
                          onCheckedChange={(checked) => setForm({ ...form, has_tattoos: !!checked })}
                        />
                        <Label>Has tattoos</Label>
                      </div>
                      {form.has_tattoos && (
                        <Input 
                          value={form.tattoo_notes}
                          onChange={(e) => setForm({ ...form, tattoo_notes: e.target.value })}
                          placeholder="Location and description"
                          className="flex-1"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={form.has_piercings}
                          onCheckedChange={(checked) => setForm({ ...form, has_piercings: !!checked })}
                        />
                        <Label>Has piercings</Label>
                      </div>
                      {form.has_piercings && (
                        <Input 
                          value={form.piercing_notes}
                          onChange={(e) => setForm({ ...form, piercing_notes: e.target.value })}
                          placeholder="Location and description"
                          className="flex-1"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Comfort Levels - Talent Only */}
          {form.applicant_type === 'talent' && (
            <TabsContent value="comfort">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Comfort Levels</CardTitle>
                  <CardDescription>Help casting directors understand what you're comfortable with</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Performance Comfort</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={form.comfort_speaking}
                            onCheckedChange={(checked) => setForm({ ...form, comfort_speaking: !!checked })}
                          />
                          <Label>On-camera speaking</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={form.comfort_improv}
                            onCheckedChange={(checked) => setForm({ ...form, comfort_improv: !!checked })}
                          />
                          <Label>Improvised dialogue</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={form.comfort_stunts}
                            onCheckedChange={(checked) => setForm({ ...form, comfort_stunts: !!checked })}
                          />
                          <Label>Athletic scenes / basic stunts</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={form.comfort_swimwear}
                            onCheckedChange={(checked) => setForm({ ...form, comfort_swimwear: !!checked })}
                          />
                          <Label>Swimwear / athletic wear</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Romance Scene Comfort</h4>
                      <Select 
                        value={form.comfort_romance_level} 
                        onValueChange={(v) => setForm({ ...form, comfort_romance_level: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None - Not comfortable</SelectItem>
                          <SelectItem value="pg">PG - Light (hand holding, hugging)</SelectItem>
                          <SelectItem value="pg13">PG-13 - Moderate (kissing)</SelectItem>
                          <SelectItem value="mature">Mature - Open to intimate scenes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={form.has_drivers_license}
                      onCheckedChange={(checked) => setForm({ ...form, has_drivers_license: !!checked })}
                    />
                    <Label>Valid driver's license (can drive on set if needed)</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Crew Skills - Crew Only */}
          {form.applicant_type === 'crew' && (
            <TabsContent value="crew">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Crew Skills & Experience</CardTitle>
                  <CardDescription>Your technical skills, gear, and experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Primary Role *</Label>
                      <Select value={form.crew_primary_role} onValueChange={(v) => setForm({ ...form, crew_primary_role: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your main role" />
                        </SelectTrigger>
                        <SelectContent>
                          {CREW_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Years of Experience</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={form.crew_years_experience || ""}
                        onChange={(e) => setForm({ ...form, crew_years_experience: parseInt(e.target.value) || 0 })}
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Roles (can also work as)</Label>
                    <div className="flex flex-wrap gap-2">
                      {CREW_ROLES.filter(r => r !== form.crew_primary_role).map((role) => (
                        <Button
                          key={role}
                          type="button"
                          size="sm"
                          variant={form.crew_secondary_roles.includes(role) ? "default" : "outline"}
                          onClick={() => toggleCrewSecondaryRole(role)}
                        >
                          {role}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Gear Owned</Label>
                    <Textarea 
                      value={form.crew_gear_owned}
                      onChange={(e) => setForm({ ...form, crew_gear_owned: e.target.value })}
                      placeholder="List your cameras, lenses, lights, audio equipment, etc."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Software Proficiency</Label>
                    <div className="flex flex-wrap gap-2">
                      {CREW_SOFTWARE.map((sw) => (
                        <Button
                          key={sw}
                          type="button"
                          size="sm"
                          variant={form.crew_software.includes(sw) ? "default" : "outline"}
                          onClick={() => toggleCrewSoftware(sw)}
                        >
                          {sw}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Certifications</Label>
                    <Input 
                      value={form.crew_certifications}
                      onChange={(e) => setForm({ ...form, crew_certifications: e.target.value })}
                      placeholder="e.g., FAA Part 107 (Drone), First Aid Certified"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Work Preferences</Label>
                    <div className="flex flex-wrap gap-4">
                      {['Day Shoots', 'Night Shoots', 'Weekends', 'Travel', 'Remote/Virtual'].map((pref) => (
                        <div key={pref} className="flex items-center gap-2">
                          <Checkbox 
                            checked={form.crew_work_preferences.includes(pref)}
                            onCheckedChange={() => toggleWorkPreference(pref)}
                          />
                          <Label>{pref}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Portfolio URL</Label>
                    <Input 
                      value={form.portfolio_url}
                      onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Photos */}
          <TabsContent value="photos">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Photo Gallery</CardTitle>
                  <CardDescription>Add headshots, full body shots, and portfolio images</CardDescription>
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
                            placeholder="Caption (e.g., Headshot, Full Body, On Set)"
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
                  <CardTitle>Work History / Credits</CardTitle>
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
                            placeholder="Type (Film, TV, Commercial, Music Video...)"
                          />
                          <Input 
                            value={work.year}
                            onChange={(e) => updateWorkHistory(index, 'year', e.target.value)}
                            placeholder="Year"
                          />
                          <Input 
                            value={work.director}
                            onChange={(e) => updateWorkHistory(index, 'director', e.target.value)}
                            placeholder="Director / Production Company"
                          />
                        </div>
                        <Textarea 
                          value={work.description}
                          onChange={(e) => updateWorkHistory(index, 'description', e.target.value)}
                          placeholder="Description / Notes"
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
                <CardDescription>Link your social profiles and demo reel (at least one social required)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Video Reel / Demo Reel URL</Label>
                  <Input 
                    value={form.video_reel_url}
                    onChange={(e) => setForm({ ...form, video_reel_url: e.target.value })}
                    placeholder="https://vimeo.com/... or https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resume PDF URL</Label>
                  <Input 
                    value={form.resume_url}
                    onChange={(e) => setForm({ ...form, resume_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Instagram URL *</Label>
                    <Input 
                      value={form.instagram_url}
                      onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TikTok URL *</Label>
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
                    <Label>Facebook URL</Label>
                    <Input 
                      value={form.facebook_url}
                      onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>X (Twitter) URL</Label>
                    <Input 
                      value={form.x_twitter_url}
                      onChange={(e) => setForm({ ...form, x_twitter_url: e.target.value })}
                      placeholder="https://x.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IMDb URL</Label>
                    <Input 
                      value={form.imdb_url}
                      onChange={(e) => setForm({ ...form, imdb_url: e.target.value })}
                      placeholder="https://imdb.com/name/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website / Portfolio URL</Label>
                    <Input 
                      value={form.website_url}
                      onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Follower Count (total across platforms)</Label>
                    <Input 
                      value={form.follower_count}
                      onChange={(e) => setForm({ ...form, follower_count: e.target.value })}
                      placeholder="e.g., 50K, 1M"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Best Platform</Label>
                    <Select value={form.best_platform} onValueChange={(v) => setForm({ ...form, best_platform: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Your strongest platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="twitter">X (Twitter)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
