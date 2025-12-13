import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Users, Star, Eye } from "lucide-react";
import { format } from "date-fns";

type TalentCategory = 'actor' | 'model' | 'singer' | 'dancer' | 'extra' | 'voice_artist' | 'host' | 'influencer' | 'other';

interface CastingCall {
  id: string;
  title: string;
  description: string | null;
  project_name: string | null;
  category: TalentCategory;
  location: string | null;
  compensation: string | null;
  deadline: string | null;
  requirements: string | null;
  age_range: string | null;
  gender: string | null;
  is_active: boolean;
  is_featured: boolean;
  poster_url: string | null;
  created_at: string;
}

interface CastingApplication {
  id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  talents: {
    id: string;
    name: string;
    primary_photo_url: string | null;
    category: TalentCategory;
  };
}

const CATEGORIES: { value: TalentCategory; label: string }[] = [
  { value: "actor", label: "Actor" },
  { value: "model", label: "Model" },
  { value: "singer", label: "Singer" },
  { value: "dancer", label: "Dancer" },
  { value: "voice_artist", label: "Voice Artist" },
  { value: "host", label: "Host" },
  { value: "influencer", label: "Influencer" },
  { value: "extra", label: "Extra" },
  { value: "other", label: "Other" },
];

const emptyForm: Omit<CastingCall, 'id' | 'created_at'> = {
  title: "",
  description: "",
  project_name: "",
  category: "actor",
  location: "",
  compensation: "",
  deadline: "",
  requirements: "",
  age_range: "",
  gender: "",
  is_active: true,
  is_featured: false,
  poster_url: "",
};

export default function AdminCastingCalls() {
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [applicationsModalId, setApplicationsModalId] = useState<string | null>(null);
  const [applications, setApplications] = useState<CastingApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    fetchCastingCalls();
  }, []);

  const fetchCastingCalls = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('casting_calls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch casting calls");
    } else {
      setCastingCalls(data as CastingCall[]);
    }
    setLoading(false);
  };

  const fetchApplications = async (castingCallId: string) => {
    setLoadingApps(true);
    const { data, error } = await supabase
      .from('casting_applications')
      .select(`
        id, status, cover_letter, applied_at,
        talents (id, name, primary_photo_url, category)
      `)
      .eq('casting_call_id', castingCallId)
      .order('applied_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch applications");
    } else {
      setApplications(data as unknown as CastingApplication[]);
    }
    setLoadingApps(false);
  };

  const openForm = (call?: CastingCall) => {
    if (call) {
      setEditingId(call.id);
      setForm({
        title: call.title,
        description: call.description || "",
        project_name: call.project_name || "",
        category: call.category,
        location: call.location || "",
        compensation: call.compensation || "",
        deadline: call.deadline || "",
        requirements: call.requirements || "",
        age_range: call.age_range || "",
        gender: call.gender || "",
        is_active: call.is_active,
        is_featured: call.is_featured,
        poster_url: call.poster_url || "",
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('casting_calls')
          .update(form)
          .eq('id', editingId);

        if (error) throw error;
        toast.success("Casting call updated");
      } else {
        const { error } = await supabase
          .from('casting_calls')
          .insert(form);

        if (error) throw error;
        toast.success("Casting call created");
      }

      setIsFormOpen(false);
      fetchCastingCalls();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCastingCall = async (id: string) => {
    if (!confirm("Are you sure you want to delete this casting call?")) return;

    const { error } = await supabase
      .from('casting_calls')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      setCastingCalls(castingCalls.filter(c => c.id !== id));
      toast.success("Casting call deleted");
    }
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    const { error } = await supabase
      .from('casting_applications')
      .update({ status })
      .eq('id', appId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setApplications(applications.map(a => a.id === appId ? { ...a, status } : a));
      toast.success("Status updated");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Casting Calls</h1>
            <p className="text-muted-foreground mt-1">Manage casting opportunities</p>
          </div>
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            New Casting Call
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="bg-card/50 border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {castingCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{call.title}</p>
                        {call.project_name && (
                          <p className="text-sm text-muted-foreground">{call.project_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORIES.find(c => c.value === call.category)?.label || call.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {call.deadline ? format(new Date(call.deadline), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={call.is_active}
                        onCheckedChange={async (checked) => {
                          await supabase.from('casting_calls').update({ is_active: checked }).eq('id', call.id);
                          setCastingCalls(castingCalls.map(c => c.id === call.id ? { ...c, is_active: checked } : c));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={call.is_featured}
                        onCheckedChange={async (checked) => {
                          await supabase.from('casting_calls').update({ is_featured: checked }).eq('id', call.id);
                          setCastingCalls(castingCalls.map(c => c.id === call.id ? { ...c, is_featured: checked } : c));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setApplicationsModalId(call.id);
                            fetchApplications(call.id);
                          }}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openForm(call)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteCastingCall(call.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {castingCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No casting calls yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Casting Call" : "New Casting Call"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Role title"
                />
              </div>
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input 
                  value={form.project_name || ""}
                  onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                  placeholder="Film/Show name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the role and opportunity..."
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v: TalentCategory) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input 
                  value={form.location || ""}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Los Angeles, CA"
                />
              </div>
              <div className="space-y-2">
                <Label>Compensation</Label>
                <Input 
                  value={form.compensation || ""}
                  onChange={(e) => setForm({ ...form, compensation: e.target.value })}
                  placeholder="e.g., $500/day"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input 
                  type="date"
                  value={form.deadline || ""}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Age Range</Label>
                <Input 
                  value={form.age_range || ""}
                  onChange={(e) => setForm({ ...form, age_range: e.target.value })}
                  placeholder="e.g., 25-35"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Input 
                  value={form.gender || ""}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  placeholder="e.g., Female"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea 
                value={form.requirements || ""}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                placeholder="List any specific requirements..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Poster URL</Label>
              <Input 
                value={form.poster_url || ""}
                onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={form.is_featured}
                  onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })}
                />
                <Label>Featured</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingId ? "Update" : "Create"} Casting Call
              </Button>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Applications Modal */}
      <Dialog open={!!applicationsModalId} onOpenChange={() => setApplicationsModalId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applications</DialogTitle>
          </DialogHeader>

          {loadingApps ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications yet
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                        {app.talents?.primary_photo_url ? (
                          <img src={app.talents.primary_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                            {app.talents?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{app.talents?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              Applied {format(new Date(app.applied_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Select 
                            value={app.status}
                            onValueChange={(v) => updateApplicationStatus(app.id, v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {app.cover_letter && (
                          <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-3 rounded-lg">
                            {app.cover_letter}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
