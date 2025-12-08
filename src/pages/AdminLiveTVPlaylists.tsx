import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, PlayCircle, GripVertical, Search, Clock, Tv, Radio } from "lucide-react";
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
}

interface PlaylistItem {
  id: string;
  order_index: number;
  duration_seconds: number | null;
  video: {
    id: string;
    title: string;
    poster_url: string | null;
    duration: string | null;
  };
}

interface Video {
  id: string;
  title: string;
  poster_url: string | null;
  duration: string | null;
  type: string;
}

function SortableItem({ item, onRemove }: { item: PlaylistItem; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
      <button {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <span className="text-sm font-medium text-muted-foreground w-8">{item.order_index}</span>
      {item.video?.poster_url ? (
        <img src={item.video.poster_url} alt={item.video?.title} className="w-20 h-12 object-cover rounded" />
      ) : (
        <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
          <Tv className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.video?.title}</p>
        <p className="text-xs text-muted-foreground">
          {item.duration_seconds ? `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s` : item.video?.duration || 'Unknown duration'}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

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
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [formData, setFormData] = useState({
    playlist_name: '',
    start_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    loop_mode: 'continuous_loop',
    is_active: false,
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
      .select(`*, video:contents(id, title, poster_url, duration)`)
      .eq('channel_playlist_id', selectedPlaylist.id)
      .order('order_index');
    if (data) setPlaylistItems(data as PlaylistItem[]);
  }, [selectedPlaylist]);

  useEffect(() => {
    fetchChannel();
    fetchPlaylists();
  }, [channelId]);

  useEffect(() => {
    fetchPlaylistItems();
  }, [fetchPlaylistItems]);

  const searchVideos = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const { data } = await supabase
      .from('contents')
      .select('id, title, poster_url, duration, type')
      .ilike('title', `%${query}%`)
      .limit(20);
    setSearchResults(data || []);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchVideos(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchVideos]);

  const resetForm = () => {
    setFormData({
      playlist_name: '',
      start_date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      loop_mode: 'continuous_loop',
      is_active: false,
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
      if (editingPlaylist) {
        const { error } = await supabase
          .from('live_channel_playlists')
          .update({
            playlist_name: formData.playlist_name,
            start_date: formData.start_date,
            start_time: formData.start_time,
            loop_mode: formData.loop_mode,
            is_active: formData.is_active,
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
      // Deactivate all other playlists for this channel
      await supabase
        .from('live_channel_playlists')
        .update({ is_active: false })
        .eq('channel_id', channelId);
      // Activate this one
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

    // Update order in database
    try {
      for (const item of newItems) {
        await supabase.from('live_playlist_items').update({ order_index: item.order_index }).eq('id', item.id);
      }
    } catch (error) {
      console.error('Failed to update order:', error);
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
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Header - always visible */}
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
                <Button onClick={handleSavePlaylist} className="w-full" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPlaylist ? 'Update' : 'Create'} Playlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Instructions Banner */}
        {playlists.length === 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <h3 className="font-semibold text-foreground mb-2">How to add videos to your Live TV channel:</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Click <strong>"New Playlist"</strong> button above to create a playlist</li>
                <li>Set the playlist name, start date/time, and loop mode</li>
                <li>After creating, <strong>select the playlist</strong> from the left panel</li>
                <li>Click <strong>"Add Video"</strong> button to search and add videos</li>
                <li>Drag and drop to reorder videos in the playlist</li>
                <li>Click <strong>"Activate"</strong> on a playlist to make it live</li>
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
                    <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button><Plus className="h-4 w-4 mr-2" />Add Video</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-0" align="end">
                        <div className="p-3 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search videos..." className="pl-9" autoFocus />
                          </div>
                        </div>
                        <ScrollArea className="h-80">
                          {isSearching ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                          ) : searchResults.length > 0 ? (
                            <div className="p-2 space-y-1">
                              {searchResults.map((video) => (
                                <button key={video.id} onClick={() => handleAddVideo(video)} className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent text-left">
                                  {video.poster_url ? (
                                    <img src={video.poster_url} alt={video.title} className="w-16 h-10 object-cover rounded" />
                                  ) : (
                                    <div className="w-16 h-10 bg-muted rounded" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{video.title}</p>
                                    <p className="text-xs text-muted-foreground">{video.type} • {video.duration || 'N/A'}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : searchQuery ? (
                            <p className="p-4 text-center text-muted-foreground">No videos found</p>
                          ) : (
                            <p className="p-4 text-center text-muted-foreground">Start typing to search</p>
                          )}
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
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
                            <SortableItem key={item.id} item={item} onRemove={() => handleRemoveItem(item.id)} />
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
    </div>
  );
}
