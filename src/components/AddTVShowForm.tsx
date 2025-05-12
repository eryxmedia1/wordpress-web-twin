import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CheckIcon, X } from "lucide-react";
import { toast } from "sonner";
import { supabase, DbContent, DbCategory, DbTag, ContentType } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

type Season = {
  number: number;
  title: string;
  episodes: Episode[];
}

type Episode = {
  number: number;
  title: string;
  videoUrl: string;
  description: string;
  duration: string;
  thumbnail: string;
}

type FormData = {
  title: string;
  description: string;
  category: string;
  rating: string;
  releaseYear: string;
  duration: string; // Adding duration field
  videoUrl: string;
  thumbnailUrl: string;
  backdropUrl: string;
  isMature: boolean;
  isExclusive: boolean;
  isNewRelease: boolean;
  featured: boolean;
  tags: string[];
  seasons: Season[];
}

const AddTVShowForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [availableTags, setAvailableTags] = useState<DbTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("info");
  
  const form = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      rating: "TV-14",
      releaseYear: new Date().getFullYear().toString(),
      duration: "", // Initialize duration
      videoUrl: "",
      thumbnailUrl: "",
      backdropUrl: "",
      isMature: false,
      isExclusive: false,
      isNewRelease: false,
      featured: false,
      tags: [],
      seasons: [{
        number: 1,
        title: "Season 1",
        episodes: [{
          number: 1,
          title: "Episode 1",
          videoUrl: "",
          description: "",
          duration: "",
          thumbnail: ""
        }]
      }]
    }
  });
  
  // Fetch categories and tags on component mount
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);
  
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("content_type", "show" as ContentType)
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
  
  const addSeason = () => {
    const newSeason = {
      number: form.getValues().seasons.length + 1,
      title: `Season ${form.getValues().seasons.length + 1}`,
      episodes: [{
        number: 1,
        title: "Episode 1",
        videoUrl: "",
        description: "",
        duration: "",
        thumbnail: ""
      }]
    };
    
    const updatedSeasons = [...form.getValues().seasons, newSeason];
    form.setValue("seasons", updatedSeasons);
  };
  
  const addEpisode = (seasonIndex: number) => {
    const seasons = form.getValues().seasons;
    const newEpisodeNumber = seasons[seasonIndex].episodes.length + 1;
    
    const newEpisode = {
      number: newEpisodeNumber,
      title: `Episode ${newEpisodeNumber}`,
      videoUrl: "",
      description: "",
      duration: "",
      thumbnail: ""
    };
    
    seasons[seasonIndex].episodes.push(newEpisode);
    form.setValue("seasons", seasons);
  };
  
  const updateEpisodeField = (seasonIndex: number, episodeIndex: number, field: keyof Episode, value: string) => {
    const seasons = form.getValues().seasons;
    seasons[seasonIndex].episodes[episodeIndex][field] = value;
    form.setValue("seasons", seasons);
  };
  
  const removeEpisode = (seasonIndex: number, episodeIndex: number) => {
    const seasons = form.getValues().seasons;
    seasons[seasonIndex].episodes.splice(episodeIndex, 1);
    
    // Renumber remaining episodes
    seasons[seasonIndex].episodes.forEach((episode, idx) => {
      episode.number = idx + 1;
    });
    
    form.setValue("seasons", seasons);
  };
  
  const removeSeason = (seasonIndex: number) => {
    const seasons = form.getValues().seasons;
    seasons.splice(seasonIndex, 1);
    
    // Renumber remaining seasons
    seasons.forEach((season, idx) => {
      season.number = idx + 1;
    });
    
    form.setValue("seasons", seasons);
  };
  
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      // Step 1: Create the TV show content record
      const { data: content, error: contentError } = await supabase
        .from("contents")
        .insert({
          title: data.title,
          description: data.description,
          type: "show" as ContentType,
          genre: data.category, // Using category as genre 
          release_year: parseInt(data.releaseYear),
          rating: data.rating,
          duration: data.duration, // Include duration
          poster_url: data.thumbnailUrl,
          backdrop_url: data.backdropUrl,
          video_url: data.videoUrl,
          featured: data.featured,
          trailer_url: null, // Not included in form yet
          vast_ad_preroll: null,
          vast_ad_midroll: null,
          vast_ad_postroll: null
        })
        .select()
        .single();
        
      if (contentError) throw contentError;
      
      // Step 2: Associate tags with the content
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
      
      // Step 3: Create seasons and episodes
      for (const season of data.seasons) {
        // Create season
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .insert({
            content_id: content.id,
            season_number: season.number,
            title: season.title,
            description: "", // Including required properties
            poster_url: "" // Including required properties
          })
          .select()
          .single();
          
        if (seasonError) throw seasonError;
        
        // Create episodes for this season
        if (season.episodes.length > 0) {
          // Prepare episode data
          const episodeInserts = season.episodes.map(episode => ({
            season_id: seasonData.id,
            episode_number: episode.number,
            title: episode.title,
            description: episode.description,
            duration: episode.duration,
            video_url: episode.videoUrl,
            thumbnail_url: episode.thumbnail,
            vast_ad_url: null // Include required property
          }));
          
          // Insert all episodes
          const { error: episodeError } = await supabase
            .from("episodes")
            .insert(episodeInserts);
            
          if (episodeError) throw episodeError;
        }
      }
      
      toast.success("TV Show published successfully!");
      navigate("/admin/tvshows");
      
    } catch (error: any) {
      console.error("Error publishing TV show:", error);
      toast.error(`Failed to publish TV show: ${error.message}`);
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
              <TabsTrigger value="media">Media & Metadata</TabsTrigger>
              <TabsTrigger value="seasons">Seasons & Episodes</TabsTrigger>
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
                              placeholder="Enter TV show title" 
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
                              placeholder="Enter TV show description" 
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
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rating</FormLabel>
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
                                <SelectItem value="TV-Y">TV-Y (All Children)</SelectItem>
                                <SelectItem value="TV-Y7">TV-Y7 (7+ Years)</SelectItem>
                                <SelectItem value="TV-G">TV-G (General Audience)</SelectItem>
                                <SelectItem value="TV-PG">TV-PG (Parental Guidance)</SelectItem>
                                <SelectItem value="TV-14">TV-14 (14+ Years)</SelectItem>
                                <SelectItem value="TV-MA">TV-MA (Mature Audience)</SelectItem>
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
                                placeholder="30m per episode" 
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
                        <div className="flex items-center space-x-2">
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FormField
                            control={form.control}
                            name="isExclusive"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange} 
                                  />
                                </FormControl>
                                <FormLabel className="m-0">Exclusive Content</FormLabel>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
                            className={selectedTags.includes(tag.id) ? "bg-blue-600" : ""}
                            onClick={() => toggleTag(tag.id)}
                            size="sm"
                          >
                            {tag.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="media">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="thumbnailUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thumbnail URL</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-gray-900 border-gray-700"
                              placeholder="https://example.com/thumbnail.jpg" 
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
                      name="videoUrl"
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
                  </div>
                </TabsContent>
                
                <TabsContent value="seasons">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Seasons & Episodes</h3>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={addSeason}
                        className="border-blue-500 text-blue-500"
                      >
                        Add Season
                      </Button>
                    </div>
                    
                    <div className="space-y-8">
                      {form.watch("seasons").map((season, seasonIndex) => (
                        <div key={seasonIndex} className="space-y-4 border border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-md font-medium">Season {season.number}</h4>
                            {form.watch("seasons").length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => removeSeason(seasonIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h5 className="text-sm font-medium">Episodes</h5>
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                className="text-blue-500"
                                onClick={() => addEpisode(seasonIndex)}
                              >
                                Add Episode
                              </Button>
                            </div>
                            
                            <div className="space-y-4">
                              {season.episodes.map((episode, episodeIndex) => (
                                <div key={episodeIndex} className="border border-gray-700 rounded-md p-3">
                                  <div className="flex justify-between items-center mb-3">
                                    <h6 className="text-sm font-medium">Episode {episode.number}</h6>
                                    {season.episodes.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-6 w-6 p-0"
                                        onClick={() => removeEpisode(seasonIndex, episodeIndex)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Title</Label>
                                      <Input 
                                        className="bg-gray-900 border-gray-700 h-8 mt-1"
                                        value={episode.title}
                                        onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "title", e.target.value)}
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label className="text-xs">Duration</Label>
                                      <Input 
                                        className="bg-gray-900 border-gray-700 h-8 mt-1"
                                        placeholder="45m"
                                        value={episode.duration}
                                        onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "duration", e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                      <Label className="text-xs">Video URL</Label>
                                      <Input 
                                        className="bg-gray-900 border-gray-700 h-8 mt-1"
                                        placeholder="https://example.com/episode.mp4"
                                        value={episode.videoUrl}
                                        onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "videoUrl", e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                      <Label className="text-xs">Thumbnail</Label>
                                      <Input 
                                        className="bg-gray-900 border-gray-700 h-8 mt-1"
                                        placeholder="https://example.com/thumbnail.jpg"
                                        value={episode.thumbnail}
                                        onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "thumbnail", e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                      <Label className="text-xs">Description</Label>
                                      <Textarea 
                                        className="bg-gray-900 border-gray-700 min-h-16 mt-1"
                                        placeholder="Episode description"
                                        value={episode.description}
                                        onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "description", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    className="bg-[#e50914] hover:bg-[#f6121d]"
                    disabled={loading}
                  >
                    {loading ? "Publishing..." : "Publish TV Show"}
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

export default AddTVShowForm;
