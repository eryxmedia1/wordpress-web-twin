
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Plus, Trash, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import AdminNavbar from "@/components/AdminNavbar";

const EditContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [contentType, setContentType] = useState("movie");
  
  // For TV shows
  const [seasons, setSeasons] = useState([{ 
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
  const [contentDetails, setContentDetails] = useState({
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
  
  const handleSave = () => {
    // This would send data to the backend in a real implementation
    toast.success(`Content ${isNew ? "created" : "updated"} successfully!`);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{isNew ? "Add New Content" : "Edit Content"}</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Cancel
            </Button>
            <Button className="bg-[#e50914] hover:bg-[#f6121d]" onClick={handleSave}>
              Save Changes
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
