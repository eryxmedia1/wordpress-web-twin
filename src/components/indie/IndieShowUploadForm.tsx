import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useVimeoMetadata } from "@/hooks/useVimeoMetadata";
import { Loader2, Plus, Trash2, Video, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface IndieShowUploadFormProps {
  channelId: string;
  onSuccess: () => void;
  onCancel: () => void;
  currentVideoCount: number;
  maxVideos: number;
}

interface SeasonData {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: EpisodeData[];
  isOpen: boolean;
}

interface EpisodeData {
  id: string;
  vimeoUrl: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  isLoading: boolean;
}

const MATURITY_RATINGS = ["TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA", "G", "PG", "PG-13", "R", "NC-17"];

const IndieShowUploadForm = ({
  channelId,
  onSuccess,
  onCancel,
  currentVideoCount,
  maxVideos,
}: IndieShowUploadFormProps) => {
  // Show metadata
  const [showTitle, setShowTitle] = useState("");
  const [showDescription, setShowDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [genre, setGenre] = useState("");
  const [maturityRating, setMaturityRating] = useState("");
  const [releaseYear, setReleaseYear] = useState("");

  // Seasons and episodes
  const [seasons, setSeasons] = useState<SeasonData[]>([
    { id: crypto.randomUUID(), seasonNumber: 1, title: "Season 1", episodes: [], isOpen: true }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchMetadata } = useVimeoMetadata();

  const getTotalEpisodeCount = () => {
    return seasons.reduce((total, season) => total + season.episodes.length, 0);
  };

  const remainingSlots = maxVideos - currentVideoCount;

  const addSeason = () => {
    const nextNumber = seasons.length + 1;
    setSeasons([...seasons, {
      id: crypto.randomUUID(),
      seasonNumber: nextNumber,
      title: `Season ${nextNumber}`,
      episodes: [],
      isOpen: true
    }]);
  };

  const removeSeason = (seasonId: string) => {
    if (seasons.length <= 1) {
      toast.error("Must have at least one season");
      return;
    }
    setSeasons(seasons.filter(s => s.id !== seasonId));
  };

  const toggleSeason = (seasonId: string) => {
    setSeasons(seasons.map(s => 
      s.id === seasonId ? { ...s, isOpen: !s.isOpen } : s
    ));
  };

  const addEpisode = (seasonId: string) => {
    if (getTotalEpisodeCount() >= remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more videos`);
      return;
    }

    setSeasons(seasons.map(s => {
      if (s.id === seasonId) {
        return {
          ...s,
          episodes: [...s.episodes, {
            id: crypto.randomUUID(),
            vimeoUrl: "",
            title: "",
            description: "",
            thumbnailUrl: "",
            duration: "",
            isLoading: false
          }]
        };
      }
      return s;
    }));
  };

  const removeEpisode = (seasonId: string, episodeId: string) => {
    setSeasons(seasons.map(s => {
      if (s.id === seasonId) {
        return { ...s, episodes: s.episodes.filter(e => e.id !== episodeId) };
      }
      return s;
    }));
  };

  const updateEpisode = (seasonId: string, episodeId: string, data: Partial<EpisodeData>) => {
    setSeasons(seasons.map(s => {
      if (s.id === seasonId) {
        return {
          ...s,
          episodes: s.episodes.map(e => e.id === episodeId ? { ...e, ...data } : e)
        };
      }
      return s;
    }));
  };

  const fetchEpisodeMetadata = async (seasonId: string, episodeId: string, url: string) => {
    if (!url.includes("vimeo")) return;

    updateEpisode(seasonId, episodeId, { isLoading: true });
    const metadata = await fetchMetadata(url);
    
    if (metadata) {
      updateEpisode(seasonId, episodeId, {
        title: metadata.title || "",
        description: metadata.description || "",
        thumbnailUrl: metadata.thumbnail_url || "",
        duration: metadata.duration ? `${Math.floor(Number(metadata.duration) / 60)}m` : "",
        isLoading: false
      });

      // Auto-fill show poster/backdrop from first episode if empty
      if (!posterUrl && metadata.thumbnail_url) {
        setPosterUrl(metadata.thumbnail_url);
      }
      if (!backdropUrl && metadata.thumbnail_url) {
        setBackdropUrl(metadata.thumbnail_url);
      }
    } else {
      updateEpisode(seasonId, episodeId, { isLoading: false });
    }
  };

  const handleSubmit = async () => {
    if (!showTitle.trim()) {
      toast.error("Please enter a show title");
      return;
    }

    const totalEpisodes = getTotalEpisodeCount();
    if (totalEpisodes === 0) {
      toast.error("Please add at least one episode");
      return;
    }

    if (currentVideoCount + totalEpisodes > maxVideos) {
      toast.error(`Adding ${totalEpisodes} episodes would exceed your limit of ${maxVideos} videos`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the show (content type: show)
      const firstEpisode = seasons[0]?.episodes[0];
      const showInsertData = {
        title: showTitle.trim(),
        description: showDescription.trim() || null,
        poster_url: posterUrl.trim() || firstEpisode?.thumbnailUrl || null,
        backdrop_url: backdropUrl.trim() || firstEpisode?.thumbnailUrl || null,
        trailer_url: firstEpisode?.vimeoUrl || null,
        genre: genre.trim() || null,
        maturity_rating: maturityRating || null,
        release_year: releaseYear ? parseInt(releaseYear) : null,
        type: "show",
        indie_channel_id: channelId
      };
      
      const { data: showData, error: showError } = await supabase
        .from("contents")
        .insert(showInsertData as any)
        .select("id")
        .single();

      if (showError) throw showError;

      // 2. Create seasons and episodes
      for (const season of seasons) {
        if (season.episodes.length === 0) continue;

        const seasonInsertData = {
          content_id: showData.id,
          season_number: season.seasonNumber,
          title: season.title
        };
        
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .insert(seasonInsertData as any)
          .select("id")
          .single();

        if (seasonError) throw seasonError;

        // 3. Create episodes for this season
        const episodeInserts = season.episodes.map((ep, index) => ({
          season_id: seasonData.id,
          episode_number: index + 1,
          title: ep.title || `Episode ${index + 1}`,
          description: ep.description || null,
          thumbnail_url: ep.thumbnailUrl || null,
          video_url: ep.vimeoUrl || null,
          duration: ep.duration || null,
          vast_ad_url: null
        }));

        const { error: episodesError } = await supabase
          .from("episodes")
          .insert(episodeInserts);

        if (episodesError) throw episodesError;
      }

      toast.success("TV Show created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating show:", error);
      toast.error("Failed to create show");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Show Metadata */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Show Details</h3>
        
        <div>
          <Label>Show Title *</Label>
          <Input
            value={showTitle}
            onChange={(e) => setShowTitle(e.target.value)}
            placeholder="Enter show title"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={showDescription}
            onChange={(e) => setShowDescription(e.target.value)}
            placeholder="Show description"
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Genre</Label>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Drama, Comedy, etc."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Release Year</Label>
            <Input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              placeholder="2024"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Maturity Rating</Label>
          <Select value={maturityRating} onValueChange={setMaturityRating}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {MATURITY_RATINGS.map((rating) => (
                <SelectItem key={rating} value={rating}>{rating}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Poster URL</Label>
            <Input
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="Auto-filled from first episode"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Backdrop URL</Label>
            <Input
              value={backdropUrl}
              onChange={(e) => setBackdropUrl(e.target.value)}
              placeholder="Auto-filled from first episode"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Seasons & Episodes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Seasons & Episodes</h3>
          <div className="text-sm text-muted-foreground">
            {getTotalEpisodeCount()} episodes ({remainingSlots - getTotalEpisodeCount()} slots remaining)
          </div>
        </div>

        {seasons.map((season) => (
          <Card key={season.id}>
            <Collapsible open={season.isOpen} onOpenChange={() => toggleSeason(season.id)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    {season.isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="font-medium">{season.title}</span>
                    <span className="text-sm text-muted-foreground">({season.episodes.length} episodes)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); removeSeason(season.id); }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div>
                    <Label>Season Title</Label>
                    <Input
                      value={season.title}
                      onChange={(e) => setSeasons(seasons.map(s => 
                        s.id === season.id ? { ...s, title: e.target.value } : s
                      ))}
                      className="mt-1"
                    />
                  </div>

                  {/* Episodes List */}
                  {season.episodes.map((episode, epIndex) => (
                    <div key={episode.id} className="p-3 bg-muted/30 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Episode {epIndex + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEpisode(season.id, episode.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>

                      <div>
                        <Label className="text-xs">Vimeo URL</Label>
                        <Input
                          value={episode.vimeoUrl}
                          onChange={(e) => updateEpisode(season.id, episode.id, { vimeoUrl: e.target.value })}
                          onBlur={() => episode.vimeoUrl && fetchEpisodeMetadata(season.id, episode.id, episode.vimeoUrl)}
                          placeholder="https://vimeo.com/..."
                          className="mt-1"
                        />
                      </div>

                      {episode.isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Fetching metadata...
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Title</Label>
                              <Input
                                value={episode.title}
                                onChange={(e) => updateEpisode(season.id, episode.id, { title: e.target.value })}
                                placeholder="Episode title"
                                className="mt-1 h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Duration</Label>
                              <Input
                                value={episode.duration}
                                onChange={(e) => updateEpisode(season.id, episode.id, { duration: e.target.value })}
                                placeholder="45m"
                                className="mt-1 h-8 text-sm"
                              />
                            </div>
                          </div>
                          {episode.thumbnailUrl && (
                            <img src={episode.thumbnailUrl} alt="" className="w-24 h-14 object-cover rounded" />
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addEpisode(season.id)}
                    className="gap-2 w-full"
                    disabled={getTotalEpisodeCount() >= remainingSlots}
                  >
                    <Plus className="w-4 h-4" />
                    Add Episode
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}

        <Button variant="outline" onClick={addSeason} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Season
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !showTitle.trim()}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create TV Show
        </Button>
      </div>
    </div>
  );
};

export default IndieShowUploadForm;
