
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase, DbContent, DbCategory, DbTag } from "@/integrations/supabase/client";

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
  isMature: boolean;
  isExclusive: boolean;
  isNewRelease: boolean;
  featured: boolean;
  tags: string[];
}

const AddMovieForm = () => {
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
      rating: "PG-13",
      releaseYear: new Date().getFullYear().toString(),
      duration: "",
      videoUrl: "",
      thumbnailUrl: "",
      backdropUrl: "",
      isMature: false,
      isExclusive: false,
      isNewRelease: false,
      featured: false,
      tags: []
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
  
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      // Create the movie content record
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
          featured: data.featured,
          trailer_url: null,
          vast_ad_preroll: null,
          vast_ad_midroll: null,
          vast_ad_postroll: null
        })
        .select()
        .single();
        
      if (contentError) throw contentError;
      
      // Associate tags with the content
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
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="info">General Info</TabsTrigger>
              <TabsTrigger value="media">Media & Metadata</TabsTrigger>
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
                                <SelectItem value="G">G (General Audience)</SelectItem>
                                <SelectItem value="PG">PG (Parental Guidance)</SelectItem>
                                <SelectItem value="PG-13">PG-13 (13+ Years)</SelectItem>
                                <SelectItem value="R">R (Restricted)</SelectItem>
                                <SelectItem value="NC-17">NC-17 (Adults Only)</SelectItem>
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
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-gray-900 border-gray-700"
                              placeholder="https://example.com/movie.mp4" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    className="bg-[#e50914] hover:bg-[#f6121d]"
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
