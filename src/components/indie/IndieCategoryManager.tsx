import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, GripVertical, Pencil, Video, Loader2, FolderPlus } from "lucide-react";

interface IndieCategoryManagerProps {
  channelId: string;
  maxRows: number;
  contents: Array<{ id: string; title: string; poster_url: string | null }>;
  onUpdate: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  itemCount: number;
}

interface CategoryItem {
  id: string;
  content_id: string;
  sort_order: number;
}

const IndieCategoryManager = ({ channelId, maxRows, contents, onUpdate }: IndieCategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryItems, setCategoryItems] = useState<string[]>([]);
  
  // Form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [channelId]);

  const fetchCategories = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("indie_channel_categories")
      .select("*")
      .eq("indie_channel_id", channelId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } else {
      // Get item counts for each category
      const categoriesWithCounts = await Promise.all((data || []).map(async (cat) => {
        const { count } = await supabase
          .from("indie_channel_category_items")
          .select("*", { count: "exact", head: true })
          .eq("category_id", cat.id);
        
        return { ...cat, itemCount: count || 0 };
      }));
      
      setCategories(categoriesWithCounts);
    }
    
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    if (categories.length >= maxRows) {
      toast.error(`You can only create ${maxRows} categories (rows)`);
      return;
    }

    setSaving(true);
    
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    const { error } = await supabase
      .from("indie_channel_categories")
      .insert({
        indie_channel_id: channelId,
        name: newName.trim(),
        slug,
        description: newDescription.trim() || null,
        sort_order: categories.length
      });

    if (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } else {
      toast.success("Category created!");
      setNewName("");
      setNewDescription("");
      setIsAddOpen(false);
      fetchCategories();
      onUpdate();
    }
    
    setSaving(false);
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory || !newName.trim()) return;

    setSaving(true);
    
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    const { error } = await supabase
      .from("indie_channel_categories")
      .update({
        name: newName.trim(),
        slug,
        description: newDescription.trim() || null
      })
      .eq("id", selectedCategory.id);

    if (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } else {
      toast.success("Category updated!");
      setIsEditOpen(false);
      setSelectedCategory(null);
      fetchCategories();
      onUpdate();
    }
    
    setSaving(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const { error } = await supabase
      .from("indie_channel_categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } else {
      toast.success("Category deleted");
      fetchCategories();
      onUpdate();
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setNewName(category.name);
    setNewDescription(category.description || "");
    setIsEditOpen(true);
  };

  const openAssignDialog = async (category: Category) => {
    setSelectedCategory(category);
    
    // Fetch current items
    const { data } = await supabase
      .from("indie_channel_category_items")
      .select("content_id")
      .eq("category_id", category.id);
    
    setCategoryItems(data?.map(d => d.content_id) || []);
    setIsAssignOpen(true);
  };

  const handleToggleContent = (contentId: string) => {
    setCategoryItems(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedCategory) return;

    setSaving(true);

    // Delete existing items
    await supabase
      .from("indie_channel_category_items")
      .delete()
      .eq("category_id", selectedCategory.id);

    // Insert new items
    if (categoryItems.length > 0) {
      const inserts = categoryItems.map((contentId, index) => ({
        category_id: selectedCategory.id,
        content_id: contentId,
        sort_order: index
      }));

      const { error } = await supabase
        .from("indie_channel_category_items")
        .insert(inserts);

      if (error) {
        console.error("Error saving assignments:", error);
        toast.error("Failed to save assignments");
        setSaving(false);
        return;
      }
    }

    toast.success("Videos assigned to category");
    setIsAssignOpen(false);
    setSelectedCategory(null);
    setCategoryItems([]);
    fetchCategories();
    onUpdate();
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Categories</h3>
          <p className="text-sm text-muted-foreground">
            {categories.length} / {maxRows} categories used
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2" 
              disabled={categories.length >= maxRows}
            >
              <FolderPlus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Category Name *</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Comedy Shorts"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCategory} disabled={saving || !newName.trim()}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <p className="text-sm text-muted-foreground">
              Create categories to organize your videos into custom rows on your channel page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.itemCount} videos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAssignDialog(category)}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Assign Videos
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCategory} disabled={saving || !newName.trim()}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Videos Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Assign Videos to "{selectedCategory?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 overflow-y-auto max-h-[50vh]">
            {contents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No videos available. Upload videos first.
              </p>
            ) : (
              contents.map((content) => (
                <div 
                  key={content.id} 
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                  onClick={() => handleToggleContent(content.id)}
                >
                  <Checkbox
                    checked={categoryItems.includes(content.id)}
                    onCheckedChange={() => handleToggleContent(content.id)}
                  />
                  <div className="w-16 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                    {content.poster_url ? (
                      <img src={content.poster_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium truncate">{content.title}</span>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save ({categoryItems.length} selected)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndieCategoryManager;
