import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Trash2 } from "lucide-react";
import { supabase, DbCategory, ContentType } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoriesTabProps {
  contentType?: ContentType;
}

const CategoriesTab = ({ contentType = "show" }: CategoriesTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  useEffect(() => {
    fetchCategories();
  }, [contentType]);

  async function fetchCategories() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('content_type', contentType)
      .order('name');
    
    if (error) {
      toast.error("Failed to load categories: " + error.message);
    } else {
      setCategories(data || []);
    }
    
    setLoading(false);
  }

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName) {
      toast.error("Category name is required");
      return;
    }
    
    const slugToUse = newCategorySlug || newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    setLoading(true);
    
    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategoryName,
        slug: slugToUse,
        description: newCategoryDescription || null,
        content_type: contentType
      });
    
    if (error) {
      toast.error("Failed to create category: " + error.message);
    } else {
      toast.success("Category created successfully");
      setNewCategoryName("");
      setNewCategorySlug("");
      setNewCategoryDescription("");
      fetchCategories();
    }
    
    setLoading(false);
  };

  const handleDeleteCategories = async () => {
    if (selectedCategories.length === 0) {
      toast.error("No categories selected");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedCategories.length} category(ies)?`)) {
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .in('id', selectedCategories);
    
    if (error) {
      toast.error("Failed to delete categories: " + error.message);
    } else {
      toast.success(`${selectedCategories.length} category(ies) deleted successfully`);
      setSelectedCategories([]);
      fetchCategories();
    }
    
    setLoading(false);
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(category => category.id));
    }
  };

  const handleGenerateSlug = () => {
    if (newCategoryName) {
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setNewCategorySlug(slug);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">
        {contentType === 'movie' ? 'Movie' : 'TV Show'} Categories
      </h2>
      <p className="text-gray-400 mb-6">Manage categories for your {contentType === 'movie' ? 'movies' : 'TV shows'}.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add New Category Form */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Add New Category</h3>
              
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm">Name</label>
                  <Input 
                    type="text"
                    className="bg-gray-900 border-gray-700 text-white"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm">Slug</label>
                  <div className="flex gap-2">
                    <Input 
                      type="text"
                      className="bg-gray-900 border-gray-700 text-white flex-1"
                      value={newCategorySlug}
                      onChange={(e) => setNewCategorySlug(e.target.value)}
                      placeholder="auto-generated-slug"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleGenerateSlug}
                      size="sm"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm">Description</label>
                  <Textarea
                    className="bg-gray-900 border-gray-700 text-white"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 w-full"
                  disabled={loading || !newCategoryName}
                >
                  Add Category
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Categories List */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                type="text"
                placeholder="Search categories..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {selectedCategories.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteCategories}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedCategories.length})
              </Button>
            )}
          </div>
          
          <Card className="bg-gray-800 border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="p-4 text-left w-10">
                      <Checkbox 
                        checked={filteredCategories.length > 0 && selectedCategories.length === filteredCategories.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Slug</th>
                    <th className="p-4 text-left">Description</th>
                  </tr>
                </thead>
                
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-400">Loading categories...</td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-400">
                        {searchTerm ? "No categories match your search" : "No categories yet. Create one above!"}
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => (
                      <tr key={category.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-4">
                          <Checkbox 
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() => toggleCategorySelection(category.id)}
                          />
                        </td>
                        <td className="p-4 font-medium">{category.name}</td>
                        <td className="p-4 text-gray-400 text-sm">{category.slug}</td>
                        <td className="p-4 text-gray-400 text-sm">{category.description || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
              {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CategoriesTab;
