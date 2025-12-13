import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MapPin, DollarSign, Building2 } from "lucide-react";
import type { CrewPosition, Department } from "@/types/casting";

export default function AdminCrewPositions() {
  const [positions, setPositions] = useState<CrewPosition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<CrewPosition | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  
  const [form, setForm] = useState<{
    department_id: string;
    show_id: string;
    title: string;
    description: string;
    responsibilities: string;
    required_experience: string;
    gear_required: string;
    rate_type: string;
    pay_amount: string;
    schedule_expectations: string;
    location: string;
    is_remote: boolean;
    terms_conditions: string;
    deadline: string;
    status: string;
  }>({
    department_id: "",
    show_id: "",
    title: "",
    description: "",
    responsibilities: "",
    required_experience: "",
    gear_required: "",
    rate_type: "daily",
    pay_amount: "",
    schedule_expectations: "",
    location: "",
    is_remote: false,
    terms_conditions: "",
    deadline: "",
    status: "open"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [positionsRes, deptRes, showsRes] = await Promise.all([
      supabase
        .from("crew_positions")
        .select("*, departments(name, slug), casting_shows(title)")
        .order("created_at", { ascending: false }),
      supabase.from("departments").select("*").order("sort_order"),
      supabase.from("casting_shows").select("id, title").eq("status", "casting")
    ]);

    setPositions(positionsRes.data || []);
    setDepartments(deptRes.data || []);
    setShows(showsRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.department_id || !form.title) {
      toast.error("Please fill required fields");
      return;
    }

    const data = {
      ...form,
      show_id: form.show_id || null,
      deadline: form.deadline || null
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("crew_positions").update(data).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("crew_positions").insert(data));
    }

    if (error) {
      toast.error("Failed to save position");
    } else {
      toast.success(editing ? "Position updated" : "Position created");
      setShowDialog(false);
      setEditing(null);
      resetForm();
      fetchData();
    }
  };

  const resetForm = () => {
    setForm({
      department_id: "",
      show_id: "",
      title: "",
      description: "",
      responsibilities: "",
      required_experience: "",
      gear_required: "",
      rate_type: "daily",
      pay_amount: "",
      schedule_expectations: "",
      location: "",
      is_remote: false,
      terms_conditions: "",
      deadline: "",
      status: "open"
    });
  };

  const handleEdit = (position: CrewPosition) => {
    setEditing(position);
    setForm({
      department_id: position.department_id,
      show_id: position.show_id || "",
      title: position.title,
      description: position.description || "",
      responsibilities: position.responsibilities || "",
      required_experience: position.required_experience || "",
      gear_required: position.gear_required || "",
      rate_type: position.rate_type || "daily",
      pay_amount: position.pay_amount || "",
      schedule_expectations: position.schedule_expectations || "",
      location: position.location || "",
      is_remote: position.is_remote,
      terms_conditions: position.terms_conditions || "",
      deadline: position.deadline || "",
      status: position.status
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this position?")) return;
    const { error } = await supabase.from("crew_positions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Position deleted");
      fetchData();
    }
  };

  const filteredPositions = filterDepartment === "all" 
    ? positions 
    : positions.filter(p => p.department_id === filterDepartment);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Crew Positions</h1>
            <p className="text-muted-foreground">{positions.length} positions total</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Position" : "Add Crew Position"}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Department *</Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Related Show (optional)</Label>
                  <Select value={form.show_id} onValueChange={(v) => setForm({ ...form, show_id: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select show" />
                    </SelectTrigger>
                    <SelectContent>
                      {shows.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Job Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} />
                </div>
                <div className="md:col-span-2">
                  <Label>Responsibilities</Label>
                  <Textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} className="mt-1" rows={3} />
                </div>
                <div>
                  <Label>Required Experience</Label>
                  <Input value={form.required_experience} onChange={(e) => setForm({ ...form, required_experience: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Gear Required</Label>
                  <Input value={form.gear_required} onChange={(e) => setForm({ ...form, gear_required: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Rate Type</Label>
                  <Select value={form.rate_type} onValueChange={(v: any) => setForm({ ...form, rate_type: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                      <SelectItem value="negotiable">Negotiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pay Amount</Label>
                  <Input value={form.pay_amount} onChange={(e) => setForm({ ...form, pay_amount: e.target.value })} placeholder="e.g., $500/day" className="mt-1" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="hold">On Hold</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_remote} onCheckedChange={(v) => setForm({ ...form, is_remote: v })} />
                  <Label>Remote Friendly</Label>
                </div>
                <div className="md:col-span-2">
                  <Label>Schedule Expectations</Label>
                  <Textarea value={form.schedule_expectations} onChange={(e) => setForm({ ...form, schedule_expectations: e.target.value })} className="mt-1" rows={2} />
                </div>
                <div className="md:col-span-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea value={form.terms_conditions} onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })} className="mt-1" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>{editing ? "Update" : "Create"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredPositions.map(position => (
            <Card key={position.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{position.title}</h3>
                      <Badge variant={position.status === "open" ? "default" : "secondary"}>
                        {position.status}
                      </Badge>
                      {position.is_remote && <Badge variant="outline">Remote</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {position.departments?.name}
                      </span>
                      {position.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {position.location}
                        </span>
                      )}
                      {position.pay_amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {position.pay_amount}
                        </span>
                      )}
                    </div>
                    {position.casting_shows && (
                      <p className="text-sm text-primary">For: {position.casting_shows.title}</p>
                    )}
                    {position.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{position.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(position)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(position.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
