import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BarChart3, 
  Eye, 
  Clock, 
  Users, 
  Globe, 
  MapPin, 
  Building, 
  Loader2,
  TrendingUp,
  Monitor,
  Smartphone,
  Tv,
  Radio,
  RefreshCw,
  Calendar,
  ArrowLeft,
  X
} from "lucide-react";

interface ChannelStats {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  type: 'indie' | 'live';
  totalViews: number;
  totalWatchHours: number;
  subscribers: number;
  topCountry: string;
}

interface GeoData {
  location: string;
  views: number;
  watchHours: number;
}

interface ViewerDetail {
  session_id: string;
  channel_id: string;
  channel_name: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  profile_id: string | null;
  profile_name: string | null;
  profile_color: string | null;
  device_type: string;
  geo_country: string | null;
  geo_region: string | null;
  geo_city: string | null;
  started_at: string;
  watch_duration_seconds: number;
}

interface LiveViewerStats {
  total_viewers: number;
  total_devices: Record<string, number>;
  total_countries: Record<string, number>;
  channels: Array<{
    channel_id: string;
    channel_name: string;
    channel_slug: string;
    logo_url: string | null;
    viewer_count: number;
    devices: Record<string, number>;
    countries: Record<string, number>;
    viewers: ViewerDetail[];
  }>;
  all_viewers: ViewerDetail[];
  timestamp: string;
}

interface ChannelDetailStats {
  channel: ChannelStats;
  geoByCountry: GeoData[];
  geoByRegion: GeoData[];
  geoByCity: GeoData[];
  deviceStats: { device: string; count: number }[];
  recentViews: Array<{
    watched_at: string;
    duration_seconds: number;
    geo_country: string | null;
    geo_city: string | null;
    device_type: string | null;
  }>;
}

type DateRange = 'today' | 'week' | 'month' | 'year' | 'all';

const AdminChannelAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWatchHours, setTotalWatchHours] = useState(0);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [geoByCountry, setGeoByCountry] = useState<GeoData[]>([]);
  const [geoByRegion, setGeoByRegion] = useState<GeoData[]>([]);
  const [geoByCity, setGeoByCity] = useState<GeoData[]>([]);
  const [deviceStats, setDeviceStats] = useState<{ device: string; count: number }[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  
  // Live viewer stats
  const [liveViewerStats, setLiveViewerStats] = useState<LiveViewerStats | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Selected channel for detail view
  const [selectedChannel, setSelectedChannel] = useState<ChannelDetailStats | null>(null);
  const [channelDetailLoading, setChannelDetailLoading] = useState(false);

  // Get date filter for queries
  const getDateFilter = useCallback((range: DateRange): string | null => {
    const now = new Date();
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo.toISOString();
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return yearAgo.toISOString();
      default:
        return null;
    }
  }, []);

  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'year': return 'Last Year';
      default: return 'All Time';
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchLiveViewers();
    
    // Auto-refresh live viewers every 2 minutes (120000ms)
    const interval = setInterval(() => {
      fetchLiveViewers();
    }, 120000);
    
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchLiveViewers = useCallback(async () => {
    setLiveLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-active-viewers');
      
      if (error) {
        console.error('Error fetching live viewers:', error);
      } else {
        setLiveViewerStats(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching live viewers:', error);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const fetchChannelDetails = useCallback(async (channel: ChannelStats) => {
    setChannelDetailLoading(true);
    const dateFilter = getDateFilter(dateRange);

    try {
      // Fetch views for this specific channel
      let viewsQuery = supabase.from("channel_views").select("*");
      
      if (channel.type === 'indie') {
        viewsQuery = viewsQuery.eq("indie_channel_id", channel.id);
      } else {
        viewsQuery = viewsQuery.eq("live_channel_id", channel.id);
      }
      
      if (dateFilter) {
        viewsQuery = viewsQuery.gte("watched_at", dateFilter);
      }
      
      viewsQuery = viewsQuery.order("watched_at", { ascending: false }).limit(100);
      
      const { data: views } = await viewsQuery;

      // Calculate geo stats for this channel
      const countryMap = new Map<string, { views: number; seconds: number }>();
      const regionMap = new Map<string, { views: number; seconds: number }>();
      const cityMap = new Map<string, { views: number; seconds: number }>();
      const deviceMap = new Map<string, number>();

      (views || []).forEach(v => {
        const country = v.geo_country || "Unknown";
        const region = v.geo_region || "Unknown";
        const city = v.geo_city || "Unknown";
        const device = v.device_type || "Unknown";

        const countryData = countryMap.get(country) || { views: 0, seconds: 0 };
        countryMap.set(country, { 
          views: countryData.views + 1, 
          seconds: countryData.seconds + (v.duration_seconds || 0) 
        });

        const regionData = regionMap.get(region) || { views: 0, seconds: 0 };
        regionMap.set(region, {
          views: regionData.views + 1,
          seconds: regionData.seconds + (v.duration_seconds || 0)
        });

        const cityData = cityMap.get(city) || { views: 0, seconds: 0 };
        cityMap.set(city, {
          views: cityData.views + 1,
          seconds: cityData.seconds + (v.duration_seconds || 0)
        });

        deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
      });

      const channelGeoByCountry = Array.from(countryMap.entries())
        .map(([location, data]) => ({ location, views: data.views, watchHours: Math.round(data.seconds / 3600) }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      const channelGeoByRegion = Array.from(regionMap.entries())
        .map(([location, data]) => ({ location, views: data.views, watchHours: Math.round(data.seconds / 3600) }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      const channelGeoByCity = Array.from(cityMap.entries())
        .map(([location, data]) => ({ location, views: data.views, watchHours: Math.round(data.seconds / 3600) }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      const channelDeviceStats = Array.from(deviceMap.entries())
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count);

      const recentViews = (views || []).slice(0, 20).map(v => ({
        watched_at: v.watched_at,
        duration_seconds: v.duration_seconds || 0,
        geo_country: v.geo_country,
        geo_city: v.geo_city,
        device_type: v.device_type
      }));

      setSelectedChannel({
        channel,
        geoByCountry: channelGeoByCountry,
        geoByRegion: channelGeoByRegion,
        geoByCity: channelGeoByCity,
        deviceStats: channelDeviceStats,
        recentViews
      });
    } catch (error) {
      console.error('Error fetching channel details:', error);
    } finally {
      setChannelDetailLoading(false);
    }
  }, [dateRange, getDateFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);

    const dateFilter = getDateFilter(dateRange);

    // Fetch indie channels
    const { data: indieChannels } = await supabase
      .from("indie_channels")
      .select("id, name, slug, logo_url");

    // Fetch live channels
    const { data: liveChannels } = await supabase
      .from("live_channels")
      .select("id, name, slug, logo_url");

    // Fetch channel views with date filter
    let viewsQuery = supabase.from("channel_views").select("*");
    if (dateFilter) {
      viewsQuery = viewsQuery.gte("watched_at", dateFilter);
    }
    const { data: allViews } = await viewsQuery;

    // Fetch all subscribers
    const { count: indieSubCount } = await supabase
      .from("indie_channel_favorites")
      .select("*", { count: "exact", head: true });

    // Calculate stats for each channel
    const stats: ChannelStats[] = [];

    // Process indie channels
    for (const channel of indieChannels || []) {
      const channelViews = (allViews || []).filter(v => v.indie_channel_id === channel.id);
      const { count: subs } = await supabase
        .from("indie_channel_favorites")
        .select("*", { count: "exact", head: true })
        .eq("indie_channel_id", channel.id);

      const totalSeconds = channelViews.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
      const countries = channelViews.map(v => v.geo_country).filter(Boolean);
      const topCountry = countries.length > 0 
        ? countries.sort((a, b) => 
            countries.filter(c => c === a).length - countries.filter(c => c === b).length
          ).pop() || "Unknown"
        : "Unknown";

      stats.push({
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        logo_url: channel.logo_url,
        type: 'indie',
        totalViews: channelViews.length,
        totalWatchHours: Math.round(totalSeconds / 3600),
        subscribers: subs || 0,
        topCountry
      });
    }

    // Process live channels
    for (const channel of liveChannels || []) {
      const channelViews = (allViews || []).filter(v => v.live_channel_id === channel.id);
      const totalSeconds = channelViews.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
      const countries = channelViews.map(v => v.geo_country).filter(Boolean);
      const topCountry = countries.length > 0
        ? countries.sort((a, b) =>
            countries.filter(c => c === a).length - countries.filter(c => c === b).length
          ).pop() || "Unknown"
        : "Unknown";

      // Get live channel favorites count
      const { count: liveSubs } = await supabase
        .from("live_channel_favorites")
        .select("*", { count: "exact", head: true })
        .eq("live_channel_id", channel.id);

      stats.push({
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        logo_url: channel.logo_url,
        type: 'live',
        totalViews: channelViews.length,
        totalWatchHours: Math.round(totalSeconds / 3600),
        subscribers: liveSubs || 0,
        topCountry
      });
    }

    setChannelStats(stats);

    // Calculate totals
    const views = allViews || [];
    setTotalViews(views.length);
    setTotalWatchHours(Math.round(views.reduce((s, v) => s + (v.duration_seconds || 0), 0) / 3600));
    setTotalSubscribers((indieSubCount || 0));

    // Calculate geo stats
    const countryMap = new Map<string, { views: number; seconds: number }>();
    const regionMap = new Map<string, { views: number; seconds: number }>();
    const cityMap = new Map<string, { views: number; seconds: number }>();
    const deviceMap = new Map<string, number>();

    views.forEach(v => {
      const country = v.geo_country || "Unknown";
      const region = v.geo_region || "Unknown";
      const city = v.geo_city || "Unknown";
      const device = v.device_type || "Unknown";

      const countryData = countryMap.get(country) || { views: 0, seconds: 0 };
      countryMap.set(country, { 
        views: countryData.views + 1, 
        seconds: countryData.seconds + (v.duration_seconds || 0) 
      });

      const regionData = regionMap.get(region) || { views: 0, seconds: 0 };
      regionMap.set(region, {
        views: regionData.views + 1,
        seconds: regionData.seconds + (v.duration_seconds || 0)
      });

      const cityData = cityMap.get(city) || { views: 0, seconds: 0 };
      cityMap.set(city, {
        views: cityData.views + 1,
        seconds: cityData.seconds + (v.duration_seconds || 0)
      });

      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });

    setGeoByCountry(
      Array.from(countryMap.entries())
        .map(([location, data]) => ({ location, views: data.views, watchHours: Math.round(data.seconds / 3600) }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
    );

    setGeoByRegion(
      Array.from(regionMap.entries())
        .map(([location, data]) => ({ location, views: data.views, watchHours: Math.round(data.seconds / 3600) }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
    );

    setGeoByCity(
      Array.from(cityMap.entries())
        .map(([location, data]) => ({ location, views: data.views, watchHours: Math.round(data.seconds / 3600) }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
    );

    setDeviceStats(
      Array.from(deviceMap.entries())
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count)
    );

    setLoading(false);
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />;
    if (device.toLowerCase().includes('tv')) return <Tv className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Channel Analytics</h1>
          <p className="text-muted-foreground">Monitor all channel performance and viewer insights</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-red-500/50 bg-red-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                Watching Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-500">
                  {liveViewerStats?.total_viewers || 0}
                </span>
                <span className="text-xs text-muted-foreground">live viewers</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{totalViews.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Watch Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{totalWatchHours.toLocaleString()}h</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{totalSubscribers.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{channelStats.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList>
            <TabsTrigger value="live" className="gap-2">
              <Radio className="w-4 h-4" />
              Live Now
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="geography" className="gap-2">
              <Globe className="w-4 h-4" />
              Geography
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2">
              <Monitor className="w-4 h-4" />
              Devices
            </TabsTrigger>
          </TabsList>

          {/* Live Now Tab */}
          <TabsContent value="live">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                      Real-Time Viewers
                    </CardTitle>
                    <CardDescription>
                      {lastUpdated && (
                        <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchLiveViewers}
                    disabled={liveLoading}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", liveLoading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {liveViewerStats && liveViewerStats.total_viewers > 0 ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-red-500">
                              {liveViewerStats.total_viewers}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Total Watching</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary">
                              {liveViewerStats.channels.length}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Active Channels</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary">
                              {Object.keys(liveViewerStats.total_countries).length}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Countries</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Per-Channel Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Viewers by Channel</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Channel</TableHead>
                            <TableHead className="text-center">Viewers</TableHead>
                            <TableHead>Device Breakdown</TableHead>
                            <TableHead>Top Locations</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {liveViewerStats.channels.map((channel) => (
                            <TableRow key={channel.channel_id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                                    {channel.logo_url ? (
                                      <img src={channel.logo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-sm font-bold text-muted-foreground">
                                          {channel.channel_name.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-medium">{channel.channel_name}</span>
                                    <div className="flex items-center gap-1 text-xs text-red-500">
                                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                      Live
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  <span className="text-2xl font-bold text-red-500">
                                    {channel.viewer_count}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(channel.devices).map(([device, count]) => (
                                    <span 
                                      key={device} 
                                      className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-xs"
                                    >
                                      {getDeviceIcon(device)}
                                      {count}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(channel.countries)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 3)
                                    .map(([country, count]) => (
                                      <span 
                                        key={country} 
                                        className="px-2 py-1 rounded bg-muted text-xs"
                                      >
                                        {country}: {count}
                                      </span>
                                    ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Device & Country Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Device Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(liveViewerStats.total_devices)
                              .sort(([,a], [,b]) => b - a)
                              .map(([device, count]) => (
                                <div key={device} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getDeviceIcon(device)}
                                    <span className="capitalize">{device}</span>
                                  </div>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Countries</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(liveViewerStats.total_countries)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 5)
                              .map(([country, count]) => (
                                <div key={country} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    <span>{country}</span>
                                  </div>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* All Viewers Detailed List */}
                    {liveViewerStats.all_viewers && liveViewerStats.all_viewers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">All Active Viewers</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User / Profile</TableHead>
                              <TableHead>Channel</TableHead>
                              <TableHead>Device</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Watch Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {liveViewerStats.all_viewers.map((viewer) => (
                              <TableRow key={viewer.session_id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                      style={{ backgroundColor: viewer.profile_color || '#d4af37' }}
                                    >
                                      {(viewer.profile_name?.[0] || viewer.user_email?.[0] || 'A').toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {viewer.profile_name || 'Anonymous'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {viewer.user_email || 'Guest viewer'}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    {viewer.channel_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {getDeviceIcon(viewer.device_type)}
                                    <span className="capitalize text-sm">{viewer.device_type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {[viewer.geo_city, viewer.geo_region, viewer.geo_country]
                                      .filter(Boolean)
                                      .join(', ') || 'Unknown'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {formatDuration(viewer.watch_duration_seconds)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Live Viewers</h3>
                    <p className="text-muted-foreground">
                      There are no viewers watching Live TV channels right now.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Channels Performance</CardTitle>
                    <CardDescription>View analytics for all indie and live channels</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Watch Hours</TableHead>
                      <TableHead>Subscribers</TableHead>
                      <TableHead>Top Country</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channelStats.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                              {channel.logo_url ? (
                                <img src={channel.logo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-muted-foreground">
                                    {channel.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{channel.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            channel.type === 'indie' 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {channel.type === 'indie' ? 'Indie' : 'Live TV'}
                          </span>
                        </TableCell>
                        <TableCell>{channel.totalViews.toLocaleString()}</TableCell>
                        <TableCell>{channel.totalWatchHours}h</TableCell>
                        <TableCell>{channel.subscribers.toLocaleString()}</TableCell>
                        <TableCell>{channel.topCountry}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => fetchChannelDetails(channel)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geography Tab */}
          <TabsContent value="geography">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    By Country
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {geoByCountry.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{item.location}</span>
                        <div className="text-right">
                          <span className="font-medium">{item.views}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.watchHours}h)</span>
                        </div>
                      </div>
                    ))}
                    {geoByCountry.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    By State/Region
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {geoByRegion.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{item.location}</span>
                        <div className="text-right">
                          <span className="font-medium">{item.views}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.watchHours}h)</span>
                        </div>
                      </div>
                    ))}
                    {geoByRegion.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    By City
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {geoByCity.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{item.location}</span>
                        <div className="text-right">
                          <span className="font-medium">{item.views}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.watchHours}h)</span>
                        </div>
                      </div>
                    ))}
                    {geoByCity.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Device Breakdown
                </CardTitle>
                <CardDescription>See what devices your viewers are using</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {deviceStats.map((stat) => (
                    <Card key={stat.device}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(stat.device)}
                            <span className="font-medium capitalize">{stat.device}</span>
                          </div>
                          <span className="text-2xl font-bold">{stat.count}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {deviceStats.length === 0 && (
                    <p className="text-muted-foreground col-span-4 text-center py-8">No device data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Channel Detail Modal */}
      <Dialog open={!!selectedChannel} onOpenChange={() => setSelectedChannel(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {channelDetailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedChannel ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded bg-muted overflow-hidden">
                    {selectedChannel.channel.logo_url ? (
                      <img src={selectedChannel.channel.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl font-bold text-muted-foreground">
                          {selectedChannel.channel.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedChannel.channel.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedChannel.channel.type === 'indie' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {selectedChannel.channel.type === 'indie' ? 'Indie Channel' : 'Live TV'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {getDateRangeLabel(dateRange)}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Views</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {selectedChannel.channel.totalViews.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Watch Hours</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {selectedChannel.channel.totalWatchHours}h
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Subscribers</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {selectedChannel.channel.subscribers.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Top Country</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {selectedChannel.channel.topCountry}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Geography & Devices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Top Countries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedChannel.geoByCountry.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm">{item.location}</span>
                          <span className="font-medium">{item.views}</span>
                        </div>
                      ))}
                      {selectedChannel.geoByCountry.length === 0 && (
                        <p className="text-muted-foreground text-sm">No data</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Devices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedChannel.deviceStats.map((stat) => (
                        <div key={stat.device} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(stat.device)}
                            <span className="text-sm capitalize">{stat.device}</span>
                          </div>
                          <span className="font-medium">{stat.count}</span>
                        </div>
                      ))}
                      {selectedChannel.deviceStats.length === 0 && (
                        <p className="text-muted-foreground text-sm">No data</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Cities */}
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Top Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {selectedChannel.geoByCity.slice(0, 10).map((item, i) => (
                      <div key={i} className="text-center p-2 rounded bg-muted/50">
                        <div className="font-medium">{item.views}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.location}</div>
                      </div>
                    ))}
                    {selectedChannel.geoByCity.length === 0 && (
                      <p className="text-muted-foreground text-sm col-span-5">No city data</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Views */}
              {selectedChannel.recentViews.length > 0 && (
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Recent Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Device</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedChannel.recentViews.map((view, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{formatDate(view.watched_at)}</TableCell>
                            <TableCell>{formatDuration(view.duration_seconds)}</TableCell>
                            <TableCell className="text-sm">
                              {[view.geo_city, view.geo_country].filter(Boolean).join(', ') || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getDeviceIcon(view.device_type || 'unknown')}
                                <span className="text-sm capitalize">{view.device_type || 'Unknown'}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChannelAnalytics;
