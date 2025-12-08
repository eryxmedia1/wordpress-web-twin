import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GenreSelector } from "./GenreSelector";
import { ChannelsSelector } from "./ChannelsSelector";
import { MembershipPlansSelector } from "./MembershipPlansSelector";
import { TagsSelector } from "./TagsSelector";

interface EpisodeEntry {
  id: string;
  title: string;
  vimeoUrl: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
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
  const [seasonNumber, setSeasonNumber] = useState("1");

  // Episodes
  const [episodes, setEpisodes] = useState<EpisodeEntry[]>([
    { id: crypto.randomUUID(), title: "", vimeoUrl: "", description: "", thumbnailUrl: "", duration: "" }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState<string | null>(null);

  const addEpisode = () => {
    setEpisodes([
      ...episodes,
      { id: crypto.randomUUID(), title: "", vimeoUrl: "", description: "", thumbnailUrl: "", duration: "" }
    ]);
  };

  const removeEpisode = (id: string) => {
    if (episodes.length > 1) {
      setEpisodes(episodes.filter(ep => ep.id !== id));
    }
  };

  const updateEpisode = (id: string, field: keyof EpisodeEntry, value: string) => {
    setEpisodes(episodes.map(ep => ep.id === id ? { ...ep, [field]: value } : ep));
  };

  const fetchVimeoMetadata = async (episodeId: string, url: string) => {
    if (!url.includes('vimeo')) return;
    
    setFetchingMetadata(episodeId);
    try {
      const { data, error } = await supabase.functions.invoke('vimeo-metadata', {
        body: { url }
      });

      if (error) throw error;

      if (data) {
        setEpisodes(episodes.map(ep => {
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
        }));
      }
    } catch (error) {
      console.error('Error fetching Vimeo metadata:', error);
    } finally {
      setFetchingMetadata(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a show title");
      return;
    }

    const validEpisodes = episodes.filter(ep => ep.title.trim() && ep.vimeoUrl.trim());
    if (validEpisodes.length === 0) {
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
          type: 'tvshow' as const,
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

      // Create season
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .insert([{
          content_id: showData.id,
          season_number: parseInt(seasonNumber),
          title: `Season ${seasonNumber}`,
          description: null,
          poster_url: null
        }])
        .select()
        .single();

      if (seasonError) throw seasonError;

      // Create episodes
      const episodeInserts = validEpisodes.map((ep, index) => ({
        season_id: seasonData.id,
        episode_number: index + 1,
        title: ep.title,
        description: ep.description || null,
        video_url: ep.vimeoUrl,
        thumbnail_url: ep.thumbnailUrl || null,
        duration: ep.duration || null,
        vast_ad_url: null
      }));

      const { error: episodesError } = await supabase
        .from('episodes')
        .insert(episodeInserts);

      if (episodesError) throw episodesError;

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

      toast.success(`"${title}" created with ${validEpisodes.length} episodes!`);
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
              <Label className="text-white">Season Number</Label>
              <Input
                type="number"
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(e.target.value)}
                min="1"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Release Year</Label>
              <Input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Maturity Rating</Label>
              <Input
                value={maturityRating}
                onChange={(e) => setMaturityRating(e.target.value)}
                placeholder="TV-PG, TV-MA, etc."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              <Label className="text-white">Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isZoeOriginal} onCheckedChange={setIsZoeOriginal} />
              <Label className="text-white">Zoe Original</Label>
            </div>
          </div>

          <GenreSelector selectedGenres={selectedGenres} onGenresChange={setSelectedGenres} />
          <ChannelsSelector selectedChannels={selectedChannels} onChannelsChange={setSelectedChannels} />
          <MembershipPlansSelector selectedPlans={selectedPlans} onSelectedPlansChange={setSelectedPlans} />
          <TagsSelector selectedTagIds={selectedTags} onTagsChange={setSelectedTags} contentType="show" />
        </CardContent>
      </Card>

      {/* Episodes */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Episodes (Season {seasonNumber})</CardTitle>
          <Button type="button" onClick={addEpisode} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Episode
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {episodes.map((episode, index) => (
            <div key={episode.id} className="p-4 bg-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Episode {index + 1}</span>
                {episodes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEpisode(episode.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300 text-sm">Vimeo URL *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={episode.vimeoUrl}
                      onChange={(e) => updateEpisode(episode.id, 'vimeoUrl', e.target.value)}
                      onBlur={() => fetchVimeoMetadata(episode.id, episode.vimeoUrl)}
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
                    onChange={(e) => updateEpisode(episode.id, 'title', e.target.value)}
                    placeholder="Episode title"
                    className="bg-gray-600 border-gray-500 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Episode Description</Label>
                <Textarea
                  value={episode.description}
                  onChange={(e) => updateEpisode(episode.id, 'description', e.target.value)}
                  placeholder="Episode description..."
                  className="bg-gray-600 border-gray-500 text-white h-16"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300 text-sm">Thumbnail URL</Label>
                  <Input
                    value={episode.thumbnailUrl}
                    onChange={(e) => updateEpisode(episode.id, 'thumbnailUrl', e.target.value)}
                    placeholder="Auto-filled from Vimeo"
                    className="bg-gray-600 border-gray-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Duration</Label>
                  <Input
                    value={episode.duration}
                    onChange={(e) => updateEpisode(episode.id, 'duration', e.target.value)}
                    placeholder="e.g., 45m"
                    className="bg-gray-600 border-gray-500 text-white"
                  />
                </div>
              </div>
            </div>
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
            `Create Show with ${episodes.filter(e => e.title && e.vimeoUrl).length} Episodes`
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
