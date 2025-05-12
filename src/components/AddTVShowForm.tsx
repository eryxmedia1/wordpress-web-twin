
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CheckIcon, X } from "lucide-react";
import { toast } from "sonner";
import { supabase, DbContent, DbCategory, DbTag, ContentType } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const AddTVShowForm = ({ onClose }: AddTVShowFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [activeTab, setActiveTab] = useState("info");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    // Fetch categories
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

    // Fetch tags
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

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Step 1: Create the TV show content record
      const showType: ContentType = "show";
      const { data: content, error: contentError } = await supabase
        .from("contents")
        .insert({
          title: data.title,
          description: data.description,
          type: showType,
          genre: data.genre,
          release_year: parseInt(data.releaseYear),
          rating: data.rating,
          poster_url: data.posterUrl,
          backdrop_url: data.backdropUrl,
          trailer_url: data.trailerUrl,
          video_url: data.videoUrl, // Add video URL field
          featured: data.featured,
          category_id: data.category,
          // Add missing required properties
          duration: data.duration, // Add duration field
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

      // Step 2: Create content tags
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
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="info" className="text-white">General Info</TabsTrigger>
            <TabsTrigger value="media" className="text-white">Media & Metadata</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TabsContent value="info" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white">Title</label>
                <Input
                  type="text"
                  {...register("title", { required: "Title is required" })}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs">{String(errors.title.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">
                  Description
                </label>
                <Textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs">{String(errors.description.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Genre</label>
                <Input
                  type="text"
                  {...register("genre", { required: "Genre is required" })}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                />
                {errors.genre && (
                  <p className="text-red-500 text-xs">{String(errors.genre.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">
                  Release Year
                </label>
                <Input
                  type="number"
                  {...register("releaseYear", {
                    required: "Release Year is required",
                    valueAsNumber: true,
                  })}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                />
                {errors.releaseYear && (
                  <p className="text-red-500 text-xs">{String(errors.releaseYear.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Rating</label>
                <Input
                  type="text"
                  {...register("rating", { required: "Rating is required" })}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                />
                {errors.rating && (
                  <p className="text-red-500 text-xs">{String(errors.rating.message)}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white">Duration</label>
                <Input
                  type="text"
                  {...register("duration")}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                  placeholder="e.g. 30m per episode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Category</label>
                <select
                  {...register("category", { required: "Category is required" })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs">{String(errors.category.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Tags</label>
                <div className="mt-2 space-y-2">
                  {tags.map((tag) => (
                    <div key={tag.value} className="flex items-center">
                      <label className="flex items-center text-white">
                        <input 
                          type="checkbox"
                          value={tag.value}
                          {...register("tags")}
                          className="mr-2 rounded bg-gray-700 border-gray-600"
                        />
                        {tag.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  {...register("featured")} 
                  id="featured" 
                  className="rounded bg-gray-700 border-gray-600"
                />
                <label htmlFor="featured" className="text-sm font-medium text-white">
                  Featured
                </label>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white">
                  Video URL
                </label>
                <Input
                  type="url"
                  {...register("videoUrl")}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                  placeholder="https://example.com/video.mp4"
                />
                <p className="text-xs text-gray-400 mt-1">Full video URL for the TV show (if applicable)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white">
                  Poster URL
                </label>
                <Input
                  type="url"
                  {...register("posterUrl", { required: "Poster URL is required" })}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                />
                {errors.posterUrl && (
                  <p className="text-red-500 text-xs">{String(errors.posterUrl.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">
                  Backdrop URL
                </label>
                <Input
                  type="url"
                  {...register("backdropUrl", {
                    required: "Backdrop URL is required",
                  })}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                />
                {errors.backdropUrl && (
                  <p className="text-red-500 text-xs">{String(errors.backdropUrl.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">
                  Trailer URL
                </label>
                <Input
                  type="url"
                  {...register("trailerUrl", { required: "Trailer URL is required" })}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                />
                {errors.trailerUrl && (
                  <p className="text-red-500 text-xs">{String(errors.trailerUrl.message)}</p>
                )}
              </div>

              <div className="border border-gray-600 rounded-md p-4">
                <h3 className="font-medium text-white">VAST Ad URLs (Optional)</h3>
                
                <div className="space-y-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-white">
                      Pre-roll Ad URL
                    </label>
                    <Input
                      type="url"
                      {...register("vastAdPreroll")}
                      className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                      placeholder="https://example.com/ads/preroll.xml"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">
                      Mid-roll Ad URL
                    </label>
                    <Input
                      type="url"
                      {...register("vastAdMidroll")}
                      className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                      placeholder="https://example.com/ads/midroll.xml"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">
                      Post-roll Ad URL
                    </label>
                    <Input
                      type="url"
                      {...register("vastAdPostroll")}
                      className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                      placeholder="https://example.com/ads/postroll.xml"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <div className="flex justify-end pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="mr-2 text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#e50914] hover:bg-[#f6121d] text-white">
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
