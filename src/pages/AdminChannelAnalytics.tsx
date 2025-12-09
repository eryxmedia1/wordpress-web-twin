import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Tv
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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    // Fetch indie channels
    const { data: indieChannels } = await supabase
      .from("indie_channels")
      .select("id, name, slug, logo_url");

    // Fetch live channels
    const { data: liveChannels } = await supabase
      .from("live_channels")
      .select("id, name, slug, logo_url");

    // Fetch all channel views
    const { data: allViews } = await supabase
      .from("channel_views")
      .select("*");

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

      stats.push({
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        logo_url: channel.logo_url,
        type: 'live',
        totalViews: channelViews.length,
        totalWatchHours: Math.round(totalSeconds / 3600),
        subscribers: 0,
        topCountry
      });
    }

    setChannelStats(stats);

    // Calculate totals
    const views = allViews || [];
    setTotalViews(views.length);
    setTotalWatchHours(Math.round(views.reduce((s, v) => s + (v.duration_seconds || 0), 0) / 3600));
    setTotalSubscribers(indieSubCount || 0);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

        <Tabs defaultValue="channels" className="space-y-6">
          <TabsList>
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

          {/* Channels Tab */}
          <TabsContent value="channels">
            <Card>
              <CardHeader>
                <CardTitle>All Channels Performance</CardTitle>
                <CardDescription>View analytics for all indie and live channels</CardDescription>
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
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={channel.type === 'indie' ? `/producer/${channel.slug}` : `/admin/livetv`}>
                              View
                            </Link>
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
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>See what devices viewers are using</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {deviceStats.map((item, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          {getDeviceIcon(item.device)}
                          <div>
                            <p className="font-medium capitalize">{item.device || "Unknown"}</p>
                            <p className="text-2xl font-bold">{item.count.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">views</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {deviceStats.length === 0 && (
                    <p className="text-muted-foreground text-center py-8 col-span-3">No device data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminChannelAnalytics;