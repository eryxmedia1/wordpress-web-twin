
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CheckIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, DbContent, DbCategory, DbTag, ContentType } from "@/integrations/supabase/client";
import { VimeoUrlInput } from "@/components/VimeoUrlInput";
import { ChannelsSelector } from "@/components/admin/ChannelsSelector";
import { GenreSelector } from "@/components/admin/GenreSelector";
import { VimeoMetadata } from "@/hooks/useVimeoMetadata";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddTVShowFormProps {
  onClose: () => void;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface TagOption {
  value: string;
  label: string;
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

const DEFAULT_MIDROLL_URL = "https://servedby.aqua-adserver.com/fc.php?script=apVideo:vast2&zoneid=12154";

const AddTVShowForm = ({ onClose }: AddTVShowFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [activeTab, setActiveTab] = useState("info");
  const [castMembers, setCastMembers] = useState<string[]>([]);
  const [castInput, setCastInput] = useState("");
  const [selectedAudioLanguages, setSelectedAudioLanguages] = useState<string[]>([]);
  const [selectedSubtitleLanguages, setSelectedSubtitleLanguages] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      genre: "",
      releaseYear: new Date().getFullYear(),
      rating: "",
      duration: "",
      category: "",
      tags: [] as string[],
      featured: false,
      isZoeOriginal: false,
      isComingSoon: false,
      topRank: "",
      maturityRating: "TV-PG",
      creator: "",
      videoUrl: "",
      posterUrl: "",
      backdropUrl: "",
      trailerUrl: "",
      logoUrl: "",
      vastAdPreroll: "",
      vastAdMidroll: "",
      vastAdPostroll: "",
    }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("content_type", "show");

      if (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories.");
      }

      if (data) {
        setCategories(
          data.map((cat) => ({
            value: cat.id,
            label: cat.name,
          }))
        );
      }
    };

    const fetchTags = async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .eq("content_type", "show");

      if (error) {
        console.error("Error fetching tags:", error);
        toast.error("Failed to load tags.");
      }

      if (data) {
        setTags(
          data.map((tag) => ({
            value: tag.id,
            label: tag.name,
          }))
        );
      }
    };

    fetchCategories();
    fetchTags();
  }, []);

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

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    // Only require video URL - everything else is optional
    if (!data.videoUrl && !data.title) {
      toast.error("Please enter a video URL or title");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const showType: ContentType = "show";
      const { data: content, error: contentError } = await supabase
        .from("contents")
        .insert({
          title: data.title || "Untitled Show",
          description: data.description || null,
          type: showType,
          genre: selectedGenres.length > 0 ? selectedGenres.join(", ") : null,
          release_year: data.releaseYear ? parseInt(data.releaseYear) : new Date().getFullYear(),
          rating: data.rating || null,
          poster_url: data.posterUrl || null,
          backdrop_url: data.backdropUrl || null,
          trailer_url: data.trailerUrl || null,
          video_url: data.videoUrl || null,
          logo_url: data.logoUrl || null,
          featured: data.featured || false,
          is_zoe_original: data.isZoeOriginal || false,
          is_coming_soon: data.isComingSoon || false,
          top_rank: data.topRank ? parseInt(data.topRank) : null,
          maturity_rating: data.maturityRating || null,
          creator: data.creator || null,
          cast_members: castMembers.length > 0 ? castMembers : null,
          audio_languages: selectedAudioLanguages.length > 0 ? selectedAudioLanguages : null,
          subtitle_languages: selectedSubtitleLanguages.length > 0 ? selectedSubtitleLanguages : null,
          channels: selectedChannels.length > 0 ? selectedChannels : [],
          duration: data.duration || null,
          vast_ad_preroll: data.vastAdPreroll || null,
          vast_ad_midroll: data.vastAdMidroll || null,
          vast_ad_postroll: data.vastAdPostroll || null
        })
        .select()
        .single();

      if (contentError) {
        console.error("Content creation error:", contentError);
        toast.error("Failed to create TV show content.");
        return;
      }

      if (!content) {
        console.error("No content returned after creation.");
        toast.error("Failed to create TV show content.");
        return;
      }

      if (data.tags && data.tags.length > 0) {
        const contentTags = data.tags.map((tagId: string) => ({
          content_id: content.id,
          tag_id: tagId,
        }));

        const { error: contentTagsError } = await supabase
          .from("content_tags")
          .insert(contentTags);

        if (contentTagsError) {
          console.error("Content tags creation error:", contentTagsError);
          toast.error("Failed to assign tags to the TV show.");
          return;
        }
      }

      toast.success("TV Show created successfully!");
      reset();
      onClose();
      navigate("/admin/tvshows");
    } catch (error) {
      console.error("Error creating TV show:", error);
      toast.error("Failed to create TV show. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 shadow-lg">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="info" className="text-white">General Info</TabsTrigger>
            <TabsTrigger value="media" className="text-white">Media & URLs</TabsTrigger>
            <TabsTrigger value="metadata" className="text-white">Metadata</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TabsContent value="info" className="space-y-4">
              <div>
                <Label className="text-white">Title</Label>
                <Input
                  type="text"
                  {...register("title")}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="Auto-filled from Vimeo or enter manually"
                />
              </div>

              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  {...register("description")}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="Auto-filled from Vimeo or enter manually"
                />
              </div>

              {/* Genre Multi-Select */}
              <GenreSelector
                selectedGenres={selectedGenres}
                onGenresChange={setSelectedGenres}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <Label className="text-white">Maturity Rating</Label>
                  <select
                    {...register("maturityRating")}
                    className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  >
                    {MATURITY_RATINGS.map((rating) => (
                      <option key={rating.value} value={rating.value}>
                        {rating.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-white">Release Year</Label>
                  <Input
                    type="number"
                    {...register("releaseYear")}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Star Rating</Label>
                  <Input
                    type="text"
                    {...register("rating")}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    placeholder="8.5"
                  />
                </div>
                
                <div>
                  <Label className="text-white">Duration (per episode)</Label>
                  <Input
                    type="text"
                    {...register("duration")}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    placeholder="45m"
                  />
                </div>

                <div>
                  <Label className="text-white">Top 10 Rank (1-10)</Label>
                  <Input
                    type="number"
                    {...register("topRank")}
                    min="1"
                    max="10"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    placeholder="Leave empty if not in Top 10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Category</Label>
                <select
                  {...register("category")}
                  className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured Hero Carousel Checkbox - Prominent */}
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    {...register("featured")} 
                    id="featured" 
                    className="h-5 w-5 rounded bg-gray-700 border-primary accent-primary"
                  />
                  <div>
                    <Label htmlFor="featured" className="text-base font-semibold text-primary">
                      ⭐ Display in Hero Carousel
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable this to show the video in the top hero section on the home page (max 10 videos)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    {...register("isZoeOriginal")} 
                    id="isZoeOriginal" 
                    className="rounded bg-gray-700 border-gray-600"
                  />
                  <Label htmlFor="isZoeOriginal" className="text-white">Zoe Original</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    {...register("isComingSoon")} 
                    id="isComingSoon" 
                    className="rounded bg-gray-700 border-gray-600"
                  />
                  <Label htmlFor="isComingSoon" className="text-white">Coming Soon</Label>
                </div>
              </div>

              <div>
                <Label className="text-white">Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <label key={tag.value} className="flex items-center text-white">
                      <input 
                        type="checkbox"
                        value={tag.value}
                        {...register("tags")}
                        className="mr-2 rounded bg-gray-700 border-gray-600"
                      />
                      {tag.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Channels / Networks */}
              <ChannelsSelector
                selectedChannels={selectedChannels}
                onChannelsChange={setSelectedChannels}
              />
            </TabsContent>
            
            <TabsContent value="media" className="space-y-4">
              <div>
                <Label className="text-white">Video URL (Vimeo) - Paste to auto-fill all fields</Label>
                <VimeoUrlInput
                  value={watch("videoUrl") || ""}
                  onChange={(value) => setValue("videoUrl", value)}
                  onMetadataFetched={(metadata: VimeoMetadata) => {
                    // Auto-fill ALL fields from Vimeo metadata (overwrite existing)
                    if (metadata.title) {
                      setValue('title', metadata.title);
                    }
                    if (metadata.thumbnail_large || metadata.thumbnail_url) {
                      setValue('posterUrl', metadata.thumbnail_large || metadata.thumbnail_url || '');
                      setValue('backdropUrl', metadata.thumbnail_large || metadata.thumbnail_url || '');
                    }
                    if (metadata.duration) {
                      setValue('duration', metadata.duration);
                    }
                    if (metadata.description) {
                      setValue('description', metadata.description);
                    }
                    if (metadata.author_name) {
                      setValue('creator', metadata.author_name);
                    }
                  }}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paste a Vimeo URL to auto-fetch thumbnail, duration, title, and description
                </p>
              </div>

              <div>
                <Label className="text-white">Trailer URL</Label>
                <Input
                  type="url"
                  {...register("trailerUrl")}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="https://example.com/trailer.mp4"
                />
              </div>
              
              <div>
                <Label className="text-white">Poster URL</Label>
                <Input
                  type="url"
                  {...register("posterUrl")}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="Auto-filled from Vimeo"
                />
              </div>

              <div>
                <Label className="text-white">Backdrop URL</Label>
                <Input
                  type="url"
                  {...register("backdropUrl")}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Logo/Title Card URL</Label>
                <Input
                  type="url"
                  {...register("logoUrl")}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-400 mt-1">Title logo image shown in hero and detail views</p>
              </div>

              <div className="border border-gray-600 rounded-md p-4">
                <h3 className="font-medium text-white">VAST Ad URLs (Optional)</h3>
                
                <div className="space-y-4 mt-3">
                  <div>
                    <Label className="text-white">Pre-roll Ad URL</Label>
                    <Input
                      type="url"
                      {...register("vastAdPreroll")}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      placeholder="https://example.com/ads/preroll.xml"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Mid-roll Ad URL</Label>
                    <Input
                      type="url"
                      {...register("vastAdMidroll")}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      placeholder={DEFAULT_MIDROLL_URL}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => setValue("vastAdMidroll", DEFAULT_MIDROLL_URL)}
                    >
                      Use Default Midroll URL
                    </Button>
                  </div>

                  <div>
                    <Label className="text-white">Post-roll Ad URL</Label>
                    <Input
                      type="url"
                      {...register("vastAdPostroll")}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      placeholder="https://example.com/ads/postroll.xml"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <div>
                <Label className="text-white">Creator</Label>
                <Input
                  type="text"
                  {...register("creator")}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="Shonda Rhimes"
                />
              </div>

              {/* Cast Members */}
              <div className="space-y-2">
                <Label className="text-white">Cast Members</Label>
                <div className="flex gap-2">
                  <Input
                    className="bg-gray-700 border-gray-600 text-white"
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
                <Label className="text-white">Audio Languages</Label>
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
                <Label className="text-white">Subtitle Languages</Label>
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
            </TabsContent>
            
            <div className="flex justify-end pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="mr-2 text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-white">
                {isSubmitting ? (
                  <>
                    <CheckIcon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create TV Show"
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AddTVShowForm;
