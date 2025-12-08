import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Tv, PlayCircle, Film, Plus, Settings } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  default_ad_interval_minutes: number;
  timezone: string;
}

interface Stats {
  totalChannels: number;
  activeChannels: number;
  totalPlaylists: number;
  totalAds: number;
}

export default function AdminLiveTV() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalChannels: 0,
    activeChannels: 0,
    totalPlaylists: 0,
    totalAds: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch channels
      const { data: channelsData } = await supabase
        .from('live_channels')
        .select('*')
        .order('name');

      if (channelsData) {
        setChannels(channelsData);
        setStats(prev => ({
          ...prev,
          totalChannels: channelsData.length,
          activeChannels: channelsData.filter(c => c.is_active).length,
        }));
      }

      // Fetch playlist count
      const { count: playlistCount } = await supabase
        .from('live_channel_playlists')
        .select('*', { count: 'exact', head: true });

      // Fetch ads count
      const { count: adsCount } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true });

      setStats(prev => ({
        ...prev,
        totalPlaylists: playlistCount || 0,
        totalAds: adsCount || 0,
      }));

      setIsLoading(false);
    };

    fetchData();
  }, []);

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Radio className="h-8 w-8 text-primary" />
              Live TV Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage channels, playlists, and advertisements
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Tv className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalChannels}</p>
                  <p className="text-sm text-muted-foreground">Total Channels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Radio className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeChannels}</p>
                  <p className="text-sm text-muted-foreground">Active Channels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <PlayCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalPlaylists}</p>
                  <p className="text-sm text-muted-foreground">Playlists</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Film className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalAds}</p>
                  <p className="text-sm text-muted-foreground">Advertisements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/admin/livetv/channels">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-primary" />
                  Manage Channels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and configure live TV channels with logos, timezones, and ad settings.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Channel Settings
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/livetv/ads">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary" />
                  Manage Ads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload and manage pre-roll, mid-roll, and post-roll advertisements.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Advertisement
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/live">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-red-500" />
                  View Live TV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Preview the live TV experience as users will see it.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Watch Live
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Channels List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Channels</CardTitle>
              <Link to="/admin/livetv/channels">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Channel
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <div className="text-center py-12">
                <Tv className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Channels Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first live TV channel to get started.
                </p>
                <Link to="/admin/livetv/channels">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Channel
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <Link key={channel.id} to={`/admin/livetv/playlists/${channel.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          {channel.logo_url ? (
                            <img
                              src={channel.logo_url}
                              alt={channel.name}
                              className="h-12 w-auto rounded"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center">
                              <Tv className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{channel.name}</h4>
                              {channel.is_active ? (
                                <Badge variant="outline" className="text-green-500 border-green-500">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{channel.timezone}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
