import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Search, Star, CheckCircle, XCircle, Eye, Trash2, Users } from "lucide-react";
import { Link } from "react-router-dom";

type TalentCategory = 'actor' | 'model' | 'singer' | 'dancer' | 'extra' | 'voice_artist' | 'host' | 'influencer' | 'other';

interface Talent {
  id: string;
  name: string;
  category: TalentCategory;
  city: string | null;
  state: string | null;
  country: string | null;
  primary_photo_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
}

const CATEGORY_LABELS: Record<TalentCategory, string> = {
  actor: "Actor",
  model: "Model",
  singer: "Singer",
  dancer: "Dancer",
  voice_artist: "Voice Artist",
  host: "Host",
  influencer: "Influencer",
  extra: "Extra",
  other: "Other",
};

export default function AdminTalents() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('talents')
      .select('id, name, category, city, state, country, primary_photo_url, is_featured, is_active, is_approved, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch talents");
    } else {
      setTalents(data as Talent[]);
    }
    setLoading(false);
  };

  const toggleApproved = async (id: string, approved: boolean) => {
    const { error } = await supabase
      .from('talents')
      .update({ is_approved: approved })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update");
    } else {
      setTalents(talents.map(t => t.id === id ? { ...t, is_approved: approved } : t));
      toast.success(approved ? "Talent approved" : "Talent unapproved");
    }
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    const { error } = await supabase
      .from('talents')
      .update({ is_featured: featured })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update");
    } else {
      setTalents(talents.map(t => t.id === id ? { ...t, is_featured: featured } : t));
      toast.success(featured ? "Talent featured" : "Talent unfeatured");
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('talents')
      .update({ is_active: active })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update");
    } else {
      setTalents(talents.map(t => t.id === id ? { ...t, is_active: active } : t));
      toast.success(active ? "Talent activated" : "Talent deactivated");
    }
  };

  const deleteTalent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this talent?")) return;

    const { error } = await supabase
      .from('talents')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      setTalents(talents.filter(t => t.id !== id));
      toast.success("Talent deleted");
    }
  };

  const filteredTalents = talents.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'pending') return matchesSearch && !t.is_approved;
    if (filter === 'approved') return matchesSearch && t.is_approved;
    if (filter === 'featured') return matchesSearch && t.is_featured;
    return matchesSearch;
  });

  const stats = {
    total: talents.length,
    pending: talents.filter(t => !t.is_approved).length,
    approved: talents.filter(t => t.is_approved).length,
    featured: talents.filter(t => t.is_featured).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Talent Management</h1>
            <p className="text-muted-foreground mt-1">Manage talent profiles and approvals</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/30" onClick={() => setFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/30" onClick={() => setFilter('pending')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                </div>
                <XCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/30" onClick={() => setFilter('approved')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/30" onClick={() => setFilter('featured')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Featured</p>
                  <p className="text-2xl font-bold text-primary">{stats.featured}</p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search talents..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="bg-card/50 border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talent</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTalents.map((talent) => (
                  <TableRow key={talent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                          {talent.primary_photo_url ? (
                            <img src={talent.primary_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                              {talent.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{talent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[talent.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[talent.city, talent.state, talent.country].filter(Boolean).join(", ") || "-"}
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={talent.is_approved}
                        onCheckedChange={(checked) => toggleApproved(talent.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={talent.is_featured}
                        onCheckedChange={(checked) => toggleFeatured(talent.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={talent.is_active}
                        onCheckedChange={(checked) => toggleActive(talent.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/talent/${talent.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => deleteTalent(talent.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTalents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No talents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
