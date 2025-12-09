import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Eye, Users, CheckCircle, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AdImpression {
  id: string;
  ad_id: string;
  position: string;
  played_at: string;
  completed: boolean;
  geo_country: string | null;
  geo_region: string | null;
  geo_city: string | null;
  device_type: string | null;
  membership_tier: string | null;
  duration_ms: number | null;
}

interface Ad {
  id: string;
  name: string;
}

interface AggregatedData {
  name: string;
  value: number;
}

const COLORS = ['#d4af37', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f59e0b'];

const AdminAdReports = () => {
  const [dateRange, setDateRange] = useState('7');
  const [impressions, setImpressions] = useState<AdImpression[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
    const endDate = endOfDay(new Date());

    const [impressionsRes, adsRes] = await Promise.all([
      supabase
        .from('ad_impressions')
        .select('*')
        .gte('played_at', startDate.toISOString())
        .lte('played_at', endDate.toISOString())
        .order('played_at', { ascending: false }),
      supabase.from('ads').select('id, name')
    ]);

    if (impressionsRes.data) setImpressions(impressionsRes.data);
    if (adsRes.data) setAds(adsRes.data);
    setLoading(false);
  };

  // Calculate summary stats
  const totalImpressions = impressions.length;
  const completedImpressions = impressions.filter(i => i.completed).length;
  const completionRate = totalImpressions > 0 ? Math.round((completedImpressions / totalImpressions) * 100) : 0;
  const uniqueViewers = new Set(impressions.map(i => i.ad_id)).size;

  // Aggregate by position
  const positionData: AggregatedData[] = ['pre', 'mid', 'post'].map(pos => ({
    name: pos.charAt(0).toUpperCase() + pos.slice(1) + '-roll',
    value: impressions.filter(i => i.position === pos).length
  }));

  // Aggregate by device
  const deviceCounts: Record<string, number> = {};
  impressions.forEach(i => {
    const device = i.device_type || 'unknown';
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  });
  const deviceData: AggregatedData[] = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

  // Aggregate by membership tier
  const tierCounts: Record<string, number> = {};
  impressions.forEach(i => {
    const tier = i.membership_tier || 'free';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });
  const tierData: AggregatedData[] = Object.entries(tierCounts).map(([name, value]) => ({ 
    name: name.charAt(0).toUpperCase() + name.slice(1), 
    value 
  }));

  // Aggregate by country
  const countryCounts: Record<string, number> = {};
  impressions.forEach(i => {
    const country = i.geo_country || 'Unknown';
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });
  const countryData = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Daily impressions for line chart
  const dailyData: Record<string, { date: string; impressions: number; completed: number }> = {};
  impressions.forEach(i => {
    const date = format(new Date(i.played_at!), 'MMM dd');
    if (!dailyData[date]) {
      dailyData[date] = { date, impressions: 0, completed: 0 };
    }
    dailyData[date].impressions++;
    if (i.completed) dailyData[date].completed++;
  });
  const timeSeriesData = Object.values(dailyData).reverse();

  // Top ads by impressions
  const adCounts: Record<string, number> = {};
  impressions.forEach(i => {
    adCounts[i.ad_id] = (adCounts[i.ad_id] || 0) + 1;
  });
  const topAds = Object.entries(adCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([adId, count]) => ({
      id: adId,
      name: ads.find(a => a.id === adId)?.name || 'Unknown Ad',
      impressions: count,
      completed: impressions.filter(i => i.ad_id === adId && i.completed).length
    }));

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="pt-24 px-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Ad Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Track ad performance and viewer engagement</p>
          </div>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Impressions</p>
                      <p className="text-3xl font-bold text-foreground">{totalImpressions.toLocaleString()}</p>
                    </div>
                    <Eye className="h-10 w-10 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Views</p>
                      <p className="text-3xl font-bold text-foreground">{completedImpressions.toLocaleString()}</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Ads Shown</p>
                      <p className="text-3xl font-bold text-foreground">{uniqueViewers}</p>
                    </div>
                    <Users className="h-10 w-10 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Impressions Over Time */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Impressions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))'
                        }} 
                      />
                      <Legend />
                      <Line type="monotone" dataKey="impressions" stroke="#d4af37" strokeWidth={2} name="Impressions" />
                      <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Position Breakdown */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">By Ad Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={positionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {positionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Device Breakdown */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">By Device Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={deviceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))'
                        }} 
                      />
                      <Bar dataKey="value" fill="#3b82f6" name="Impressions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Membership Tier */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">By Membership Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tierData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tierData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Ads */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Top Performing Ads</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Ad Name</TableHead>
                        <TableHead className="text-muted-foreground text-right">Impressions</TableHead>
                        <TableHead className="text-muted-foreground text-right">Completed</TableHead>
                        <TableHead className="text-muted-foreground text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topAds.map((ad) => (
                        <TableRow key={ad.id} className="border-border">
                          <TableCell className="text-foreground font-medium">{ad.name}</TableCell>
                          <TableCell className="text-right text-foreground">{ad.impressions}</TableCell>
                          <TableCell className="text-right text-foreground">{ad.completed}</TableCell>
                          <TableCell className="text-right text-foreground">
                            {ad.impressions > 0 ? Math.round((ad.completed / ad.impressions) * 100) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {topAds.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No ad data available for selected period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Geo Breakdown */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">By Country</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Country</TableHead>
                        <TableHead className="text-muted-foreground text-right">Impressions</TableHead>
                        <TableHead className="text-muted-foreground text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countryData.map(([country, count]) => (
                        <TableRow key={country} className="border-border">
                          <TableCell className="text-foreground font-medium">{country}</TableCell>
                          <TableCell className="text-right text-foreground">{count}</TableCell>
                          <TableCell className="text-right text-foreground">
                            {totalImpressions > 0 ? Math.round((count / totalImpressions) * 100) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {countryData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No geo data available for selected period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAdReports;
