import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
  Play,
  Activity,
  Film,
  Video
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

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

// Chart colors
const CHART_COLORS = {
  primary: 'hsl(43, 74%, 53%)',
  secondary: 'hsl(255, 70%, 60%)',
  blue: 'hsl(210, 100%, 60%)',
  green: 'hsl(142, 70%, 45%)',
  orange: 'hsl(25, 95%, 53%)',
  pink: 'hsl(340, 80%, 60%)',
  cyan: 'hsl(180, 70%, 50%)'
};

const DEVICE_COLORS = [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.pink];

// Country code to flag emoji helper
const getCountryFlag = (countryCode: string | null): string => {
  if (!countryCode) return '🌍';
  const code = countryCode.toUpperCase().trim();
  
  // Handle full country names by mapping to codes
  const countryNameToCode: Record<string, string> = {
    'UNITED STATES': 'US', 'USA': 'US', 'AMERICA': 'US',
    'UNITED KINGDOM': 'GB', 'UK': 'GB', 'GREAT BRITAIN': 'GB', 'ENGLAND': 'GB',
    'CANADA': 'CA', 'GERMANY': 'DE', 'FRANCE': 'FR', 'JAPAN': 'JP',
    'CHINA': 'CN', 'INDIA': 'IN', 'BRAZIL': 'BR', 'AUSTRALIA': 'AU',
    'MEXICO': 'MX', 'SPAIN': 'ES', 'ITALY': 'IT', 'NETHERLANDS': 'NL',
    'RUSSIA': 'RU', 'SOUTH KOREA': 'KR', 'KOREA': 'KR', 'JAMAICA': 'JM',
    'NIGERIA': 'NG', 'SOUTH AFRICA': 'ZA', 'KENYA': 'KE', 'GHANA': 'GH',
    'EGYPT': 'EG', 'MOROCCO': 'MA', 'UNKNOWN': '🌍'
  };
  
  const mappedCode = countryNameToCode[code] || code;
  
  // If it's not a 2-letter code after mapping, return globe
  if (mappedCode.length !== 2) return '🌍';
  
  // Convert 2-letter country code to flag emoji
  const codePoints = mappedCode
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌍';
  }
};

