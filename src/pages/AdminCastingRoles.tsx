import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminNavbar from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Clapperboard, DollarSign } from 'lucide-react';

interface CastingShow {
  id: string;
  title: string;
}

interface CastingRole {
  id: string;
  show_id: string;
  title: string;
  role_type: string;
  description: string | null;
  requirements: string | null;
  shoot_dates: string | null;
  time_commitment: string | null;
  location_notes: string | null;
  pay_type: string | null;
  pay_amount: string | null;
  payment_terms: string | null;
  terms_conditions: string | null;
  is_remote: boolean | null;
  deadline: string | null;
  status: string;
  sort_order: number;
}

const initialFormState = {
  show_id: '',
  title: '',
  role_type: 'talent',
  description: '',
  requirements: '',
  shoot_dates: '',
  time_commitment: '',
  location_notes: '',
  pay_type: '',
  pay_amount: '',
  payment_terms: '',
  terms_conditions: '',
  is_remote: false,
  deadline: '',
  status: 'open',
};

export default function AdminCastingRoles() {
  const [searchParams] = useSearchParams();
  const showIdParam = searchParams.get('show');

  const [shows, setShows] = useState<CastingShow[]>([]);
  const [roles, setRoles] = useState<CastingRole[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>(showIdParam || '');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CastingRole | null>(null);
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (selectedShowId) {
      fetchRoles();
    }
  }, [selectedShowId]);

  const fetchShows = async () => {
    try {
      const { data, error } = await supabase
        .from('casting_shows')
        .select('id, title')
        .order('title');

      if (error) throw error;
      setShows(data || []);

      if (showIdParam && data?.some(s => s.id === showIdParam)) {
        setSelectedShowId(showIdParam);
      } else if (data && data.length > 0 && !selectedShowId) {
        setSelectedShowId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('casting_roles')
        .select('*')
        .eq('show_id', selectedShowId)
        .order('role_type')
        .order('sort_order');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        show_id: selectedShowId,
        title: form.title,
        role_type: form.role_type,
        description: form.description || null,
        requirements: form.requirements || null,
        shoot_dates: form.shoot_dates || null,
        time_commitment: form.time_commitment || null,
        location_notes: form.location_notes || null,
        pay_type: form.pay_type || null,
        pay_amount: form.pay_amount || null,
        payment_terms: form.payment_terms || null,
        terms_conditions: form.terms_conditions || null,
        is_remote: form.is_remote,
        deadline: form.deadline || null,
        status: form.status,
      };

      if (editingRole) {
        const { error } = await supabase
          .from('casting_roles')
          .update(payload)
          .eq('id', editingRole.id);

        if (error) throw error;
        toast.success('Role updated');
      } else {
        const { error } = await supabase
          .from('casting_roles')
          .insert(payload);

        if (error) throw error;
        toast.success('Role created');
      }

      setDialogOpen(false);
      setEditingRole(null);
      setForm({ ...initialFormState, show_id: selectedShowId });
      fetchRoles();
    } catch (error: any) {
      console.error('Error saving role:', error);
      toast.error(error.message || 'Failed to save role');
    }
  };

  const handleEdit = (role: CastingRole) => {
    setEditingRole(role);
    setForm({
      show_id: role.show_id,
      title: role.title,
      role_type: role.role_type,
      description: role.description || '',
      requirements: role.requirements || '',
      shoot_dates: role.shoot_dates || '',
      time_commitment: role.time_commitment || '',
      location_notes: role.location_notes || '',
      pay_type: role.pay_type || '',
      pay_amount: role.pay_amount || '',
      payment_terms: role.payment_terms || '',
      terms_conditions: role.terms_conditions || '',
      is_remote: role.is_remote || false,
      deadline: role.deadline || '',
      status: role.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this role?')) return;

    try {
      const { error } = await supabase
        .from('casting_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Role deleted');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const talentRoles = roles.filter(r => r.role_type === 'talent');
  const crewRoles = roles.filter(r => r.role_type === 'crew');

  const RoleCard = ({ role }: { role: CastingRole }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{role.title}</h4>
              <Badge variant={role.status === 'open' ? 'default' : 'secondary'}>
                {role.status}
              </Badge>
              {role.is_remote && <Badge variant="outline">Remote</Badge>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{role.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {role.pay_type && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {role.pay_type}: {role.pay_amount || 'TBD'}
                </span>
              )}
              {role.time_commitment && <span>{role.time_commitment}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(role)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(role.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center pt-24 pb-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-6 pt-32 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Casting Roles</h1>
              <p className="text-muted-foreground">Manage roles for each show</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedShowId} onValueChange={setSelectedShowId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a show" />
              </SelectTrigger>
              <SelectContent>
                {shows.map(show => (
                  <SelectItem key={show.id} value={show.id}>{show.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingRole(null);
                setForm({ ...initialFormState, show_id: selectedShowId });
              }
            }}>
              <DialogTrigger asChild>
                <Button disabled={!selectedShowId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Role Title *</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Lead Host, Camera Operator"
                        required
                      />
                    </div>
                    <div>
                      <Label>Role Type *</Label>
                      <Select 
                        value={form.role_type} 
                        onValueChange={(v) => setForm(prev => ({ ...prev, role_type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="talent">Talent</SelectItem>
                          <SelectItem value="crew">Crew</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <RichTextEditor
                      value={form.description}
                      onChange={(value) => setForm(prev => ({ ...prev, description: value }))}
                    />
                  </div>

                  <div>
                    <Label>Requirements</Label>
                    <RichTextEditor
                      value={form.requirements}
                      onChange={(value) => setForm(prev => ({ ...prev, requirements: value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Shoot Dates</Label>
                      <Input
                        value={form.shoot_dates}
                        onChange={(e) => setForm(prev => ({ ...prev, shoot_dates: e.target.value }))}
                        placeholder="e.g., Feb 15-28, 2025"
                      />
                    </div>
                    <div>
                      <Label>Time Commitment</Label>
                      <Input
                        value={form.time_commitment}
                        onChange={(e) => setForm(prev => ({ ...prev, time_commitment: e.target.value }))}
                        placeholder="e.g., 3 days/week, 8 hrs/day"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Location Notes</Label>
                    <Input
                      value={form.location_notes}
                      onChange={(e) => setForm(prev => ({ ...prev, location_notes: e.target.value }))}
                      placeholder="e.g., Must be local to Atlanta, some travel required"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Pay Type</Label>
                      <Select 
                        value={form.pay_type} 
                        onValueChange={(v) => setForm(prev => ({ ...prev, pay_type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="flat">Flat Rate</SelectItem>
                          <SelectItem value="deferred">Deferred</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pay Amount</Label>
                      <Input
                        value={form.pay_amount}
                        onChange={(e) => setForm(prev => ({ ...prev, pay_amount: e.target.value }))}
                        placeholder="e.g., $500/day"
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
                          <SelectItem value="filled">Filled</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Payment Terms</Label>
                    <Input
                      value={form.payment_terms}
                      onChange={(e) => setForm(prev => ({ ...prev, payment_terms: e.target.value }))}
                      placeholder="e.g., Net 30 after wrap, weekly payroll"
                    />
                  </div>

                  <div>
                    <Label>Terms & Conditions</Label>
                    <RichTextEditor
                      value={form.terms_conditions}
                      onChange={(value) => setForm(prev => ({ ...prev, terms_conditions: value }))}
                    />
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
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={form.is_remote}
                        onCheckedChange={(v) => setForm(prev => ({ ...prev, is_remote: v }))}
                      />
                      <Label>Remote work available</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRole ? 'Update Role' : 'Create Role'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!selectedShowId ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Select a show to manage its roles</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="talent">
            <TabsList className="mb-6">
              <TabsTrigger value="talent" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Talent Roles ({talentRoles.length})
              </TabsTrigger>
              <TabsTrigger value="crew" className="flex items-center gap-2">
                <Clapperboard className="w-4 h-4" />
                Crew Roles ({crewRoles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="talent" className="space-y-4">
              {talentRoles.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No talent roles yet</p>
                  </CardContent>
                </Card>
              ) : (
                talentRoles.map(role => <RoleCard key={role.id} role={role} />)
              )}
            </TabsContent>

            <TabsContent value="crew" className="space-y-4">
              {crewRoles.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clapperboard className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No crew roles yet</p>
                  </CardContent>
                </Card>
              ) : (
                crewRoles.map(role => <RoleCard key={role.id} role={role} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
