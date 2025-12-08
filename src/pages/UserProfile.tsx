import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Bookmark, Clock, Film, Heart, ListVideo, Plus, Settings, ThumbsUp, Trash, User, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/context/ProfileContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface WatchHistoryItem {
  id: string;
  content_id: string;
  progress_percent: number;
  last_watched_at: string;
  content: {
    id: string;
    title: string;
    poster_url: string | null;
    type: string;
    duration: string | null;
  };
}

interface FavoriteItem {
  id: string;
  content_id: string;
  content: {
    id: string;
    title: string;
    poster_url: string | null;
    type: string;
  };
}

interface LikeItem {
  id: string;
  content_id: string;
  rating: number | null;
  content: {
    id: string;
    title: string;
    poster_url: string | null;
    type: string;
  };
}

interface UserPlaylist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  item_count: number;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState("free");
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [currentProfile?.id]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to view your profile");
        navigate("/login");
        return;
      }
      
      // Check admin status and get plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, subscription_tier')
        .eq('id', user.id)
        .single();
        
      setIsAdmin(profile?.is_admin || false);
      setUserPlan(profile?.subscription_tier || 'free');

      if (!currentProfile?.id) {
        setLoading(false);
        return;
      }

      // Fetch watch history
      const { data: historyData } = await supabase
        .from('watch_history')
        .select(`
          id, content_id, progress_percent, last_watched_at,
          content:contents(id, title, poster_url, type, duration)
        `)
        .eq('profile_id', currentProfile.id)
        .order('last_watched_at', { ascending: false })
        .limit(20);

      // Fetch favorites
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select(`
          id, content_id,
          content:contents(id, title, poster_url, type)
        `)
        .eq('profile_id', currentProfile.id)
        .order('created_at', { ascending: false });

      // Fetch likes
      const { data: likesData } = await supabase
        .from('likes')
        .select(`
          id, content_id, rating,
          content:contents(id, title, poster_url, type)
        `)
        .eq('profile_id', currentProfile.id)
        .order('created_at', { ascending: false });

      // Fetch user playlists
      const { data: playlistsData } = await supabase
        .from('user_playlists')
        .select(`
          id, name, description, created_at,
          items:user_playlist_items(count)
        `)
        .eq('profile_id', currentProfile.id)
        .order('created_at', { ascending: false });

      setWatchHistory((historyData as any) || []);
      setFavorites((favoritesData as any) || []);
      setLikes((likesData as any) || []);
      setPlaylists(playlistsData?.map(p => ({
        ...p,
        item_count: (p.items as any)?.[0]?.count || 0
      })) || []);

    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !currentProfile?.id) return;
    
    if (userPlan === 'free') {
      toast.error("Playlists are available for Standard and Premium members");
      return;
    }

    setIsCreatingPlaylist(true);
    
    const { error } = await supabase
      .from('user_playlists')
      .insert({
        profile_id: currentProfile.id,
        name: newPlaylistName.trim()
      });

    if (error) {
      toast.error("Failed to create playlist");
    } else {
      toast.success("Playlist created!");
      setNewPlaylistName("");
      fetchUserData();
    }
    
    setIsCreatingPlaylist(false);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Delete this playlist?")) return;
    
    const { error } = await supabase
      .from('user_playlists')
      .delete()
      .eq('id', playlistId);

    if (error) {
      toast.error("Failed to delete playlist");
    } else {
      toast.success("Playlist deleted");
      fetchUserData();
    }
  };

  const calculateRemainingTime = (progress: number, duration: string | null) => {
    if (!duration) return "";
    const match = duration.match(/(\d+)/);
    if (!match) return "";
    const totalMinutes = parseInt(match[1]);
    const remaining = Math.round(totalMinutes * (1 - progress / 100));
    return `${remaining} min remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              {currentProfile?.name || "Profile"} • {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
            </p>
          </div>
          <Link to="/plans">
            <Button variant="outline" className="mt-4 md:mt-0">
              Manage Subscription
            </Button>
          </Link>
        </div>
        
        <Tabs defaultValue="continue" className="w-full">
          <TabsList className="bg-card border border-border mb-6 flex-wrap h-auto">
            <TabsTrigger value="continue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="w-4 h-4 mr-2" /> Continue Watching
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bookmark className="w-4 h-4 mr-2" /> My List
            </TabsTrigger>
            <TabsTrigger value="liked" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ThumbsUp className="w-4 h-4 mr-2" /> Liked
            </TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ListVideo className="w-4 h-4 mr-2" /> Playlists
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="w-4 h-4 mr-2" /> Admin
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Continue Watching Tab */}
          <TabsContent value="continue">
            {watchHistory.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No watch history yet. Start watching to see your progress here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {watchHistory.map(item => (
                  <Link to={`/watch/${item.content?.id}`} key={item.id}>
                    <Card className="bg-card border-border overflow-hidden hover:scale-105 transition cursor-pointer">
                      <div className="relative">
                        <img 
                          src={item.content?.poster_url || "https://via.placeholder.com/400x225"} 
                          alt={item.content?.title} 
                          className="w-full object-cover aspect-video" 
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                          <h3 className="text-lg font-medium text-white">{item.content?.title}</h3>
                          <p className="text-sm text-gray-300">
                            {calculateRemainingTime(item.progress_percent, item.content?.duration)}
                          </p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${item.progress_percent}%` }}></div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* My List Tab */}
          <TabsContent value="saved">
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your list is empty. Add movies and shows to watch later!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map(item => (
                  <Link to={`/watch/${item.content?.id}`} key={item.id}>
                    <Card className="bg-card border-border overflow-hidden hover:scale-105 transition cursor-pointer">
                      <div className="relative">
                        <img 
                          src={item.content?.poster_url || "https://via.placeholder.com/400x225"} 
                          alt={item.content?.title} 
                          className="w-full object-cover aspect-video" 
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                          <h3 className="text-lg font-medium text-white">{item.content?.title}</h3>
                          <span className="text-xs text-gray-300 capitalize">{item.content?.type}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Liked Tab */}
          <TabsContent value="liked">
            {likes.length === 0 ? (
              <div className="text-center py-12">
                <ThumbsUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't liked anything yet!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {likes.map(item => (
                  <Link to={`/watch/${item.content?.id}`} key={item.id}>
                    <Card className="bg-card border-border overflow-hidden hover:scale-105 transition cursor-pointer">
                      <div className="relative">
                        <img 
                          src={item.content?.poster_url || "https://via.placeholder.com/400x225"} 
                          alt={item.content?.title} 
                          className="w-full object-cover aspect-video" 
                        />
                        <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                          <ThumbsUp className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                          <h3 className="text-lg font-medium text-white">{item.content?.title}</h3>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Playlists Tab */}
          <TabsContent value="playlists">
            {userPlan === 'free' ? (
              <div className="text-center py-12">
                <ListVideo className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Create custom playlists with Standard or Premium membership</p>
                <Link to="/plans?upgrade=standard">
                  <Button className="bg-primary">Upgrade Now</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Your Playlists ({playlists.length})</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-primary">
                        <Plus className="w-4 h-4 mr-2" /> Create Playlist
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle>Create New Playlist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Playlist name"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="bg-background"
                        />
                        <Button 
                          onClick={handleCreatePlaylist}
                          disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                          className="w-full bg-primary"
                        >
                          {isCreatingPlaylist ? "Creating..." : "Create Playlist"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {playlists.length === 0 ? (
                  <div className="text-center py-12">
                    <ListVideo className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No playlists yet. Create your first one!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {playlists.map(playlist => (
                      <Card key={playlist.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{playlist.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {playlist.item_count} items
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeletePlaylist(playlist.id)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                          {playlist.description && (
                            <p className="text-sm text-muted-foreground">{playlist.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Admin Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-medium mb-4">Content Management</h4>
                      <p className="text-muted-foreground mb-4">Manage movies, shows, seasons, and episodes</p>
                      <Link to="/admin">
                        <Button className="w-full bg-primary hover:bg-primary/90">
                          Go to Admin Dashboard
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-medium mb-4">Membership Plans</h4>
                      <p className="text-muted-foreground mb-4">Manage plan features and channels</p>
                      <Link to="/admin/plans">
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black">
                          Manage Plans
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;