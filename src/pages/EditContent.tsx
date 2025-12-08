
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Plus, Trash, Video, ChevronUp, ChevronDown, Star, Upload } from "lucide-react";
import { toast } from "sonner";
import AdminNavbar from "@/components/AdminNavbar";
import { ChannelsSelector } from "@/components/admin/ChannelsSelector";
import { TagsSelector } from "@/components/admin/TagsSelector";
import { MembershipPlansSelector } from "@/components/admin/MembershipPlansSelector";
import { GenreSelector } from "@/components/admin/GenreSelector";
import { VideoSearchSelector } from "@/components/admin/VideoSearchSelector";
import { supabase, DbContent, DbProfile, DbSeason, DbEpisode, ContentType, MidrollConfig } from "@/integrations/supabase/client";

const RATING_OPTIONS = [
  "G", "PG", "PG-13", "R", "NC-17",
  "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA",
  "NR", "Unrated"
];

const DEFAULT_MIDROLL_URL = "https://servedby.aqua-adserver.com/fc.php?script=apVideo:vast2&zoneid=12154";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

interface Episode {
  number: number;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  vastAdUrl: string;
}

interface Season {
  number: number;
  episodes: Episode[];
}

// Using MidrollConfig from supabase client

interface ContentDetails {
  title: string;
  description: string;
  releaseYear: string;
  genre: string;
  rating: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  bannerUrl: string;
  vastAdUrl: {
    preroll: string;
    midroll: string;
    postroll: string;
  };
  midrollConfig: MidrollConfig;
}

const EditContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [contentType, setContentType] = useState<ContentType>("movie");
  const [loading, setLoading] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [bulkImportUrls, setBulkImportUrls] = useState("");
  
  // For TV shows - start with empty array, will be populated from DB
  const [seasons, setSeasons] = useState<Season[]>([]);
  
  // Available videos for episode selection
  const [availableVideos, setAvailableVideos] = useState<{id: string; title: string; video_url: string | null; poster_url: string | null}[]>([]);
  
  // Fetch available videos for episode selection
  useEffect(() => {
    async function fetchAvailableVideos() {
      const { data, error } = await supabase
        .from('contents')
        .select('id, title, video_url, poster_url')
        .not('video_url', 'is', null)
        .order('title', { ascending: true });
        
      if (!error && data) {
        setAvailableVideos(data);
      }
    }
    fetchAvailableVideos();
  }, []);
  
  // For a single movie or general content details
  const [contentDetails, setContentDetails] = useState<ContentDetails>({
    title: "",
    description: "",
    releaseYear: "",
    genre: "",
    rating: "",
    duration: "",
    videoUrl: "",
    thumbnailUrl: "",
    bannerUrl: "",
    vastAdUrl: {
      preroll: "",
      midroll: "",
      postroll: ""
    },
    midrollConfig: {
      enabled: false,
      count: 1,
      startAfterMinutes: 10,
      intervalMinutes: 10
    }
  });

  useEffect(() => {
    async function checkAdminStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to access the admin area");
        navigate("/login");
        return;
      }

      // Use type assertion to work with the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single() as { data: DbProfile | null };
      
      if (!profile?.is_admin) {
        toast.error("You don't have permission to access the admin area");
        navigate("/");
      }
    }

    checkAdminStatus();
    
    if (!isNew) {
      fetchContentDetails();
    }
  }, [id, isNew, navigate]);

  async function fetchContentDetails() {
    setLoading(true);
    
    // Fetch content details with type assertion
    const { data: content, error } = await supabase
      .from('contents')
      .select('*')
      .eq('id', id)
      .single() as { data: DbContent | null; error: any };
      
    if (error) {
      toast.error("Failed to fetch content details");
      setLoading(false);
      return;
    }
    
    if (!content) {
      toast.error("Content not found");
      setLoading(false);
      return;
    }
    
    setContentType(content.type);
    
    // Parse midroll_config from database or use defaults
    const dbMidrollConfig = content.midroll_config as MidrollConfig | null;
    const midrollConfig: MidrollConfig = dbMidrollConfig || {
      enabled: false,
      count: 1,
      startAfterMinutes: 10,
      intervalMinutes: 10
    };
    
    setContentDetails({
      title: content.title || "",
      description: content.description || "",
      releaseYear: content.release_year?.toString() || "",
      genre: content.genre || "",
      rating: content.rating || "",
      duration: content.duration || "",
      videoUrl: content.video_url || "",
      thumbnailUrl: content.poster_url || "",
      bannerUrl: content.backdrop_url || "",
      vastAdUrl: {
        preroll: content.vast_ad_preroll || "",
        midroll: content.vast_ad_midroll || "",
        postroll: content.vast_ad_postroll || ""
      },
      midrollConfig
    });
    setSelectedChannels(content.channels || []);
    setIsFeatured((content as any).featured || false);
    
    // Fetch associated tags and membership plans
    await Promise.all([
      fetchContentTags(content.id),
      fetchContentMembershipPlans(content.id)
    ]);
    
    if (content.type === 'show') {
      await fetchSeasons(content.id);
    }
    
    setLoading(false);
  }

  async function fetchContentTags(contentId: string) {
    const { data: contentTags, error } = await supabase
      .from('content_tags')
      .select('tag_id')
      .eq('content_id', contentId);
      
    if (error) {
      console.error("Failed to fetch content tags:", error);
      return;
    }
    
    setSelectedTagIds((contentTags || []).map(ct => ct.tag_id));
  }

  async function fetchContentMembershipPlans(contentId: string) {
    const { data: contentPlans, error } = await supabase
      .from('content_membership_plans')
      .select('plan_id')
      .eq('content_id', contentId);
      
    if (error) {
      console.error("Failed to fetch content membership plans:", error);
      return;
    }
    
    setSelectedPlanIds((contentPlans || []).map(cp => cp.plan_id));
  }

  async function fetchSeasons(contentId: string) {
    // Fetch seasons with type assertion
    const { data: seasonsData, error: seasonsError } = await supabase
      .from('seasons')
      .select('id, season_number, title, description, poster_url')
      .eq('content_id', contentId)
      .order('season_number', { ascending: true }) as { data: DbSeason[] | null; error: any };
      
    if (seasonsError) {
      toast.error("Failed to fetch seasons");
      return;
    }
    
    if (!seasonsData?.length) return;
    
    // Fetch episodes for each season
    const newSeasons = await Promise.all(
      seasonsData.map(async (season) => {
        // Fetch episodes with type assertion
        const { data: episodes, error: episodesError } = await supabase
          .from('episodes')
          .select('*')
          .eq('season_id', season.id)
          .order('episode_number', { ascending: true }) as { data: DbEpisode[] | null; error: any };
          
        if (episodesError) {
          toast.error(`Failed to fetch episodes for season ${season.season_number}`);
          return {
            number: season.season_number,
            episodes: []
          };
        }
        
        return {
          number: season.season_number,
          episodes: (episodes || []).map(ep => ({
            number: ep.episode_number,
            title: ep.title,
            description: ep.description || "",
            duration: ep.duration || "",
            videoUrl: ep.video_url || "",
            thumbnail: ep.thumbnail_url || "",
            vastAdUrl: ep.vast_ad_url || ""
          }))
        };
      })
    );
    
    setSeasons(newSeasons);
  }
  
  const handleSave = async () => {
    setLoading(true);
    
    try {
      if (!contentDetails.title) {
        toast.error("Title is required");
        setLoading(false);
        return;
      }
      
      let contentId = id;
      
      // Insert or update content
      if (isNew) {
        // Create new content - adding missing properties: trailer_url and featured
        const { data: contentData, error: contentError } = await supabase
          .from('contents')
          .insert({
            title: contentDetails.title,
            description: contentDetails.description,
            type: contentType,
            genre: contentDetails.genre,
            release_year: contentDetails.releaseYear ? parseInt(contentDetails.releaseYear) : null,
            rating: contentDetails.rating,
            duration: contentDetails.duration,
            poster_url: contentDetails.thumbnailUrl,
            backdrop_url: contentDetails.bannerUrl,
            video_url: contentDetails.videoUrl,
            vast_ad_preroll: contentDetails.vastAdUrl.preroll,
            vast_ad_midroll: contentDetails.vastAdUrl.midroll,
            vast_ad_postroll: contentDetails.vastAdUrl.postroll,
            channels: selectedChannels,
            trailer_url: null,
            featured: isFeatured,
            midroll_config: contentDetails.midrollConfig
          })
          .select()
          .single() as { data: DbContent | null; error: any };
          
        if (contentError) {
          throw new Error(`Failed to create content: ${contentError.message}`);
        }
        
        if (!contentData) {
          throw new Error("Failed to create content: No data returned");
        }
        
        contentId = contentData.id;
      } else {
        // Update existing content with type assertion
        const { error: contentError } = await supabase
          .from('contents')
          .update({
            title: contentDetails.title,
            description: contentDetails.description,
            type: contentType,
            genre: contentDetails.genre,
            release_year: contentDetails.releaseYear ? parseInt(contentDetails.releaseYear) : null,
            rating: contentDetails.rating,
            duration: contentDetails.duration,
            poster_url: contentDetails.thumbnailUrl,
            backdrop_url: contentDetails.bannerUrl,
            video_url: contentDetails.videoUrl,
            vast_ad_preroll: contentDetails.vastAdUrl.preroll,
            vast_ad_midroll: contentDetails.vastAdUrl.midroll,
            vast_ad_postroll: contentDetails.vastAdUrl.postroll,
            channels: selectedChannels,
            midroll_config: contentDetails.midrollConfig,
            featured: isFeatured
          })
          .eq('id', contentId as string) as { error: any };
          
        if (contentError) {
          throw new Error(`Failed to update content: ${contentError.message}`);
        }
      }
      
      // If it's a show, save seasons and episodes
      if (contentType === 'show' && contentId) {
        // Get existing seasons to compare
        const { data: existingSeasons } = await supabase
          .from('seasons')
          .select('id, season_number')
          .eq('content_id', contentId) as { data: DbSeason[] | null };
        
        // Process each season
        for (const season of seasons) {
          let seasonId;
          
          // Find existing season or create new one
          const existingSeason = existingSeasons?.find(s => s.season_number === season.number);
          
          if (existingSeason) {
            seasonId = existingSeason.id;
          } else {
            // Create new season - Fixed: removed array brackets and added required fields
            const { data: newSeason, error: seasonError } = await supabase
              .from('seasons')
              .insert(
                {
                  content_id: contentId,
                  season_number: season.number,
                  title: `Season ${season.number}`, // Added required field
                  description: null, // Added null for optional field
                  poster_url: null // Added null for optional field
                }
              )
              .select()
              .single() as { data: DbSeason | null; error: any };
              
            if (seasonError) {
              throw new Error(`Failed to create season ${season.number}: ${seasonError.message}`);
            }
            
            if (!newSeason) {
              throw new Error(`Failed to create season ${season.number}: No data returned`);
            }
            
            seasonId = newSeason.id;
          }
          
          // Get existing episodes to compare
          const { data: existingEpisodes } = await supabase
            .from('episodes')
            .select('id, episode_number')
            .eq('season_id', seasonId) as { data: DbEpisode[] | null };
          
          // Process each episode
          for (const episode of season.episodes) {
            // Find existing episode or create new one
            const existingEpisode = existingEpisodes?.find(e => e.episode_number === episode.number);
            
            if (existingEpisode) {
              // Update existing episode
              const { error: epError } = await supabase
                .from('episodes')
                .update({
                  title: episode.title,
                  description: episode.description,
                  duration: episode.duration,
                  video_url: episode.videoUrl,
                  thumbnail_url: episode.thumbnail,
                  vast_ad_url: episode.vastAdUrl
                })
                .eq('id', existingEpisode.id) as { error: any };
                
              if (epError) {
                throw new Error(`Failed to update episode ${episode.number}: ${epError.message}`);
              }
            } else {
              // Create new episode
              const { error: epError } = await supabase
                .from('episodes')
                .insert(
                  {
                    season_id: seasonId,
                    episode_number: episode.number,
                    title: episode.title,
                    description: episode.description,
                    duration: episode.duration,
                    video_url: episode.videoUrl,
                    thumbnail_url: episode.thumbnail,
                    vast_ad_url: episode.vastAdUrl
                  }
                ) as { error: any };
                
              if (epError) {
                throw new Error(`Failed to create episode ${episode.number}: ${epError.message}`);
              }
            }
          }
          
          // Remove episodes that were deleted in UI
          const episodeNumbersToKeep = season.episodes.map(e => e.number);
          for (const existingEp of existingEpisodes || []) {
            if (!episodeNumbersToKeep.includes(existingEp.episode_number)) {
              await supabase
                .from('episodes')
                .delete()
                .eq('id', existingEp.id);
            }
          }
        }
        
        // Remove seasons that were deleted in UI
        const seasonNumbersToKeep = seasons.map(s => s.number);
        for (const existingSeason of existingSeasons || []) {
          if (!seasonNumbersToKeep.includes(existingSeason.season_number)) {
            await supabase
              .from('seasons')
              .delete()
              .eq('id', existingSeason.id);
          }
        }
        
        // Auto-populate poster/backdrop/trailer from first episode if missing or invalid
        if (contentId && seasons.length > 0 && seasons[0].episodes.length > 0) {
          const firstEpisode = seasons[0].episodes[0];
          
          // Fetch current content to check trailer_url
          const { data: currentContent } = await supabase
            .from('contents')
            .select('trailer_url, poster_url')
            .eq('id', contentId)
            .single();
          
          const updates: Record<string, string> = {};
          
          // Check if poster_url is empty or contains a Vimeo video URL instead of an image
          const isInvalidPosterUrl = !currentContent?.poster_url || 
            currentContent.poster_url.includes('vimeo.com') || 
            currentContent.poster_url.includes('player.vimeo.com');
          
          if (isInvalidPosterUrl && firstEpisode.thumbnail) {
            updates.poster_url = firstEpisode.thumbnail;
            updates.backdrop_url = firstEpisode.thumbnail;
          }
          
          // Set trailer to first episode video if not set
          if (!currentContent?.trailer_url && firstEpisode.videoUrl) {
            updates.trailer_url = firstEpisode.videoUrl;
          }
          
          if (Object.keys(updates).length > 0) {
            await supabase
              .from('contents')
              .update(updates)
              .eq('id', contentId);
          }
        }
      }
      
      // Save content tags
      if (contentId) {
        // Delete existing content_tags for this content
        await supabase
          .from('content_tags')
          .delete()
          .eq('content_id', contentId);
        
        // Insert new content_tags
        if (selectedTagIds.length > 0) {
          const contentTagsToInsert = selectedTagIds.map(tagId => ({
            content_id: contentId,
            tag_id: tagId
          }));
          
          const { error: tagsError } = await supabase
            .from('content_tags')
            .insert(contentTagsToInsert as any);
            
          if (tagsError) {
            console.error("Failed to save tags:", tagsError);
            toast.error("Content saved but failed to save some tags");
          }
        }
      }
      
      // Save content membership plans
      if (contentId) {
        // Delete existing content_membership_plans for this content
        await supabase
          .from('content_membership_plans')
          .delete()
          .eq('content_id', contentId);
        
        // Insert new content_membership_plans
        if (selectedPlanIds.length > 0) {
          const contentPlansToInsert = selectedPlanIds.map(planId => ({
            content_id: contentId,
            plan_id: planId
          }));
          
          const { error: plansError } = await supabase
            .from('content_membership_plans')
            .insert(contentPlansToInsert as any);
            
          if (plansError) {
            console.error("Failed to save membership plans:", plansError);
            toast.error("Content saved but failed to save membership plan access");
          }
        }
      }
      
      toast.success(`Content ${isNew ? "created" : "updated"} successfully!`);
      navigate("/admin");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{isNew ? "Add New Content" : "Edit Content"}</h1>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#e50914] hover:bg-[#f6121d]" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
        
        {isNew && (
          <div className="mb-6">
            <Label htmlFor="content-type" className="mb-2 block">Content Type</Label>
            <div className="flex gap-4">
              <Button 
                variant={contentType === "movie" ? "default" : "outline"}
                className={contentType === "movie" ? "bg-[#e50914]" : ""}
                onClick={() => setContentType("movie")}
              >
                <Film className="mr-2" /> Movie
              </Button>
              <Button 
                variant={contentType === "show" ? "default" : "outline"}
                className={contentType === "show" ? "bg-[#e50914]" : ""}
                onClick={() => setContentType("show")}
              >
                <Video className="mr-2" /> TV Show
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title" className="mb-2 block">Title</Label>
              <Input 
                id="title"
                value={contentDetails.title}
                onChange={(e) => setContentDetails({...contentDetails, title: e.target.value})}
                className="bg-gray-800 border-gray-700"
                placeholder="Content title"
              />
            </div>
            
            <div>
              <Label htmlFor="releaseYear" className="mb-2 block">Release Year</Label>
              <Select
                value={contentDetails.releaseYear}
                onValueChange={(value) => setContentDetails({...contentDetails, releaseYear: value})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description" className="mb-2 block">Description</Label>
            <Textarea 
              id="description"
              value={contentDetails.description}
              onChange={(e) => setContentDetails({...contentDetails, description: e.target.value})}
              className="bg-gray-800 border-gray-700 min-h-[120px]"
              placeholder="Content description"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="mb-2 block">Genre</Label>
              <GenreSelector
                selectedGenres={contentDetails.genre ? contentDetails.genre.split(', ').filter(Boolean) : []}
                onGenresChange={(genres) => setContentDetails({...contentDetails, genre: genres.join(', ')})}
              />
            </div>
            
            <div>
              <Label htmlFor="rating" className="mb-2 block">Rating</Label>
              <Select
                value={contentDetails.rating}
                onValueChange={(value) => setContentDetails({...contentDetails, rating: value})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {RATING_OPTIONS.map((rating) => (
                    <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration" className="mb-2 block">Duration</Label>
              <Input 
                id="duration"
                value={contentDetails.duration}
                onChange={(e) => setContentDetails({...contentDetails, duration: e.target.value})}
                className="bg-gray-800 border-gray-700"
                placeholder="e.g. 2h 15m"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="thumbnailUrl" className="mb-2 block">Thumbnail URL</Label>
            <Input 
              id="thumbnailUrl"
              value={contentDetails.thumbnailUrl}
              onChange={(e) => setContentDetails({...contentDetails, thumbnailUrl: e.target.value})}
              className="bg-gray-800 border-gray-700"
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>
          
          <div>
            <Label htmlFor="bannerUrl" className="mb-2 block">Banner URL (for featured content)</Label>
            <Input 
              id="bannerUrl"
              value={contentDetails.bannerUrl}
              onChange={(e) => setContentDetails({...contentDetails, bannerUrl: e.target.value})}
              className="bg-gray-800 border-gray-700"
              placeholder="https://example.com/banner.jpg"
            />
          </div>
          
          {/* Featured Content Toggle */}
          <div className="border border-amber-600/50 rounded-md p-6 bg-amber-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className={`w-6 h-6 ${isFeatured ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                <div>
                  <Label htmlFor="featured" className="text-base font-medium">Featured on Home Page Slider</Label>
                  <p className="text-sm text-muted-foreground">Display this content in the hero carousel at the top of the home page</p>
                </div>
              </div>
              <Switch
                id="featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="videoUrl" className="mb-2 block">Video URL</Label>
            <Input 
              id="videoUrl"
              value={contentDetails.videoUrl}
              onChange={(e) => setContentDetails({...contentDetails, videoUrl: e.target.value})}
              className="bg-gray-800 border-gray-700"
              placeholder="https://example.com/video.mp4"
            />
          </div>
          
          <div className="border border-gray-700 rounded-md p-6">
            <h3 className="text-xl font-medium mb-4">VAST Ad URLs</h3>
            <p className="text-gray-400 text-sm mb-4">
              Enter VAST ad URLs to monetize your content. These URLs will be used to display ads before, during, or after video playback.
              You can get VAST ad tags from your ad network provider or use sample VAST tags for testing.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="preroll" className="mb-2 block">Pre-roll Ad URL</Label>
                <Input 
                  id="preroll"
                  value={contentDetails.vastAdUrl.preroll}
                  onChange={(e) => setContentDetails({
                    ...contentDetails, 
                    vastAdUrl: {...contentDetails.vastAdUrl, preroll: e.target.value}
                  })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="https://example.com/vast/preroll.xml"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sample VAST URL: https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=
                </p>
              </div>
              
              <div>
                <Label htmlFor="midroll" className="mb-2 block">Mid-roll Ad URL</Label>
                <Input 
                  id="midroll"
                  value={contentDetails.vastAdUrl.midroll}
                  onChange={(e) => setContentDetails({
                    ...contentDetails, 
                    vastAdUrl: {...contentDetails.vastAdUrl, midroll: e.target.value}
                  })}
                  className="bg-gray-800 border-gray-700"
                  placeholder={DEFAULT_MIDROLL_URL}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => setContentDetails({
                    ...contentDetails, 
                    vastAdUrl: {...contentDetails.vastAdUrl, midroll: DEFAULT_MIDROLL_URL}
                  })}
                >
                  Use Default Midroll URL
                </Button>
              </div>

              {/* Mid-roll Configuration */}
              <div className="border border-gray-600 rounded-lg p-4 mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="midroll-enabled" className="text-base font-medium">Enable Mid-roll Ads</Label>
                    <p className="text-sm text-muted-foreground">Configure when and how many mid-roll ads play</p>
                  </div>
                  <Switch
                    id="midroll-enabled"
                    checked={contentDetails.midrollConfig.enabled}
                    onCheckedChange={(checked) => setContentDetails({
                      ...contentDetails,
                      midrollConfig: { ...contentDetails.midrollConfig, enabled: checked }
                    })}
                  />
                </div>

                {contentDetails.midrollConfig.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <Label htmlFor="midroll-count" className="mb-2 block">Number of Mid-rolls</Label>
                      <Input
                        id="midroll-count"
                        type="number"
                        min="1"
                        max="10"
                        value={contentDetails.midrollConfig.count}
                        onChange={(e) => setContentDetails({
                          ...contentDetails,
                          midrollConfig: { ...contentDetails.midrollConfig, count: parseInt(e.target.value) || 1 }
                        })}
                        className="bg-gray-900 border-gray-800"
                      />
                      <p className="text-xs text-gray-500 mt-1">How many mid-roll ads to show</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="midroll-start" className="mb-2 block">Start After (minutes)</Label>
                      <Input
                        id="midroll-start"
                        type="number"
                        min="1"
                        max="120"
                        value={contentDetails.midrollConfig.startAfterMinutes}
                        onChange={(e) => setContentDetails({
                          ...contentDetails,
                          midrollConfig: { ...contentDetails.midrollConfig, startAfterMinutes: parseInt(e.target.value) || 10 }
                        })}
                        className="bg-gray-900 border-gray-800"
                      />
                      <p className="text-xs text-gray-500 mt-1">First ad plays after this many minutes</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="midroll-interval" className="mb-2 block">Interval (minutes)</Label>
                      <Input
                        id="midroll-interval"
                        type="number"
                        min="1"
                        max="60"
                        value={contentDetails.midrollConfig.intervalMinutes}
                        onChange={(e) => setContentDetails({
                          ...contentDetails,
                          midrollConfig: { ...contentDetails.midrollConfig, intervalMinutes: parseInt(e.target.value) || 10 }
                        })}
                        className="bg-gray-900 border-gray-800"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minutes between each mid-roll</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="postroll" className="mb-2 block">Post-roll Ad URL</Label>
                <Input 
                  id="postroll"
                  value={contentDetails.vastAdUrl.postroll}
                  onChange={(e) => setContentDetails({
                    ...contentDetails, 
                    vastAdUrl: {...contentDetails.vastAdUrl, postroll: e.target.value}
                  })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="https://example.com/vast/postroll.xml"
                />
              </div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded-md p-6">
            <ChannelsSelector 
              selectedChannels={selectedChannels} 
              onChannelsChange={setSelectedChannels} 
            />
          </div>
          
          <div className="border border-gray-700 rounded-md p-6">
            <TagsSelector 
              selectedTagIds={selectedTagIds} 
              onTagsChange={setSelectedTagIds}
              contentType={contentType}
            />
          </div>
          
          <div className="border border-gray-700 rounded-md p-6">
            <h3 className="text-lg font-medium mb-3">Available On Membership Plans</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select which membership tiers can access this content. By default, new content is available on Standard and Premium plans.
            </p>
            <MembershipPlansSelector 
              selectedPlans={selectedPlanIds} 
              onSelectedPlansChange={setSelectedPlanIds} 
            />
          </div>
          
          {contentType === "show" && (
            <div className="border border-gray-700 rounded-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium">Seasons & Episodes</h3>
                <Button 
                  onClick={() => {
                    const nextSeasonNumber = seasons.length > 0 
                      ? Math.max(...seasons.map(s => s.number)) + 1 
                      : 1;
                    setSeasons([...seasons, { 
                      number: nextSeasonNumber, 
                      episodes: [] 
                    }]);
                  }}
                  className="bg-[#e50914] hover:bg-[#f6121d]"
                >
                  <Plus className="mr-2" /> Add Season
                </Button>
              </div>
              
              {seasons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No seasons added yet. Click "Add Season" to get started.</p>
                </div>
              ) : (
              <Tabs defaultValue={`season-${seasons[0]?.number || 1}`} className="w-full">
                <TabsList className="bg-gray-800 h-auto flex-wrap">
                  {seasons.map((season) => (
                    <TabsTrigger key={season.number} value={`season-${season.number}`} className="data-[state=active]:bg-gray-700">
                      Season {season.number}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {seasons.map((season, seasonIndex) => (
                  <TabsContent key={season.number} value={`season-${season.number}`} className="mt-6">
                    {/* Season Number Selector */}
                    <div className="mb-4">
                      <Label className="mb-2 block">Season Number</Label>
                      <Select
                        value={season.number.toString()}
                        onValueChange={(value) => {
                          const newSeasons = [...seasons];
                          newSeasons[seasonIndex].number = parseInt(value);
                          setSeasons(newSeasons);
                        }}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 w-40">
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>Season {num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Visual Video Search & Selection */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium">Select Episodes from Video Library</h4>
                      </div>
                      <VideoSearchSelector
                        availableVideos={availableVideos.map(v => ({
                          id: v.id,
                          title: v.title,
                          video_url: v.video_url,
                          poster_url: v.poster_url,
                        }))}
                        selectedVideos={season.episodes.map((ep, idx) => {
                          const matchedVideo = availableVideos.find(v => v.video_url === ep.videoUrl);
                          // Use a stable ID based on videoUrl or index
                          const stableId = matchedVideo?.id || (ep.videoUrl ? `url-${btoa(ep.videoUrl).slice(0, 12)}` : `manual-${season.number}-${ep.number}`);
                          return {
                            id: stableId,
                            title: matchedVideo?.title || ep.title,
                            video_url: ep.videoUrl,
                            poster_url: matchedVideo?.poster_url || ep.thumbnail || null,
                            episodeNumber: ep.number,
                            episodeTitle: ep.title,
                            description: ep.description,
                          };
                        })}
                        onSelectedVideosChange={(videos) => {
                          const newSeasons = [...seasons];
                          newSeasons[seasonIndex].episodes = videos.map((v, idx) => ({
                            number: idx + 1,
                            title: v.episodeTitle,
                            description: v.description || "",
                            duration: "",
                            videoUrl: v.video_url || "",
                            thumbnail: v.poster_url || "",
                            vastAdUrl: ""
                          }));
                          setSeasons(newSeasons);
                        }}
                      />
                    </div>

                    {/* Manual Episode Entry Section */}
                    <div className="border-t border-gray-700 pt-6 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium">Or Add Episodes Manually</h4>
                        <Button 
                          onClick={() => {
                            const newSeasons = [...seasons];
                            newSeasons[seasonIndex].episodes.push({
                              number: newSeasons[seasonIndex].episodes.length + 1,
                              title: `Episode ${newSeasons[seasonIndex].episodes.length + 1}`,
                              description: "",
                              duration: "",
                              videoUrl: "",
                              thumbnail: "",
                              vastAdUrl: ""
                            });
                            setSeasons(newSeasons);
                          }}
                          variant="outline"
                        >
                          <Plus className="mr-2" /> Add Episode Manually
                        </Button>
                      </div>
                    </div>
                    
                    {/* Bulk Import Section */}
                    <div className="border border-gray-600 rounded-lg p-4 mb-4 bg-gray-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="w-4 h-4 text-amber-500" />
                        <Label className="text-sm font-medium">Bulk Import Episodes</Label>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Paste one video URL per line to create multiple episodes at once</p>
                      <Textarea
                        value={bulkImportUrls}
                        onChange={(e) => setBulkImportUrls(e.target.value)}
                        placeholder="https://vimeo.com/123456789&#10;https://vimeo.com/987654321&#10;https://example.com/video.mp4"
                        className="bg-gray-800 border-gray-700 min-h-[80px] text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const urls = bulkImportUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0);
                          if (urls.length === 0) {
                            toast.error("Please enter at least one video URL");
                            return;
                          }
                          const newSeasons = [...seasons];
                          const startNumber = newSeasons[seasonIndex].episodes.length + 1;
                          urls.forEach((url, idx) => {
                            newSeasons[seasonIndex].episodes.push({
                              number: startNumber + idx,
                              title: `Episode ${startNumber + idx}`,
                              description: "",
                              duration: "",
                              videoUrl: url,
                              thumbnail: "",
                              vastAdUrl: ""
                            });
                          });
                          setSeasons(newSeasons);
                          setBulkImportUrls("");
                          toast.success(`Added ${urls.length} episodes`);
                        }}
                      >
                        <Upload className="w-3 h-3 mr-1" /> Import {bulkImportUrls.split('\n').filter(u => u.trim()).length || 0} URLs
                      </Button>
                    </div>
                    
                    {season.episodes.map((episode, episodeIndex) => (
                      <Card key={episodeIndex} className="bg-gray-800 border-gray-700 mb-4">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-md font-medium">Episode {episode.number}: {episode.title}</h5>
                            <div className="flex items-center gap-2">
                              {/* Move Up Button */}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-gray-400 hover:text-white hover:bg-gray-700"
                                disabled={episodeIndex === 0}
                                onClick={() => {
                                  if (episodeIndex === 0) return;
                                  const newSeasons = [...seasons];
                                  const episodes = newSeasons[seasonIndex].episodes;
                                  // Swap positions
                                  [episodes[episodeIndex - 1], episodes[episodeIndex]] = [episodes[episodeIndex], episodes[episodeIndex - 1]];
                                  // Update episode numbers
                                  episodes.forEach((ep, idx) => { ep.number = idx + 1; });
                                  setSeasons(newSeasons);
                                }}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              {/* Move Down Button */}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-gray-400 hover:text-white hover:bg-gray-700"
                                disabled={episodeIndex === season.episodes.length - 1}
                                onClick={() => {
                                  if (episodeIndex === season.episodes.length - 1) return;
                                  const newSeasons = [...seasons];
                                  const episodes = newSeasons[seasonIndex].episodes;
                                  // Swap positions
                                  [episodes[episodeIndex], episodes[episodeIndex + 1]] = [episodes[episodeIndex + 1], episodes[episodeIndex]];
                                  // Update episode numbers
                                  episodes.forEach((ep, idx) => { ep.number = idx + 1; });
                                  setSeasons(newSeasons);
                                }}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              {/* Delete Button */}
                              <Button 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                  const newSeasons = [...seasons];
                                  newSeasons[seasonIndex].episodes = newSeasons[seasonIndex].episodes.filter((_, i) => i !== episodeIndex);
                                  // Re-number remaining episodes
                                  newSeasons[seasonIndex].episodes.forEach((ep, idx) => { ep.number = idx + 1; });
                                  setSeasons(newSeasons);
                                }}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor={`episode-${season.number}-${episode.number}-title`} className="mb-1 block">Episode Title</Label>
                              <Input 
                                id={`episode-${season.number}-${episode.number}-title`}
                                value={episode.title}
                                onChange={(e) => {
                                  const newSeasons = [...seasons];
                                  newSeasons[seasonIndex].episodes[episodeIndex].title = e.target.value;
                                  setSeasons(newSeasons);
                                }}
                                className="bg-gray-900 border-gray-800"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`episode-${season.number}-${episode.number}-duration`} className="mb-1 block">Duration</Label>
                              <Input 
                                id={`episode-${season.number}-${episode.number}-duration`}
                                value={episode.duration}
                                onChange={(e) => {
                                  const newSeasons = [...seasons];
                                  newSeasons[seasonIndex].episodes[episodeIndex].duration = e.target.value;
                                  setSeasons(newSeasons);
                                }}
                                className="bg-gray-900 border-gray-800"
                                placeholder="e.g. 45m"
                              />
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <Label htmlFor={`episode-${season.number}-${episode.number}-description`} className="mb-1 block">Description</Label>
                            <Textarea 
                              id={`episode-${season.number}-${episode.number}-description`}
                              value={episode.description}
                              onChange={(e) => {
                                const newSeasons = [...seasons];
                                newSeasons[seasonIndex].episodes[episodeIndex].description = e.target.value;
                                setSeasons(newSeasons);
                              }}
                              className="bg-gray-900 border-gray-800"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="mb-1 block">Select Video from Library</Label>
                              <div className="flex gap-2 items-start">
                                {/* Thumbnail preview */}
                                {episode.videoUrl && (() => {
                                  const selectedVideo = availableVideos.find(v => v.video_url === episode.videoUrl);
                                  return selectedVideo?.poster_url ? (
                                    <img 
                                      src={selectedVideo.poster_url} 
                                      alt="Video thumbnail" 
                                      className="w-16 h-10 object-cover rounded border border-gray-700"
                                    />
                                  ) : null;
                                })()}
                                <div className="flex-1">
                                  <Select
                                    value={episode.videoUrl || "__none__"}
                                    onValueChange={(value) => {
                                      const newSeasons = [...seasons];
                                      const actualValue = value === "__none__" ? "" : value;
                                      const selectedVideo = availableVideos.find(v => v.video_url === actualValue);
                                      newSeasons[seasonIndex].episodes[episodeIndex].videoUrl = actualValue;
                                      // Auto-fill thumbnail if available
                                      if (selectedVideo?.poster_url && !episode.thumbnail) {
                                        newSeasons[seasonIndex].episodes[episodeIndex].thumbnail = selectedVideo.poster_url;
                                      }
                                      setSeasons(newSeasons);
                                    }}
                                  >
                                    <SelectTrigger className="bg-gray-900 border-gray-800">
                                      <SelectValue placeholder="Select a video..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                                      <SelectItem value="__none__">-- None --</SelectItem>
                                      {availableVideos.filter(v => v.video_url).map((video) => (
                                        <SelectItem key={video.id} value={video.video_url!}>
                                          <div className="flex items-center gap-2">
                                            {video.poster_url && (
                                              <img 
                                                src={video.poster_url} 
                                                alt="" 
                                                className="w-8 h-5 object-cover rounded"
                                              />
                                            )}
                                            <span>{video.title}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Or enter URL manually below</p>
                              <Input 
                                value={episode.videoUrl}
                                onChange={(e) => {
                                  const newSeasons = [...seasons];
                                  newSeasons[seasonIndex].episodes[episodeIndex].videoUrl = e.target.value;
                                  setSeasons(newSeasons);
                                }}
                                className="bg-gray-900 border-gray-800 mt-2"
                                placeholder="https://example.com/video.mp4"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`episode-${season.number}-${episode.number}-thumbnail`} className="mb-1 block">Thumbnail URL</Label>
                              <Input 
                                id={`episode-${season.number}-${episode.number}-thumbnail`}
                                value={episode.thumbnail}
                                onChange={(e) => {
                                  const newSeasons = [...seasons];
                                  newSeasons[seasonIndex].episodes[episodeIndex].thumbnail = e.target.value;
                                  setSeasons(newSeasons);
                                }}
                                className="bg-gray-900 border-gray-800"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Label htmlFor={`episode-${season.number}-${episode.number}-vast`} className="mb-1 block">VAST Ad URL</Label>
                            <Input 
                              id={`episode-${season.number}-${episode.number}-vast`}
                              value={episode.vastAdUrl}
                              onChange={(e) => {
                                const newSeasons = [...seasons];
                                newSeasons[seasonIndex].episodes[episodeIndex].vastAdUrl = e.target.value;
                                setSeasons(newSeasons);
                              }}
                              className="bg-gray-900 border-gray-800"
                              placeholder="https://example.com/vast/episode-ad.xml"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Sample VAST URL: https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditContent;
