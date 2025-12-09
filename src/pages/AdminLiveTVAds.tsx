import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Film, Plus, Pencil, Trash2, ArrowLeft, Loader2, PlayCircle, 
  CalendarIcon, Globe, Target, Settings, Video, Layers, Tv,
  HelpCircle, Info, BookOpen, Zap, Users, MapPin, Clock, BarChart3,
  CheckCircle2, AlertCircle, ArrowRight
} from "lucide-react";
import { VimeoUrlInput } from "@/components/VimeoUrlInput";
import { VimeoMetadata } from "@/hooks/useVimeoMetadata";

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

interface ProgressiveMidrollConfig {
  id?: string;
  break_1_pod_size: number;
  break_2_pod_size: number;
  break_3_pod_size: number;
  break_4_pod_size: number;
}

interface Channel {
  id: string;
  name: string;
  type: 'live' | 'indie';
}

interface Content {
  id: string;
  title: string;
  type: string;
}

interface PodConfig {
  id: string;
  content_id: string | null;
  channel_id: string | null;
  preroll_pod_size: number;
  midroll_pod_size: number;
  postroll_pod_size: number;
  midroll_interval_minutes: number;
  max_midroll_count: number | null;
  enabled: boolean;
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
  const [activeMainTab, setActiveMainTab] = useState("guide");

  // Pod config states
  const [contentPodConfigs, setContentPodConfigs] = useState<PodConfig[]>([]);
  const [channelPodConfigs, setChannelPodConfigs] = useState<PodConfig[]>([]);
  const [selectedContentForConfig, setSelectedContentForConfig] = useState<string>("");
  const [selectedChannelForConfig, setSelectedChannelForConfig] = useState<string>("");
  const [newContentConfig, setNewContentConfig] = useState({ preroll: 1, midroll: 1, postroll: 1, interval: 10, midrollCount: 4 });
  const [newChannelConfig, setNewChannelConfig] = useState({ preroll: 1, midroll: 1, postroll: 1, interval: 10, midrollCount: 4 });

