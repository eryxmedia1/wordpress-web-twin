
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Plus, Trash, Video } from "lucide-react";
import { toast } from "sonner";
import AdminNavbar from "@/components/AdminNavbar";
import { supabase, DbContent, DbProfile, DbSeason, DbEpisode, ContentType } from "@/integrations/supabase/client";

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
  }
}

const EditContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [contentType, setContentType] = useState<ContentType>("movie");
  const [loading, setLoading] = useState(false);
  
  // For TV shows
  const [seasons, setSeasons] = useState<Season[]>([{ 
    number: 1, 
    episodes: [{ 
      number: 1, 
      title: "Pilot", 
      description: "", 
      duration: "", 
      videoUrl: "",
      thumbnail: "",
      vastAdUrl: ""
    }] 
  }]);
  
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
      }
    });
    
    if (content.type === 'show') {
      await fetchSeasons(content.id);
    }
    
    setLoading(false);
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
        // Create new content - Fixed: removed array brackets around the object
        const { data: contentData, error: contentError } = await supabase
          .from('contents')
          .insert(
            {
              title: contentDetails.title,
              description: contentDetails.description,
              type: contentType, // Fixed: using the ContentType type
              genre: contentDetails.genre,
              release_year: contentDetails.releaseYear ? parseInt(contentDetails.releaseYear) : null,
              rating: contentDetails.rating,
              duration: contentDetails.duration,
              poster_url: contentDetails.thumbnailUrl,
              backdrop_url: contentDetails.bannerUrl,
              video_url: contentDetails.videoUrl,
              vast_ad_preroll: contentDetails.vastAdUrl.preroll,
              vast_ad_midroll: contentDetails.vastAdUrl.midroll,
              vast_ad_postroll: contentDetails.vastAdUrl.postroll
            }
          )
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
            type: contentType, // Fixed: using the ContentType type
            genre: contentDetails.genre,
            release_year: contentDetails.releaseYear ? parseInt(contentDetails.releaseYear) : null,
            rating: contentDetails.rating,
            duration: contentDetails.duration,
            poster_url: contentDetails.thumbnailUrl,
            backdrop_url: contentDetails.bannerUrl,
            video_url: contentDetails.videoUrl,
            vast_ad_preroll: contentDetails.vastAdUrl.preroll,
            vast_ad_midroll: contentDetails.vastAdUrl.midroll,
            vast_ad_postroll: contentDetails.vastAdUrl.postroll
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
              <Input 
                id="releaseYear"
                value={contentDetails.releaseYear}
                onChange={(e) => setContentDetails({...contentDetails, releaseYear: e.target.value})}
                className="bg-gray-800 border-gray-700"
                placeholder="e.g. 2023"
              />
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
              <Label htmlFor="genre" className="mb-2 block">Genre</Label>
              <Input 
                id="genre"
                value={contentDetails.genre}
                onChange={(e) => setContentDetails({...contentDetails, genre: e.target.value})}
                className="bg-gray-800 border-gray-700"
                placeholder="e.g. Action, Drama"
              />
            </div>
            
            <div>
              <Label htmlFor="rating" className="mb-2 block">Rating</Label>
              <Input 
                id="rating"
                value={contentDetails.rating}
                onChange={(e) => setContentDetails({...contentDetails, rating: e.target.value})}
                className="bg-gray-800 border-gray-700"
                placeholder="e.g. PG-13"
              />
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
                  placeholder="https://example.com/vast/midroll.xml"
                />
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
          
          {contentType === "show" && (
            <div className="border border-gray-700 rounded-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium">Seasons & Episodes</h3>
                <Button 
                  onClick={() => setSeasons([...seasons, { 
                    number: seasons.length + 1, 
                    episodes: [{ number: 1, title: "Episode 1", description: "", duration: "", videoUrl: "", thumbnail: "", vastAdUrl: "" }] 
                  }])}
                  className="bg-[#e50914] hover:bg-[#f6121d]"
                >
                  <Plus className="mr-2" /> Add Season
                </Button>
              </div>
              
              <Tabs defaultValue={`season-1`} className="w-full">
                <TabsList className="bg-gray-800 h-auto flex-wrap">
                  {seasons.map((season) => (
                    <TabsTrigger key={season.number} value={`season-${season.number}`} className="data-[state=active]:bg-gray-700">
                      Season {season.number}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {seasons.map((season, seasonIndex) => (
                  <TabsContent key={season.number} value={`season-${season.number}`} className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium">Episodes</h4>
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
                        <Plus className="mr-2" /> Add Episode
                      </Button>
                    </div>
                    
                    {season.episodes.map((episode, episodeIndex) => (
                      <Card key={episode.number} className="bg-gray-800 border-gray-700 mb-4">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-md font-medium">Episode {episode.number}: {episode.title}</h5>
                            <Button 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => {
                                const newSeasons = [...seasons];
                                newSeasons[seasonIndex].episodes = newSeasons[seasonIndex].episodes.filter((_, i) => i !== episodeIndex);
                                setSeasons(newSeasons);
                              }}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
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
                              <Label htmlFor={`episode-${season.number}-${episode.number}-video`} className="mb-1 block">Video URL</Label>
                              <Input 
                                id={`episode-${season.number}-${episode.number}-video`}
                                value={episode.videoUrl}
                                onChange={(e) => {
                                  const newSeasons = [...seasons];
                                  newSeasons[seasonIndex].episodes[episodeIndex].videoUrl = e.target.value;
                                  setSeasons(newSeasons);
                                }}
                                className="bg-gray-900 border-gray-800"
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
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditContent;
