import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Play, Plus, Check, ThumbsUp, Tag, ListVideo, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EpisodeList from "./EpisodeList";
import MoreLikeThis from "./MoreLikeThis";

interface ContentDetailModalProps {
  contentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ContentDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  genre: string | null;
  release_year: number | null;
  duration: string | null;
  rating: string | null;
  maturity_rating: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  logo_url: string | null;
  trailer_url: string | null;
  video_url: string | null;
  cast_members: string[] | null;
  creator: string | null;
  audio_languages: string[] | null;
  subtitle_languages: string[] | null;
  is_zoe_original: boolean | null;
}

interface ContentTag {
  id: string;
  name: string;
}

interface UserPlaylist {
  id: string;
  name: string;
}

const ContentDetailModal = ({ contentId, isOpen, onClose }: ContentDetailModalProps) => {
  const { currentProfile } = useProfile();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [isInList, setIsInList] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [playlistsWithContent, setPlaylistsWithContent] = useState<Set<string>>(new Set());
  const [userPlan, setUserPlan] = useState("free");

  useEffect(() => {
    if (!contentId || !isOpen) return;

    const fetchContent = async () => {
      setIsLoading(true);
      
      // Fetch content details
      const { data: contentData } = await supabase
        .from("contents")
        .select("*")
        .eq("id", contentId)
        .single();

      if (contentData) {
        setContent(contentData as ContentDetail);
      }

      // Fetch content tags
      const { data: contentTags } = await supabase
        .from("content_tags")
        .select("tag_id, tags(id, name)")
        .eq("content_id", contentId);

      if (contentTags) {
        const tagList = contentTags
          .map((ct: any) => ct.tags)
          .filter(Boolean) as ContentTag[];
        setTags(tagList);
      }

      // Check if in favorites and liked
      if (currentProfile?.id) {
        const [favResult, likeResult] = await Promise.all([
          supabase
            .from("favorites")
            .select("id")
            .eq("profile_id", currentProfile.id)
            .eq("content_id", contentId)
            .maybeSingle(),
          supabase
            .from("likes")
            .select("id")
            .eq("profile_id", currentProfile.id)
            .eq("content_id", contentId)
            .maybeSingle()
        ]);

        setIsInList(!!favResult.data);
        setIsLiked(!!likeResult.data);

        // Fetch user playlists
        const { data: playlists } = await supabase
          .from("user_playlists")
          .select("id, name")
          .eq("profile_id", currentProfile.id);
        
        setUserPlaylists(playlists || []);

        // Check which playlists already have this content
        if (playlists && playlists.length > 0) {
          const { data: playlistItems } = await supabase
            .from("user_playlist_items")
            .select("playlist_id")
            .eq("content_id", contentId)
            .in("playlist_id", playlists.map(p => p.id));
          
          setPlaylistsWithContent(new Set(playlistItems?.map(pi => pi.playlist_id) || []));
        }

        // Get user plan
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", user.id)
            .single();
          setUserPlan(profile?.subscription_tier || "free");
        }
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [contentId, isOpen, currentProfile?.id]);

  const toggleMyList = async () => {
    if (!currentProfile?.id || !contentId) return;

    if (isInList) {
      await supabase
        .from("favorites")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
      setIsInList(false);
    } else {
      await supabase
        .from("favorites")
        .insert({ profile_id: currentProfile.id, content_id: contentId });
      setIsInList(true);
    }
  };

  const toggleLike = async () => {
    if (!currentProfile?.id || !contentId) return;

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("profile_id", currentProfile.id)
        .eq("content_id", contentId);
      setIsLiked(false);
    } else {
      await supabase
        .from("likes")
        .insert({ profile_id: currentProfile.id, content_id: contentId, rating: 1 });
      setIsLiked(true);
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    if (!contentId) return;

    const isInPlaylist = playlistsWithContent.has(playlistId);
    
    if (isInPlaylist) {
      // Remove from playlist
      const { error } = await supabase
        .from("user_playlist_items")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("content_id", contentId);
      
      if (!error) {
        setPlaylistsWithContent(prev => {
          const newSet = new Set(prev);
          newSet.delete(playlistId);
          return newSet;
        });
        toast.success("Removed from playlist");
      }
    } else {
      // Add to playlist
      const { error } = await supabase
        .from("user_playlist_items")
        .insert({ playlist_id: playlistId, content_id: contentId });
      
      if (!error) {
        setPlaylistsWithContent(prev => new Set(prev).add(playlistId));
        toast.success("Added to playlist");
      }
    }
  };

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background border-border">
        <ScrollArea className="max-h-[90vh]">
          {/* Hero Section */}
          <div className="relative">
            {content.backdrop_url ? (
              <img
                src={content.backdrop_url}
                alt={content.title}
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-background" />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/80 text-foreground hover:bg-background"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {content.logo_url ? (
                <img
                  src={content.logo_url}
                  alt={content.title}
                  className="max-w-[250px] h-auto mb-4"
                />
              ) : (
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {content.title}
                </h2>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Link to={`/watch/${content.id}`}>
                    <Play className="w-5 h-5 fill-current" />
                    Play
                  </Link>
                </Button>
                
                <button
                  onClick={toggleMyList}
                  className="p-3 rounded-full border-2 border-muted-foreground/50 text-foreground hover:border-foreground transition-colors"
                  title={isInList ? "Remove from My List" : "Add to My List"}
                >
                  {isInList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleLike}
                  className={`p-3 rounded-full border-2 transition-colors ${
                    isLiked 
                      ? "border-primary bg-primary/20 text-primary" 
                      : "border-muted-foreground/50 text-foreground hover:border-foreground"
                  }`}
                  title="Like"
                >
                  <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                </button>

                {/* Add to Playlist Button */}
                {userPlan !== 'free' && userPlaylists.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-3 rounded-full border-2 border-muted-foreground/50 text-foreground hover:border-foreground transition-colors"
                        title="Add to Playlist"
                      >
                        <ListVideo className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border">
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        Add to Playlist
                      </div>
                      <DropdownMenuSeparator />
                      {userPlaylists.map(playlist => (
                        <DropdownMenuItem
                          key={playlist.id}
                          onClick={() => addToPlaylist(playlist.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            {playlistsWithContent.has(playlist.id) ? (
                              <Check className="w-4 h-4 text-primary" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            <span>{playlist.name}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {userPlan === 'free' && (
                  <Link to="/plans?upgrade=standard">
                    <button
                      className="p-3 rounded-full border-2 border-muted-foreground/50 text-foreground hover:border-foreground transition-colors"
                      title="Upgrade to create playlists"
                    >
                      <ListVideo className="w-5 h-5" />
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-6">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {content.release_year && <span className="text-primary font-semibold">{content.release_year}</span>}
              {content.maturity_rating && (
                <span className="px-2 py-0.5 border border-muted-foreground/50 rounded text-xs">
                  {content.maturity_rating}
                </span>
              )}
              {content.duration && <span>{content.duration}</span>}
              {content.rating && <span>⭐ {content.rating}</span>}
              {content.is_zoe_original && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-semibold">
                  ZOE ORIGINAL
                </span>
              )}
            </div>

            {/* Tags Section */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-full text-xs hover:bg-muted transition-colors"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {content.description && (
              <p className="text-foreground leading-relaxed">{content.description}</p>
            )}

            {/* Cast & Crew */}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {content.cast_members && content.cast_members.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Cast: </span>
                  <span className="text-foreground">{content.cast_members.join(", ")}</span>
                </div>
              )}
              {content.creator && (
                <div>
                  <span className="text-muted-foreground">Creator: </span>
                  <span className="text-foreground">{content.creator}</span>
                </div>
              )}
              {content.genre && (
                <div>
                  <span className="text-muted-foreground">Genres: </span>
                  <span className="text-foreground">{content.genre}</span>
                </div>
              )}
              {content.audio_languages && content.audio_languages.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Audio: </span>
                  <span className="text-foreground">{content.audio_languages.join(", ")}</span>
                </div>
              )}
              {content.subtitle_languages && content.subtitle_languages.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Subtitles: </span>
                  <span className="text-foreground">{content.subtitle_languages.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Episodes Section (for TV shows) */}
            {content.type === "show" && (
              <EpisodeList contentId={content.id} />
            )}

            {/* Trailers & More */}
            {content.trailer_url && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Trailers & More</h3>
                <div className="flex gap-4">
                  <div className="relative w-48 aspect-video rounded-lg overflow-hidden group cursor-pointer">
                    <video
                      src={content.trailer_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <Play className="w-10 h-10 text-white" />
                    </div>
                    <p className="absolute bottom-2 left-2 text-white text-sm font-medium">Trailer</p>
                  </div>
                </div>
              </div>
            )}

            {/* More Like This */}
            <MoreLikeThis contentId={content.id} genre={content.genre} onSelect={onClose} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ContentDetailModal;
