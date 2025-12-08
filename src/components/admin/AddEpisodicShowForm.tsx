import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GenreSelector } from "./GenreSelector";
import { ChannelsSelector } from "./ChannelsSelector";
import { MembershipPlansSelector } from "./MembershipPlansSelector";
import { TagsSelector } from "./TagsSelector";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EpisodeEntry {
  id: string;
  title: string;
  vimeoUrl: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
}

interface SeasonEntry {
  id: string;
  seasonNumber: number;
  episodes: EpisodeEntry[];
  isOpen: boolean;
}

interface AddEpisodicShowFormProps {
  onClose: () => void;
}

const AddEpisodicShowForm = ({ onClose }: AddEpisodicShowFormProps) => {
  // General show info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear().toString());
  const [maturityRating, setMaturityRating] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isZoeOriginal, setIsZoeOriginal] = useState(false);

  // Seasons with episodes
  const [seasons, setSeasons] = useState<SeasonEntry[]>([
    {
      id: crypto.randomUUID(),
      seasonNumber: 1,
      isOpen: true,
      episodes: [
        { id: crypto.randomUUID(), title: "", vimeoUrl: "", description: "", thumbnailUrl: "", duration: "" }
      ]
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState<string | null>(null);

  // Memoized callbacks to prevent re-render loops
  const handleGenresChange = useCallback((genres: string[]) => {
    setSelectedGenres(genres);
  }, []);

  const handleChannelsChange = useCallback((channels: string[]) => {
    setSelectedChannels(channels);
  }, []);

  const handlePlansChange = useCallback((plans: string[]) => {
    setSelectedPlans(plans);
  }, []);

  const handleTagsChange = useCallback((tags: string[]) => {
    setSelectedTags(tags);
  }, []);

  const handleFeaturedChange = useCallback((checked: boolean) => {
    setIsFeatured(checked);
  }, []);

  const handleZoeOriginalChange = useCallback((checked: boolean) => {
    setIsZoeOriginal(checked);
  }, []);

  const addSeason = useCallback(() => {
    setSeasons(prev => {
      const nextSeasonNumber = Math.max(...prev.map(s => s.seasonNumber)) + 1;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          seasonNumber: nextSeasonNumber,
          isOpen: true,
          episodes: [
            { id: crypto.randomUUID(), title: "", vimeoUrl: "", description: "", thumbnailUrl: "", duration: "" }
          ]
        }
      ];
    });
  }, []);

  const removeSeason = useCallback((seasonId: string) => {
    setSeasons(prev => prev.length > 1 ? prev.filter(s => s.id !== seasonId) : prev);
  }, []);

  const toggleSeasonOpen = useCallback((seasonId: string) => {
    setSeasons(prev => prev.map(s => s.id === seasonId ? { ...s, isOpen: !s.isOpen } : s));
  }, []);

  const addEpisodeToSeason = useCallback((seasonId: string) => {
    setSeasons(prev => prev.map(s => {
      if (s.id === seasonId) {
        return {
          ...s,
          episodes: [
            ...s.episodes,
            { id: crypto.randomUUID(), title: "", vimeoUrl: "", description: "", thumbnailUrl: "", duration: "" }
          ]
        };
      }
      return s;
    }));
  }, []);

  const removeEpisodeFromSeason = useCallback((seasonId: string, episodeId: string) => {
    setSeasons(prev => prev.map(s => {
      if (s.id === seasonId && s.episodes.length > 1) {
        return { ...s, episodes: s.episodes.filter(ep => ep.id !== episodeId) };
      }
      return s;
    }));
  }, []);

  const updateEpisode = useCallback((seasonId: string, episodeId: string, field: keyof EpisodeEntry, value: string) => {
    setSeasons(prev => prev.map(s => {
      if (s.id === seasonId) {
        return {
          ...s,
          episodes: s.episodes.map(ep => ep.id === episodeId ? { ...ep, [field]: value } : ep)
        };
      }
      return s;
    }));
  }, []);

  const fetchVimeoMetadata = useCallback(async (seasonId: string, episodeId: string, url: string) => {
    if (!url.includes('vimeo')) return;
    
    setFetchingMetadata(episodeId);
    try {
      const { data, error } = await supabase.functions.invoke('vimeo-metadata', {
        body: { url }
      });

      if (error) throw error;

      if (data) {
        setSeasons(prev => prev.map(s => {
          if (s.id === seasonId) {
            return {
              ...s,
              episodes: s.episodes.map(ep => {
                if (ep.id === episodeId) {
                  return {
                    ...ep,
                    title: ep.title || data.title || "",
                    description: ep.description || data.description || "",
                    thumbnailUrl: ep.thumbnailUrl || data.thumbnail_url || "",
                    duration: ep.duration || data.duration || ""
                  };
                }
                return ep;
              })
            };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error('Error fetching Vimeo metadata:', error);
    } finally {
      setFetchingMetadata(null);
    }
  }, []);

  const totalEpisodeCount = useMemo(() => {
    return seasons.reduce((total, s) => {
      return total + s.episodes.filter(ep => ep.title.trim() && ep.vimeoUrl.trim()).length;
    }, 0);
  }, [seasons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a show title");
      return;
    }

    if (totalEpisodeCount === 0) {
      toast.error("Please add at least one episode with title and URL");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the TV show content entry
      const { data: showData, error: showError } = await supabase
        .from('contents')
        .insert({
          title,
          description,
          type: 'show',
          poster_url: posterUrl || null,
          backdrop_url: backdropUrl || null,
          release_year: releaseYear ? parseInt(releaseYear) : null,
          maturity_rating: maturityRating || null,
          genre: selectedGenres.join(', ') || null,
          channels: selectedChannels,
          featured: isFeatured,
          is_zoe_original: isZoeOriginal
        } as any)
        .select()
        .single();

      if (showError) throw showError;

      // Create seasons and episodes
      let firstEpisodeThumbnail: string | null = null;
      let firstEpisodeVideoUrl: string | null = null;

      for (const season of seasons) {
        const validEpisodes = season.episodes.filter(ep => ep.title.trim() && ep.vimeoUrl.trim());
        if (validEpisodes.length === 0) continue;

        // Create season
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .insert({
            content_id: showData.id,
            season_number: season.seasonNumber,
            title: `Season ${season.seasonNumber}`,
            description: null,
            poster_url: null
          } as any)
          .select()
          .single();

        if (seasonError) throw seasonError;

        // Capture first episode data for show thumbnail/trailer
        if (!firstEpisodeThumbnail && validEpisodes.length > 0) {
          firstEpisodeThumbnail = validEpisodes[0].thumbnailUrl || null;
          firstEpisodeVideoUrl = validEpisodes[0].vimeoUrl || null;
        }

        // Create episodes for this season
        const DEFAULT_VAST_AD_URL = 'https://servedby.aqua-adserver.com/fc.php?script=apVideo:vast2&zoneid=12154';
        const episodeInserts = validEpisodes.map((ep, index) => ({
          season_id: seasonData.id,
          episode_number: index + 1,
          title: ep.title,
          description: ep.description || null,
          video_url: ep.vimeoUrl,
          thumbnail_url: ep.thumbnailUrl || null,
          duration: ep.duration || null,
          vast_ad_url: DEFAULT_VAST_AD_URL
        }));

        const { error: episodesError } = await supabase
          .from('episodes')
          .insert(episodeInserts);

        if (episodesError) throw episodesError;
      }

      // Update show with first episode's thumbnail and trailer if not manually set
      // Also update if posterUrl contains a video URL instead of an image URL
      if (firstEpisodeThumbnail || firstEpisodeVideoUrl) {
        const updateData: Record<string, string | null> = {};
        const isInvalidPosterUrl = !posterUrl || posterUrl.includes('vimeo.com') || posterUrl.includes('player.vimeo.com');
        if (isInvalidPosterUrl && firstEpisodeThumbnail) {
          updateData.poster_url = firstEpisodeThumbnail;
          updateData.backdrop_url = firstEpisodeThumbnail;
        }
        if (firstEpisodeVideoUrl) {
          updateData.trailer_url = firstEpisodeVideoUrl;
        }
        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('contents')
            .update(updateData)
            .eq('id', showData.id);
        }
      }

      // Add membership plans
      if (selectedPlans.length > 0) {
        const planInserts = selectedPlans.map(planId => ({
          content_id: showData.id,
          plan_id: planId
        }));
        await supabase.from('content_membership_plans').insert(planInserts);
      }

      // Add tags
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          content_id: showData.id,
          tag_id: tagId
        }));
        await supabase.from('content_tags').insert(tagInserts);
      }

      toast.success(`"${title}" created with ${seasons.length} season(s) and ${totalEpisodeCount} episode(s)!`);
      onClose();
    } catch (error) {
      console.error('Error creating episodic show:', error);
      toast.error("Failed to create show");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Show Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Show Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Show Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Zoe Muzik"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Release Year</Label>
              <Input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Show description..."
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Poster URL</Label>
              <Input
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Backdrop URL</Label>
              <Input
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                placeholder="https://..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white">Maturity Rating</Label>
            <Select value={maturityRating} onValueChange={setMaturityRating}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-48">
                <SelectValue placeholder="Select rating..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 z-50">
                <SelectItem value="TV-Y">TV-Y (Young Children)</SelectItem>
                <SelectItem value="TV-Y7">TV-Y7 (Older Children)</SelectItem>
                <SelectItem value="TV-G">TV-G (General Audiences)</SelectItem>
                <SelectItem value="TV-PG">TV-PG (Parental Guidance)</SelectItem>
                <SelectItem value="TV-14">TV-14 (Parents Cautioned)</SelectItem>
                <SelectItem value="TV-MA">TV-MA (Mature Audiences)</SelectItem>
                <SelectItem value="G">G (General)</SelectItem>
                <SelectItem value="PG">PG (Parental Guidance)</SelectItem>
                <SelectItem value="PG-13">PG-13</SelectItem>
                <SelectItem value="R">R (Restricted)</SelectItem>
                <SelectItem value="NC-17">NC-17 (Adults Only)</SelectItem>
                <SelectItem value="NR">NR (Not Rated)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch 
                id="featured-switch"
                checked={isFeatured} 
                onCheckedChange={handleFeaturedChange} 
              />
              <Label htmlFor="featured-switch" className="text-white cursor-pointer">Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="zoe-original-switch"
                checked={isZoeOriginal} 
                onCheckedChange={handleZoeOriginalChange} 
              />
              <Label htmlFor="zoe-original-switch" className="text-white cursor-pointer">Zoe Original</Label>
            </div>
          </div>

          <GenreSelector selectedGenres={selectedGenres} onGenresChange={handleGenresChange} />
          <ChannelsSelector selectedChannels={selectedChannels} onChannelsChange={handleChannelsChange} />
          <MembershipPlansSelector selectedPlans={selectedPlans} onSelectedPlansChange={handlePlansChange} />
          <TagsSelector selectedTagIds={selectedTags} onTagsChange={handleTagsChange} contentType="show" />
        </CardContent>
      </Card>

      {/* Seasons & Episodes */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Seasons & Episodes</CardTitle>
          <Button type="button" onClick={addSeason} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Season
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {seasons.map((season) => (
            <Collapsible key={season.id} open={season.isOpen} onOpenChange={() => toggleSeasonOpen(season.id)}>
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 bg-gray-700 cursor-pointer hover:bg-gray-650">
                    <div className="flex items-center gap-3">
                      {season.isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      <span className="text-white font-medium">Season {season.seasonNumber}</span>
                      <span className="text-gray-400 text-sm">
                        ({season.episodes.filter(ep => ep.title && ep.vimeoUrl).length} episodes)
                      </span>
                    </div>
                    {seasons.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); removeSeason(season.id); }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="p-4 space-y-4 bg-gray-800">
                    {season.episodes.map((episode, index) => (
                      <div key={episode.id} className="p-4 bg-gray-700 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">Episode {index + 1}</span>
                          {season.episodes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEpisodeFromSeason(season.id, episode.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-gray-300 text-sm">Vimeo URL *</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                value={episode.vimeoUrl}
                                onChange={(e) => updateEpisode(season.id, episode.id, 'vimeoUrl', e.target.value)}
                                onBlur={() => fetchVimeoMetadata(season.id, episode.id, episode.vimeoUrl)}
                                placeholder="https://vimeo.com/..."
                                className="bg-gray-600 border-gray-500 text-white"
                              />
                              {fetchingMetadata === episode.id && (
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className="text-gray-300 text-sm">Episode Title *</Label>
                            <Input
                              value={episode.title}
                              onChange={(e) => updateEpisode(season.id, episode.id, 'title', e.target.value)}
                              placeholder="Episode title"
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-gray-300 text-sm">Episode Description</Label>
                          <Textarea
                            value={episode.description}
                            onChange={(e) => updateEpisode(season.id, episode.id, 'description', e.target.value)}
                            placeholder="Episode description..."
                            className="bg-gray-600 border-gray-500 text-white h-16"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-gray-300 text-sm">Thumbnail URL</Label>
                            <Input
                              value={episode.thumbnailUrl}
                              onChange={(e) => updateEpisode(season.id, episode.id, 'thumbnailUrl', e.target.value)}
                              placeholder="Auto-filled from Vimeo"
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300 text-sm">Duration</Label>
                            <Input
                              value={episode.duration}
                              onChange={(e) => updateEpisode(season.id, episode.id, 'duration', e.target.value)}
                              placeholder="e.g., 45m"
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button 
                      type="button" 
                      onClick={() => addEpisodeToSeason(season.id)} 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Episode to Season {season.seasonNumber}
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Show...
            </>
          ) : (
            `Create Show with ${seasons.length} Season(s) & ${totalEpisodeCount} Episode(s)`
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddEpisodicShowForm;
