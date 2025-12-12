import { useState, useEffect, useCallback, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, PlayCircle, GripVertical, Search, Clock, Tv, Radio, Film, List, Settings, Link2, Shuffle } from "lucide-react";
import { VideoUrlInput } from "@/components/VideoUrlInput";
import { useVideoMetadata, VideoMetadata } from "@/hooks/useVideoMetadata";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Channel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface Playlist {
  id: string;
  playlist_name: string;
  start_date: string;
  start_time: string;
  loop_mode: string;
  is_active: boolean;
  ad_breaks_per_hour: number | null;
  ad_break_duration_seconds: number | null;
  allowed_tiers: string[] | null;
}

const MEMBERSHIP_TIERS = [
  { value: 'free', label: 'Free', description: 'Ad-supported users' },
  { value: 'standard', label: 'Standard', description: '$9.95/month' },
  { value: 'premium', label: 'Premium', description: '$19.95/month' },
];

interface PlaylistItem {
  id: string;
  order_index: number;
  duration_seconds: number | null;
  episode_id: string | null;
  midroll_breaks_json: number[] | null;
  video: {
    id: string;
    title: string;
    poster_url: string | null;
    duration: string | null;
    type: string;
  } | null;
  episode?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: string | null;
    episode_number: number;
    season: {
      season_number: number;
      content: {
        title: string;
      };
    };
  } | null;
}

interface Video {
  id: string;
  title: string;
  poster_url: string | null;
  duration: string | null;
  type: string;
  channels: string[] | null;
}

const FILTER_TYPES = [
  { value: 'none', label: 'No Filter' },
  { value: 'channel', label: 'By Channel' },
  { value: 'tag', label: 'By Tag' },
  { value: 'category', label: 'By Category' },
  { value: 'genre', label: 'By Genre' },
  { value: 'type', label: 'By Type' },
];

const CHANNEL_OPTIONS = [
  'Zoe RatedTV', 'MadFaceTV', 'AyiTV', 'MyPureTV', 'Yard MonTV', 
  'Indie Films', 'Movie Channel', 'More Networks', 'Boss Mogul TV',
  'Cap Village Media', 'Podcast Universe', 'Funny Videos', 'Caught On Camera',
  'Dramatic Videos',
];

const TYPE_OPTIONS = [
  { value: 'movie', label: 'Movies' },
  { value: 'show', label: 'TV Shows' },
  { value: 'video', label: 'Videos' },
  { value: 'podcast', label: 'Podcasts' },
];

interface Episode {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  episode_number: number;
  video_url: string | null;
  season: {
    season_number: number;
    content_id: string;
    content: {
      title: string;
    };
  };
}

