import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Film, Plus, Pencil, Trash2, ArrowLeft, Loader2, PlayCircle, 
  CalendarIcon, Globe, Target, Settings, Video, Layers, Tv
} from "lucide-react";

interface Ad {
  id: string;
  name: string;
  video_url: string | null;
  vast_tag_url: string | null;
  duration_seconds: number;
  ad_type: string;
  is_active: boolean;
  status: string;
  position_pre: boolean;
  position_mid: boolean;
  position_post: boolean;
  weight: number;
  max_impressions: number | null;
  current_impressions: number;
  start_at: string | null;
  end_at: string | null;
  frequency_cap_per_user_per_day: number | null;
}

interface GlobalConfig {
  id?: string;
  preroll_pod_size: number;
  midroll_pod_size: number;
  postroll_pod_size: number;
  midroll_interval_minutes: number;
}

interface Channel {
  id: string;
  name: string;
}

interface Content {
  id: string;
  title: string;
  type: string;
}

const COUNTRIES = ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'JP', 'BR', 'MX', 'IN'];
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'];
const MEMBERSHIP_TIERS = ['free', 'standard', 'premium'];
const DEVICE_TYPES = ['mobile', 'desktop', 'tv'];

export default function AdminLiveTVAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("ads");

  // Global config state
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    preroll_pod_size: 1,
    midroll_pod_size: 1,
    postroll_pod_size: 1,
    midroll_interval_minutes: 10,
  });
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  // Basic form data
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    adType: 'video' as 'video' | 'vast',
    video_url: '',
    vast_tag_url: '',
    duration_seconds: 30,
    position_pre: true,
    position_mid: false,
    position_post: false,
    weight: 50,
    max_impressions: null as number | null,
    start_at: null as Date | null,
    end_at: null as Date | null,
    frequency_cap_per_user_per_day: null as number | null,
  });

  // Targeting data
  const [targeting, setTargeting] = useState<{
    countries: string[];
    regions: string[];
    cities: string[];
    postal_codes: string[];
    time_zones: string[];
    membership_tiers: string[];
    device_types: string[];
  }>({
    countries: [],
    regions: [],
    cities: [],
    postal_codes: [],
    time_zones: [],
    membership_tiers: [],
    device_types: [],
  });

  // Placement data
  const [placement, setPlacement] = useState<{
    type: 'global' | 'content' | 'channel';
    contentIds: string[];
    channelIds: string[];
    allChannels: boolean;
    pre_enabled: boolean;
    mid_enabled: boolean;
    post_enabled: boolean;
  }>({
    type: 'global',
    contentIds: [],
    channelIds: [],
    allChannels: false,
    pre_enabled: true,
    mid_enabled: true,
    post_enabled: true,
  });

  const fetchData = async () => {
    const [adsRes, channelsRes, contentsRes, globalRes] = await Promise.all([
      supabase.from('ads').select('*').order('name'),
      supabase.from('live_channels').select('id, name').order('name'),
      supabase.from('contents').select('id, title, type').order('title').limit(100),
      supabase.from('ad_global_config').select('*').limit(1).maybeSingle(),
    ]);

    if (adsRes.data) setAds(adsRes.data);
    if (channelsRes.data) setChannels(channelsRes.data);
    if (contentsRes.data) setContents(contentsRes.data);
    if (globalRes.data) {
      setGlobalConfig({
        id: globalRes.data.id,
        preroll_pod_size: globalRes.data.preroll_pod_size || 1,
        midroll_pod_size: globalRes.data.midroll_pod_size || 1,
        postroll_pod_size: globalRes.data.postroll_pod_size || 1,
        midroll_interval_minutes: globalRes.data.midroll_interval_minutes || 10,
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'active',
      adType: 'video',
      video_url: '',
      vast_tag_url: '',
      duration_seconds: 30,
      position_pre: true,
      position_mid: false,
      position_post: false,
      weight: 50,
      max_impressions: null,
      start_at: null,
      end_at: null,
      frequency_cap_per_user_per_day: null,
    });
    setTargeting({
      countries: [],
      regions: [],
      cities: [],
      postal_codes: [],
      time_zones: [],
      membership_tiers: [],
      device_types: [],
    });
    setPlacement({
      type: 'global',
      contentIds: [],
      channelIds: [],
      allChannels: false,
      pre_enabled: true,
      mid_enabled: true,
      post_enabled: true,
    });
    setEditingAd(null);
  };

  const handleSaveGlobalConfig = async () => {
    setIsSavingGlobal(true);
    try {
      if (globalConfig.id) {
        await supabase
          .from('ad_global_config')
          .update({
            preroll_pod_size: globalConfig.preroll_pod_size,
            midroll_pod_size: globalConfig.midroll_pod_size,
            postroll_pod_size: globalConfig.postroll_pod_size,
            midroll_interval_minutes: globalConfig.midroll_interval_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', globalConfig.id);
      } else {
        const { data } = await supabase
          .from('ad_global_config')
          .insert({
            preroll_pod_size: globalConfig.preroll_pod_size,
            midroll_pod_size: globalConfig.midroll_pod_size,
            postroll_pod_size: globalConfig.postroll_pod_size,
            midroll_interval_minutes: globalConfig.midroll_interval_minutes,
          })
          .select()
          .single();
        if (data) {
          setGlobalConfig(prev => ({ ...prev, id: data.id }));
        }
      }
      toast.success('Global settings saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save global settings');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleEdit = async (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      name: ad.name,
      status: ad.status || 'active',
      adType: ad.vast_tag_url ? 'vast' : 'video',
      video_url: ad.video_url || '',
      vast_tag_url: ad.vast_tag_url || '',
      duration_seconds: ad.duration_seconds,
      position_pre: ad.position_pre ?? true,
      position_mid: ad.position_mid ?? false,
      position_post: ad.position_post ?? false,
      weight: ad.weight ?? 50,
      max_impressions: ad.max_impressions,
      start_at: ad.start_at ? new Date(ad.start_at) : null,
      end_at: ad.end_at ? new Date(ad.end_at) : null,
      frequency_cap_per_user_per_day: ad.frequency_cap_per_user_per_day,
    });

    // Fetch targeting
    const { data: targetingData } = await supabase
      .from('ad_targeting')
      .select('*')
      .eq('ad_id', ad.id)
      .maybeSingle();

    if (targetingData) {
      setTargeting({
        countries: targetingData.countries || [],
        regions: targetingData.regions || [],
        cities: targetingData.cities || [],
        postal_codes: targetingData.postal_codes || [],
        time_zones: targetingData.time_zones || [],
        membership_tiers: targetingData.membership_tiers || [],
        device_types: targetingData.device_types || [],
      });
    }

    // Fetch placements
    const { data: placementsData } = await supabase
      .from('ad_placements')
      .select('*')
      .eq('ad_id', ad.id);

    if (placementsData && placementsData.length > 0) {
      const firstPlacement = placementsData[0];
      const hasAllChannels = placementsData.some(p => p.all_channels);
      setPlacement({
        type: firstPlacement.placement_type as 'global' | 'content' | 'channel',
        contentIds: placementsData.filter(p => p.content_id).map(p => p.content_id!),
        channelIds: placementsData.filter(p => p.channel_id).map(p => p.channel_id!),
        allChannels: hasAllChannels,
        pre_enabled: firstPlacement.pre_enabled,
        mid_enabled: firstPlacement.mid_enabled,
        post_enabled: firstPlacement.post_enabled,
      });
    }

    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Ad name is required');
      return;
    }

    if (formData.adType === 'video' && !formData.video_url) {
      toast.error('Video URL is required');
      return;
    }

    if (formData.adType === 'vast' && !formData.vast_tag_url) {
      toast.error('VAST tag URL is required');
      return;
    }

    setIsSaving(true);

    try {
      const adData = {
        name: formData.name,
        status: formData.status,
        video_url: formData.adType === 'video' ? formData.video_url : null,
        vast_tag_url: formData.adType === 'vast' ? formData.vast_tag_url : null,
        duration_seconds: formData.duration_seconds,
        ad_type: formData.position_pre ? 'preroll' : formData.position_mid ? 'midroll' : 'postroll',
        is_active: formData.status === 'active',
        position_pre: formData.position_pre,
        position_mid: formData.position_mid,
        position_post: formData.position_post,
        weight: formData.weight,
        max_impressions: formData.max_impressions,
        start_at: formData.start_at?.toISOString() || null,
        end_at: formData.end_at?.toISOString() || null,
        frequency_cap_per_user_per_day: formData.frequency_cap_per_user_per_day,
      };

      let adId: string;

      if (editingAd) {
        const { error } = await supabase
          .from('ads')
          .update(adData)
          .eq('id', editingAd.id);

        if (error) throw error;
        adId = editingAd.id;
        toast.success('Ad updated successfully');
      } else {
        const { data, error } = await supabase
          .from('ads')
          .insert(adData)
          .select()
          .single();

        if (error) throw error;
        adId = data.id;
        toast.success('Ad created successfully');
      }

      // Save targeting
      const targetingData = {
        ad_id: adId,
        countries: targeting.countries,
        regions: targeting.regions,
        cities: targeting.cities,
        postal_codes: targeting.postal_codes,
        time_zones: targeting.time_zones,
        membership_tiers: targeting.membership_tiers,
        device_types: targeting.device_types,
      };

      // Upsert targeting
      await supabase.from('ad_targeting').delete().eq('ad_id', adId);
      if (Object.values(targeting).some(arr => arr.length > 0)) {
        await supabase.from('ad_targeting').insert(targetingData);
      }

      // Save placements
      await supabase.from('ad_placements').delete().eq('ad_id', adId);

      if (placement.type === 'global') {
        await supabase.from('ad_placements').insert({
          ad_id: adId,
          placement_type: 'global',
          pre_enabled: placement.pre_enabled,
          mid_enabled: placement.mid_enabled,
          post_enabled: placement.post_enabled,
        });
      } else if (placement.type === 'content' && placement.contentIds.length > 0) {
        const contentPlacements = placement.contentIds.map(contentId => ({
          ad_id: adId,
          placement_type: 'content' as const,
          content_id: contentId,
          pre_enabled: placement.pre_enabled,
          mid_enabled: placement.mid_enabled,
          post_enabled: placement.post_enabled,
        }));
        await supabase.from('ad_placements').insert(contentPlacements);
      } else if (placement.type === 'channel') {
        if (placement.allChannels) {
          // Insert single placement with all_channels flag
          await supabase.from('ad_placements').insert({
            ad_id: adId,
            placement_type: 'channel',
            all_channels: true,
            pre_enabled: placement.pre_enabled,
            mid_enabled: placement.mid_enabled,
            post_enabled: placement.post_enabled,
          });
        } else if (placement.channelIds.length > 0) {
          const channelPlacements = placement.channelIds.map(channelId => ({
            ad_id: adId,
            placement_type: 'channel' as const,
            channel_id: channelId,
            pre_enabled: placement.pre_enabled,
            mid_enabled: placement.mid_enabled,
            post_enabled: placement.post_enabled,
          }));
          await supabase.from('ad_placements').insert(channelPlacements);
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving ad:', error);
      toast.error(error.message || 'Failed to save ad');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ad: Ad) => {
    if (!confirm(`Delete ad "${ad.name}"?`)) return;

    try {
      const { error } = await supabase.from('ads').delete().eq('id', ad.id);
      if (error) throw error;
      toast.success('Ad deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete ad');
    }
  };

  const toggleStatus = async (ad: Ad) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: newStatus, is_active: newStatus === 'active' })
        .eq('id', ad.id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ad');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      expired: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || styles.paused;
  };

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
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Film className="h-8 w-8 text-primary" />
              Ad Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage ad pods, targeting, placements, and campaigns
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Ads
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Global Settings
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Pod Config
            </TabsTrigger>
          </TabsList>

          {/* Global Settings Tab */}
          <TabsContent value="global">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Global Ad Pod Defaults
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-sm">
                  These settings apply to all content and channels unless overridden with specific configurations.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label>Pre-roll Pod Size</Label>
                    <Select
                      value={String(globalConfig.preroll_pod_size)}
                      onValueChange={(v) => setGlobalConfig(prev => ({ ...prev, preroll_pod_size: parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} ad{n > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Ads shown before content</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Mid-roll Pod Size</Label>
                    <Select
                      value={String(globalConfig.midroll_pod_size)}
                      onValueChange={(v) => setGlobalConfig(prev => ({ ...prev, midroll_pod_size: parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} ad{n > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Ads shown during content</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Post-roll Pod Size</Label>
                    <Select
                      value={String(globalConfig.postroll_pod_size)}
                      onValueChange={(v) => setGlobalConfig(prev => ({ ...prev, postroll_pod_size: parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} ad{n > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Ads shown after content</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Mid-roll Interval</Label>
                    <Select
                      value={String(globalConfig.midroll_interval_minutes)}
                      onValueChange={(v) => setGlobalConfig(prev => ({ ...prev, midroll_interval_minutes: parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {[5, 10, 15, 20, 30].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} minutes</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Time between mid-rolls</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveGlobalConfig} 
                  disabled={isSavingGlobal}
                  className="mt-4"
                >
                  {isSavingGlobal && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Global Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pod Config Tab - Per Content/Channel */}
          <TabsContent value="config">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Content & Channel Ad Config
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Override global settings for specific content or channels. These take priority over global defaults.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-muted/30 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Content Config
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Set custom pod sizes for specific movies or shows. Coming soon.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/30 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tv className="h-4 w-4" />
                        Channel Config
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Set custom pod sizes for specific live channels. Coming soon.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ad
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-card">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Film className="h-5 w-5 text-primary" />
                      {editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                    <Tabs defaultValue="basic" className="mt-4">
                      <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="basic" className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          Basic
                        </TabsTrigger>
                        <TabsTrigger value="delivery" className="flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          Delivery
                        </TabsTrigger>
                        <TabsTrigger value="targeting" className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Targeting
                        </TabsTrigger>
                        <TabsTrigger value="placement" className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          Placement
                        </TabsTrigger>
                      </TabsList>

                      {/* Basic Tab */}
                      <TabsContent value="basic" className="space-y-4">
                        <div>
                          <Label>Ad Name *</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Summer Sale 2024"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Ad Type</Label>
                            <Select
                              value={formData.adType}
                              onValueChange={(value: 'video' | 'vast') => setFormData(prev => ({ ...prev, adType: value }))}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                <SelectItem value="video">Direct Video</SelectItem>
                                <SelectItem value="vast">VAST Tag</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {formData.adType === 'video' ? (
                          <div>
                            <Label>Video URL *</Label>
                            <Input
                              value={formData.video_url}
                              onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                              placeholder="https://vimeo.com/... or direct MP4 URL"
                            />
                          </div>
                        ) : (
                          <div>
                            <Label>VAST Tag URL *</Label>
                            <Input
                              value={formData.vast_tag_url}
                              onChange={(e) => setFormData(prev => ({ ...prev, vast_tag_url: e.target.value }))}
                              placeholder="https://ad-server.com/vast?..."
                            />
                          </div>
                        )}

                        <div>
                          <Label>Duration (seconds)</Label>
                          <Input
                            type="number"
                            value={formData.duration_seconds}
                            onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 30 }))}
                            min={5}
                            max={300}
                          />
                        </div>

                        <div className="space-y-3 pt-2">
                          <Label>Ad Positions</Label>
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={formData.position_pre}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, position_pre: !!checked }))}
                              />
                              <span>Pre-roll</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={formData.position_mid}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, position_mid: !!checked }))}
                              />
                              <span>Mid-roll</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={formData.position_post}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, position_post: !!checked }))}
                              />
                              <span>Post-roll</span>
                            </label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              position_pre: true,
                              position_mid: true,
                              position_post: true,
                            }))}
                          >
                            Select All Positions
                          </Button>
                        </div>
                      </TabsContent>

                      {/* Delivery Tab */}
                      <TabsContent value="delivery" className="space-y-4">
                        <div>
                          <Label>Weight (Priority): {formData.weight}</Label>
                          <p className="text-xs text-muted-foreground mb-2">Higher weight = more likely to be shown</p>
                          <Slider
                            value={[formData.weight]}
                            onValueChange={([value]) => setFormData(prev => ({ ...prev, weight: value }))}
                            min={1}
                            max={100}
                            step={1}
                            className="py-2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Max Impressions</Label>
                            <Input
                              type="number"
                              value={formData.max_impressions ?? ''}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                max_impressions: e.target.value ? parseInt(e.target.value) : null 
                              }))}
                              placeholder="Unlimited"
                              min={1}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
                          </div>
                          <div>
                            <Label>Frequency Cap (per user/day)</Label>
                            <Input
                              type="number"
                              value={formData.frequency_cap_per_user_per_day ?? ''}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                frequency_cap_per_user_per_day: e.target.value ? parseInt(e.target.value) : null 
                              }))}
                              placeholder="Unlimited"
                              min={1}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Max times shown to same user per day</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Start Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal bg-background",
                                    !formData.start_at && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formData.start_at ? format(formData.start_at, "PPP") : "No start date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                                <Calendar
                                  mode="single"
                                  selected={formData.start_at ?? undefined}
                                  onSelect={(date) => setFormData(prev => ({ ...prev, start_at: date ?? null }))}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label>End Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal bg-background",
                                    !formData.end_at && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formData.end_at ? format(formData.end_at, "PPP") : "No end date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                                <Calendar
                                  mode="single"
                                  selected={formData.end_at ?? undefined}
                                  onSelect={(date) => setFormData(prev => ({ ...prev, end_at: date ?? null }))}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Leave dates empty for the ad to run indefinitely</p>
                      </TabsContent>

                      {/* Targeting Tab */}
                      <TabsContent value="targeting" className="space-y-4">
                        <div>
                          <Label>Membership Tiers</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {MEMBERSHIP_TIERS.map(tier => (
                              <label key={tier} className="flex items-center gap-2 cursor-pointer bg-muted/50 px-3 py-2 rounded-md">
                                <Checkbox
                                  checked={targeting.membership_tiers.includes(tier)}
                                  onCheckedChange={(checked) => {
                                    setTargeting(prev => ({
                                      ...prev,
                                      membership_tiers: checked 
                                        ? [...prev.membership_tiers, tier]
                                        : prev.membership_tiers.filter(t => t !== tier)
                                    }));
                                  }}
                                />
                                <span className="capitalize">{tier}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Leave empty to target all tiers</p>
                        </div>

                        <div>
                          <Label>Device Types</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {DEVICE_TYPES.map(device => (
                              <label key={device} className="flex items-center gap-2 cursor-pointer bg-muted/50 px-3 py-2 rounded-md">
                                <Checkbox
                                  checked={targeting.device_types.includes(device)}
                                  onCheckedChange={(checked) => {
                                    setTargeting(prev => ({
                                      ...prev,
                                      device_types: checked 
                                        ? [...prev.device_types, device]
                                        : prev.device_types.filter(d => d !== device)
                                    }));
                                  }}
                                />
                                <span className="capitalize">{device}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Leave empty to target all devices</p>
                        </div>

                        <div>
                          <Label>Countries</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {COUNTRIES.map(country => (
                              <label key={country} className="flex items-center gap-2 cursor-pointer bg-muted/50 px-3 py-2 rounded-md">
                                <Checkbox
                                  checked={targeting.countries.includes(country)}
                                  onCheckedChange={(checked) => {
                                    setTargeting(prev => ({
                                      ...prev,
                                      countries: checked 
                                        ? [...prev.countries, country]
                                        : prev.countries.filter(c => c !== country)
                                    }));
                                  }}
                                />
                                <span>{country}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Leave empty to target all countries</p>
                        </div>

                        <div>
                          <Label>Time Zones</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {TIMEZONES.map(tz => (
                              <label key={tz} className="flex items-center gap-2 cursor-pointer bg-muted/50 px-3 py-2 rounded-md text-sm">
                                <Checkbox
                                  checked={targeting.time_zones.includes(tz)}
                                  onCheckedChange={(checked) => {
                                    setTargeting(prev => ({
                                      ...prev,
                                      time_zones: checked 
                                        ? [...prev.time_zones, tz]
                                        : prev.time_zones.filter(t => t !== tz)
                                    }));
                                  }}
                                />
                                <span>{tz.split('/')[1]?.replace('_', ' ')}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Cities (comma-separated)</Label>
                            <Input
                              value={targeting.cities.join(', ')}
                              onChange={(e) => setTargeting(prev => ({ 
                                ...prev, 
                                cities: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                              }))}
                              placeholder="New York, Los Angeles, Miami"
                            />
                          </div>
                          <div>
                            <Label>Postal Codes (comma-separated)</Label>
                            <Input
                              value={targeting.postal_codes.join(', ')}
                              onChange={(e) => setTargeting(prev => ({ 
                                ...prev, 
                                postal_codes: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                              }))}
                              placeholder="10001, 90210, 33101"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Placement Tab */}
                      <TabsContent value="placement" className="space-y-4">
                        <div>
                          <Label>Placement Type</Label>
                          <Select
                            value={placement.type}
                            onValueChange={(value: 'global' | 'content' | 'channel') => setPlacement(prev => ({ ...prev, type: value, allChannels: false }))}
                          >
                            <SelectTrigger className="bg-background mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="global">Global (All Content & Channels)</SelectItem>
                              <SelectItem value="content">Specific Videos/Shows</SelectItem>
                              <SelectItem value="channel">Specific Live Channels</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {placement.type === 'channel' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                              <Checkbox
                                checked={placement.allChannels}
                                onCheckedChange={(checked) => setPlacement(prev => ({ 
                                  ...prev, 
                                  allChannels: !!checked,
                                  channelIds: checked ? [] : prev.channelIds 
                                }))}
                              />
                              <div>
                                <span className="font-medium">Apply to ALL channels</span>
                                <p className="text-xs text-muted-foreground">This ad will run on every live channel</p>
                              </div>
                            </div>
                            
                            {!placement.allChannels && (
                              <div>
                                <Label>Select Channels</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {channels.map(channel => (
                                    <label key={channel.id} className="flex items-center gap-2 cursor-pointer bg-muted/50 px-3 py-2 rounded-md">
                                      <Checkbox
                                        checked={placement.channelIds.includes(channel.id)}
                                        onCheckedChange={(checked) => {
                                          setPlacement(prev => ({
                                            ...prev,
                                            channelIds: checked 
                                              ? [...prev.channelIds, channel.id]
                                              : prev.channelIds.filter(id => id !== channel.id)
                                          }));
                                        }}
                                      />
                                      <span>{channel.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {placement.type === 'content' && (
                          <div>
                            <Label>Select Content</Label>
                            <ScrollArea className="h-48 border rounded-md mt-2 p-2">
                              <div className="space-y-1">
                                {contents.map(content => (
                                  <label key={content.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted/50 rounded">
                                    <Checkbox
                                      checked={placement.contentIds.includes(content.id)}
                                      onCheckedChange={(checked) => {
                                        setPlacement(prev => ({
                                          ...prev,
                                          contentIds: checked 
                                            ? [...prev.contentIds, content.id]
                                            : prev.contentIds.filter(id => id !== content.id)
                                        }));
                                      }}
                                    />
                                    <span className="flex-1">{content.title}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {content.type}
                                    </Badge>
                                  </label>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        <div className="pt-4 border-t">
                          <Label>Position Enable/Disable</Label>
                          <p className="text-xs text-muted-foreground mb-2">Control which positions this ad can appear in for selected placements</p>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Switch
                                checked={placement.pre_enabled}
                                onCheckedChange={(checked) => setPlacement(prev => ({ ...prev, pre_enabled: checked }))}
                              />
                              <span>Pre-roll enabled</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Switch
                                checked={placement.mid_enabled}
                                onCheckedChange={(checked) => setPlacement(prev => ({ ...prev, mid_enabled: checked }))}
                              />
                              <span>Mid-roll enabled</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Switch
                                checked={placement.post_enabled}
                                onCheckedChange={(checked) => setPlacement(prev => ({ ...prev, post_enabled: checked }))}
                              />
                              <span>Post-roll enabled</span>
                            </label>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {editingAd ? 'Update Ad' : 'Create Ad'}
                      </Button>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            {/* Ads List */}
            {ads.length === 0 ? (
              <Card className="bg-card/50 border-dashed">
                <CardContent className="py-12 text-center">
                  <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Ads Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first advertisement to start monetizing</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Ad
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.map(ad => (
                  <Card key={ad.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{ad.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {ad.duration_seconds}s • {ad.current_impressions || 0} impressions
                          </p>
                        </div>
                        <Badge className={cn("ml-2", getStatusBadge(ad.status))}>
                          {ad.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {ad.position_pre && <Badge variant="outline" className="text-xs">Pre</Badge>}
                        {ad.position_mid && <Badge variant="outline" className="text-xs">Mid</Badge>}
                        {ad.position_post && <Badge variant="outline" className="text-xs">Post</Badge>}
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ad.status === 'active'}
                          onCheckedChange={() => toggleStatus(ad)}
                        />
                        <span className="text-xs text-muted-foreground flex-1">
                          {ad.status === 'active' ? 'Running' : 'Paused'}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ad)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(ad)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}