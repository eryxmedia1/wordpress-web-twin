import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Edit, Users, Briefcase, Mail } from "lucide-react";
import type { Department } from "@/types/casting";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [positionCounts, setPositionCounts] = useState<Record<string, number>>({});
  
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_hiring: false,
    contact_email: ""
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select("*")
      .order("sort_order");

    setDepartments(data || []);

    // Fetch position counts
    const { data: positions } = await supabase
      .from("crew_positions")
      .select("department_id")
      .eq("status", "open");

    const counts: Record<string, number> = {};
    positions?.forEach(p => {
      counts[p.department_id] = (counts[p.department_id] || 0) + 1;
    });
    setPositionCounts(counts);

    setLoading(false);
  };

  const handleSubmit = async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const data = {
      ...form,
      slug
    };

    let error;
    if (editing) {
      ({ error } = await supabase
        .from("departments")
        .update(data)
        .eq("id", editing.id));
    } else {
      ({ error } = await supabase
        .from("departments")
        .insert(data));
    }

    if (error) {
      toast.error("Failed to save department");
    } else {
      toast.success(editing ? "Department updated" : "Department created");
      setShowDialog(false);
      setEditing(null);
      setForm({ name: "", slug: "", description: "", is_hiring: false, contact_email: "" });
      fetchDepartments();
    }
  };

  const handleEdit = (dept: Department) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      slug: dept.slug,
      description: dept.description || "",
      is_hiring: dept.is_hiring,
      contact_email: dept.contact_email || ""
    });
    setShowDialog(true);
  };

  const toggleHiring = async (dept: Department) => {
    const { error } = await supabase
      .from("departments")
      .update({ is_hiring: !dept.is_hiring })
      .eq("id", dept.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      fetchDepartments();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground">Manage production departments and hiring status</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "", is_hiring: false, contact_email: "" }); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Department Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Camera"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>URL Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto-generated from name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What this department does, common positions..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    placeholder="department@example.com"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Currently Hiring</Label>
                    <p className="text-sm text-muted-foreground">Show as "Now Hiring" on public pages</p>
                  </div>
                  <Switch
                    checked={form.is_hiring}
                    onCheckedChange={(checked) => setForm({ ...form, is_hiring: checked })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button onClick={handleSubmit}>{editing ? "Update" : "Create"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <Card key={dept.id} className={dept.is_hiring ? "border-green-500" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {dept.is_hiring && <Badge className="bg-green-500">Hiring</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {dept.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {positionCounts[dept.id] || 0} open positions
                    </span>
                  </div>
                  <Switch
                    checked={dept.is_hiring}
                    onCheckedChange={() => toggleHiring(dept)}
                  />
                </div>

                {dept.contact_email && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <Mail className="h-3 w-3" />
                    {dept.contact_email}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
