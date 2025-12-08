import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { useNavigate } from "react-router-dom";
import { supabase, DbTag, ContentType } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminTags = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState<DbTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagSlug, setNewTagSlug] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [newTagContentType, setNewTagContentType] = useState<ContentType | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    fetchTags();
  }, []);

  async function checkAdminStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to access the admin area");
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null };
    
    if (!profile?.is_admin) {
      toast.error("You don't have permission to access the admin area");
      navigate("/");
    }
  }

  async function fetchTags() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error("Failed to load tags: " + error.message);
      setLoading(false);
      return;
    }
    
    // Fetch content counts for each tag
    const tagsWithCounts = await Promise.all(
      (data || []).map(async (tag) => {
        const { count } = await supabase
          .from('content_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);
        
        return { ...tag, content_count: count || 0 };
      })
    );
    
    setTags(tagsWithCounts as any);
    setLoading(false);
  }

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTagName || !newTagSlug) {
      toast.error("Name and slug are required");
      return;
    }
    
    // Auto-generate slug if needed
    const slugToUse = newTagSlug || newTagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    setLoading(true);
    
    const { error } = await supabase
      .from('tags')
      .insert({
        name: newTagName,
        slug: slugToUse,
        description: newTagDescription || null,
        content_type: newTagContentType  // This can be null as it's optional in the schema
      });
    
    if (error) {
      toast.error("Failed to create tag: " + error.message);
    } else {
      toast.success("Tag created successfully");
      setNewTagName("");
      setNewTagSlug("");
      setNewTagDescription("");
      setNewTagContentType(null);
      fetchTags();
    }
    
    setLoading(false);
  };

  const handleDeleteTags = async () => {
    if (selectedTags.length === 0) {
      toast.error("No tags selected");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedTags.length} tag(s)?`)) {
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase
      .from('tags')
      .delete()
      .in('id', selectedTags);
    
    if (error) {
      toast.error("Failed to delete tags: " + error.message);
    } else {
      toast.success(`${selectedTags.length} tag(s) deleted successfully`);
      setSelectedTags([]);
      fetchTags();
    }
    
    setLoading(false);
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTags.length === filteredTags.length) {
      setSelectedTags([]);
    } else {
      setSelectedTags(filteredTags.map(tag => tag.id));
    }
  };

  const handleGenerateSlug = () => {
    if (newTagName) {
      const slug = newTagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setNewTagSlug(slug);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTags.length === 0) {
      toast.error("No tags selected");
      return;
    }
    
    if (action === 'delete') {
      handleDeleteTags();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <h1 className="text-3xl font-bold mb-6">Tag Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add New Tag Form */}
          <div className="md:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Add New Tag</h2>
                
                <form onSubmit={handleCreateTag} className="space-y-4">
                  <div>
                    <label className="block mb-2">Name</label>
                    <Input 
                      type="text"
                      className="bg-gray-900 border-gray-700 text-white"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter tag name"
                    />
                    <p className="text-gray-400 text-sm mt-1">The name is how it appears on your site.</p>
                  </div>
                  
                  <div>
                    <label className="block mb-2">Slug</label>
                    <div className="flex gap-2">
                      <Input 
                        type="text"
                        className="bg-gray-900 border-gray-700 text-white flex-1"
                        value={newTagSlug}
                        onChange={(e) => setNewTagSlug(e.target.value)}
                        placeholder="enter-tag-slug"
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
                    <label className="block mb-2">Description</label>
                    <Textarea
                      className="bg-gray-900 border-gray-700 text-white"
                      value={newTagDescription}
                      onChange={(e) => setNewTagDescription(e.target.value)}
                      placeholder="Enter tag description (optional)"
                      rows={4}
                    />
                    <p className="text-gray-400 text-sm mt-1">The description is not prominent by default; however, some themes may show it.</p>
                  </div>
                  
                  <div>
                    <label className="block mb-2">Content Type (Optional)</label>
                    <select
                      className="w-full bg-gray-900 border-gray-700 text-white rounded p-2"
                      value={newTagContentType || ""}
                      onChange={(e) => setNewTagContentType(e.target.value ? e.target.value as ContentType : null)}
                    >
                      <option value="">Select content type</option>
                      <option value="movie">Movie</option>
                      <option value="show">TV Show</option>
                    </select>
                    <p className="text-gray-400 text-sm mt-1">Optionally associate this tag with a specific content type.</p>
                  </div>
                  
                  <Button 
                    type="submit"
                    className="bg-[#e50914] hover:bg-[#f6121d] w-full"
                    disabled={loading || !newTagName}
                  >
                    Add New Tag
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Tags List */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  type="text"
                  placeholder="Search tags..."
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
                  disabled={selectedTags.length === 0}
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
                          checked={filteredTags.length > 0 && selectedTags.length === filteredTags.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left">Content Type</th>
                      <th className="p-4 text-left">Slug</th>
                      <th className="p-4 text-left">Count</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center">Loading tags...</td>
                      </tr>
                    ) : filteredTags.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center">No tags found</td>
                      </tr>
                    ) : (
                      filteredTags.map((tag) => (
                        <tr key={tag.id} className="border-b border-gray-700">
                          <td className="p-4">
                            <Checkbox 
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => toggleTagSelection(tag.id)}
                            />
                          </td>
                          <td className="p-4">{tag.name}</td>
                          <td className="p-4 text-muted-foreground max-w-xs truncate">
                            {(tag as any).description || "—"}
                          </td>
                          <td className="p-4">{tag.content_type || "All"}</td>
                          <td className="p-4 text-muted-foreground">{tag.slug}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                              {(tag as any).content_count || 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 flex justify-between items-center text-sm text-gray-400">
                <div>{filteredTags.length} items</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTags;
