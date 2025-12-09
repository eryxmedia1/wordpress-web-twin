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
  Power,
  Loader2,
  Film,
  FolderPlus
} from "lucide-react";
import { toast } from "sonner";
import IndieVideoUploadForm from "@/components/indie/IndieVideoUploadForm";
import IndieLimitReachedModal from "@/components/indie/IndieLimitReachedModal";

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
  allow_ads: boolean;
}

interface ChannelContent {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  video_url: string | null;
  created_at: string;
  type: string;
  duration: string | null;
  genre: string | null;
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

  // Dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitType, setLimitType] = useState<"videos" | "rows">("videos");

  // Settings form state
  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsLogoUrl, setSettingsLogoUrl] = useState("");
  const [settingsBackdropUrl, setSettingsBackdropUrl] = useState("");
  const [settingsTrailerUrl, setSettingsTrailerUrl] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);

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
      .select("id, title, description, poster_url, video_url, created_at, type, duration, genre")
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
      totalWatchTime: (viewCount || 0) * 15,
      subscriberCount: subscriberCount || 0,
      contentCount: contentData?.length || 0
    });

    setLoading(false);
  };

  const handleUploadClick = () => {
    if (!channel) return;
    
    if (contents.length >= (channel.max_total_videos || 100)) {
      setLimitType("videos");
      setLimitModalOpen(true);
      return;
    }
    
    setIsUploadOpen(true);
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

  const handleFileUpload = async (
    file: File,
    type: 'logo' | 'backdrop',
    setUploading: (v: boolean) => void,
    setUrl: (v: string) => void
  ) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('channel-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('channel-logos')
        .getPublicUrl(fileName);

      setUrl(publicUrl);
      toast.success(`${type === 'logo' ? 'Logo' : 'Backdrop'} uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!channel) return;

    setSavingSettings(true);
    
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
    
    setSavingSettings(false);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!channel || !isOwner) {
    return null;
  }

  const videoLimitPercentage = Math.min((contents.length / (channel.max_total_videos || 100)) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ExpandingSidebar />
      
      <div className="ml-16 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {channel.logo_url ? (
              <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-2xl font-bold text-primary">{channel.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{channel.name}</h1>
              <span className={`px-2 py-0.5 rounded text-xs ${channel.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {channel.is_active ? 'Active' : 'Inactive'}
              </span>
              {channel.allow_ads && (
                <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                  Ads Enabled
                </span>
              )}
            </div>
            <p className="text-muted-foreground">Producer Dashboard</p>
            {/* Usage bar */}
            <div className="mt-2 max-w-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Videos</span>
                <span>{contents.length} / {channel.max_total_videos || 100}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${videoLimitPercentage >= 90 ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${videoLimitPercentage}%` }}
                />
              </div>
            </div>
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
          <Button onClick={handleUploadClick} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Video
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Video className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Video
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
                    <Film className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{analytics.contentCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Limits Overview */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Channel Limits</CardTitle>
                <CardDescription>Your current plan limits and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Total Videos</span>
                      <span className="font-medium">{contents.length} / {channel.max_total_videos}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${videoLimitPercentage >= 90 ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${videoLimitPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Max Rows</span>
                      <span className="font-medium">{channel.max_rows}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Videos Per Row</span>
                      <span className="font-medium">{channel.max_videos_per_row}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Content</CardTitle>
                    <CardDescription>
                      {contents.length} / {channel.max_total_videos || 100} videos
                    </CardDescription>
                  </div>
                  <Button onClick={handleUploadClick} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Video
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No videos uploaded yet</p>
                    <Button onClick={handleUploadClick} variant="outline" className="mt-4 gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Your First Video
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Video</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Genre</TableHead>
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
                          <TableCell className="text-muted-foreground">{content.duration || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{content.genre || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(content.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link to={`/watch/${content.id}`} target="_blank">
                                  <Play className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteContent(content.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Add New Video</CardTitle>
                <CardDescription>
                  Upload a new video to your channel. Paste a Vimeo URL to auto-fetch metadata.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contents.length >= (channel.max_total_videos || 100) ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
                      <Video className="h-6 w-6 text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Video Limit Reached</h3>
                    <p className="text-muted-foreground mb-4">
                      You've reached your maximum limit of {channel.max_total_videos} videos.
                    </p>
                    <Button asChild>
                      <a href="mailto:support@zoeratedtv.com">Contact Support to Upgrade</a>
                    </Button>
                  </div>
                ) : (
                  <IndieVideoUploadForm
                    channelId={channel.id}
                    onSuccess={() => {
                      fetchChannel();
                    }}
                    onCancel={() => {}}
                    currentVideoCount={contents.length}
                    maxVideos={channel.max_total_videos || 100}
                  />
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
                            <span className="text-muted-foreground font-bold w-4">{index + 1}</span>
                            <div className="w-12 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
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
                  <Label>Logo</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={settingsLogoUrl}
                      onChange={(e) => setSettingsLogoUrl(e.target.value)}
                      placeholder="https://... or upload"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'logo', setUploadingLogo, setSettingsLogoUrl);
                        }}
                        disabled={uploadingLogo}
                      />
                      <Button type="button" variant="outline" size="icon" disabled={uploadingLogo} asChild>
                        <span>
                          {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  {settingsLogoUrl && (
                    <img src={settingsLogoUrl} alt="Logo" className="mt-2 h-16 w-16 object-cover rounded" />
                  )}
                </div>
                <div>
                  <Label>Backdrop Image</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={settingsBackdropUrl}
                      onChange={(e) => setSettingsBackdropUrl(e.target.value)}
                      placeholder="https://... or upload"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'backdrop', setUploadingBackdrop, setSettingsBackdropUrl);
                        }}
                        disabled={uploadingBackdrop}
                      />
                      <Button type="button" variant="outline" size="icon" disabled={uploadingBackdrop} asChild>
                        <span>
                          {uploadingBackdrop ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  {settingsBackdropUrl && (
                    <img src={settingsBackdropUrl} alt="Backdrop" className="mt-2 h-24 w-full object-cover rounded" />
                  )}
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
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={savingSettings}
                  className="gap-2"
                >
                  {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload New Video</DialogTitle>
          </DialogHeader>
          <IndieVideoUploadForm
            channelId={channel.id}
            onSuccess={() => {
              setIsUploadOpen(false);
              fetchChannel();
            }}
            onCancel={() => setIsUploadOpen(false)}
            currentVideoCount={contents.length}
            maxVideos={channel.max_total_videos || 100}
          />
        </DialogContent>
      </Dialog>

      {/* Limit Reached Modal */}
      <IndieLimitReachedModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        limitType={limitType}
        currentCount={limitType === "videos" ? contents.length : 0}
        maxCount={limitType === "videos" ? (channel.max_total_videos || 100) : (channel.max_rows || 5)}
      />
    </div>
  );
};

export default ProducerDashboard;
