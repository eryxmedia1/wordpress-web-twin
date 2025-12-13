import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, GripVertical, Image } from "lucide-react";

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  button_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  title: "",
  subtitle: "",
  image_url: "",
  button_text: "Become a Talent",
  button_url: "/talent/signup",
  is_active: true,
  sort_order: 0,
};

export default function AdminCastingBanners() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('casting_hero_banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error("Failed to fetch banners");
    } else {
      setBanners(data);
    }
    setLoading(false);
  };

  const openForm = (banner?: HeroBanner) => {
    if (banner) {
      setEditingId(banner.id);
      setForm({
        title: banner.title,
        subtitle: banner.subtitle || "",
        image_url: banner.image_url,
        button_text: banner.button_text || "Become a Talent",
        button_url: banner.button_url || "/talent/signup",
        is_active: banner.is_active,
        sort_order: banner.sort_order,
      });
    } else {
      setEditingId(null);
      setForm({ ...emptyForm, sort_order: banners.length });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.image_url.trim()) {
      toast.error("Title and image URL are required");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('casting_hero_banners')
          .update(form)
          .eq('id', editingId);

        if (error) throw error;
        toast.success("Banner updated");
      } else {
        const { error } = await supabase
          .from('casting_hero_banners')
          .insert(form);

        if (error) throw error;
        toast.success("Banner created");
      }

      setIsFormOpen(false);
      fetchBanners();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    const { error } = await supabase
      .from('casting_hero_banners')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      setBanners(banners.filter(b => b.id !== id));
      toast.success("Banner deleted");
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('casting_hero_banners')
      .update({ is_active: active })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update");
    } else {
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: active } : b));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Casting Hero Banners</h1>
            <p className="text-muted-foreground mt-1">Manage the hero banners on the casting page</p>
          </div>
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : banners.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-16 text-center">
              <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No banners yet</p>
              <Button onClick={() => openForm()} className="mt-4">
                Add Your First Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => (
              <Card key={banner.id} className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="cursor-move text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    
                    <div className="w-40 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={banner.image_url} 
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{banner.subtitle}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Button: {banner.button_text} → {banner.button_url}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={banner.is_active}
                          onCheckedChange={(checked) => toggleActive(banner.id, checked)}
                        />
                        <span className="text-sm text-muted-foreground">Active</span>
                      </div>
                      
                      <Button variant="ghost" size="sm" onClick={() => openForm(banner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteBanner(banner.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Banner" : "New Banner"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input 
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Discover Premier Talent"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input 
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="e.g., Connect with exceptional performers"
              />
            </div>

            <div className="space-y-2">
              <Label>Background Image URL *</Label>
              <Input 
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
              {form.image_url && (
                <div className="mt-2 h-32 rounded-lg overflow-hidden bg-muted">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input 
                  value={form.button_text}
                  onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                  placeholder="Become a Talent"
                />
              </div>
              <div className="space-y-2">
                <Label>Button URL</Label>
                <Input 
                  value={form.button_url}
                  onChange={(e) => setForm({ ...form, button_url: e.target.value })}
                  placeholder="/talent/signup"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingId ? "Update" : "Create"} Banner
              </Button>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
