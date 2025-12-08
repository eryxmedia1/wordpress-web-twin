
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase, DbContent, DbCategory, DbTag } from "@/integrations/supabase/client";
import { X, Loader2 } from "lucide-react";
import { VimeoUrlInput } from "@/components/VimeoUrlInput";
import { VimeoMetadata } from "@/hooks/useVimeoMetadata";
import { MembershipPlansSelector } from "@/components/admin/MembershipPlansSelector";
import { ChannelsSelector } from "@/components/admin/ChannelsSelector";
import { SubtitlesSelector } from "@/components/admin/SubtitlesSelector";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Subtitle {
  language: string;
  vttUrl: string;
}

type FormData = {
  title: string;
  description: string;
  category: string;
  rating: string;
  releaseYear: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  logoUrl: string;
  isMature: boolean;
  isExclusive: boolean;
  isNewRelease: boolean;
  featured: boolean;
  isZoeOriginal: boolean;
  isComingSoon: boolean;
  topRank: string;
  maturityRating: string;
  creator: string;
  tags: string[];
}

const MATURITY_RATINGS = [
  { value: "G", label: "G (General Audience)" },
  { value: "PG", label: "PG (Parental Guidance)" },
  { value: "PG-13", label: "PG-13 (13+ Years)" },
  { value: "R", label: "R (Restricted)" },
  { value: "NC-17", label: "NC-17 (Adults Only)" },
  { value: "TV-Y", label: "TV-Y (All Children)" },
  { value: "TV-Y7", label: "TV-Y7 (7+ Years)" },
  { value: "TV-G", label: "TV-G (General Audience)" },
  { value: "TV-PG", label: "TV-PG (Parental Guidance)" },
  { value: "TV-14", label: "TV-14 (14+ Years)" },
  { value: "TV-MA", label: "TV-MA (Mature Audience)" },
];

const AUDIO_LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Korean", "Chinese", "Hindi"];
const SUBTITLE_LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Korean", "Chinese", "Hindi"];

const AddMovieForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [availableTags, setAvailableTags] = useState<DbTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("info");
  const [castMembers, setCastMembers] = useState<string[]>([]);
  const [castInput, setCastInput] = useState("");
  const [selectedAudioLanguages, setSelectedAudioLanguages] = useState<string[]>([]);
  const [selectedSubtitleLanguages, setSelectedSubtitleLanguages] = useState<string[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  const form = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      rating: "PG-13",
      releaseYear: new Date().getFullYear().toString(),
      duration: "",
      videoUrl: "",
      thumbnailUrl: "",
      backdropUrl: "",
      trailerUrl: "",
      logoUrl: "",
      isMature: false,
      isExclusive: false,
      isNewRelease: false,
      featured: false,
      isZoeOriginal: false,
      isComingSoon: false,
      topRank: "",
      maturityRating: "PG-13",
      creator: "",
      tags: []
    }
  });
  
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);
  
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("content_type", "movie")
        .order("name");
        
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };
  
  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");
        
      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
    }
  };
  
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };

  const addCastMember = () => {
    if (castInput.trim() && !castMembers.includes(castInput.trim())) {
      setCastMembers([...castMembers, castInput.trim()]);
      setCastInput("");
    }
  };

  const removeCastMember = (member: string) => {
    setCastMembers(castMembers.filter(m => m !== member));
  };

  const toggleAudioLanguage = (lang: string) => {
    setSelectedAudioLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleSubtitleLanguage = (lang: string) => {
    setSelectedSubtitleLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };
  
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      const { data: content, error: contentError } = await supabase
        .from("contents")
        .insert({
          title: data.title,
          description: data.description,
          type: "movie",
          genre: data.category,
          release_year: parseInt(data.releaseYear),
          rating: data.rating,
          duration: data.duration,
          poster_url: data.thumbnailUrl,
          backdrop_url: data.backdropUrl,
          video_url: data.videoUrl,
          trailer_url: data.trailerUrl || null,
          logo_url: data.logoUrl || null,
          featured: data.featured,
          is_zoe_original: data.isZoeOriginal,
          is_coming_soon: data.isComingSoon,
          top_rank: data.topRank ? parseInt(data.topRank) : null,
          maturity_rating: data.maturityRating,
          creator: data.creator || null,
          cast_members: castMembers.length > 0 ? castMembers : null,
          audio_languages: selectedAudioLanguages.length > 0 ? selectedAudioLanguages : null,
          subtitle_languages: selectedSubtitleLanguages.length > 0 ? selectedSubtitleLanguages : null,
          channels: selectedChannels.length > 0 ? selectedChannels : [],
          vast_ad_preroll: null,
          vast_ad_midroll: null,
          vast_ad_postroll: null
        } as any)
        .select()
        .single();
        
      if (contentError) throw contentError;
      
      // Insert tags
      if (selectedTags.length > 0) {
        const tagRelations = selectedTags.map(tagId => ({
          content_id: content.id,
          tag_id: tagId
        }));
        
        const { error: tagError } = await supabase
          .from("content_tags")
          .insert(tagRelations);
          
        if (tagError) throw tagError;
      }

      // Insert membership plan associations
      if (selectedPlans.length > 0) {
        const planRelations = selectedPlans.map(planId => ({
          content_id: content.id,
          plan_id: planId
        }));
        
        const { error: planError } = await supabase
          .from("content_membership_plans")
          .insert(planRelations);
          
        if (planError) console.error("Error adding plans:", planError);
      }
      
      toast.success("Movie published successfully!");
      navigate("/admin/movies");
      
    } catch (error: any) {
      console.error("Error publishing movie:", error);
      toast.error(`Failed to publish movie: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="info">General Info</TabsTrigger>
              <TabsTrigger value="media">Media & URLs</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="info">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-gray-900 border-gray-700"
                              placeholder="Enter movie title" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              className="bg-gray-900 border-gray-700 min-h-32"
                              placeholder="Enter movie description" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-900 border-gray-700">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maturityRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maturity Rating</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-900 border-gray-700">
                                  <SelectValue placeholder="Select a rating" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                {MATURITY_RATINGS.map(rating => (
                                  <SelectItem key={rating.value} value={rating.value}>
                                    {rating.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="releaseYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Release Year</FormLabel>
                            <FormControl>
                              <Input 
                                className="bg-gray-900 border-gray-700"
                                type="number"
                                placeholder="2023" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                              <Input 
                                className="bg-gray-900 border-gray-700"
                                placeholder="2h 15m" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Star Rating</FormLabel>
                            <FormControl>
                              <Input 
                                className="bg-gray-900 border-gray-700"
                                placeholder="8.5" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="topRank"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Top 10 Rank (1-10)</FormLabel>
                            <FormControl>
                              <Input 
                                className="bg-gray-900 border-gray-700"
                                type="number"
                                min="1"
                                max="10"
                                placeholder="Leave empty if not in Top 10" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Content Properties</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="featured"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="m-0">Featured Content</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isZoeOriginal"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="m-0">Zoe Original</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isComingSoon"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="m-0">Coming Soon</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isMature"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="m-0">Mature Content</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isNewRelease"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="m-0">New Release</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                          <Button
                            key={tag.id}
                            type="button"
                            variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                            className={selectedTags.includes(tag.id) ? "bg-primary" : ""}
                            onClick={() => toggleTag(tag.id)}
                            size="sm"
                          >
                            {tag.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Channels / Networks */}
                    <ChannelsSelector
                      selectedChannels={selectedChannels}
                      onChannelsChange={setSelectedChannels}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="media">
                  <div className="space-y-6">
                    {/* Vimeo URL Input with Auto-fetch */}
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL (Vimeo)</FormLabel>
                          <FormControl>
                            <VimeoUrlInput
                              value={field.value}
                              onChange={field.onChange}
                              onMetadataFetched={(metadata: VimeoMetadata) => {
                                // Auto-fill fields from Vimeo metadata
                                if (metadata.title && !form.getValues('title')) {
                                  form.setValue('title', metadata.title);
                                }
                                if (metadata.thumbnail_large || metadata.thumbnail_url) {
                                  form.setValue('thumbnailUrl', metadata.thumbnail_large || metadata.thumbnail_url || '');
                                  form.setValue('backdropUrl', metadata.thumbnail_large || metadata.thumbnail_url || '');
                                }
                                if (metadata.duration && !form.getValues('duration')) {
                                  form.setValue('duration', metadata.duration);
                                }
                                if (metadata.description && !form.getValues('description')) {
                                  form.setValue('description', metadata.description);
                                }
                                if (metadata.author_name && !form.getValues('creator')) {
                                  form.setValue('creator', metadata.author_name);
                                }
                              }}
                              className="bg-gray-900 border-gray-700"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Paste a Vimeo URL to auto-fetch thumbnail, duration, and title
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trailerUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trailer URL</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-gray-900 border-gray-700"
                              placeholder="https://example.com/trailer.mp4" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="thumbnailUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poster/Thumbnail URL</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-gray-900 border-gray-700"
                              placeholder="https://example.com/poster.jpg" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="backdropUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Backdrop URL (Banner)</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-gray-900 border-gray-700"
                              placeholder="https://example.com/backdrop.jpg" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo/Title Card URL</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-gray-900 border-gray-700"
                              placeholder="https://example.com/logo.png" 
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-400">Title logo image shown in hero and detail views</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="metadata">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="creator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Creator/Director</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-gray-900 border-gray-700"
                              placeholder="Christopher Nolan" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cast Members */}
                    <div className="space-y-2">
                      <Label>Cast Members</Label>
                      <div className="flex gap-2">
                        <Input
                          className="bg-gray-900 border-gray-700"
                          placeholder="Add cast member name"
                          value={castInput}
                          onChange={(e) => setCastInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCastMember();
                            }
                          }}
                        />
                        <Button type="button" onClick={addCastMember} variant="secondary">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {castMembers.map((member) => (
                          <Badge key={member} variant="secondary" className="flex items-center gap-1">
                            {member}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeCastMember(member)} />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Audio Languages */}
                    <div className="space-y-2">
                      <Label>Audio Languages</Label>
                      <div className="flex flex-wrap gap-2">
                        {AUDIO_LANGUAGES.map((lang) => (
                          <Button
                            key={lang}
                            type="button"
                            variant={selectedAudioLanguages.includes(lang) ? "default" : "outline"}
                            className={selectedAudioLanguages.includes(lang) ? "bg-primary" : ""}
                            onClick={() => toggleAudioLanguage(lang)}
                            size="sm"
                          >
                            {lang}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Subtitle Languages */}
                    <div className="space-y-2">
                      <Label>Subtitle Languages</Label>
                      <div className="flex flex-wrap gap-2">
                        {SUBTITLE_LANGUAGES.map((lang) => (
                          <Button
                            key={lang}
                            type="button"
                            variant={selectedSubtitleLanguages.includes(lang) ? "default" : "outline"}
                            className={selectedSubtitleLanguages.includes(lang) ? "bg-primary" : ""}
                            onClick={() => toggleSubtitleLanguage(lang)}
                            size="sm"
                          >
                            {lang}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Subtitles (VTT Files) */}
                    <SubtitlesSelector
                      subtitles={subtitles}
                      onSubtitlesChange={setSubtitles}
                    />

                    {/* Membership Plans */}
                    <MembershipPlansSelector
                      selectedPlans={selectedPlans}
                      onSelectedPlansChange={setSelectedPlans}
                    />
                  </div>
                </TabsContent>
                
                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? "Publishing..." : "Publish Movie"}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMovieForm;
