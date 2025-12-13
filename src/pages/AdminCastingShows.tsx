import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminNavbar from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, Users, Clapperboard } from 'lucide-react';
import { format } from 'date-fns';

interface CastingShow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  logline: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  filming_dates: string | null;
  filming_location: string | null;
  production_notes: string | null;
  pay_range_min: number | null;
  pay_range_max: number | null;
  status: string;
  deadline: string | null;
  is_featured: boolean | null;
  casting_email: string | null;
  created_at: string;
  talent_count?: number;
  crew_count?: number;
}

const initialFormState = {
  title: '',
  slug: '',
  description: '',
  logline: '',
  poster_url: '',
  trailer_url: '',
  filming_dates: '',
  filming_location: '',
  production_notes: '',
  pay_range_min: '',
  pay_range_max: '',
  status: 'open',
  deadline: '',
  is_featured: false,
  casting_email: '',
};

export default function AdminCastingShows() {
  const [shows, setShows] = useState<CastingShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<CastingShow | null>(null);
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      const { data, error } = await supabase
        .from('casting_shows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get role counts
      const showsWithCounts = await Promise.all(
        (data || []).map(async (show) => {
          const { count: talentCount } = await supabase
            .from('casting_roles')
            .select('*', { count: 'exact', head: true })
            .eq('show_id', show.id)
            .eq('role_type', 'talent');

          const { count: crewCount } = await supabase
            .from('casting_roles')
            .select('*', { count: 'exact', head: true })
            .eq('show_id', show.id)
            .eq('role_type', 'crew');

          return { ...show, talent_count: talentCount || 0, crew_count: crewCount || 0 };
        })
      );

      setShows(showsWithCounts);
    } catch (error) {
      console.error('Error fetching shows:', error);
      toast.error('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: editingShow ? prev.slug : generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        logline: form.logline || null,
        poster_url: form.poster_url || null,
        trailer_url: form.trailer_url || null,
        filming_dates: form.filming_dates || null,
        filming_location: form.filming_location || null,
        production_notes: form.production_notes || null,
        pay_range_min: form.pay_range_min ? parseFloat(form.pay_range_min) : null,
        pay_range_max: form.pay_range_max ? parseFloat(form.pay_range_max) : null,
        status: form.status,
        deadline: form.deadline || null,
        is_featured: form.is_featured,
        casting_email: form.casting_email || null,
      };

      if (editingShow) {
        const { error } = await supabase
          .from('casting_shows')
          .update(payload)
          .eq('id', editingShow.id);

        if (error) throw error;
        toast.success('Show updated successfully');
      } else {
        const { error } = await supabase
          .from('casting_shows')
          .insert(payload);

        if (error) throw error;
        toast.success('Show created successfully');
      }

      setDialogOpen(false);
      setEditingShow(null);
      setForm(initialFormState);
      fetchShows();
    } catch (error: any) {
      console.error('Error saving show:', error);
      toast.error(error.message || 'Failed to save show');
    }
  };

  const handleEdit = (show: CastingShow) => {
    setEditingShow(show);
    setForm({
      title: show.title,
      slug: show.slug,
      description: show.description || '',
      logline: show.logline || '',
      poster_url: show.poster_url || '',
      trailer_url: show.trailer_url || '',
      filming_dates: show.filming_dates || '',
      filming_location: show.filming_location || '',
      production_notes: show.production_notes || '',
      pay_range_min: show.pay_range_min?.toString() || '',
      pay_range_max: show.pay_range_max?.toString() || '',
      status: show.status,
      deadline: show.deadline || '',
      is_featured: show.is_featured || false,
      casting_email: show.casting_email || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this show and all its roles?')) return;

    try {
      const { error } = await supabase
        .from('casting_shows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Show deleted');
      fetchShows();
    } catch (error) {
      console.error('Error deleting show:', error);
      toast.error('Failed to delete show');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500">Open</Badge>;
      case 'hold':
        return <Badge className="bg-amber-500">On Hold</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Casting Shows</h1>
              <p className="text-muted-foreground">Manage shows you're casting for</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingShow(null);
              setForm(initialFormState);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Show
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingShow ? 'Edit Show' : 'Add New Show'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Slug *</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Logline (Short Pitch)</Label>
                  <Input
                    value={form.logline}
                    onChange={(e) => setForm(prev => ({ ...prev, logline: e.target.value }))}
                    placeholder="One-sentence description"
                  />
                </div>

                <div>
                  <Label>Full Description</Label>
                  <RichTextEditor
                    value={form.description}
                    onChange={(value) => setForm(prev => ({ ...prev, description: value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Poster URL</Label>
                    <Input
                      value={form.poster_url}
                      onChange={(e) => setForm(prev => ({ ...prev, poster_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Trailer URL</Label>
                    <Input
                      value={form.trailer_url}
                      onChange={(e) => setForm(prev => ({ ...prev, trailer_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Filming Location</Label>
                    <Input
                      value={form.filming_location}
                      onChange={(e) => setForm(prev => ({ ...prev, filming_location: e.target.value }))}
                      placeholder="e.g., Atlanta, GA"
                    />
                  </div>
                  <div>
                    <Label>Filming Dates</Label>
                    <Input
                      value={form.filming_dates}
                      onChange={(e) => setForm(prev => ({ ...prev, filming_dates: e.target.value }))}
                      placeholder="e.g., Jan - Mar 2025"
                    />
                  </div>
                </div>

                <div>
                  <Label>Production Notes</Label>
                  <RichTextEditor
                    value={form.production_notes}
                    onChange={(value) => setForm(prev => ({ ...prev, production_notes: value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Min Pay ($)</Label>
                    <Input
                      type="number"
                      value={form.pay_range_min}
                      onChange={(e) => setForm(prev => ({ ...prev, pay_range_min: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Max Pay ($)</Label>
                    <Input
                      type="number"
                      value={form.pay_range_max}
                      onChange={(e) => setForm(prev => ({ ...prev, pay_range_max: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select 
                      value={form.status} 
                      onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="hold">On Hold</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Application Deadline</Label>
                    <Input
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Casting Email</Label>
                    <Input
                      type="email"
                      value={form.casting_email}
                      onChange={(e) => setForm(prev => ({ ...prev, casting_email: e.target.value }))}
                      placeholder="casting@example.com"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, is_featured: v }))}
                  />
                  <Label>Featured on homepage</Label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingShow ? 'Update Show' : 'Create Show'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : shows.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clapperboard className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Shows Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first casting show to get started.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Show
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {shows.map((show) => (
              <Card key={show.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-32 rounded overflow-hidden bg-muted flex-shrink-0">
                      {show.poster_url ? (
                        <img src={show.poster_url} alt={show.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Clapperboard className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{show.title}</h3>
                          <p className="text-sm text-muted-foreground">/{show.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(show.status)}
                          {show.is_featured && <Badge variant="outline">Featured</Badge>}
                        </div>
                      </div>

                      {show.logline && (
                        <p className="text-muted-foreground mt-2 line-clamp-2">{show.logline}</p>
                      )}

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {show.talent_count} talent roles
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clapperboard className="w-4 h-4" />
                          {show.crew_count} crew roles
                        </div>
                        {show.filming_location && (
                          <span className="text-sm text-muted-foreground">📍 {show.filming_location}</span>
                        )}
                        {show.deadline && (
                          <span className="text-sm text-muted-foreground">
                            Deadline: {format(new Date(show.deadline), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/casting/shows/${show.slug}`} target="_blank">
                          <Eye className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/casting-roles?show=${show.id}`}>
                          Manage Roles
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(show)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(show.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
