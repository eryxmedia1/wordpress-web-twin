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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Building2, Plus, Edit, Briefcase, Mail, ChevronDown, ChevronRight, Eye, Trash2 } from "lucide-react";
import type { Department, CrewPosition } from "@/types/casting";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<CrewPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [editingPosition, setEditingPosition] = useState<CrewPosition | null>(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_hiring: false,
    contact_email: ""
  });

  const [positionForm, setPositionForm] = useState({
    title: "",
    description: "",
    responsibilities: "",
    status: "open"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [deptRes, posRes] = await Promise.all([
      supabase.from("departments").select("*").order("sort_order"),
      supabase.from("crew_positions").select("*").eq("is_template", true).order("title")
    ]);

    setDepartments(deptRes.data || []);
    setPositions(posRes.data || []);
    setLoading(false);
  };

  const getPositionsForDept = (deptId: string) => positions.filter(p => p.department_id === deptId);
  const getOpenPositionCount = (deptId: string) => positions.filter(p => p.department_id === deptId && p.status === "open").length;

  const toggleExpanded = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const handleSubmit = async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const data = { ...form, slug };

    let error;
    if (editing) {
      ({ error } = await supabase.from("departments").update(data).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("departments").insert(data));
    }

    if (error) {
      toast.error("Failed to save department");
    } else {
      toast.success(editing ? "Department updated" : "Department created");
      setShowDialog(false);
      setEditing(null);
      setForm({ name: "", slug: "", description: "", is_hiring: false, contact_email: "" });
      fetchData();
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
    const { error } = await supabase.from("departments").update({ is_hiring: !dept.is_hiring }).eq("id", dept.id);
    if (error) toast.error("Failed to update");
    else fetchData();
  };

  const handleEditPosition = (pos: CrewPosition) => {
    setEditingPosition(pos);
    setPositionForm({
      title: pos.title,
      description: pos.description || "",
      responsibilities: pos.responsibilities || "",
      status: pos.status
    });
    setShowPositionDialog(true);
  };

  const handleSavePosition = async () => {
    if (!editingPosition) return;
    const { error } = await supabase.from("crew_positions").update(positionForm).eq("id", editingPosition.id);
    if (error) toast.error("Failed to update position");
    else {
      toast.success("Position updated");
      setShowPositionDialog(false);
      setEditingPosition(null);
      fetchData();
    }
  };

  const togglePositionStatus = async (pos: CrewPosition) => {
    const newStatus = pos.status === "open" ? "closed" : "open";
    const { error } = await supabase.from("crew_positions").update({ status: newStatus }).eq("id", pos.id);
    if (error) toast.error("Failed to update");
    else fetchData();
  };

  const handleAddPosition = (deptId: string) => {
    setEditingPosition({ department_id: deptId, is_template: true, id: "", title: "" } as unknown as CrewPosition);
    setPositionForm({ title: "", description: "", responsibilities: "", status: "open" });
    setShowPositionDialog(true);
  };

  const handleCreatePosition = async () => {
    if (!editingPosition?.department_id || !positionForm.title) {
      toast.error("Title is required");
      return;
    }
    const { error } = await supabase.from("crew_positions").insert({
      ...positionForm,
      department_id: editingPosition.department_id,
      is_template: true
    });
    if (error) toast.error("Failed to create position");
    else {
      toast.success("Position created");
      setShowPositionDialog(false);
      setEditingPosition(null);
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
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
            <h1 className="text-3xl font-bold">Departments & Positions</h1>
            <p className="text-muted-foreground">Manage departments and their crew positions</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "", is_hiring: false, contact_email: "" }); }}>
                <Plus className="h-4 w-4 mr-2" />Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Department Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
                <div><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="mt-1" /></div>
                <div className="flex items-center justify-between">
                  <div><Label>Currently Hiring</Label><p className="text-sm text-muted-foreground">Show as "Now Hiring"</p></div>
                  <Switch checked={form.is_hiring} onCheckedChange={(checked) => setForm({ ...form, is_hiring: checked })} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button onClick={handleSubmit}>{editing ? "Update" : "Create"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {departments.map(dept => {
            const deptPositions = getPositionsForDept(dept.id);
            const openCount = getOpenPositionCount(dept.id);
            const isExpanded = expandedDepts.has(dept.id);

            return (
              <Card key={dept.id} className={dept.is_hiring ? "border-green-500/50" : ""}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(dept.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-3 hover:text-primary transition-colors cursor-pointer">
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <Building2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <Badge variant="secondary">{deptPositions.length} positions</Badge>
                        {openCount > 0 && <Badge className="bg-green-500">{openCount} open</Badge>}
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-2">
                        {dept.is_hiring && <Badge className="bg-green-500">Hiring</Badge>}
                        <Switch checked={dept.is_hiring} onCheckedChange={() => toggleHiring(dept)} />
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    {dept.description && <p className="text-sm text-muted-foreground ml-12 mt-1">{dept.description}</p>}
                  </CardHeader>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="ml-12 space-y-2 mt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-sm text-muted-foreground">Positions in this department</h4>
                          <Button size="sm" variant="outline" onClick={() => handleAddPosition(dept.id)}>
                            <Plus className="h-3 w-3 mr-1" />Add Position
                          </Button>
                        </div>
                        {deptPositions.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No positions defined yet</p>
                        ) : (
                          deptPositions.map(pos => (
                            <div key={pos.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{pos.title}</span>
                                  <Badge variant={pos.status === "open" ? "default" : "secondary"} className="text-xs">
                                    {pos.status}
                                  </Badge>
                                </div>
                                {pos.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{pos.description}</p>}
                              </div>
                              <div className="flex items-center gap-1">
                                <Switch checked={pos.status === "open"} onCheckedChange={() => togglePositionStatus(pos)} />
                                <Button variant="ghost" size="icon" onClick={() => handleEditPosition(pos)}><Edit className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Position Edit Dialog */}
      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPosition?.id ? "Edit Position" : "Add Position"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Position Title *</Label><Input value={positionForm.title} onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={positionForm.description} onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })} className="mt-1" rows={3} /></div>
            <div><Label>Responsibilities</Label><Textarea value={positionForm.responsibilities} onChange={(e) => setPositionForm({ ...positionForm, responsibilities: e.target.value })} className="mt-1" rows={4} placeholder="• Bullet point responsibilities..." /></div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPositionDialog(false)}>Cancel</Button>
              <Button onClick={editingPosition?.id ? handleSavePosition : handleCreatePosition}>
                {editingPosition?.id ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