  // Global config state - default to 60-minute intervals for 4 mid-rolls per hour
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    preroll_pod_size: 1,
    midroll_pod_size: 1,
    postroll_pod_size: 1,
    midroll_interval_minutes: 60,
  });
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  
  // Progressive mid-roll config state
  const [progressiveMidroll, setProgressiveMidroll] = useState<ProgressiveMidrollConfig>({
    break_1_pod_size: 2,
    break_2_pod_size: 3,
    break_3_pod_size: 5,
    break_4_pod_size: 3,
  });

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

  // Targeting data - default to free and standard tiers (premium members don't see ads)
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
    membership_tiers: ['free', 'standard'], // Default: ads only for free and standard users
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
    const [adsRes, liveChannelsRes, indieChannelsRes, contentsRes, globalRes, podConfigsRes, progressiveMidrollRes] = await Promise.all([
      supabase.from('ads').select('*').order('name'),
      supabase.from('live_channels').select('id, name').order('name'),
      supabase.from('indie_channels').select('id, name').eq('is_active', true).order('name'),
      supabase.from('contents').select('id, title, type').order('title').limit(100),
      supabase.from('ad_global_config').select('*').limit(1).maybeSingle(),
      supabase.from('ad_pod_config').select('*'),
      supabase.from('ad_midroll_pod_config').select('*').eq('is_global', true).maybeSingle(),
    ]);

    if (adsRes.data) setAds(adsRes.data);
    
    // Combine live and indie channels
    const allChannels: Channel[] = [
      ...(liveChannelsRes.data || []).map(c => ({ ...c, type: 'live' as const })),
      ...(indieChannelsRes.data || []).map(c => ({ ...c, type: 'indie' as const })),
    ];
    setChannels(allChannels);
    
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
    if (progressiveMidrollRes.data) {
      setProgressiveMidroll({
        id: progressiveMidrollRes.data.id,
        break_1_pod_size: progressiveMidrollRes.data.break_1_pod_size ?? 2,
        break_2_pod_size: progressiveMidrollRes.data.break_2_pod_size ?? 3,
        break_3_pod_size: progressiveMidrollRes.data.break_3_pod_size ?? 5,
        break_4_pod_size: progressiveMidrollRes.data.break_4_pod_size ?? 3,
      });
    }
    if (podConfigsRes.data) {
      setContentPodConfigs(podConfigsRes.data.filter(c => c.content_id));
      setChannelPodConfigs(podConfigsRes.data.filter(c => c.channel_id));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save content-specific pod config
  const handleSaveContentPodConfig = async () => {
    if (!selectedContentForConfig) {
      toast.error('Please select a content item');
      return;
    }
    try {
      // Check if config already exists
      const existing = contentPodConfigs.find(c => c.content_id === selectedContentForConfig);
      if (existing) {
        await supabase.from('ad_pod_config').update({
          preroll_pod_size: newContentConfig.preroll,
          midroll_pod_size: newContentConfig.midroll,
          postroll_pod_size: newContentConfig.postroll,
          midroll_interval_minutes: newContentConfig.interval,
          max_midroll_count: newContentConfig.midrollCount,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await supabase.from('ad_pod_config').insert({
          content_id: selectedContentForConfig,
          preroll_pod_size: newContentConfig.preroll,
          midroll_pod_size: newContentConfig.midroll,
          postroll_pod_size: newContentConfig.postroll,
          midroll_interval_minutes: newContentConfig.interval,
          max_midroll_count: newContentConfig.midrollCount,
        });
      }
      toast.success('Content ad config saved');
      fetchData();
      setSelectedContentForConfig("");
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    }
  };

  // Save channel-specific pod config
  const handleSaveChannelPodConfig = async () => {
    if (!selectedChannelForConfig) {
      toast.error('Please select a channel');
      return;
    }
    try {
      const existing = channelPodConfigs.find(c => c.channel_id === selectedChannelForConfig);
      if (existing) {
        await supabase.from('ad_pod_config').update({
          preroll_pod_size: newChannelConfig.preroll,
          midroll_pod_size: newChannelConfig.midroll,
          postroll_pod_size: newChannelConfig.postroll,
          midroll_interval_minutes: newChannelConfig.interval,
          max_midroll_count: newChannelConfig.midrollCount,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await supabase.from('ad_pod_config').insert({
          channel_id: selectedChannelForConfig,
          preroll_pod_size: newChannelConfig.preroll,
          midroll_pod_size: newChannelConfig.midroll,
          postroll_pod_size: newChannelConfig.postroll,
          midroll_interval_minutes: newChannelConfig.interval,
          max_midroll_count: newChannelConfig.midrollCount,
        });
      }
      toast.success('Channel ad config saved');
      fetchData();
      setSelectedChannelForConfig("");
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    }
  };

  // Delete pod config
  const handleDeletePodConfig = async (id: string) => {
    if (!confirm('Delete this ad configuration?')) return;
    try {
      await supabase.from('ad_pod_config').delete().eq('id', id);
      toast.success('Config deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

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
      membership_tiers: ['free', 'standard'], // Default: ads only for free and standard users
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
      // Save ad_global_config
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

      // Save progressive mid-roll config
      if (progressiveMidroll.id) {
        await supabase
          .from('ad_midroll_pod_config')
          .update({
            break_1_pod_size: progressiveMidroll.break_1_pod_size,
            break_2_pod_size: progressiveMidroll.break_2_pod_size,
            break_3_pod_size: progressiveMidroll.break_3_pod_size,
            break_4_pod_size: progressiveMidroll.break_4_pod_size,
            updated_at: new Date().toISOString(),
          })
          .eq('id', progressiveMidroll.id);
      } else {
        const { data } = await supabase
          .from('ad_midroll_pod_config')
          .insert({
            is_global: true,
            break_1_pod_size: progressiveMidroll.break_1_pod_size,
            break_2_pod_size: progressiveMidroll.break_2_pod_size,
            break_3_pod_size: progressiveMidroll.break_3_pod_size,
            break_4_pod_size: progressiveMidroll.break_4_pod_size,
          })
          .select()
          .single();
        if (data) {
          setProgressiveMidroll(prev => ({ ...prev, id: data.id }));
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
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Guide
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Ads
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="content-config" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="channel-config" className="flex items-center gap-2">
              <Tv className="h-4 w-4" />
              Channels
            </TabsTrigger>
          </TabsList>

          {/* Guide Tab - Detailed Instructions */}
          <TabsContent value="guide">
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <BookOpen className="h-6 w-6 text-primary" />
                    ZoeRatedTV Ad Network Guide
                  </CardTitle>
                  <CardDescription className="text-base">
                    Complete guide to managing ads across all your content and live channels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This comprehensive ad system allows you to monetize your streaming platform with targeted advertisements. 
                    Ads can be shown before (pre-roll), during (mid-roll), and after (post-roll) content on both VOD and Live TV.
                  </p>
                </CardContent>
              </Card>

              <Accordion type="multiple" className="space-y-4" defaultValue={["quick-start", "multi-ad-setup", "overview", "ad-pods", "targeting", "placements", "examples"]}>
                
                {/* QUICK START - Most Important */}
                <AccordionItem value="quick-start" className="border-2 border-primary/50 rounded-lg px-4 bg-gradient-to-r from-primary/10 to-primary/5">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-primary" />
                      🚀 Quick Start: Set Up Multi-Ad Breaks in 5 Minutes
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-2">
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Goal: Have 3 different commercials play during each mid-roll break
                      </h4>
                      <p className="text-sm text-muted-foreground">Follow these 3 simple steps:</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">1</div>
                        <div>
                          <h5 className="font-semibold">Go to "Global" tab → Set Mid-roll Pod Size = 3</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            This tells the system: "I want 3 ads to play back-to-back for every mid-roll break"
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">2</div>
                        <div>
                          <h5 className="font-semibold">Go to "Ads" tab → Create at least 3 ads with "Mid-roll" enabled</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Paste your Vimeo URL → Duration auto-fills → Enable "Mid-roll" position → Save
                          </p>
                          <p className="text-xs text-yellow-500 mt-2">
                            ⚠️ You need at least as many ads as your pod size! If pod size is 3, create 3+ ads.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">3</div>
                        <div>
                          <h5 className="font-semibold">Done! Test by watching any content</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Every mid-roll break will now show: "AD BREAK in 10... (3 ads)" → Ad 1 → Ad 2 → Ad 3 → Resume
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h5 className="font-medium text-blue-400 mb-2">💡 Pro Tip: Want different ad counts for different channels?</h5>
                      <p className="text-sm text-muted-foreground">
                        Go to "Channels" tab → Select MadFaceTV → Set Mid-roll = 4 ads. Now MadFaceTV gets 4 ads per break while others get the global setting (3).
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* DETAILED MULTI-AD SETUP */}
                <AccordionItem value="multi-ad-setup" className="border-2 border-yellow-500/50 rounded-lg px-4 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-yellow-500" />
                      📺 Complete Guide: Multiple Ads in One Break (Step-by-Step)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-2">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-bold mb-3">Understanding the System</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Think of it like traditional TV: You don't create "1 commercial break" — you create individual commercials, 
                        then tell the system how many to play together. The system picks which ones based on targeting.
                      </p>
                      <div className="flex items-center gap-3 flex-wrap text-sm">
                        <Badge variant="outline" className="bg-background">Individual Ad</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="bg-background">Individual Ad</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="bg-background">Individual Ad</Badge>
                        <span className="text-muted-foreground">=</span>
                        <Badge className="bg-primary">Ad Pod (3 ads)</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-lg">Step-by-Step Setup</h4>
                      
                      {/* Step 1 */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-primary/10 px-4 py-2 font-semibold flex items-center gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                          Create Your Ad Inventory
                        </div>
                        <div className="p-4 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Upload each commercial as a separate ad. Each ad = 1 video file (typically 15-60 seconds).
                          </p>
                          <div className="bg-muted/30 p-3 rounded text-sm">
                            <p className="font-medium mb-2">Example: You have 10 commercials to run</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                              <li>Nike Shoes - 30 sec</li>
                              <li>Coca-Cola - 15 sec</li>
                              <li>Local Car Dealer - 30 sec</li>
                              <li>iPhone 15 - 30 sec</li>
                              <li>... (create all 10 individually)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-primary/10 px-4 py-2 font-semibold flex items-center gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                          Configure Each Ad's Eligibility
                        </div>
                        <div className="p-4 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            For each ad, decide WHERE and WHEN it can play:
                          </p>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="bg-muted/30 p-3 rounded">
                              <h6 className="font-medium mb-2">Positions (check all that apply)</h6>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li>☑️ Pre-roll (before video starts)</li>
                                <li>☑️ Mid-roll (during video)</li>
                                <li>☐ Post-roll (after video ends)</li>
                              </ul>
                            </div>
                            <div className="bg-muted/30 p-3 rounded">
                              <h6 className="font-medium mb-2">Targeting (optional)</h6>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• US viewers only</li>
                                <li>• Free tier members only</li>
                                <li>• Mobile devices only</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-primary/10 px-4 py-2 font-semibold flex items-center gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                          Set Pod Sizes (How Many Ads Per Break)
                        </div>
                        <div className="p-4 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            This is the key step! Pod size = number of ads that play together in one break.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
                              <Settings className="h-5 w-5 text-green-500" />
                              <div>
                                <span className="font-medium">Global Tab:</span>
                                <span className="text-muted-foreground ml-2">Set defaults for ALL content</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                              <Video className="h-5 w-5 text-blue-500" />
                              <div>
                                <span className="font-medium">Content Tab:</span>
                                <span className="text-muted-foreground ml-2">Override for specific movies/shows</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                              <Tv className="h-5 w-5 text-purple-500" />
                              <div>
                                <span className="font-medium">Channels Tab:</span>
                                <span className="text-muted-foreground ml-2">Override for specific live channels</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-primary/10 px-4 py-2 font-semibold flex items-center gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                          How the System Selects Ads (Automatic)
                        </div>
                        <div className="p-4 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            When a mid-roll break triggers, here's what happens:
                          </p>
                          <div className="bg-muted/30 p-4 rounded font-mono text-sm space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-primary">→</span>
                              <span>User watching MadFaceTV at 8:15 PM</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-primary">→</span>
                              <span>10-min interval reached → Mid-roll triggers</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-primary">→</span>
                              <span>System checks: Pod size for MadFaceTV = 3</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-primary">→</span>
                              <span>System finds all ads where:</span>
                            </div>
                            <div className="pl-6 text-muted-foreground">
                              • Mid-roll = enabled<br/>
                              • Targets MadFaceTV OR all channels<br/>
                              • User location matches targeting<br/>
                              • Under impression cap
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-primary">→</span>
                              <span>Picks 3 ads using weighted random selection</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="text-green-500">Plays: Ad 1 → Ad 2 → Ad 3 → Resume show</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Common Scenarios */}
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-bold mb-4">Common Scenarios</h4>
                      <div className="space-y-4">
                        <div className="p-3 border border-border rounded">
                          <h5 className="font-medium text-sm">Scenario: "I want MadFaceTV to have MORE ads than other channels"</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            1. Set Global mid-roll = 2 ads<br/>
                            2. Go to Channels tab → Select MadFaceTV → Set mid-roll = 4 ads<br/>
                            Result: MadFaceTV gets 4 ads per break, all other channels get 2
                          </p>
                        </div>
                        <div className="p-3 border border-border rounded">
                          <h5 className="font-medium text-sm">Scenario: "Show Nike ad ONLY to US mobile users"</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            1. Create Nike ad<br/>
                            2. In Targeting tab: Select Countries = US, Device Types = Mobile<br/>
                            Result: Nike ad only appears for US viewers on phones
                          </p>
                        </div>
                        <div className="p-3 border border-border rounded">
                          <h5 className="font-medium text-sm">Scenario: "Premium members should see fewer ads"</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Create ads targeting ONLY "free" and "standard" tiers. Premium users won't see those ads.
                            Or: Set global pod size = 1 for premium content.
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Overview */}
                <AccordionItem value="overview" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <Info className="h-5 w-5 text-primary" />
                      System Overview
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Key Features
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Pre-roll, Mid-roll, and Post-roll ad positions</li>
                          <li>Ad pods (multiple ads per break)</li>
                          <li>10-second countdown before ad breaks</li>
                          <li>Geo-targeting by country, region, city, postal code</li>
                          <li>Device targeting (mobile, desktop, TV)</li>
                          <li>Membership tier targeting</li>
                          <li>Weight-based rotation for ad selection</li>
                          <li>Impression caps and frequency caps</li>
                          <li>Flight dates (start/end scheduling)</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <PlayCircle className="h-4 w-4 text-green-500" />
                          Supported Content Types
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li><strong>Movies:</strong> Single video with pre/mid/post ads</li>
                          <li><strong>TV Shows:</strong> Each episode has its own ad breaks</li>
                          <li><strong>Live TV:</strong> Scheduled ad breaks on all channels</li>
                          <li><strong>VOD:</strong> On-demand content with configurable breaks</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Ad Pods */}
                <AccordionItem value="ad-pods" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-primary" />
                      Ad Pods Explained
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <p className="text-muted-foreground">
                      Ad pods allow you to show multiple ads back-to-back in a single break. This mimics traditional TV commercial breaks.
                    </p>
                    
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <h4 className="font-medium mb-3">How Ad Pods Work:</h4>
                      <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                        <li>When a break is triggered, a 10-second countdown appears: <span className="text-primary">"AD BREAK in 10... (3 ads)"</span></li>
                        <li>The system selects multiple ads based on targeting and weight</li>
                        <li>Ads play back-to-back with indicator: <span className="text-primary">"Ad 1 of 3 — Your show will resume shortly"</span></li>
                        <li>After the last ad, content automatically resumes</li>
                      </ol>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary mb-1">Pre-roll</div>
                        <p className="text-sm text-muted-foreground">Ads shown BEFORE content starts playing</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-500 mb-1">Mid-roll</div>
                        <p className="text-sm text-muted-foreground">Ads shown DURING content at intervals</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-500 mb-1">Post-roll</div>
                        <p className="text-sm text-muted-foreground">Ads shown AFTER content ends</p>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">Pod Size Configuration:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li><strong>Global Settings:</strong> Default pod sizes for all content (see "Global" tab)</li>
                        <li><strong>Per-Content Override:</strong> Custom pod sizes for specific movies/shows (see "Content" tab)</li>
                        <li><strong>Per-Channel Override:</strong> Custom pod sizes for specific live channels (see "Channels" tab)</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Targeting */}
                <AccordionItem value="targeting" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-primary" />
                      Targeting Options
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          Geographic Targeting
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li><strong>Countries:</strong> US, CA, UK, AU, etc.</li>
                          <li><strong>Regions:</strong> States or provinces</li>
                          <li><strong>Cities:</strong> New York, Los Angeles, etc.</li>
                          <li><strong>Postal Codes:</strong> Zip codes for hyper-local targeting</li>
                          <li><strong>Time Zones:</strong> Show ads during specific hours</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Leave empty to target all locations
                        </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          Audience Targeting
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li><strong>Membership Tiers:</strong> Free, Standard, Premium</li>
                          <li><strong>Device Types:</strong> Mobile, Desktop, Smart TV</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Example: Show premium ads only to free users to encourage upgrades
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        Delivery Controls
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li><strong>Weight (1-100):</strong> Higher weight = more likely to be shown</li>
                        <li><strong>Max Impressions:</strong> Ad automatically pauses after reaching limit</li>
                        <li><strong>Frequency Cap:</strong> Limit how many times one user sees the ad per day</li>
                        <li><strong>Flight Dates:</strong> Schedule ads to run only during specific periods</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Placements */}
                <AccordionItem value="placements" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-primary" />
                      Placement Types
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <h4 className="font-medium text-green-400 mb-2">Global Placement</h4>
                        <p className="text-sm text-muted-foreground">
                          Ad runs everywhere — all movies, shows, episodes, and live channels.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Best for: Brand awareness campaigns
                        </p>
                      </div>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="font-medium text-blue-400 mb-2">Content-Specific</h4>
                        <p className="text-sm text-muted-foreground">
                          Ad runs only on selected movies or TV shows.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Best for: Targeted product placement
                        </p>
                      </div>
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <h4 className="font-medium text-purple-400 mb-2">Channel-Specific</h4>
                        <p className="text-sm text-muted-foreground">
                          Ad runs only on selected live channels (MadFaceTV, MyPureTV, etc.)
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Use "Apply to ALL channels" for full live TV coverage
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Examples */}
                <AccordionItem value="examples" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Example Configurations
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium text-primary mb-2">Example 1: National Brand Campaign</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li><strong>Placement:</strong> Global</li>
                          <li><strong>Positions:</strong> Pre-roll + Mid-roll</li>
                          <li><strong>Weight:</strong> 80 (high priority)</li>
                          <li><strong>Targeting:</strong> US only, all membership tiers</li>
                          <li><strong>Max Impressions:</strong> 100,000</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium text-primary mb-2">Example 2: Local Business Ad</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li><strong>Placement:</strong> Channel-specific (MadFaceTV only)</li>
                          <li><strong>Positions:</strong> Mid-roll only</li>
                          <li><strong>Weight:</strong> 50 (normal)</li>
                          <li><strong>Targeting:</strong> Cities: New York, Brooklyn; Postal: 10001, 10002</li>
                          <li><strong>Frequency Cap:</strong> 3 per user per day</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium text-primary mb-2">Example 3: Free Tier Upgrade Promo</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li><strong>Placement:</strong> Global</li>
                          <li><strong>Positions:</strong> All (Pre, Mid, Post)</li>
                          <li><strong>Weight:</strong> 100 (highest priority)</li>
                          <li><strong>Targeting:</strong> Membership Tier: Free only</li>
                          <li><strong>Flight Dates:</strong> Holiday sale period only</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

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
                
                {/* Pre-roll, Post-roll, Interval Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {/* Progressive Mid-roll Pod Sizes Section */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Progressive Mid-roll Pod Sizes</h4>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Configure how many ads play for each mid-roll break in a viewing session. 
                    The 4th break setting is used for all breaks 4 and beyond.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>1st Mid-roll Break</Label>
                      <Select
                        value={String(progressiveMidroll.break_1_pod_size)}
                        onValueChange={(v) => setProgressiveMidroll(prev => ({ ...prev, break_1_pod_size: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} ad{n > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>2nd Mid-roll Break</Label>
                      <Select
                        value={String(progressiveMidroll.break_2_pod_size)}
                        onValueChange={(v) => setProgressiveMidroll(prev => ({ ...prev, break_2_pod_size: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} ad{n > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>3rd Mid-roll Break</Label>
                      <Select
                        value={String(progressiveMidroll.break_3_pod_size)}
                        onValueChange={(v) => setProgressiveMidroll(prev => ({ ...prev, break_3_pod_size: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} ad{n > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>4th+ Mid-roll Break</Label>
                      <Select
                        value={String(progressiveMidroll.break_4_pod_size)}
                        onValueChange={(v) => setProgressiveMidroll(prev => ({ ...prev, break_4_pod_size: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} ad{n > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Used for breaks 4, 5, 6...</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Example:</strong> With settings 2, 3, 5, 3 — First break shows 2 ads, second break shows 3 ads, 
                      third break shows 5 ads, and all subsequent breaks show 3 ads.
                    </p>
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

          {/* Content-Specific Pod Config Tab */}
          <TabsContent value="content-config">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Per-Content Ad Pod Configuration
                </CardTitle>
                <CardDescription>
                  Override global ad settings for specific movies or TV shows. These settings take priority over global defaults.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Content Config */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-medium mb-4">Add Content-Specific Config</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                      <Label>Select Content</Label>
                      <Select value={selectedContentForConfig} onValueChange={setSelectedContentForConfig}>
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue placeholder="Choose a movie or show..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover max-h-60">
                          {contents.map(content => (
                            <SelectItem key={content.id} value={content.id}>
                              {content.title} ({content.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pre-roll</Label>
                      <Select 
                        value={String(newContentConfig.preroll)} 
                        onValueChange={(v) => setNewContentConfig(prev => ({ ...prev, preroll: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[0, 1, 2, 3, 4, 5].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} ad{n !== 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Mid-rolls</Label>
                      <Select 
                        value={String(newContentConfig.midrollCount)} 
                        onValueChange={(v) => setNewContentConfig(prev => ({ ...prev, midrollCount: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[1, 2, 3, 4].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} break{n !== 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Post-roll</Label>
                      <Select 
                        value={String(newContentConfig.postroll)} 
                        onValueChange={(v) => setNewContentConfig(prev => ({ ...prev, postroll: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[0, 1, 2, 3, 4, 5].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} ad{n !== 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-end gap-4 mt-4">
                    <div className="flex-1">
                      <Label>Mid-roll Interval</Label>
                      <Select 
                        value={String(newContentConfig.interval)} 
                        onValueChange={(v) => setNewContentConfig(prev => ({ ...prev, interval: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[5, 10, 15, 20, 30].map(n => (
                            <SelectItem key={n} value={String(n)}>Every {n} minutes</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSaveContentPodConfig} disabled={!selectedContentForConfig}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Config
                    </Button>
                  </div>
                </div>

                {/* Existing Content Configs */}
                {contentPodConfigs.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium">Active Content Configurations</h4>
                    <div className="grid gap-3">
                      {contentPodConfigs.map(config => {
                        const content = contents.find(c => c.id === config.content_id);
                        return (
                          <div key={config.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex-1">
                              <h5 className="font-medium">{content?.title || 'Unknown Content'}</h5>
                              <p className="text-sm text-muted-foreground">
                                Pre: {config.preroll_pod_size} ads • Mid-rolls: {config.max_midroll_count ?? 4} breaks • Post: {config.postroll_pod_size} ads • Interval: {config.midroll_interval_minutes}min
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletePodConfig(config.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No content-specific configurations yet.</p>
                    <p className="text-sm">All content will use global settings.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channel-Specific Pod Config Tab */}
          <TabsContent value="channel-config">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-primary" />
                  Per-Channel Ad Pod Configuration
                </CardTitle>
                <CardDescription>
                  Override global ad settings for specific live channels like MadFaceTV or MyPureTV. These settings take priority over global defaults.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Channel Config */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-medium mb-4">Add Channel-Specific Config</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                      <Label>Select Channel</Label>
                      <Select value={selectedChannelForConfig} onValueChange={setSelectedChannelForConfig}>
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue placeholder="Choose a live channel..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {channels.map(channel => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pre-roll</Label>
                      <Select 
                        value={String(newChannelConfig.preroll)} 
                        onValueChange={(v) => setNewChannelConfig(prev => ({ ...prev, preroll: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[0, 1, 2, 3, 4, 5].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} ad{n !== 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Mid-rolls</Label>
                      <Select 
                        value={String(newChannelConfig.midrollCount)} 
                        onValueChange={(v) => setNewChannelConfig(prev => ({ ...prev, midrollCount: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[1, 2, 3, 4].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} break{n !== 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Post-roll</Label>
                      <Select 
                        value={String(newChannelConfig.postroll)} 
                        onValueChange={(v) => setNewChannelConfig(prev => ({ ...prev, postroll: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[0, 1, 2, 3, 4, 5].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} ad{n !== 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-end gap-4 mt-4">
                    <div className="flex-1">
                      <Label>Mid-roll Interval</Label>
                      <Select 
                        value={String(newChannelConfig.interval)} 
                        onValueChange={(v) => setNewChannelConfig(prev => ({ ...prev, interval: parseInt(v) }))}
                      >
                        <SelectTrigger className="bg-background mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {[5, 10, 15, 20, 30].map(n => (
                            <SelectItem key={n} value={String(n)}>Every {n} minutes</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSaveChannelPodConfig} disabled={!selectedChannelForConfig}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Config
                    </Button>
                  </div>
                </div>

                {/* Existing Channel Configs */}
                {channelPodConfigs.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium">Active Channel Configurations</h4>
                    <div className="grid gap-3">
                      {channelPodConfigs.map(config => {
                        const channel = channels.find(c => c.id === config.channel_id);
                        return (
                          <div key={config.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex-1">
                              <h5 className="font-medium">{channel?.name || 'Unknown Channel'}</h5>
                              <p className="text-sm text-muted-foreground">
                                Pre: {config.preroll_pod_size} ads • Mid-rolls: {config.max_midroll_count ?? 4} breaks • Post: {config.postroll_pod_size} ads • Interval: {config.midroll_interval_minutes}min
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletePodConfig(config.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No channel-specific configurations yet.</p>
                    <p className="text-sm">All live channels will use global settings.</p>
                  </div>
                )}
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
                            <Label>Video URL * (paste Vimeo URL for auto-metadata)</Label>
                            <VimeoUrlInput
                              value={formData.video_url}
                              onChange={(value) => setFormData(prev => ({ ...prev, video_url: value }))}
                              onMetadataFetched={(metadata: VimeoMetadata) => {
                                // Auto-fill duration from metadata
                                if (metadata.duration_seconds) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    duration_seconds: metadata.duration_seconds || prev.duration_seconds,
                                    // Auto-fill name if empty
                                    name: prev.name || metadata.title || prev.name
                                  }));
                                }
                              }}
                              placeholder="https://vimeo.com/... (auto-fetches duration & thumbnail)"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Paste a Vimeo URL to automatically fetch duration and thumbnail preview
                            </p>
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
                          <Label>Duration (seconds) {formData.adType === 'video' && <span className="text-muted-foreground text-xs">(auto-filled from video)</span>}</Label>
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
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium text-primary">Live TV Channels</Label>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    {channels.filter(c => c.type === 'live').map(channel => (
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
                                
                                <div>
                                  <Label className="text-sm font-medium text-purple-400">Indie Channels</Label>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    {channels.filter(c => c.type === 'indie').map(channel => (
                                      <label key={channel.id} className="flex items-center gap-2 cursor-pointer bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-md">
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
                                    {channels.filter(c => c.type === 'indie').length === 0 && (
                                      <p className="text-sm text-muted-foreground col-span-2">No indie channels available</p>
                                    )}
                                  </div>
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