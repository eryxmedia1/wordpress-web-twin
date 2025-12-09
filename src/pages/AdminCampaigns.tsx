import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { CampaignList, Campaign } from "@/components/admin/CampaignList";
import { CampaignForm } from "@/components/admin/CampaignForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Target, BarChart3, TrendingUp, Eye } from "lucide-react";

interface CampaignStats {
  total: number;
  active: number;
  totalImpressions: number;
  topCampaign: string | null;
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats>({ total: 0, active: 0, totalImpressions: 0, topCampaign: null });

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      toast.error('Failed to fetch campaigns');
      return;
    }

    // Map the data to ensure proper typing
    const typedCampaigns: Campaign[] = (data || []).map(c => ({
      ...c,
      status: c.status as 'draft' | 'active' | 'paused' | 'completed',
    }));

    setCampaigns(typedCampaigns);
    
    // Calculate stats
    const activeCampaigns = data?.filter(c => c.status === 'active') || [];
    const totalImpressions = data?.reduce((sum, c) => sum + (c.current_impressions || 0), 0) || 0;
    const topCampaign = data?.sort((a, b) => (b.current_impressions || 0) - (a.current_impressions || 0))[0];
    
    setStats({
      total: data?.length || 0,
      active: activeCampaigns.length,
      totalImpressions,
      topCampaign: topCampaign?.name || null,
    });
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This cannot be undone.')) return;
    
    const { error } = await supabase.from('ad_campaigns').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete campaign');
      return;
    }
    
    toast.success('Campaign deleted');
    fetchCampaigns();
  };

  const handleToggleStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('ad_campaigns')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update campaign status');
      return;
    }

    toast.success(`Campaign ${newStatus}`);
    fetchCampaigns();
  };

  const handleCreateNew = () => {
    setEditingCampaign(null);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Ad Campaigns</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Impressions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <BarChart3 className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-lg font-bold truncate">{stats.topCampaign || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Top Campaign</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        <CampaignList
          campaigns={campaigns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onCreateNew={handleCreateNew}
        />

        {/* Campaign Form Dialog */}
        <CampaignForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          campaign={editingCampaign}
          onSave={fetchCampaigns}
        />
      </main>
    </div>
  );
}
