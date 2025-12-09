import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  CalendarIcon, Globe, Target, BarChart3, Settings, Video
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

interface AdTargeting {
  id?: string;
  ad_id: string;
  countries: string[];
  regions: string[];
  cities: string[];
  postal_codes: string[];
  time_zones: string[];
  membership_tiers: string[];
  device_types: string[];
}

interface AdPlacement {
  id?: string;
  ad_id: string;
  placement_type: 'global' | 'content' | 'channel';
  content_id: string | null;
  channel_id: string | null;
  pre_enabled: boolean;
  mid_enabled: boolean;
  post_enabled: boolean;
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
    pre_enabled: boolean;
    mid_enabled: boolean;
    post_enabled: boolean;
  }>({
    type: 'global',
    contentIds: [],
    channelIds: [],
    pre_enabled: true,
    mid_enabled: true,
    post_enabled: true,
  });

  const fetchData = async () => {
    const [adsRes, channelsRes, contentsRes] = await Promise.all([
      supabase.from('ads').select('*').order('name'),
      supabase.from('live_channels').select('id, name').order('name'),
      supabase.from('contents').select('id, title, type').order('title').limit(100),
    ]);

    if (adsRes.data) setAds(adsRes.data);
    if (channelsRes.data) setChannels(channelsRes.data);
    if (contentsRes.data) setContents(contentsRes.data);
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
      pre_enabled: true,
      mid_enabled: true,
      post_enabled: true,
    });
    setEditingAd(null);
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
      setPlacement({
        type: firstPlacement.placement_type as 'global' | 'content' | 'channel',
        contentIds: placementsData.filter(p => p.content_id).map(p => p.content_id!),
        channelIds: placementsData.filter(p => p.channel_id).map(p => p.channel_id!),
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
      } else if (placement.type === 'channel' && placement.channelIds.length > 0) {
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
          <Link to="/admin/livetv">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Film className="h-8 w-8 text-primary" />
              Ad Network
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage targeted advertisements with geo-targeting, frequency caps, and placements
            </p>
          </div>
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
                        onValueChange={(value: 'global' | 'content' | 'channel') => setPlacement(prev => ({ ...prev, type: value }))}
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

                    {placement.type === 'content' && (
                      <div>
                        <Label>Select Content</Label>
                        <ScrollArea className="h-48 mt-2 border border-border rounded-md p-2">
                          <div className="space-y-2">
                            {contents.map(content => (
                              <label key={content.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
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
                                <span className="text-sm">{content.title}</span>
                                <Badge variant="outline" className="ml-auto text-xs">{content.type}</Badge>
                              </label>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    <div className="space-y-3 pt-2">
                      <Label>Position Overrides for this Placement</Label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={placement.pre_enabled}
                            onCheckedChange={(checked) => setPlacement(prev => ({ ...prev, pre_enabled: !!checked }))}
                          />
                          <span>Pre-roll</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={placement.mid_enabled}
                            onCheckedChange={(checked) => setPlacement(prev => ({ ...prev, mid_enabled: !!checked }))}
                          />
                          <span>Mid-roll</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={placement.post_enabled}
                            onCheckedChange={(checked) => setPlacement(prev => ({ ...prev, post_enabled: !!checked }))}
                          />
                          <span>Post-roll</span>
                        </label>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={handleSave} className="w-full mt-6" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAd ? 'Update Ad' : 'Create Ad'}
                </Button>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {ads.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Ads Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first targeted advertisement
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ad
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <Card key={ad.id} className="overflow-hidden">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{ad.name}</h3>
                          <Badge className={cn("text-xs", getStatusBadge(ad.status || 'paused'))}>
                            {ad.status || 'paused'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {ad.position_pre && <Badge variant="outline" className="text-xs">Pre</Badge>}
                          {ad.position_mid && <Badge variant="outline" className="text-xs">Mid</Badge>}
                          {ad.position_post && <Badge variant="outline" className="text-xs">Post</Badge>}
                          <span className="text-xs text-muted-foreground">
                            {ad.duration_seconds}s
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BarChart3 className="h-3 w-3" />
                        <span>{ad.current_impressions || 0}{ad.max_impressions ? `/${ad.max_impressions}` : ''} impr.</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>Weight: {ad.weight || 1}</span>
                      </div>
                    </div>

                    {(ad.start_at || ad.end_at) && (
                      <div className="text-xs text-muted-foreground">
                        {ad.start_at && <span>From: {format(new Date(ad.start_at), "MMM d, yyyy")}</span>}
                        {ad.start_at && ad.end_at && <span> → </span>}
                        {ad.end_at && <span>To: {format(new Date(ad.end_at), "MMM d, yyyy")}</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(ad)}
                        title={ad.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        <PlayCircle className={`h-4 w-4 ${ad.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(ad)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ad)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
