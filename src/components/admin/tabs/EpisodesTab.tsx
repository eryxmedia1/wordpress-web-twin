import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Film, Loader2, GripVertical, X } from "lucide-react";
import { VimeoUrlInput } from "@/components/VimeoUrlInput";
import { VimeoMetadata } from "@/hooks/useVimeoMetadata";

interface TvShow {
  id: string;
  title: string;
  poster_url: string | null;
}

interface Season {
  id: string;
  content_id: string;
  season_number: number;
  title: string | null;
  description: string | null;
}

interface Episode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string;
  description: string | null;
  duration: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
}

const EpisodesTab = () => {
  const [tvShows, setTvShows] = useState<TvShow[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodesBySeasonId, setEpisodesBySeasonId] = useState<Record<string, Episode[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingSeasonId, setSavingSeasonId] = useState<string | null>(null);
  
  // New episode form state
  const [newEpisodeDialogOpen, setNewEpisodeDialogOpen] = useState(false);
  const [newEpisodeSeasonId, setNewEpisodeSeasonId] = useState<string>("");
  const [newEpisode, setNewEpisode] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    duration: "",
  });
  const [addingEpisode, setAddingEpisode] = useState(false);

  // New season form state
  const [newSeasonDialogOpen, setNewSeasonDialogOpen] = useState(false);
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [addingSeason, setAddingSeason] = useState(false);

  // Fetch all TV shows
  useEffect(() => {
    const fetchTvShows = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, poster_url")
        .eq("type", "show")
        .order("title");

      if (error) {
        console.error("Error fetching TV shows:", error);
        toast.error("Failed to load TV shows");
      } else {
        setTvShows(data || []);
      }
      setLoading(false);
    };

    fetchTvShows();
  }, []);

  // Fetch seasons when show is selected
  useEffect(() => {
    if (!selectedShowId) {
      setSeasons([]);
      setEpisodesBySeasonId({});
      return;
    }

    const fetchSeasons = async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("content_id", selectedShowId)
        .order("season_number");

      if (error) {
        console.error("Error fetching seasons:", error);
        toast.error("Failed to load seasons");
      } else {
        setSeasons(data || []);
        // Fetch episodes for each season
        if (data && data.length > 0) {
          fetchEpisodesForSeasons(data.map(s => s.id));
        } else {
          setEpisodesBySeasonId({});
        }
      }
    };

    fetchSeasons();
  }, [selectedShowId]);

  const fetchEpisodesForSeasons = async (seasonIds: string[]) => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .in("season_id", seasonIds)
      .order("episode_number");

    if (error) {
      console.error("Error fetching episodes:", error);
      return;
    }

    // Group episodes by season_id
    const grouped: Record<string, Episode[]> = {};
    seasonIds.forEach(id => grouped[id] = []);
    data?.forEach(ep => {
      if (grouped[ep.season_id]) {
        grouped[ep.season_id].push(ep);
      }
    });
    setEpisodesBySeasonId(grouped);
  };

  // Add new season
  const handleAddSeason = async () => {
    if (!selectedShowId) return;
    
    setAddingSeason(true);
    const nextSeasonNumber = seasons.length > 0 
      ? Math.max(...seasons.map(s => s.season_number)) + 1 
      : 1;

    const { data, error } = await supabase
      .from("seasons")
      .insert([{
        content_id: selectedShowId,
        season_number: nextSeasonNumber,
        title: newSeasonTitle || `Season ${nextSeasonNumber}`,
        description: null,
        poster_url: null,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding season:", error);
      toast.error("Failed to add season");
    } else {
      setSeasons([...seasons, data]);
      setEpisodesBySeasonId(prev => ({ ...prev, [data.id]: [] }));
      toast.success(`Season ${nextSeasonNumber} added`);
      setNewSeasonDialogOpen(false);
      setNewSeasonTitle("");
    }
    setAddingSeason(false);
  };

  // Delete season
  const handleDeleteSeason = async (seasonId: string) => {
    if (!confirm("Delete this season and all its episodes?")) return;

    const { error } = await supabase
      .from("seasons")
      .delete()
      .eq("id", seasonId);

    if (error) {
      console.error("Error deleting season:", error);
      toast.error("Failed to delete season");
    } else {
      setSeasons(seasons.filter(s => s.id !== seasonId));
      setEpisodesBySeasonId(prev => {
        const updated = { ...prev };
        delete updated[seasonId];
        return updated;
      });
      toast.success("Season deleted");
    }
  };

  // Open add episode dialog
  const openAddEpisodeDialog = (seasonId: string) => {
    setNewEpisodeSeasonId(seasonId);
    setNewEpisode({ title: "", description: "", videoUrl: "", thumbnailUrl: "", duration: "" });
    setNewEpisodeDialogOpen(true);
  };

  // Add episode to season
  const handleAddEpisode = async () => {
    if (!newEpisodeSeasonId || !newEpisode.title) {
      toast.error("Episode title is required");
      return;
    }

    setAddingEpisode(true);
    const currentEpisodes = episodesBySeasonId[newEpisodeSeasonId] || [];
    const nextEpisodeNumber = currentEpisodes.length > 0 
      ? Math.max(...currentEpisodes.map(e => e.episode_number)) + 1 
      : 1;

    const { data, error } = await supabase
      .from("episodes")
      .insert([{
        season_id: newEpisodeSeasonId,
        episode_number: nextEpisodeNumber,
        title: newEpisode.title,
        description: newEpisode.description || null,
        video_url: newEpisode.videoUrl || null,
        thumbnail_url: newEpisode.thumbnailUrl || null,
        duration: newEpisode.duration || null,
        vast_ad_url: null,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding episode:", error);
      toast.error("Failed to add episode");
    } else {
      setEpisodesBySeasonId(prev => ({
        ...prev,
        [newEpisodeSeasonId]: [...(prev[newEpisodeSeasonId] || []), data],
      }));
      toast.success(`Episode ${nextEpisodeNumber} added`);
      setNewEpisodeDialogOpen(false);
    }
    setAddingEpisode(false);
  };

  // Delete episode
  const handleDeleteEpisode = async (seasonId: string, episodeId: string) => {
    if (!confirm("Delete this episode?")) return;

    const { error } = await supabase
      .from("episodes")
      .delete()
      .eq("id", episodeId);

    if (error) {
      console.error("Error deleting episode:", error);
      toast.error("Failed to delete episode");
    } else {
      setEpisodesBySeasonId(prev => ({
        ...prev,
        [seasonId]: prev[seasonId].filter(e => e.id !== episodeId),
      }));
      toast.success("Episode deleted");
    }
  };

  // Update episode
  const handleUpdateEpisode = async (seasonId: string, episodeId: string, updates: Partial<Episode>) => {
    const { error } = await supabase
      .from("episodes")
      .update(updates)
      .eq("id", episodeId);

    if (error) {
      console.error("Error updating episode:", error);
      toast.error("Failed to update episode");
    } else {
      setEpisodesBySeasonId(prev => ({
        ...prev,
        [seasonId]: prev[seasonId].map(e => 
          e.id === episodeId ? { ...e, ...updates } : e
        ),
      }));
    }
  };

  const selectedShow = tvShows.find(s => s.id === selectedShowId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Episodes</h2>
          <p className="text-muted-foreground text-sm">Select a TV show to manage its seasons and episodes</p>
        </div>
      </div>

      {/* TV Show Selector */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select TV Show</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedShowId} onValueChange={setSelectedShowId}>
            <SelectTrigger className="w-full max-w-md bg-background border-border">
              <SelectValue placeholder="Choose a TV show..." />
            </SelectTrigger>
            <SelectContent>
              {tvShows.map((show) => (
                <SelectItem key={show.id} value={show.id}>
                  <div className="flex items-center gap-2">
                    {show.poster_url ? (
                      <img 
                        src={show.poster_url} 
                        alt={show.title} 
                        className="w-6 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-6 h-8 bg-muted rounded flex items-center justify-center">
                        <Film className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <span>{show.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Show Details & Seasons */}
      {selectedShowId && selectedShow && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedShow.poster_url ? (
                  <img 
                    src={selectedShow.poster_url} 
                    alt={selectedShow.title} 
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                    <Film className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <CardTitle>{selectedShow.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {seasons.length} season{seasons.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Add Season Button */}
              <Dialog open={newSeasonDialogOpen} onOpenChange={setNewSeasonDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Season
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Add New Season</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Season Title (optional)</Label>
                      <Input
                        value={newSeasonTitle}
                        onChange={(e) => setNewSeasonTitle(e.target.value)}
                        placeholder={`Season ${seasons.length + 1}`}
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                    <Button 
                      onClick={handleAddSeason} 
                      disabled={addingSeason}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {addingSeason ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add Season {seasons.length + 1}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {seasons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No seasons yet. Add a season to start adding episodes.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {seasons.map((season) => {
                  const episodes = episodesBySeasonId[season.id] || [];
                  return (
                    <AccordionItem 
                      key={season.id} 
                      value={season.id}
                      className="border border-border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-semibold">
                            Season {season.season_number}
                            {season.title && season.title !== `Season ${season.season_number}` && (
                              <span className="text-muted-foreground font-normal ml-2">
                                - {season.title}
                              </span>
                            )}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-6">
                        {/* Season Actions */}
                        <div className="flex items-center gap-2 mb-4">
                          <Button 
                            size="sm" 
                            onClick={() => openAddEpisodeDialog(season.id)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Episode
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteSeason(season.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Season
                          </Button>
                        </div>

                        {/* Episodes List */}
                        {episodes.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4">
                            No episodes in this season yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {episodes.map((episode) => (
                              <div 
                                key={episode.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                              >
                                {/* Thumbnail */}
                                <div className="w-24 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                                  {episode.thumbnail_url ? (
                                    <img
                                      src={episode.thumbnail_url}
                                      alt={episode.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                      <Film className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>

                                {/* Episode Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-0.5 rounded">
                                      E{episode.episode_number}
                                    </span>
                                    <Input
                                      value={episode.title}
                                      onChange={(e) => handleUpdateEpisode(season.id, episode.id, { title: e.target.value })}
                                      className="h-7 text-sm bg-transparent border-transparent hover:border-border focus:border-border"
                                    />
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    {episode.duration && (
                                      <span className="text-xs text-muted-foreground">
                                        {episode.duration}
                                      </span>
                                    )}
                                    {episode.video_url && (
                                      <span className="text-xs text-green-500">
                                        ✓ Video linked
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Delete Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                                  onClick={() => handleDeleteEpisode(season.id, episode.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Episode Dialog */}
      <Dialog open={newEpisodeDialogOpen} onOpenChange={setNewEpisodeDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Episode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Vimeo URL (auto-fills fields below)</Label>
              <VimeoUrlInput
                value={newEpisode.videoUrl}
                onChange={(value) => setNewEpisode(prev => ({ ...prev, videoUrl: value }))}
                onMetadataFetched={(metadata: VimeoMetadata) => {
                  setNewEpisode(prev => ({
                    ...prev,
                    title: metadata.title || prev.title,
                    thumbnailUrl: metadata.thumbnail_large || metadata.thumbnail_url || prev.thumbnailUrl,
                    duration: metadata.duration || prev.duration,
                    description: metadata.description || prev.description,
                  }));
                }}
                className="mt-1 bg-background border-border"
              />
            </div>
            
            <div>
              <Label>Episode Title *</Label>
              <Input
                value={newEpisode.title}
                onChange={(e) => setNewEpisode(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Episode title"
                className="mt-1 bg-background border-border"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newEpisode.description}
                onChange={(e) => setNewEpisode(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Episode description"
                className="mt-1 bg-background border-border"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration</Label>
                <Input
                  value={newEpisode.duration}
                  onChange={(e) => setNewEpisode(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="45m"
                  className="mt-1 bg-background border-border"
                />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={newEpisode.thumbnailUrl}
                  onChange={(e) => setNewEpisode(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="Auto-filled from Vimeo"
                  className="mt-1 bg-background border-border"
                />
              </div>
            </div>

            <Button 
              onClick={handleAddEpisode} 
              disabled={addingEpisode || !newEpisode.title}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {addingEpisode ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Episode
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EpisodesTab;