// Country code to full name helper
const getCountryName = (code: string | null): string => {
  if (!code) return 'Unknown';
  const codeToName: Record<string, string> = {
    'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada',
    'DE': 'Germany', 'FR': 'France', 'JP': 'Japan', 'CN': 'China',
    'IN': 'India', 'BR': 'Brazil', 'AU': 'Australia', 'MX': 'Mexico',
    'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands', 'RU': 'Russia',
    'KR': 'South Korea', 'JM': 'Jamaica', 'NG': 'Nigeria', 'ZA': 'South Africa',
    'KE': 'Kenya', 'GH': 'Ghana', 'EG': 'Egypt', 'MA': 'Morocco'
  };
  return codeToName[code.toUpperCase()] || code;
};

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
  const [viewsOverTime, setViewsOverTime] = useState<{ date: string; views: number; hours: number }[]>([]);
  
  // Breakdown stats by content type
  const [liveTvHours, setLiveTvHours] = useState(0);
  const [liveTvViews, setLiveTvViews] = useState(0);
  const [vodHours, setVodHours] = useState(0);
  const [vodViews, setVodViews] = useState(0);
  const [indieHours, setIndieHours] = useState(0);
  const [indieViews, setIndieViews] = useState(0);
  
  // Live viewer stats
  const [liveViewerStats, setLiveViewerStats] = useState<LiveViewerStats | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Selected channel for detail view
  const [selectedChannel, setSelectedChannel] = useState<ChannelDetailStats | null>(null);
  const [channelDetailLoading, setChannelDetailLoading] = useState(false);
  
  // Top channels sort option
  const [topChannelsSortBy, setTopChannelsSortBy] = useState<'views' | 'followers' | 'hours'>('views');

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

    const { data: indieChannels } = await supabase
      .from("indie_channels")
      .select("id, name, slug, logo_url");

    const { data: liveChannels } = await supabase
      .from("live_channels")
      .select("id, name, slug, logo_url");

    let viewsQuery = supabase.from("channel_views").select("*");
    if (dateFilter) {
      viewsQuery = viewsQuery.gte("watched_at", dateFilter);
    }
    const { data: allViews } = await viewsQuery;

    const { count: indieSubCount } = await supabase
      .from("indie_channel_favorites")
      .select("*", { count: "exact", head: true });

    const stats: ChannelStats[] = [];

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

    for (const channel of liveChannels || []) {
      const channelViews = (allViews || []).filter(v => v.live_channel_id === channel.id);
      const totalSeconds = channelViews.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
      const countries = channelViews.map(v => v.geo_country).filter(Boolean);
      const topCountry = countries.length > 0
        ? countries.sort((a, b) =>
            countries.filter(c => c === a).length - countries.filter(c => c === b).length
          ).pop() || "Unknown"
        : "Unknown";

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

    const views = allViews || [];
    
    // Calculate breakdown by content type
    const liveViews = views.filter(v => v.live_channel_id !== null);
    const indieViews = views.filter(v => v.indie_channel_id !== null);
    const vodContentViews = views.filter(v => v.content_id !== null && v.live_channel_id === null && v.indie_channel_id === null);
    
    const liveTvTotalSeconds = liveViews.reduce((s, v) => s + (v.duration_seconds || 0), 0);
    const indieTotalSeconds = indieViews.reduce((s, v) => s + (v.duration_seconds || 0), 0);
    const vodTotalSeconds = vodContentViews.reduce((s, v) => s + (v.duration_seconds || 0), 0);
    
    setLiveTvViews(liveViews.length);
    setLiveTvHours(Math.round(liveTvTotalSeconds / 3600 * 10) / 10);
    setIndieViews(indieViews.length);
    setIndieHours(Math.round(indieTotalSeconds / 3600 * 10) / 10);
    setVodViews(vodContentViews.length);
    setVodHours(Math.round(vodTotalSeconds / 3600 * 10) / 10);
    
    // Total across all content types
    const totalSeconds = liveTvTotalSeconds + indieTotalSeconds + vodTotalSeconds;
    setTotalViews(views.length);
    setTotalWatchHours(Math.round(totalSeconds / 3600 * 10) / 10);
    setTotalSubscribers((indieSubCount || 0));

    // Calculate views over time - respecting the date range filter
    const viewsByDate = new Map<string, { views: number; seconds: number }>();
    const now = new Date();
    
    if (dateRange === 'today') {
      // Group by hour for today
      views.forEach(v => {
        const viewDate = new Date(v.watched_at);
        const hour = viewDate.getHours();
        const key = `${hour}:00`;
        const existing = viewsByDate.get(key) || { views: 0, seconds: 0 };
        viewsByDate.set(key, {
          views: existing.views + 1,
          seconds: existing.seconds + (v.duration_seconds || 0)
        });
      });
      
      // Fill in all 24 hours
      const sortedHours = [];
      for (let i = 0; i <= now.getHours(); i++) {
        const key = `${i}:00`;
        const data = viewsByDate.get(key) || { views: 0, seconds: 0 };
        sortedHours.push({
          date: key,
          views: data.views,
          hours: Math.round(data.seconds / 3600)
        });
      }
      setViewsOverTime(sortedHours);
    } else {
      // Group by date for other ranges
      views.forEach(v => {
        const date = new Date(v.watched_at).toLocaleDateString();
        const existing = viewsByDate.get(date) || { views: 0, seconds: 0 };
        viewsByDate.set(date, {
          views: existing.views + 1,
          seconds: existing.seconds + (v.duration_seconds || 0)
        });
      });
      
      // Determine how many days to show
      let daysToShow = 14;
      if (dateRange === 'week') daysToShow = 7;
      else if (dateRange === 'month') daysToShow = 30;
      else if (dateRange === 'year') daysToShow = 12; // Show monthly for year
      
      if (dateRange === 'year') {
        // Aggregate by month for yearly view
        const viewsByMonth = new Map<string, { views: number; seconds: number }>();
        views.forEach(v => {
          const viewDate = new Date(v.watched_at);
          const monthKey = viewDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const existing = viewsByMonth.get(monthKey) || { views: 0, seconds: 0 };
          viewsByMonth.set(monthKey, {
            views: existing.views + 1,
            seconds: existing.seconds + (v.duration_seconds || 0)
          });
        });
        
        const sortedMonths = Array.from(viewsByMonth.entries())
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
          .slice(-12)
          .map(([date, data]) => ({
            date,
            views: data.views,
            hours: Math.round(data.seconds / 3600)
          }));
        setViewsOverTime(sortedMonths);
      } else {
        const sortedDates = Array.from(viewsByDate.entries())
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
          .slice(-daysToShow)
          .map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: data.views,
            hours: Math.round(data.seconds / 3600)
          }));
        setViewsOverTime(sortedDates);
      }
    }

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

  // Prepare chart data
  const deviceChartData = useMemo(() => {
    const total = deviceStats.reduce((sum, d) => sum + d.count, 0);
    return deviceStats.map((d, i) => ({
      name: d.device,
      value: d.count,
      percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
      color: DEVICE_COLORS[i % DEVICE_COLORS.length]
    }));
  }, [deviceStats]);

  const geoChartData = useMemo(() => {
    const maxViews = geoByCountry[0]?.views || 1;
    return geoByCountry.slice(0, 6).map((g, i) => ({
      name: g.location,
      views: g.views,
      hours: g.watchHours,
      percentage: Math.round((g.views / maxViews) * 100)
    }));
  }, [geoByCountry]);

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Channel Analytics</h1>
            <p className="text-muted-foreground">Monitor performance and viewer insights</p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Gradient Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Live Viewers Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-rose-600">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
              <Radio className="w-full h-full" />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-5 h-5 text-white/80 animate-pulse" />
                <span className="text-sm font-medium text-white/80">Live Now</span>
              </div>
              <div className="text-4xl font-bold text-white">
                {liveViewerStats?.total_viewers || 0}
              </div>
              <p className="text-sm text-white/70 mt-1">viewers watching</p>
            </CardContent>
          </Card>

          {/* Total Views Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-cyan-500">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
              <Eye className="w-full h-full" />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-white/80" />
                <span className="text-sm font-medium text-white/80">Total Views</span>
              </div>
              <div className="text-4xl font-bold text-white">
                {totalViews.toLocaleString()}
              </div>
              <p className="text-sm text-white/70 mt-1">{getDateRangeLabel(dateRange)}</p>
            </CardContent>
          </Card>

          {/* Watch Hours Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-500">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
              <Clock className="w-full h-full" />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-white/80" />
                <span className="text-sm font-medium text-white/80">Watch Hours</span>
              </div>
              <div className="text-4xl font-bold text-white">
                {totalWatchHours.toLocaleString()}h
              </div>
              <p className="text-sm text-white/70 mt-1">total watch time</p>
            </CardContent>
          </Card>

          {/* Subscribers Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-violet-600">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
              <Users className="w-full h-full" />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-white/80" />
                <span className="text-sm font-medium text-white/80">Subscribers</span>
              </div>
              <div className="text-4xl font-bold text-white">
                {totalSubscribers.toLocaleString()}
              </div>
              <p className="text-sm text-white/70 mt-1">followers</p>
            </CardContent>
          </Card>

          {/* Active Channels Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-500">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
              <Activity className="w-full h-full" />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-white/80" />
                <span className="text-sm font-medium text-white/80">Channels</span>
              </div>
              <div className="text-4xl font-bold text-white">
                {channelStats.length}
              </div>
              <p className="text-sm text-white/70 mt-1">active channels</p>
            </CardContent>
          </Card>
        </div>

        {/* Watch Hours Breakdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Live TV Hours */}
          <Card className="border border-border/50 bg-card/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-500/10">
                  <Radio className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Live TV</span>
                    <span className="text-xs text-muted-foreground">{liveTvViews.toLocaleString()} views</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{liveTvHours.toLocaleString()}h</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VOD Hours (Movies & Shows) */}
          <Card className="border border-border/50 bg-card/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <Film className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Movies & Shows</span>
                    <span className="text-xs text-muted-foreground">{vodViews.toLocaleString()} views</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{vodHours.toLocaleString()}h</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indie Channel Hours */}
          <Card className="border border-border/50 bg-card/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10">
                  <Video className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Indie Channels</span>
                    <span className="text-xs text-muted-foreground">{indieViews.toLocaleString()} views</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{indieHours.toLocaleString()}h</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Views Over Time Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Views Over Time
              </CardTitle>
              <CardDescription>Daily view trends for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {viewsOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viewsOverTime}>
                      <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2}
                        fill="url(#viewsGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No view data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device Distribution Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                Devices
              </CardTitle>
              <CardDescription>Viewer device breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {deviceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {deviceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string) => [`${value} views`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No device data
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="mt-4 space-y-2">
                {deviceChartData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-sm capitalize">{d.name}</span>
                    </div>
                    <span className="text-sm font-medium">{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geography and Channels Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Top Countries
              </CardTitle>
              <CardDescription>Where your viewers are watching from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geoChartData.map((country, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCountryFlag(country.name)}</span>
                        <span className="text-sm font-medium">{getCountryName(country.name)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{country.views} views</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${country.percentage}%`,
                          background: `linear-gradient(90deg, ${CHART_COLORS.primary}, ${CHART_COLORS.orange})`
                        }}
                      />
                    </div>
                  </div>
                ))}
                {geoChartData.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No geographic data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Channels */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  Top Performing Channels
                </CardTitle>
                <Select value={topChannelsSortBy} onValueChange={(v) => setTopChannelsSortBy(v as 'views' | 'followers' | 'hours')}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="views">By Views</SelectItem>
                    <SelectItem value="followers">By Followers</SelectItem>
                    <SelectItem value="hours">By Hours Watched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                Channels ranked by {topChannelsSortBy === 'views' ? 'views' : topChannelsSortBy === 'followers' ? 'followers' : 'hours watched'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...channelStats]
                  .sort((a, b) => {
                    if (topChannelsSortBy === 'views') return b.totalViews - a.totalViews;
                    if (topChannelsSortBy === 'followers') return b.subscribers - a.subscribers;
                    return b.totalWatchHours - a.totalWatchHours;
                  })
                  .slice(0, 5)
                  .map((channel, i) => (
                  <div 
                    key={channel.id} 
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => fetchChannelDetails(channel)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden">
                      {channel.logo_url ? (
                        <img src={channel.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">
                          {channel.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{channel.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded",
                          channel.type === 'indie' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                        )}>
                          {channel.type === 'indie' ? 'Indie' : 'Live'}
                        </span>
                        <span>{channel.subscribers} followers</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {topChannelsSortBy === 'views' && channel.totalViews.toLocaleString()}
                        {topChannelsSortBy === 'followers' && channel.subscribers.toLocaleString()}
                        {topChannelsSortBy === 'hours' && `${channel.totalWatchHours}h`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {topChannelsSortBy === 'views' && `${channel.totalWatchHours}h watched`}
                        {topChannelsSortBy === 'followers' && `${channel.totalViews.toLocaleString()} views`}
                        {topChannelsSortBy === 'hours' && `${channel.totalViews.toLocaleString()} views`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="channels" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="channels" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              All Channels
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-2">
              <Radio className="w-4 h-4" />
              Live Now
            </TabsTrigger>
            <TabsTrigger value="geography" className="gap-2">
              <Globe className="w-4 h-4" />
              Geography
            </TabsTrigger>
          </TabsList>

          {/* Channels Tab */}
          <TabsContent value="channels">
            <Card>
              <CardHeader>
                <CardTitle>All Channels Performance</CardTitle>
                <CardDescription>Click on any channel to view detailed analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelStats.map((channel) => (
                    <Card 
                      key={channel.id} 
                      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                      onClick={() => fetchChannelDetails(channel)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                            {channel.logo_url ? (
                              <img src={channel.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                                {channel.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{channel.name}</div>
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded text-xs mt-1",
                              channel.type === 'indie' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                            )}>
                              {channel.type === 'indie' ? 'Indie' : 'Live TV'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{channel.totalViews.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Views</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{channel.totalWatchHours}</div>
                            <div className="text-xs text-muted-foreground">Hours</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{channel.subscribers}</div>
                            <div className="text-xs text-muted-foreground">Followers</div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {channel.topCountry}
                          </span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs">
                            View Details →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                      {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
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
                    {/* Live Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
                        <CardContent className="pt-6 text-center">
                          <div className="text-5xl font-bold text-red-500 mb-2">
                            {liveViewerStats.total_viewers}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Watching Now</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                        <CardContent className="pt-6 text-center">
                          <div className="text-5xl font-bold text-blue-400 mb-2">
                            {liveViewerStats.channels.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Active Channels</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20">
                        <CardContent className="pt-6 text-center">
                          <div className="text-5xl font-bold text-purple-400 mb-2">
                            {Object.keys(liveViewerStats.total_countries).length}
                          </div>
                          <div className="text-sm text-muted-foreground">Countries Represented</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Per-Channel Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Viewers by Channel</h3>
                      <div className="space-y-3">
                        {liveViewerStats.channels.map((channel) => (
                          <Card key={channel.channel_id} className="bg-muted/30">
                            <CardContent className="py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                                    {channel.logo_url ? (
                                      <img src={channel.logo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                                        {channel.channel_name.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">{channel.channel_name}</div>
                                    <div className="flex items-center gap-1 text-xs text-red-500">
                                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                      Live
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-red-500">{channel.viewer_count}</div>
                                  <div className="text-xs text-muted-foreground">viewers</div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-4">
                                {Object.entries(channel.devices).map(([device, count]) => (
                                  <span key={device} className="flex items-center gap-1 px-2 py-1 rounded-full bg-background text-xs">
                                    {getDeviceIcon(device)}
                                    {device}: {count}
                                  </span>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* All Viewers List */}
                    {liveViewerStats.all_viewers && liveViewerStats.all_viewers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">All Active Viewers</h3>
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User / Profile</TableHead>
                                <TableHead>Channel</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-right">Watch Time</TableHead>
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
                                        <div className="font-medium">{viewer.profile_name || 'Anonymous'}</div>
                                        <div className="text-xs text-muted-foreground">{viewer.user_email || 'Guest'}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                      {viewer.channel_name}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getDeviceIcon(viewer.device_type)}
                                      <span className="capitalize">{viewer.device_type}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{getCountryFlag(viewer.geo_country)}</span>
                                      {[viewer.geo_city, getCountryName(viewer.geo_country)].filter(Boolean).join(', ') || 'Unknown'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatDuration(viewer.watch_duration_seconds)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Radio className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Live Viewers</h3>
                    <p className="text-muted-foreground">There are no viewers watching Live TV channels right now.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geography Tab */}
          <TabsContent value="geography">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    By Country
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {geoByCountry.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCountryFlag(item.location)}</span>
                          <span className="font-medium">{getCountryName(item.location)}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{item.views}</div>
                          <div className="text-xs text-muted-foreground">{item.watchHours}h</div>
                        </div>
                      </div>
                    ))}
                    {geoByCountry.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    By Region
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {geoByRegion.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary">
                            {i + 1}
                          </div>
                          <span className="font-medium">{item.location}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{item.views}</div>
                          <div className="text-xs text-muted-foreground">{item.watchHours}h</div>
                        </div>
                      </div>
                    ))}
                    {geoByRegion.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    By City
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {geoByCity.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-500">
                            {i + 1}
                          </div>
                          <span className="font-medium">{item.location}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{item.views}</div>
                          <div className="text-xs text-muted-foreground">{item.watchHours}h</div>
                        </div>
                      </div>
                    ))}
                    {geoByCity.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden">
                    {selectedChannel.channel.logo_url ? (
                      <img src={selectedChannel.channel.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                        {selectedChannel.channel.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedChannel.channel.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        selectedChannel.channel.type === 'indie' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      )}>
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
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-muted-foreground">Views</span>
                    </div>
                    <div className="text-3xl font-bold mt-1">
                      {selectedChannel.channel.totalViews.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-muted-foreground">Watch Hours</span>
                    </div>
                    <div className="text-3xl font-bold mt-1">
                      {selectedChannel.channel.totalWatchHours}h
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-muted-foreground">Subscribers</span>
                    </div>
                    <div className="text-3xl font-bold mt-1">
                      {selectedChannel.channel.subscribers.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-muted-foreground">Top Country</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">{getCountryFlag(selectedChannel.channel.topCountry)}</span>
                      <span className="text-lg font-bold truncate">{getCountryName(selectedChannel.channel.topCountry)}</span>
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
                    <div className="space-y-3">
                      {selectedChannel.geoByCountry.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getCountryFlag(item.location)}</span>
                            <span className="text-sm">{getCountryName(item.location)}</span>
                          </div>
                          <span className="font-medium">{item.views}</span>
                        </div>
                      ))}
                      {selectedChannel.geoByCountry.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-4">No data</p>
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
                    <div className="space-y-3">
                      {selectedChannel.deviceStats.map((stat, i) => {
                        const total = selectedChannel.deviceStats.reduce((s, d) => s + d.count, 0);
                        const percentage = total > 0 ? Math.round((stat.count / total) * 100) : 0;
                        return (
                          <div key={stat.device} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getDeviceIcon(stat.device)}
                                <span className="text-sm capitalize">{stat.device}</span>
                              </div>
                              <span className="font-medium">{stat.count} ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-1.5" />
                          </div>
                        );
                      })}
                      {selectedChannel.deviceStats.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-4">No data</p>
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {selectedChannel.geoByCity.slice(0, 10).map((item, i) => (
                      <div key={i} className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="text-xl font-bold">{item.views}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.location}</div>
                      </div>
                    ))}
                    {selectedChannel.geoByCity.length === 0 && (
                      <p className="text-muted-foreground text-sm col-span-5 text-center py-4">No city data</p>
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
                    <div className="rounded-lg border overflow-hidden">
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
                              <TableCell className="font-medium">{formatDuration(view.duration_seconds)}</TableCell>
                              <TableCell className="text-sm">
                                {[view.geo_city, view.geo_country].filter(Boolean).join(', ') || 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getDeviceIcon(view.device_type || 'unknown')}
                                  <span className="text-sm capitalize">{view.device_type || 'Unknown'}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
