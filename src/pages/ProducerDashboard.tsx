import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Video, 
  Settings, 
  BarChart3, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Users, 
  Clock,
  TrendingUp,
  Play,
  ExternalLink,
  Power
} from "lucide-react";
import { toast } from "sonner";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  trailer_url: string | null;
  backdrop_url: string | null;
  owner_id: string | null;
  is_active: boolean;
  can_go_live: boolean;
  analytics_access: boolean;
  max_total_videos: number;
  max_rows: number;
  max_videos_per_row: number;
}

interface ChannelContent {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  video_url: string | null;
  created_at: string;
  type: string;
}

interface AnalyticsData {
  totalViews: number;
  totalWatchTime: number;
  subscriberCount: number;
  contentCount: number;
}

const ProducerDashboard = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [channel, setChannel] = useState<IndieChannel | null>(null);
  const [contents, setContents] = useState<ChannelContent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    totalWatchTime: 0,
    subscriberCount: 0,
    contentCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Upload form state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadVideoUrl, setUploadVideoUrl] = useState("");
  const [uploadPosterUrl, setUploadPosterUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Settings form state
  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsLogoUrl, setSettingsLogoUrl] = useState("");
  const [settingsBackdropUrl, setSettingsBackdropUrl] = useState("");
  const [settingsTrailerUrl, setSettingsTrailerUrl] = useState("");

  useEffect(() => {
    if (slug) {
      fetchChannel();
    }
  }, [slug, user]);

  const fetchChannel = async () => {
    setLoading(true);
    
    const { data: channelData, error } = await supabase
      .from("indie_channels")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !channelData) {
      toast.error("Channel not found");
      navigate("/");
      return;
    }

    setChannel(channelData as IndieChannel);
    setSettingsName(channelData.name);
    setSettingsDescription(channelData.description || "");
    setSettingsLogoUrl(channelData.logo_url || "");
    setSettingsBackdropUrl(channelData.backdrop_url || "");
    setSettingsTrailerUrl(channelData.trailer_url || "");

    // Check if user is owner OR admin
    const ownerMatch = channelData.owner_id === user?.id;
    const hasAccess = ownerMatch || isAdmin;
    setIsOwner(hasAccess);

    if (!hasAccess) {
      toast.error("You don't have access to this dashboard");
      navigate("/");
      return;
    }

    // Fetch channel content
    const { data: contentData } = await supabase
      .from("contents")
      .select("id, title, description, poster_url, video_url, created_at, type")
      .eq("indie_channel_id", channelData.id)
      .order("created_at", { ascending: false });

    setContents((contentData || []) as ChannelContent[]);

    // Fetch analytics
    const { count: subscriberCount } = await supabase
      .from("indie_channel_favorites")
      .select("*", { count: "exact", head: true })
      .eq("indie_channel_id", channelData.id);

    const { count: viewCount } = await supabase
      .from("watch_history")
      .select("*, contents!inner(indie_channel_id)", { count: "exact", head: true })
      .eq("contents.indie_channel_id", channelData.id);

    setAnalytics({
      totalViews: viewCount || 0,
      totalWatchTime: (viewCount || 0) * 15, // Estimate 15 min avg watch
      subscriberCount: subscriberCount || 0,
      contentCount: contentData?.length || 0
    });

    setLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadVideoUrl.trim()) {
      toast.error("Title and video URL are required");
      return;
    }

    if (!channel) return;

    // Check video limit
    if (contents.length >= (channel.max_total_videos || 100)) {
      toast.error(`You've reached the maximum limit of ${channel.max_total_videos} videos`);
      return;
    }

    setUploading(true);

    const { error } = await (supabase.from("contents") as any).insert([{
      title: uploadTitle.trim(),
      description: uploadDescription.trim() || null,
      video_url: uploadVideoUrl.trim(),
      poster_url: uploadPosterUrl.trim() || null,
      type: "movie",
      indie_channel_id: channel.id
    }]);

    if (error) {
      console.error("Error uploading:", error);
      toast.error("Failed to upload video");
    } else {
      toast.success("Video uploaded successfully!");
      setIsUploadOpen(false);
      setUploadTitle("");
      setUploadDescription("");
      setUploadVideoUrl("");
      setUploadPosterUrl("");
      fetchChannel();
    }

    setUploading(false);
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    const { error } = await supabase
      .from("contents")
      .delete()
      .eq("id", contentId);

    if (error) {
      toast.error("Failed to delete video");
    } else {
      toast.success("Video deleted");
      fetchChannel();
    }
  };

  const handleSaveSettings = async () => {
    if (!channel) return;

    const { error } = await supabase
      .from("indie_channels")
      .update({
        name: settingsName.trim(),
        description: settingsDescription.trim() || null,
        logo_url: settingsLogoUrl.trim() || null,
        backdrop_url: settingsBackdropUrl.trim() || null,
        trailer_url: settingsTrailerUrl.trim() || null
      })
      .eq("id", channel.id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved!");
      fetchChannel();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!channel || !isOwner) {
    return null;
  }

  const toggleChannelActive = async () => {
    if (!channel) return;
    
    const { error } = await supabase
      .from("indie_channels")
      .update({ is_active: !channel.is_active })
      .eq("id", channel.id);

    if (error) {
      toast.error("Failed to update channel status");
    } else {
      toast.success(channel.is_active ? "Channel deactivated" : "Channel activated");
      fetchChannel();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ExpandingSidebar />
      
      <div className="ml-16 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {channel.logo_url ? (
              <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-2xl font-bold text-primary">{channel.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{channel.name}</h1>
              <span className={`px-2 py-0.5 rounded text-xs ${channel.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {channel.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-muted-foreground">Producer Dashboard</p>
          </div>
          
          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant={channel.is_active ? "destructive" : "default"}
                size="sm"
                onClick={toggleChannelActive}
                className="gap-2"
              >
                <Power className="w-4 h-4" />
                {channel.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/indie-channels">
                  Back to Admin
                </Link>
              </Button>
            </div>
          )}
          
          <Button variant="outline" asChild>
            <Link to={`/indie-channel/${channel.slug}`} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              View Channel
            </Link>
          </Button>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Video title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Video description..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Video URL *</Label>
                  <Input
                    value={uploadVideoUrl}
                    onChange={(e) => setUploadVideoUrl(e.target.value)}
                    placeholder="https://vimeo.com/..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Thumbnail URL</Label>
                  <Input
                    value={uploadPosterUrl}
                    onChange={(e) => setUploadPosterUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {contents.length} / {channel.max_total_videos || 100} videos uploaded
                </div>
                <Button onClick={handleUpload} disabled={uploading} className="w-full">
                  {uploading ? "Uploading..." : "Upload Video"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Video className="w-4 h-4" />
              Content
            </TabsTrigger>
            {channel.analytics_access && (
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{analytics.subscriberCount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Watch Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{Math.round(analytics.totalWatchTime / 60)}h</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{analytics.contentCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
                <CardDescription>Your latest video uploads</CardDescription>
              </CardHeader>
              <CardContent>
                {contents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No videos uploaded yet. Click "Upload Video" to get started!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {contents.slice(0, 4).map(content => (
                      <div key={content.id} className="relative group">
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                          {content.poster_url ? (
                            <img src={content.poster_url} alt={content.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium truncate">{content.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>All Content</CardTitle>
                <CardDescription>
                  {contents.length} / {channel.max_total_videos || 100} videos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No videos uploaded yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Video</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contents.map(content => (
                        <TableRow key={content.id}>
                          <TableCell>
                            <div className="w-20 h-12 bg-muted rounded overflow-hidden">
                              {content.poster_url ? (
                                <img src={content.poster_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{content.title}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(content.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          {channel.analytics_access && (
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Views</span>
                        <span className="font-bold">{analytics.totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Watch Time</span>
                        <span className="font-bold">{Math.round(analytics.totalWatchTime / 60)} hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Subscribers</span>
                        <span className="font-bold">{analytics.subscriberCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Avg. Views per Video</span>
                        <span className="font-bold">
                          {analytics.contentCount > 0 
                            ? Math.round(analytics.totalViews / analytics.contentCount).toLocaleString() 
                            : 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Upload videos to see analytics
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contents.slice(0, 5).map((content, index) => (
                          <div key={content.id} className="flex items-center gap-3">
                            <span className="text-muted-foreground font-bold">{index + 1}</span>
                            <div className="w-12 h-8 bg-muted rounded overflow-hidden">
                              {content.poster_url ? (
                                <img src={content.poster_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="w-3 h-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="flex-1 truncate text-sm">{content.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Channel Settings</CardTitle>
                <CardDescription>Update your channel information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Channel Name</Label>
                  <Input
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={settingsDescription}
                    onChange={(e) => setSettingsDescription(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={settingsLogoUrl}
                    onChange={(e) => setSettingsLogoUrl(e.target.value)}
                    className="mt-1"
                    placeholder="https://..."
                  />
                  {settingsLogoUrl && (
                    <img src={settingsLogoUrl} alt="Logo" className="mt-2 h-16 w-16 object-cover rounded" />
                  )}
                </div>
                <div>
                  <Label>Backdrop URL</Label>
                  <Input
                    value={settingsBackdropUrl}
                    onChange={(e) => setSettingsBackdropUrl(e.target.value)}
                    className="mt-1"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Trailer URL</Label>
                  <Input
                    value={settingsTrailerUrl}
                    onChange={(e) => setSettingsTrailerUrl(e.target.value)}
                    className="mt-1"
                    placeholder="https://..."
                  />
                </div>
                <Button onClick={handleSaveSettings}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProducerDashboard;