import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Season {
  id: string;
  season_number: number;
  title: string | null;
}

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  description: string | null;
  duration: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
}

interface EpisodeListProps {
  contentId: string;
}

const EpisodeList = ({ contentId }: EpisodeListProps) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSeasons = async () => {
      const { data } = await supabase
        .from("seasons")
        .select("id, season_number, title")
        .eq("content_id", contentId)
        .order("season_number", { ascending: true });

      if (data && data.length > 0) {
        setSeasons(data);
        setSelectedSeason(data[0].id);
      }
      setIsLoading(false);
    };

    fetchSeasons();
  }, [contentId]);

  useEffect(() => {
    if (!selectedSeason) return;

    const fetchEpisodes = async () => {
      const { data } = await supabase
        .from("episodes")
        .select("id, episode_number, title, description, duration, thumbnail_url, video_url")
        .eq("season_id", selectedSeason)
        .order("episode_number", { ascending: true });

      if (data) {
        setEpisodes(data);
      }
    };

    fetchEpisodes();
  }, [selectedSeason]);

  if (isLoading || seasons.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Episodes</h3>
        
        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((season) => (
              <SelectItem key={season.id} value={season.id}>
                Season {season.season_number}
                {season.title && `: ${season.title}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {episodes.map((episode) => (
          <Link
            key={episode.id}
            to={`/watch/${contentId}?episode=${episode.id}`}
            className={`flex gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group ${
              !episode.video_url ? 'opacity-60' : ''
            }`}
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-32 aspect-video rounded overflow-hidden">
              {episode.thumbnail_url ? (
                <img
                  src={episode.thumbnail_url}
                  alt={episode.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-current" />
              </div>
              {!episode.video_url && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-xs text-white/80">No video</span>
                </div>
              )}
            </div>

            {/* Episode Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  {episode.episode_number}. {episode.title}
                </h4>
                {episode.duration && (
                  <span className="text-sm text-muted-foreground">{episode.duration}</span>
                )}
              </div>
              {episode.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {episode.description}
                </p>
              )}
            </div>
          </Link>
        ))}

        {episodes.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No episodes available</p>
        )}
      </div>
    </div>
  );
};

export default EpisodeList;