// Sortable Item Component
const SortableItem = memo(function SortableItem({ 
  item, 
  onRemove,
  onConfigureMidrolls 
}: { 
  item: PlaylistItem; 
  onRemove: () => void;
  onConfigureMidrolls: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const isEpisode = !!item.episode_id && item.episode;
  const title = isEpisode 
    ? `${item.episode?.season?.content?.title}: S${item.episode?.season?.season_number}E${item.episode?.episode_number} - ${item.episode?.title}`
    : item.video?.title || 'Unknown';
  const thumbnail = isEpisode ? item.episode?.thumbnail_url : item.video?.poster_url;
  const durationSecs = item.duration_seconds || 0;
  const duration = durationSecs > 0
    ? `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s` 
    : (isEpisode ? item.episode?.duration : item.video?.duration) || 'Unknown duration';
  const midrollCount = item.midroll_breaks_json?.length || 0;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
      <button {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <span className="text-sm font-medium text-muted-foreground w-8">{item.order_index}</span>
      {thumbnail ? (
        <img src={thumbnail} alt={title} className="w-20 h-12 object-cover rounded" />
      ) : (
        <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
          {isEpisode ? <Film className="h-5 w-5 text-muted-foreground" /> : <Tv className="h-5 w-5 text-muted-foreground" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{title}</p>
          {isEpisode && <Badge variant="secondary" className="text-xs">Episode</Badge>}
          {midrollCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {midrollCount} ad break{midrollCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{duration}</p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onConfigureMidrolls}
        title="Configure ad breaks"
      >
        <Settings className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

export default function AdminLiveTVPlaylists() {
  const { channelId } = useParams<{ channelId: string }>();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Video search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [episodicShows, setEpisodicShows] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddingEpisodes, setIsAddingEpisodes] = useState(false);
  const [filterType, setFilterType] = useState<string>('none');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [isAddingSelected, setIsAddingSelected] = useState(false);
  
  // Filter options from database
  const [availableTags, setAvailableTags] = useState<{id: string; name: string; slug: string}[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{id: string; name: string; slug: string}[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  // Midroll configuration
  const [midrollDialogOpen, setMidrollDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlaylistItem | null>(null);
  const [midrollBreaks, setMidrollBreaks] = useState<number[]>([]);
  const [newBreakMinutes, setNewBreakMinutes] = useState('');

  // Video URL import
  const [vimeoUrl, setVimeoUrl] = useState('');
  const [vimeoMetadata, setVimeoMetadata] = useState<VideoMetadata | null>(null);
  const [isAddingVimeo, setIsAddingVimeo] = useState(false);
  const { fetchMetadata: fetchVimeoMeta, isLoading: isLoadingVimeo } = useVideoMetadata();

  const [formData, setFormData] = useState({
    playlist_name: '',
    start_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    loop_mode: 'continuous_loop',
    is_active: true,
    ad_breaks_per_hour: 2,
    ad_break_duration_seconds: 30,
    allowed_tiers: ['free', 'standard', 'premium'] as string[],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchChannel = async () => {
    if (!channelId) return;
    const { data } = await supabase.from('live_channels').select('id, name, slug, logo_url').eq('id', channelId).single();
    if (data) setChannel(data);
  };

  const fetchPlaylists = async () => {
    if (!channelId) return;
    const { data } = await supabase
      .from('live_channel_playlists')
      .select('*')
      .eq('channel_id', channelId)
      .order('start_date', { ascending: false });
    if (data) {
      setPlaylists(data);
      if (data.length > 0 && !selectedPlaylist) {
        setSelectedPlaylist(data[0]);
      }
    }
    setIsLoading(false);
  };

  const fetchPlaylistItems = useCallback(async () => {
    if (!selectedPlaylist) {
      setPlaylistItems([]);
      return;
    }
    const { data } = await supabase
      .from('live_playlist_items')
      .select(`
        *,
        video:contents(id, title, poster_url, duration, type),
        episode:episodes(
          id, title, thumbnail_url, duration, episode_number, video_url,
          season:seasons(season_number, content_id, content:contents(title))
        )
      `)
      .eq('channel_playlist_id', selectedPlaylist.id)
      .order('order_index');
    if (data) setPlaylistItems(data as PlaylistItem[]);
  }, [selectedPlaylist]);

  useEffect(() => {
    fetchChannel();
    fetchPlaylists();
    
    // Fetch filter options
    const fetchFilterOptions = async () => {
      const [tagsRes, catsRes, genresRes] = await Promise.all([
        supabase.from('tags').select('id, name, slug').order('name'),
        supabase.from('categories').select('id, name, slug').order('name'),
        supabase.from('contents').select('genre').not('genre', 'is', null),
      ]);
      
      if (tagsRes.data) setAvailableTags(tagsRes.data);
      if (catsRes.data) setAvailableCategories(catsRes.data);
      if (genresRes.data) {
        const uniqueGenres = [...new Set(genresRes.data.map(c => c.genre).filter(Boolean))] as string[];
        setAvailableGenres(uniqueGenres.sort());
      }
    };
    fetchFilterOptions();
  }, [channelId]);

  useEffect(() => {
    fetchPlaylistItems();
  }, [fetchPlaylistItems]);

  const searchVideos = useCallback(async (query: string, fType: string, fValue: string) => {
    if (!query.trim() && fType === 'none') {
      setSearchResults([]);
      setEpisodicShows([]);
      return;
    }
    setIsSearching(true);
    
    try {
      let data: any[] = [];
      
      if (fType === 'tag' && fValue) {
        // Search by tag - need to join with content_tags
        const { data: taggedContent } = await supabase
          .from('content_tags')
          .select('content:contents(id, title, poster_url, duration, type, channels)')
          .eq('tag_id', fValue);
        
        if (taggedContent) {
          data = taggedContent.map(tc => tc.content).filter(Boolean);
          if (query.trim()) {
            data = data.filter(v => v.title?.toLowerCase().includes(query.toLowerCase()));
          }
        }
      } else {
        // Standard query
        let queryBuilder = supabase
          .from('contents')
          .select('id, title, poster_url, duration, type, channels');
        
        if (query.trim()) {
          queryBuilder = queryBuilder.ilike('title', `%${query}%`);
        }
        
        // Apply filter based on type
        if (fType === 'channel' && fValue) {
          if (fValue === 'Movie Channel') {
            queryBuilder = queryBuilder.eq('type', 'movie');
          } else {
            queryBuilder = queryBuilder.contains('channels', [fValue]);
          }
        } else if (fType === 'genre' && fValue) {
          queryBuilder = queryBuilder.ilike('genre', `%${fValue}%`);
        } else if (fType === 'type' && fValue) {
          queryBuilder = queryBuilder.eq('type', fValue as any);
        } else if (fType === 'category' && fValue) {
          // Need separate query for category
          const { data: catContent } = await supabase
            .from('playlist_items')
            .select('content:contents(id, title, poster_url, duration, type, channels), playlist:playlists!inner(slug)')
            .eq('playlist.slug', fValue);
          
          if (catContent) {
            data = catContent.map(pc => pc.content).filter(Boolean);
            if (query.trim()) {
              data = data.filter(v => v.title?.toLowerCase().includes(query.toLowerCase()));
            }
          }
        }
        
        if (fType !== 'category' || !fValue) {
          const result = await queryBuilder.limit(100);
          if (result.data) data = result.data;
        }
      }
      
      const shows = data.filter(v => v.type === 'show');
      const others = data.filter(v => v.type !== 'show');
      setEpisodicShows(shows as Video[]);
      setSearchResults(others as Video[]);
    } catch (error) {
      console.error('Search error:', error);
    }
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchVideos(searchQuery, filterType, filterValue), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterType, filterValue, searchVideos]);

  const resetForm = () => {
    setFormData({
      playlist_name: '',
      start_date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      loop_mode: 'continuous_loop',
      is_active: true,
      ad_breaks_per_hour: 2,
      ad_break_duration_seconds: 30,
      allowed_tiers: ['free', 'standard', 'premium'],
    });
    setEditingPlaylist(null);
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      playlist_name: playlist.playlist_name,
      start_date: playlist.start_date,
      start_time: playlist.start_time,
      loop_mode: playlist.loop_mode,
      is_active: playlist.is_active,
      ad_breaks_per_hour: playlist.ad_breaks_per_hour || 2,
      ad_break_duration_seconds: playlist.ad_break_duration_seconds || 30,
      allowed_tiers: playlist.allowed_tiers || ['free', 'standard', 'premium'],
    });
    setIsDialogOpen(true);
  };

  const handleSavePlaylist = async () => {
    if (!formData.playlist_name) {
      toast.error('Playlist name is required');
      return;
    }
    setIsSaving(true);

    try {
      if (!editingPlaylist && formData.is_active) {
        await supabase
          .from('live_channel_playlists')
          .update({ is_active: false })
          .eq('channel_id', channelId);
      }

      if (editingPlaylist) {
        if (formData.is_active && !editingPlaylist.is_active) {
          await supabase
            .from('live_channel_playlists')
            .update({ is_active: false })
            .eq('channel_id', channelId);
        }
        
        const { error } = await supabase
          .from('live_channel_playlists')
          .update({
            playlist_name: formData.playlist_name,
            start_date: formData.start_date,
            start_time: formData.start_time,
            loop_mode: formData.loop_mode,
            is_active: formData.is_active,
            ad_breaks_per_hour: formData.ad_breaks_per_hour,
            ad_break_duration_seconds: formData.ad_break_duration_seconds,
            allowed_tiers: formData.allowed_tiers,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPlaylist.id);
        if (error) throw error;
        toast.success('Playlist updated');
      } else {
        const { error } = await supabase.from('live_channel_playlists').insert({
          channel_id: channelId,
          playlist_name: formData.playlist_name,
          start_date: formData.start_date,
          start_time: formData.start_time,
          loop_mode: formData.loop_mode,
          is_active: formData.is_active,
          ad_breaks_per_hour: formData.ad_breaks_per_hour,
          ad_break_duration_seconds: formData.ad_break_duration_seconds,
          allowed_tiers: formData.allowed_tiers,
        });
        if (error) throw error;
        toast.success('Playlist created');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchPlaylists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (!confirm(`Delete playlist "${playlist.playlist_name}"?`)) return;
    try {
      const { error } = await supabase.from('live_channel_playlists').delete().eq('id', playlist.id);
      if (error) throw error;
      toast.success('Playlist deleted');
      if (selectedPlaylist?.id === playlist.id) setSelectedPlaylist(null);
      fetchPlaylists();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleActivatePlaylist = async (playlist: Playlist) => {
    try {
      await supabase
        .from('live_channel_playlists')
        .update({ is_active: false })
        .eq('channel_id', channelId);
      await supabase
        .from('live_channel_playlists')
        .update({ is_active: true })
        .eq('id', playlist.id);
      toast.success('Playlist activated');
      fetchPlaylists();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddVideo = async (video: Video) => {
    if (!selectedPlaylist) return;
    try {
      const nextOrder = playlistItems.length + 1;
      const durationSeconds = parseDuration(video.duration || '');
      const { error } = await supabase.from('live_playlist_items').insert({
        channel_playlist_id: selectedPlaylist.id,
        video_id: video.id,
        order_index: nextOrder,
        duration_seconds: durationSeconds || null,
      });
      if (error) throw error;
      toast.success('Video added');
      setSearchQuery('');
      setIsSearchOpen(false);
      fetchPlaylistItems();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddSelectedVideos = async () => {
    if (!selectedPlaylist || selectedVideoIds.size === 0) return;
    setIsAddingSelected(true);
    
    try {
      const allVideos = [...searchResults, ...episodicShows];
      const videosToAdd = allVideos.filter(v => selectedVideoIds.has(v.id));
      
      let orderIndex = playlistItems.length;
      
      for (const video of videosToAdd) {
        orderIndex++;
        const durationSeconds = parseDuration(video.duration || '');
        await supabase.from('live_playlist_items').insert({
          channel_playlist_id: selectedPlaylist.id,
          video_id: video.id,
          order_index: orderIndex,
          duration_seconds: durationSeconds || null,
        });
      }
      
      toast.success(`${videosToAdd.length} video(s) added`);
      setSelectedVideoIds(new Set());
      setSearchQuery('');
      setFilterType('none');
      setFilterValue('');
      setIsSearchOpen(false);
      fetchPlaylistItems();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAddingSelected(false);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const allIds = [...searchResults, ...episodicShows].map(v => v.id);
    if (selectedVideoIds.size === allIds.length) {
      setSelectedVideoIds(new Set());
    } else {
      setSelectedVideoIds(new Set(allIds));
    }
  };

  const handleVimeoMetadataFetched = (metadata: VideoMetadata) => {
    setVimeoMetadata(metadata);
  };

  const handleAddVimeoUrl = async () => {
    if (!selectedPlaylist || !vimeoUrl) return;
    if (!vimeoMetadata) {
      // Try to fetch metadata first
      const meta = await fetchVimeoMeta(vimeoUrl);
      if (!meta) {
        toast.error('Could not fetch video metadata');
        return;
      }
      setVimeoMetadata(meta);
    }
    
    setIsAddingVimeo(true);
    try {
      // Create a new content record from Vimeo metadata
      const contentToInsert = {
        title: vimeoMetadata?.title || 'Untitled Video',
        video_url: vimeoUrl,
        poster_url: vimeoMetadata?.thumbnail_large || vimeoMetadata?.thumbnail_url || null,
        backdrop_url: vimeoMetadata?.thumbnail_large || vimeoMetadata?.thumbnail_url || null,
        duration: vimeoMetadata?.duration || null,
        description: vimeoMetadata?.description || null,
        type: 'movie' as const,
        genre: null,
        release_year: null,
        rating: null,
        trailer_url: null,
        featured: false,
        vast_ad_preroll: null,
        vast_ad_midroll: null,
        vast_ad_postroll: null,
      };
      
      const { data: newContent, error: contentError } = await supabase
        .from('contents')
        .insert([contentToInsert])
        .select('id, title, poster_url, duration, type')
        .single();
      
      if (contentError) throw contentError;
      
      // Add to playlist
      const nextOrder = playlistItems.length + 1;
      const durationSeconds = vimeoMetadata?.duration_seconds || parseDuration(vimeoMetadata?.duration || '');
      
      const { error: playlistError } = await supabase.from('live_playlist_items').insert({
        channel_playlist_id: selectedPlaylist.id,
        video_id: newContent.id,
        order_index: nextOrder,
        duration_seconds: durationSeconds || null,
      });
      
      if (playlistError) throw playlistError;
      
      toast.success(`Added "${newContent.title}" to playlist`);
      setVimeoUrl('');
      setVimeoMetadata(null);
      setIsSearchOpen(false);
      fetchPlaylistItems();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add video');
    } finally {
      setIsAddingVimeo(false);
    }
  };

  const handleAddEpisodicShow = async (show: Video) => {
    if (!selectedPlaylist) return;
    setIsAddingEpisodes(true);
    
    try {
      const { data: seasons, error: seasonsError } = await supabase
        .from('seasons')
        .select('id, season_number')
        .eq('content_id', show.id)
        .order('season_number');
      
      if (seasonsError) throw seasonsError;
      if (!seasons || seasons.length === 0) {
        toast.error('No seasons found for this show');
        setIsAddingEpisodes(false);
        return;
      }

      const seasonIds = seasons.map(s => s.id);
      const { data: episodes, error: episodesError } = await supabase
        .from('episodes')
        .select('id, title, thumbnail_url, duration, episode_number, video_url, season_id')
        .in('season_id', seasonIds)
        .order('episode_number');
      
      if (episodesError) throw episodesError;
      if (!episodes || episodes.length === 0) {
        toast.error('No episodes found for this show');
        setIsAddingEpisodes(false);
        return;
      }

      const sortedEpisodes = episodes.sort((a, b) => {
        const seasonA = seasons.find(s => s.id === a.season_id)?.season_number || 0;
        const seasonB = seasons.find(s => s.id === b.season_id)?.season_number || 0;
        if (seasonA !== seasonB) return seasonA - seasonB;
        return a.episode_number - b.episode_number;
      });

      let nextOrder = playlistItems.length + 1;
      const insertItems = sortedEpisodes.map((ep, index) => ({
        channel_playlist_id: selectedPlaylist.id,
        video_id: show.id,
        episode_id: ep.id,
        order_index: nextOrder + index,
        duration_seconds: parseDuration(ep.duration || '') || null,
      }));

      const { error: insertError } = await supabase
        .from('live_playlist_items')
        .insert(insertItems);
      
      if (insertError) throw insertError;
      
      toast.success(`Added ${sortedEpisodes.length} episodes from "${show.title}"`);
      setSearchQuery('');
      setIsSearchOpen(false);
      fetchPlaylistItems();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add episodes');
    } finally {
      setIsAddingEpisodes(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('live_playlist_items').delete().eq('id', itemId);
      if (error) throw error;
      toast.success('Item removed');
      fetchPlaylistItems();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = playlistItems.findIndex(item => item.id === active.id);
    const newIndex = playlistItems.findIndex(item => item.id === over.id);
    const newItems = arrayMove(playlistItems, oldIndex, newIndex).map((item, idx) => ({ ...item, order_index: idx + 1 }));
    setPlaylistItems(newItems);

    try {
      for (const item of newItems) {
        await supabase.from('live_playlist_items').update({ order_index: item.order_index }).eq('id', item.id);
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      fetchPlaylistItems();
    }
  };

  // Midroll configuration handlers
  const openMidrollConfig = useCallback((item: PlaylistItem) => {
    setEditingItem(item);
    setMidrollBreaks(item.midroll_breaks_json || []);
    setNewBreakMinutes('');
    setMidrollDialogOpen(true);
  }, []);

  const addMidrollBreak = () => {
    const minutes = parseInt(newBreakMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      toast.error('Enter a valid number of minutes');
      return;
    }
    const seconds = minutes * 60;
    if (midrollBreaks.includes(seconds)) {
      toast.error('This break time already exists');
      return;
    }
    setMidrollBreaks(prev => [...prev, seconds].sort((a, b) => a - b));
    setNewBreakMinutes('');
  };

  const removeMidrollBreak = (seconds: number) => {
    setMidrollBreaks(prev => prev.filter(b => b !== seconds));
  };

  const saveMidrollBreaks = async () => {
    if (!editingItem) return;
    
    try {
      const { error } = await supabase
        .from('live_playlist_items')
        .update({ midroll_breaks_json: midrollBreaks })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      toast.success('Ad breaks saved');
      setMidrollDialogOpen(false);
      fetchPlaylistItems();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRandomizePlaylist = async () => {
    if (playlistItems.length < 2) {
      toast.error('Need at least 2 items to randomize');
      return;
    }
    
    try {
      // Fisher-Yates shuffle
      const shuffled = [...playlistItems];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Assign new order indices
      const reorderedItems = shuffled.map((item, idx) => ({ ...item, order_index: idx + 1 }));
      setPlaylistItems(reorderedItems);
      
      // Update database
      for (const item of reorderedItems) {
        await supabase.from('live_playlist_items').update({ order_index: item.order_index }).eq('id', item.id);
      }
      
      toast.success('Playlist randomized');
    } catch (error) {
      console.error('Failed to randomize:', error);
      toast.error('Failed to randomize playlist');
      fetchPlaylistItems();
    }
  };

  function parseDuration(duration: string): number {
    if (!duration) return 0;
    if (/^\d+$/.test(duration)) return parseInt(duration, 10);
    let total = 0;
    const h = duration.match(/(\d+)\s*h/i);
    if (h) total += parseInt(h[1], 10) * 3600;
    const m = duration.match(/(\d+)\s*m/i);
    if (m) total += parseInt(m[1], 10) * 60;
    const s = duration.match(/(\d+)\s*s/i);
    if (s) total += parseInt(s[1], 10);
    const colon = duration.match(/^(\d+):(\d+)(?::(\d+))?$/);
    if (colon) {
      if (colon[3]) total = parseInt(colon[1], 10) * 3600 + parseInt(colon[2], 10) * 60 + parseInt(colon[3], 10);
      else total = parseInt(colon[1], 10) * 60 + parseInt(colon[2], 10);
    }
    return total;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="container mx-auto px-4 py-8 pb-24 pt-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <Link to="/admin/livetv/channels">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              {channel?.logo_url ? (
                <img src={channel.logo_url} alt={channel.name} className="h-8 sm:h-10" />
              ) : (
                <Tv className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              )}
              {channel?.name} Playlists
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Schedule and manage content for this channel</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />New Playlist</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPlaylist ? 'Edit Playlist' : 'Create Playlist'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Playlist Name *</Label>
                  <Input value={formData.playlist_name} onChange={(e) => setFormData(prev => ({ ...prev, playlist_name: e.target.value }))} placeholder="e.g., Morning Block" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" value={formData.start_time} onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Loop Mode</Label>
                  <Select value={formData.loop_mode} onValueChange={(value) => setFormData(prev => ({ ...prev, loop_mode: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="continuous_loop">Continuous Loop (24/7)</SelectItem>
                      <SelectItem value="end_then_idle">Play Once Then Idle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Ad Breaks Configuration */}
                <div className="border-t pt-4 mt-2">
                  <Label className="text-sm font-semibold text-foreground mb-3 block">Ad Breaks Settings</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Ad Breaks Per Hour</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="10"
                        value={formData.ad_breaks_per_hour} 
                        onChange={(e) => setFormData(prev => ({ ...prev, ad_breaks_per_hour: parseInt(e.target.value) || 0 }))} 
                        placeholder="2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">How many ad breaks per hour</p>
                    </div>
                    <div>
                      <Label className="text-xs">Ad Duration (seconds)</Label>
                      <Input 
                        type="number" 
                        min="10" 
                        max="120"
                        value={formData.ad_break_duration_seconds} 
                        onChange={(e) => setFormData(prev => ({ ...prev, ad_break_duration_seconds: parseInt(e.target.value) || 30 }))} 
                        placeholder="30"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Duration of each ad break</p>
                    </div>
                  </div>
                </div>

                {/* Membership Access */}
                <div className="border-t pt-4 mt-2">
                  <Label className="text-sm font-semibold text-foreground mb-2 block">Membership Access</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select which membership tiers can access this playlist
                  </p>
                  <div className="space-y-2">
                    {MEMBERSHIP_TIERS.map((tier) => (
                      <div key={tier.value} className="flex items-center space-x-3 p-2 rounded-md border border-border hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={`playlist-tier-${tier.value}`}
                          checked={formData.allowed_tiers.includes(tier.value)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              allowed_tiers: checked
                                ? [...prev.allowed_tiers, tier.value]
                                : prev.allowed_tiers.filter(t => t !== tier.value)
                            }));
                          }}
                        />
                        <div className="flex-1">
                          <label htmlFor={`playlist-tier-${tier.value}`} className="text-sm font-medium cursor-pointer">
                            {tier.label}
                          </label>
                          <p className="text-xs text-muted-foreground">{tier.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {formData.allowed_tiers.length === 0 && (
                    <p className="text-xs text-destructive mt-2">At least one tier must be selected</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label>Activate Immediately</Label>
                  <Switch 
                    checked={formData.is_active} 
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} 
                  />
                </div>
                <Button onClick={handleSavePlaylist} className="w-full" disabled={isSaving || formData.allowed_tiers.length === 0}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPlaylist ? 'Update' : 'Create'} Playlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Instructions Banner */}
        {/* RTMP Live Streaming Notice */}
        <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Radio className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Want to live stream from Switcher Studio?</h3>
                <p className="text-sm text-muted-foreground">
                  RTMP streaming credentials are configured in <strong>Channel Settings</strong>, not here. 
                  Go to <Link to="/admin/livetv/channels" className="text-primary underline hover:no-underline">Channels Manager</Link> and 
                  click <strong>"Generate RTMP"</strong> or <strong>"RTMP Info"</strong> on your channel to get Switcher Studio credentials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {playlists.length === 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <h3 className="font-semibold text-foreground mb-2">How to add videos to your Live TV channel:</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Click <strong>"New Playlist"</strong> button above to create a playlist</li>
                <li>Set the playlist name, start date/time, and loop mode</li>
                <li>Toggle <strong>"Activate Immediately"</strong> to make playlist live when created</li>
                <li>After creating, <strong>select the playlist</strong> from the left panel</li>
                <li>Click <strong>"Add Video"</strong> button to search and add videos</li>
                <li>For <strong>TV shows</strong>, click "Add All Episodes" to add every episode</li>
                <li>Click the <strong>⚙️ gear icon</strong> on any item to configure midroll ad breaks</li>
                <li>Drag and drop to reorder videos in the playlist</li>
              </ol>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Playlists List */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-foreground">Playlists</h2>
            {playlists.length === 0 ? (
              <Card><CardContent className="py-8 text-center">
                <PlayCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No playlists yet</p>
              </CardContent></Card>
            ) : (
              playlists.map((playlist) => (
                <Card key={playlist.id} className={`cursor-pointer transition-colors ${selectedPlaylist?.id === playlist.id ? 'border-primary' : ''}`} onClick={() => setSelectedPlaylist(playlist)}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{playlist.playlist_name}</h3>
                          {playlist.is_active && <Badge className="bg-green-500"><Radio className="h-3 w-3 mr-1" />Active</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {playlist.start_date} @ {playlist.start_time}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!playlist.is_active && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleActivatePlaylist(playlist); }}>
                            Activate
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditPlaylist(playlist); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Playlist Items */}
          <div className="lg:col-span-2">
            {selectedPlaylist ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedPlaylist.playlist_name} - Schedule</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleRandomizePlaylist}
                        disabled={playlistItems.length < 2}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />Shuffle
                      </Button>
                      <Popover open={isSearchOpen} onOpenChange={(open) => {
                        setIsSearchOpen(open);
                        if (!open) {
                          setVimeoUrl('');
                          setVimeoMetadata(null);
                          setSelectedVideoIds(new Set());
                          setFilterType('none');
                          setFilterValue('');
                          setSearchQuery('');
                        }
                      }}>
                        <PopoverTrigger asChild>
                          <Button><Plus className="h-4 w-4 mr-2" />Add Video</Button>
                        </PopoverTrigger>
                      <PopoverContent className="w-[480px] p-0" align="end">
                        <Tabs defaultValue="search" className="w-full">
                          <TabsList className="w-full grid grid-cols-2 h-auto p-1">
                            <TabsTrigger value="search" className="text-sm py-2">
                              <Search className="h-4 w-4 mr-2" />
                              Search Library
                            </TabsTrigger>
                            <TabsTrigger value="vimeo" className="text-sm py-2">
                              <Link2 className="h-4 w-4 mr-2" />
                              Add Vimeo URL
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="search" className="m-0">
                            <div className="p-3 border-b space-y-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search videos..." className="pl-9" autoFocus />
                              </div>
                              <div className="flex gap-2">
                                <Select value={filterType} onValueChange={(val) => { setFilterType(val); setFilterValue(''); }}>
                                  <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Filter by..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FILTER_TYPES.map((ft) => (
                                      <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                {filterType === 'channel' && (
                                  <Select value={filterValue} onValueChange={setFilterValue}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select channel..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CHANNEL_OPTIONS.map((ch) => (
                                        <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                
                                {filterType === 'tag' && (
                                  <Select value={filterValue} onValueChange={setFilterValue}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select tag..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <ScrollArea className="h-60">
                                        {availableTags.map((tag) => (
                                          <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                                        ))}
                                      </ScrollArea>
                                    </SelectContent>
                                  </Select>
                                )}
                                
                                {filterType === 'category' && (
                                  <Select value={filterValue} onValueChange={setFilterValue}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <ScrollArea className="h-60">
                                        {availableCategories.map((cat) => (
                                          <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                                        ))}
                                      </ScrollArea>
                                    </SelectContent>
                                  </Select>
                                )}
                                
                                {filterType === 'genre' && (
                                  <Select value={filterValue} onValueChange={setFilterValue}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select genre..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <ScrollArea className="h-60">
                                        {availableGenres.map((g) => (
                                          <SelectItem key={g} value={g}>{g}</SelectItem>
                                        ))}
                                      </ScrollArea>
                                    </SelectContent>
                                  </Select>
                                )}
                                
                                {filterType === 'type' && (
                                  <Select value={filterValue} onValueChange={setFilterValue}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TYPE_OPTIONS.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                            
                            {/* Select All / Add Selected bar */}
                            {(searchResults.length > 0 || episodicShows.length > 0) && (
                              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="select-all"
                                    checked={selectedVideoIds.size === [...searchResults, ...episodicShows].length && selectedVideoIds.size > 0}
                                    onCheckedChange={toggleSelectAll}
                                  />
                                  <label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
                                    Select All ({searchResults.length + episodicShows.length})
                                  </label>
                                </div>
                                {selectedVideoIds.size > 0 && (
                                  <Button 
                                    size="sm" 
                                    onClick={handleAddSelectedVideos}
                                    disabled={isAddingSelected}
                                  >
                                    {isAddingSelected ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Plus className="h-3 w-3 mr-1" />
                                    )}
                                    Add {selectedVideoIds.size} Selected
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            <ScrollArea className="h-72">
                              {isSearching || isAddingEpisodes ? (
                                <div className="flex flex-col items-center justify-center p-4 gap-2">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                  {isAddingEpisodes && <p className="text-sm text-muted-foreground">Adding episodes...</p>}
                                </div>
                              ) : (
                                <div className="p-2 space-y-2">
                                  {episodicShows.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2 flex items-center gap-1">
                                        <List className="h-3 w-3" /> TV Shows
                                      </p>
                                      <div className="space-y-1">
                                        {episodicShows.map((show) => (
                                          <div
                                            key={show.id}
                                            className={`flex items-center gap-2 p-2 rounded border transition-colors ${
                                              selectedVideoIds.has(show.id) ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                                            }`}
                                          >
                                            <Checkbox
                                              checked={selectedVideoIds.has(show.id)}
                                              onCheckedChange={() => toggleVideoSelection(show.id)}
                                            />
                                            {show.poster_url ? (
                                              <img src={show.poster_url} alt={show.title} className="w-16 h-10 object-cover rounded" />
                                            ) : (
                                              <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                                                <Tv className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{show.title}</p>
                                              <p className="text-xs text-muted-foreground">{show.duration || 'N/A'}</p>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddEpisodicShow(show);
                                              }}
                                              className="text-xs"
                                            >
                                              <List className="h-3 w-3 mr-1" />
                                              All Eps
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {searchResults.length > 0 && (
                                    <div>
                                      {episodicShows.length > 0 && (
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2 flex items-center gap-1">
                                          <Film className="h-3 w-3" /> Movies & Videos
                                        </p>
                                      )}
                                      <div className="space-y-1">
                                        {searchResults.map((video) => (
                                          <div 
                                            key={video.id} 
                                            className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer ${
                                              selectedVideoIds.has(video.id) ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                                            }`}
                                            onClick={() => toggleVideoSelection(video.id)}
                                          >
                                            <Checkbox
                                              checked={selectedVideoIds.has(video.id)}
                                              onCheckedChange={() => toggleVideoSelection(video.id)}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            {video.poster_url ? (
                                              <img src={video.poster_url} alt={video.title} className="w-16 h-10 object-cover rounded" />
                                            ) : (
                                              <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                                                <Film className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{video.title}</p>
                                              <p className="text-xs text-muted-foreground">{video.type} • {video.duration || 'N/A'}</p>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddVideo(video);
                                              }}
                                              title="Add single video"
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {(searchQuery || filterType !== 'none') && searchResults.length === 0 && episodicShows.length === 0 && (
                                    <p className="p-4 text-center text-muted-foreground">No videos found</p>
                                  )}
                                  {!searchQuery && filterType === 'none' && (
                                    <p className="p-4 text-center text-muted-foreground">Start typing to search or select a filter</p>
                                  )}
                                </div>
                              )}
                            </ScrollArea>
                          </TabsContent>
                          
                          <TabsContent value="vimeo" className="m-0 p-4 space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Paste Vimeo or YouTube URL</Label>
                              <VideoUrlInput
                                value={vimeoUrl}
                                onChange={setVimeoUrl}
                                onMetadataFetched={handleVimeoMetadataFetched}
                                placeholder="https://vimeo.com/... or https://youtube.com/..."
                              />
                            </div>
                            
                            {vimeoMetadata && !vimeoMetadata.is_direct_url && (
                              <div className="border border-border rounded-lg p-3 bg-muted/30">
                                <p className="text-sm font-medium text-foreground mb-1">Ready to add:</p>
                                <p className="text-xs text-muted-foreground">
                                  {vimeoMetadata.title || 'Untitled'} • {vimeoMetadata.duration || 'Unknown duration'}
                                </p>
                              </div>
                            )}
                            
                            <Button 
                              onClick={handleAddVimeoUrl} 
                              disabled={!vimeoUrl || isAddingVimeo || isLoadingVimeo}
                              className="w-full"
                            >
                              {isAddingVimeo ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add to Playlist
                                </>
                              )}
                            </Button>
                            
                            <p className="text-xs text-muted-foreground text-center">
                              Video will be added to content library and playlist
                            </p>
                          </TabsContent>
                        </Tabs>
                      </PopoverContent>
                    </Popover>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {playlistItems.length === 0 ? (
                    <div className="text-center py-12">
                      <PlayCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No videos in this playlist</p>
                      <p className="text-xs text-muted-foreground">Click "Add Video" to start building</p>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={playlistItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {playlistItems.map((item) => (
                            <SortableItem 
                              key={item.id} 
                              item={item} 
                              onRemove={() => handleRemoveItem(item.id)}
                              onConfigureMidrolls={() => openMidrollConfig(item)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="py-12 text-center">
                <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a playlist to manage its schedule</p>
              </CardContent></Card>
            )}
          </div>
        </div>
      </main>

      {/* Midroll Configuration Dialog */}
      <Dialog open={midrollDialogOpen} onOpenChange={setMidrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Ad Breaks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Set times (in minutes from start) when ads should play during this video.
            </p>
            
            {editingItem && (
              <div className="text-sm">
                <span className="font-medium">Video: </span>
                {editingItem.episode_id && editingItem.episode
                  ? `S${editingItem.episode.season.season_number}E${editingItem.episode.episode_number}: ${editingItem.episode.title}`
                  : editingItem.video?.title}
                <br />
                <span className="font-medium">Duration: </span>
                {editingItem.duration_seconds 
                  ? `${Math.floor(editingItem.duration_seconds / 60)} minutes`
                  : 'Unknown'}
              </div>
            )}

            {/* Add new break */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Minutes from start"
                value={newBreakMinutes}
                onChange={(e) => setNewBreakMinutes(e.target.value)}
                min="1"
              />
              <Button onClick={addMidrollBreak} variant="secondary">
                <Plus className="h-4 w-4 mr-2" />
                Add Break
              </Button>
            </div>

            {/* Current breaks */}
            <div className="space-y-2">
              <Label>Scheduled Ad Breaks:</Label>
              {midrollBreaks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ad breaks configured</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {midrollBreaks.map((seconds) => (
                    <Badge key={seconds} variant="secondary" className="flex items-center gap-1">
                      {Math.floor(seconds / 60)} min
                      <button
                        onClick={() => removeMidrollBreak(seconds)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={saveMidrollBreaks} className="w-full">
              Save Ad Breaks
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
