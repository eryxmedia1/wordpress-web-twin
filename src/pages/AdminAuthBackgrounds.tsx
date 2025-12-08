import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, GripVertical, Eye, ArrowUp, ArrowDown, Image } from "lucide-react";

interface AuthBackground {
  id: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const AdminAuthBackgrounds = () => {
  const navigate = useNavigate();
  const [backgrounds, setBackgrounds] = useState<AuthBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    try {
      const { data, error } = await supabase
        .from("auth_backgrounds")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setBackgrounds(data || []);
    } catch (error) {
      console.error("Error fetching backgrounds:", error);
      toast.error("Failed to load backgrounds");
    } finally {
      setLoading(false);
    }
  };

  const addBackground = async () => {
    if (!newImageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    setAdding(true);
    try {
      const maxSortOrder = backgrounds.length > 0 
        ? Math.max(...backgrounds.map(b => b.sort_order)) + 1 
        : 0;

      const { error } = await supabase
        .from("auth_backgrounds")
        .insert({
          image_url: newImageUrl.trim(),
          sort_order: maxSortOrder,
          is_active: true
        });

      if (error) throw error;
      
      toast.success("Background image added");
      setNewImageUrl("");
      fetchBackgrounds();
    } catch (error) {
      console.error("Error adding background:", error);
      toast.error("Failed to add background");
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("auth_backgrounds")
        .update({ is_active: !currentValue })
        .eq("id", id);

      if (error) throw error;
      
      setBackgrounds(prev => 
        prev.map(b => b.id === id ? { ...b, is_active: !currentValue } : b)
      );
      toast.success(currentValue ? "Background disabled" : "Background enabled");
    } catch (error) {
      console.error("Error toggling background:", error);
      toast.error("Failed to update background");
    }
  };

  const deleteBackground = async (id: string) => {
    if (!confirm("Are you sure you want to delete this background?")) return;

    try {
      const { error } = await supabase
        .from("auth_backgrounds")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setBackgrounds(prev => prev.filter(b => b.id !== id));
      toast.success("Background deleted");
    } catch (error) {
      console.error("Error deleting background:", error);
      toast.error("Failed to delete background");
    }
  };

  const moveBackground = async (id: string, direction: "up" | "down") => {
    const index = backgrounds.findIndex(b => b.id === id);
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === backgrounds.length - 1)
    ) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newBackgrounds = [...backgrounds];
    const temp = newBackgrounds[index];
    newBackgrounds[index] = newBackgrounds[newIndex];
    newBackgrounds[newIndex] = temp;

    // Update sort_order for both items
    const updates = newBackgrounds.map((b, i) => ({
      id: b.id,
      sort_order: i
    }));

    try {
      for (const update of updates) {
        await supabase
          .from("auth_backgrounds")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
      
      setBackgrounds(newBackgrounds.map((b, i) => ({ ...b, sort_order: i })));
      toast.success("Order updated");
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error("Failed to reorder");
    }
  };

  const activeBackgrounds = backgrounds.filter(b => b.is_active);

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <main className="pt-24 px-4 md:px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mobile Auth Backgrounds</h1>
              <p className="text-muted-foreground mt-1">
                Manage the rotating background images on the mobile login/signup screen
              </p>
            </div>
          </div>

          {/* Add New Background */}
          <Card className="mb-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Background Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={addBackground} 
                  disabled={adding || !newImageUrl.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {adding ? "Adding..." : "Add Image"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          {activeBackgrounds.length > 0 && (
            <Card className="mb-8 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview ({activeBackgrounds.length} active)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {activeBackgrounds.map((bg, index) => (
                    <div key={bg.id} className="relative flex-shrink-0">
                      <img
                        src={bg.image_url}
                        alt={`Background ${index + 1}`}
                        className="w-24 h-40 object-cover rounded-lg border border-border"
                      />
                      <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Background List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-5 w-5" />
                All Background Images ({backgrounds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : backgrounds.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No background images added yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your first image above to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backgrounds.map((bg, index) => (
                    <div 
                      key={bg.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        bg.is_active ? "bg-muted/30 border-border" : "bg-muted/10 border-border/50 opacity-60"
                      }`}
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      
                      <img
                        src={bg.image_url}
                        alt={`Background ${index + 1}`}
                        className="w-16 h-24 object-cover rounded-md border border-border"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Image #{index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {bg.image_url}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveBackground(bg.id, "up")}
                          disabled={index === 0}
                          className="h-8 w-8"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveBackground(bg.id, "down")}
                          disabled={index === backgrounds.length - 1}
                          className="h-8 w-8"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${bg.id}`} className="text-sm text-muted-foreground">
                          Active
                        </Label>
                        <Switch
                          id={`active-${bg.id}`}
                          checked={bg.is_active}
                          onCheckedChange={() => toggleActive(bg.id, bg.is_active)}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBackground(bg.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Note */}
          <p className="text-sm text-muted-foreground mt-6 text-center">
            💡 Tip: If no active background images are set, the login screen will show a solid dark background.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminAuthBackgrounds;
