import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink, Video, Globe, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  trailer_url: string | null;
  backdrop_url: string | null;
  is_active: boolean;
  created_at: string;
  // Capabilities
  can_go_live: boolean;
  custom_branding_enabled: boolean;
  analytics_access: boolean;
  allow_ads: boolean;
  // Restrictions
  max_rows: number;
  max_videos_per_row: number;
  max_total_videos: number;
  revenue_share_percent: number;
  // Geo restrictions
  allowed_countries: string[];
  allowed_regions: string[];
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
  { code: "NG", name: "Nigeria" },
  { code: "ZA", name: "South Africa" },
  { code: "JM", name: "Jamaica" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "BB", name: "Barbados" },
  { code: "GY", name: "Guyana" },
];

const AdminIndieChannels = () => {
  const [channels, setChannels] = useState<IndieChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<IndieChannel | null>(null);

  // Form state - Basic Info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Form state - Capabilities
  const [canGoLive, setCanGoLive] = useState(false);
  const [customBrandingEnabled, setCustomBrandingEnabled] = useState(false);
  const [analyticsAccess, setAnalyticsAccess] = useState(true);
  const [allowAds, setAllowAds] = useState(true);

  // Form state - Restrictions
  const [maxRows, setMaxRows] = useState(5);
  const [maxVideosPerRow, setMaxVideosPerRow] = useState(20);
  const [maxTotalVideos, setMaxTotalVideos] = useState(100);
  const [revenueSharePercent, setRevenueSharePercent] = useState(70);

  // Form state - Geo restrictions
  const [allowedCountries, setAllowedCountries] = useState<string[]>([]);
  const [allowedRegions, setAllowedRegions] = useState<string[]>([]);
  const [noGeoRestrictions, setNoGeoRestrictions] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from("indie_channels")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching channels:", error);
      toast.error("Failed to load channels");
    } else {
      setChannels((data || []) as IndieChannel[]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setLogoUrl("");
    setTrailerUrl("");
    setBackdropUrl("");
    setIsActive(true);
    setCanGoLive(false);
    setCustomBrandingEnabled(false);
    setAnalyticsAccess(true);
    setAllowAds(true);
    setMaxRows(5);
    setMaxVideosPerRow(20);
    setMaxTotalVideos(100);
    setRevenueSharePercent(70);
    setAllowedCountries([]);
    setAllowedRegions([]);
    setNoGeoRestrictions(true);
    setEditingChannel(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (channel: IndieChannel) => {
    setEditingChannel(channel);
    setName(channel.name);
    setSlug(channel.slug);
    setDescription(channel.description || "");
    setLogoUrl(channel.logo_url || "");
    setTrailerUrl(channel.trailer_url || "");
    setBackdropUrl(channel.backdrop_url || "");
    setIsActive(channel.is_active);
    setCanGoLive(channel.can_go_live || false);
    setCustomBrandingEnabled(channel.custom_branding_enabled || false);
    setAnalyticsAccess(channel.analytics_access !== false);
    setAllowAds(channel.allow_ads !== false);
    setMaxRows(channel.max_rows || 5);
    setMaxVideosPerRow(channel.max_videos_per_row || 20);
    setMaxTotalVideos(channel.max_total_videos || 100);
    setRevenueSharePercent(channel.revenue_share_percent || 70);
    setAllowedCountries(channel.allowed_countries || []);
    setAllowedRegions(channel.allowed_regions || []);
    setNoGeoRestrictions((channel.allowed_countries || []).length === 0 && (channel.allowed_regions || []).length === 0);
    setIsDialogOpen(true);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingChannel) {
      setSlug(generateSlug(value));
    }
  };

  const toggleCountry = (code: string) => {
    if (allowedCountries.includes(code)) {
      setAllowedCountries(allowedCountries.filter(c => c !== code));
    } else {
      setAllowedCountries([...allowedCountries, code]);
    }
    setNoGeoRestrictions(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    const channelData = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      trailer_url: trailerUrl.trim() || null,
      backdrop_url: backdropUrl.trim() || null,
      is_active: isActive,
      can_go_live: canGoLive,
      custom_branding_enabled: customBrandingEnabled,
      analytics_access: analyticsAccess,
      allow_ads: allowAds,
      max_rows: maxRows,
      max_videos_per_row: maxVideosPerRow,
      max_total_videos: maxTotalVideos,
      revenue_share_percent: revenueSharePercent,
      allowed_countries: noGeoRestrictions ? [] : allowedCountries,
      allowed_regions: noGeoRestrictions ? [] : allowedRegions,
    };

    if (editingChannel) {
      const { error } = await supabase
        .from("indie_channels")
        .update(channelData)
        .eq("id", editingChannel.id);

      if (error) {
        console.error("Error updating channel:", error);
        toast.error("Failed to update channel");
      } else {
        toast.success("Channel updated successfully");
        fetchChannels();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("indie_channels").insert(channelData);

      if (error) {
        console.error("Error creating channel:", error);
        if (error.code === "23505") {
          toast.error("A channel with this slug already exists");
        } else {
          toast.error("Failed to create channel");
        }
      } else {
        toast.success("Channel created successfully");
        fetchChannels();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (channel: IndieChannel) => {
    if (!confirm(`Are you sure you want to delete "${channel.name}"?`)) return;

    const { error } = await supabase
      .from("indie_channels")
      .delete()
      .eq("id", channel.id);

    if (error) {
      console.error("Error deleting channel:", error);
      toast.error("Failed to delete channel");
    } else {
      toast.success("Channel deleted");
      fetchChannels();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Indie Channels</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingChannel ? "Edit Channel" : "Create New Channel"}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                  <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
                  <TabsTrigger value="geo">Geo Access</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 py-4">
                  <div>
                    <Label>Channel Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="My Indie Channel"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Slug *</Label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="my-indie-channel"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL: /indie-channel/{slug || "..."}
                    </p>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your channel..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Logo URL</Label>
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo preview" className="mt-2 h-16 w-16 object-cover rounded" />
                    )}
                  </div>

                  <div>
                    <Label>Backdrop Image URL</Label>
                    <Input
                      value={backdropUrl}
                      onChange={(e) => setBackdropUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Trailer URL</Label>
                    <Input
                      value={trailerUrl}
                      onChange={(e) => setTrailerUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </TabsContent>

                <TabsContent value="capabilities" className="space-y-6 py-4">
                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                    <div>
                      <Label className="text-base">Allow Live Streaming</Label>
                      <p className="text-sm text-muted-foreground">Enable RTMP live broadcast on this channel</p>
                    </div>
                    <Switch checked={canGoLive} onCheckedChange={setCanGoLive} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                    <div>
                      <Label className="text-base">Custom Branding</Label>
                      <p className="text-sm text-muted-foreground">Allow custom colors and styling</p>
                    </div>
                    <Switch checked={customBrandingEnabled} onCheckedChange={setCustomBrandingEnabled} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                    <div>
                      <Label className="text-base">Analytics Access</Label>
                      <p className="text-sm text-muted-foreground">Give owner access to analytics dashboard</p>
                    </div>
                    <Switch checked={analyticsAccess} onCheckedChange={setAnalyticsAccess} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                    <div>
                      <Label className="text-base">Allow Ads</Label>
                      <p className="text-sm text-muted-foreground">Show ads on this channel's content</p>
                    </div>
                    <Switch checked={allowAds} onCheckedChange={setAllowAds} />
                  </div>
                </TabsContent>

                <TabsContent value="restrictions" className="space-y-6 py-4">
                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base">Max Content Rows</Label>
                      <span className="text-sm font-medium">{maxRows}</span>
                    </div>
                    <Slider
                      value={[maxRows]}
                      onValueChange={(v) => setMaxRows(v[0])}
                      max={20}
                      min={1}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground mt-2">Maximum number of content rows on channel page</p>
                  </div>

                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base">Max Videos Per Row</Label>
                      <span className="text-sm font-medium">{maxVideosPerRow}</span>
                    </div>
                    <Slider
                      value={[maxVideosPerRow]}
                      onValueChange={(v) => setMaxVideosPerRow(v[0])}
                      max={50}
                      min={5}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground mt-2">Maximum videos displayed per content row</p>
                  </div>

                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base">Max Total Videos</Label>
                      <span className="text-sm font-medium">{maxTotalVideos}</span>
                    </div>
                    <Slider
                      value={[maxTotalVideos]}
                      onValueChange={(v) => setMaxTotalVideos(v[0])}
                      max={1000}
                      min={10}
                      step={10}
                    />
                    <p className="text-xs text-muted-foreground mt-2">Total video upload limit for this channel</p>
                  </div>

                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base">Revenue Share</Label>
                      <span className="text-sm font-medium text-primary">{revenueSharePercent}%</span>
                    </div>
                    <Slider
                      value={[revenueSharePercent]}
                      onValueChange={(v) => setRevenueSharePercent(v[0])}
                      max={100}
                      min={0}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground mt-2">Percentage of ad revenue shared with channel owner</p>
                  </div>
                </TabsContent>

                <TabsContent value="geo" className="space-y-4 py-4">
                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                    <div>
                      <Label className="text-base">No Geographic Restrictions</Label>
                      <p className="text-sm text-muted-foreground">Channel accessible worldwide</p>
                    </div>
                    <Switch 
                      checked={noGeoRestrictions} 
                      onCheckedChange={(v) => {
                        setNoGeoRestrictions(v);
                        if (v) {
                          setAllowedCountries([]);
                          setAllowedRegions([]);
                        }
                      }} 
                    />
                  </div>

                  {!noGeoRestrictions && (
                    <div className="p-4 bg-card rounded-lg border">
                      <Label className="text-base mb-4 block">Allowed Countries</Label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {allowedCountries.map(code => {
                          const country = COUNTRIES.find(c => c.code === code);
                          return (
                            <Badge key={code} variant="secondary" className="gap-1">
                              {country?.name || code}
                              <button onClick={() => toggleCountry(code)} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {COUNTRIES.map(country => (
                          <button
                            key={country.code}
                            onClick={() => toggleCountry(country.code)}
                            className={`text-left px-3 py-2 rounded text-sm transition-colors ${
                              allowedCountries.includes(country.code) 
                                ? 'bg-primary/20 text-primary border border-primary/50' 
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {country.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button onClick={handleSubmit} className="w-full mt-4">
                {editingChannel ? "Update Channel" : "Create Channel"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : channels.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No indie channels yet. Create your first one!
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {channel.logo_url ? (
                            <img
                              src={channel.logo_url}
                              alt={channel.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="text-lg font-bold text-primary">
                                {channel.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{channel.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {channel.slug}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {channel.can_go_live && (
                          <Badge variant="outline" className="text-xs">
                            <Video className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                        )}
                        {channel.analytics_access && (
                          <Badge variant="outline" className="text-xs">Analytics</Badge>
                        )}
                        {!channel.allow_ads && (
                          <Badge variant="secondary" className="text-xs">No Ads</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {channel.max_total_videos || 100} videos
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          channel.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {channel.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/indie-channel/${channel.slug}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/producer/${channel.slug}`}>
                            <Settings2 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(channel)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(channel)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIndieChannels;