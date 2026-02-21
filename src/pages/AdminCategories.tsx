import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, DbCategory, ContentType } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminCategories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [contentType, setContentType] = useState<ContentType>("movie");
  const navigate = useNavigate();
  const { type } = useParams();

  useEffect(() => {
    // Set content type based on URL parameter
    if (type === "movies") {
      setContentType("movie");
    } else if (type === "tvshows") {
      setContentType("show");
    }
    
    fetchCategories();
  }, [type]);

  async function fetchCategories(contentType?: ContentType) {
    setLoading(true);
    
    // Fetch categories based on content type
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('content_type', contentType || contentType)
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
    
    if (!newCategoryName || !newCategorySlug) {
      toast.error("Name and slug are required");
      return;
    }
    
    // Auto-generate slug if needed
    const slugToUse = newCategorySlug || newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    setLoading(true);
    
    // Add proper typing to match DbCategory insert requirements
    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategoryName,
        slug: slugToUse,
        description: newCategoryDescription || null,
        content_type: contentType as ContentType // Ensure it's cast as ContentType
      });
    
    if (error) {
      toast.error("Failed to create category: " + error.message);
    } else {
      toast.success("Category created successfully");
      setNewCategoryName("");
      setNewCategorySlug("");
      setNewCategoryDescription("");
      // No need to reset contentType as it defaults to a valid value
      fetchCategories(contentType);
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

  const handleBulkAction = async (action: string) => {
    if (selectedCategories.length === 0) {
      toast.error("No categories selected");
      return;
    }
    
    if (action === 'delete') {
      handleDeleteCategories();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <h1 className="text-3xl font-bold mb-6">
          {contentType === 'movie' ? 'Movie' : 'TV Show'} Category Management
        </h1>
        
        <div className="mb-6">
          <div className="flex gap-4">
            <Button
              variant={contentType === 'movie' ? "default" : "outline"}
              onClick={() => navigate('/admin/movies/categories')}
            >
              Movie Categories
            </Button>
            <Button
              variant={contentType === 'show' ? "default" : "outline"}
              onClick={() => navigate('/admin/tvshows/categories')}
            >
              TV Show Categories
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add New Category Form */}
          <div className="md:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Add New Category</h2>
                
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block mb-2">Name</label>
                    <Input 
                      type="text"
                      className="bg-gray-900 border-gray-700 text-white"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                    />
                    <p className="text-gray-400 text-sm mt-1">The name is how it appears on your site.</p>
                  </div>
                  
                  <div>
                    <label className="block mb-2">Slug</label>
                    <div className="flex gap-2">
                      <Input 
                        type="text"
                        className="bg-gray-900 border-gray-700 text-white flex-1"
                        value={newCategorySlug}
                        onChange={(e) => setNewCategorySlug(e.target.value)}
                        placeholder="enter-category-slug"
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
                    <p className="text-gray-400 text-sm mt-1">The "slug" is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.</p>
                  </div>
                  
                  <div>
                    <label className="block mb-2">Parent Category</label>
                    <Select defaultValue="none">
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="none">None</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-gray-400 text-sm mt-1">Assign a parent term to create a hierarchy. The term Jazz, for example, would be the parent of Bebop and Big Band.</p>
                  </div>
                  
                  <div>
                    <label className="block mb-2">Description</label>
                    <Textarea
                      className="bg-gray-900 border-gray-700 text-white"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Enter category description (optional)"
                      rows={4}
                    />
                    <p className="text-gray-400 text-sm mt-1">The description is not prominent by default; however, some themes may show it.</p>
                  </div>
                  
                  <Button 
                    type="submit"
                    className="bg-[#e50914] hover:bg-[#f6121d] w-full"
                    disabled={loading || !newCategoryName}
                  >
                    Add New Category
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Categories List */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  type="text"
                  placeholder="Search categories..."
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 ml-4">
                <select 
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  onChange={(e) => handleBulkAction(e.target.value)}
                  value=""
                >
                  <option value="" disabled>Bulk actions</option>
                  <option value="delete">Delete</option>
                </select>
                
                <Button
                  variant="outline"
                  disabled={selectedCategories.length === 0}
                  onClick={() => handleBulkAction('delete')}
                >
                  Apply
                </Button>
              </div>
            </div>
            
            <Card className="bg-gray-800 border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-700">
                    <tr>
                      <th className="p-4 text-left">
                        <Checkbox 
                          checked={filteredCategories.length > 0 && selectedCategories.length === filteredCategories.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left">Slug</th>
                      <th className="p-4 text-left">Count</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center">Loading categories...</td>
                      </tr>
                    ) : filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center">No categories found</td>
                      </tr>
                    ) : (
                      filteredCategories.map((category) => (
                        <tr key={category.id} className="border-b border-gray-700">
                          <td className="p-4">
                            <Checkbox 
                              checked={selectedCategories.includes(category.id)}
                              onCheckedChange={() => toggleCategorySelection(category.id)}
                            />
                          </td>
                          <td className="p-4">{category.name}</td>
                          <td className="p-4">{category.description || "—"}</td>
                          <td className="p-4">{category.slug}</td>
                          <td className="p-4">0</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 flex justify-between items-center text-sm text-gray-400">
                <div>{filteredCategories.length} items</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
