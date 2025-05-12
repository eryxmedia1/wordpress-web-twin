
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Tv, Plus, Search, Trash } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { useNavigate } from "react-router-dom";
import { supabase, DbContent, DbProfile } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Content {
  id: string;
  title: string;
  type: 'movie' | 'show';
  duration?: string;
  seasons?: number;
}

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to access the admin area");
        navigate("/login");
        return;
      }

      // Use type assertion to work with the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single() as { data: DbProfile | null };
      
      if (!profile?.is_admin) {
        toast.error("You don't have permission to access the admin area");
        navigate("/");
      }
    }

    checkAdminStatus();
    fetchContents();
  }, [navigate]);

  async function fetchContents() {
    setLoading(true);
    
    // Fetch movies and shows
    // Use type assertion to work with the contents table
    const { data, error } = await supabase
      .from('contents')
      .select(`
        id, 
        title, 
        type,
        duration,
        seasons:seasons(count)
      `)
      .order('created_at', { ascending: false }) as { 
        data: (DbContent & { seasons: { count: number } })[] | null; 
        error: any; 
      };
    
    if (error) {
      toast.error("Failed to load content: " + error.message);
      setLoading(false);
      return;
    }

    // Transform data to include season counts
    const transformedData = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      duration: item.duration,
      seasons: item.seasons?.count || 0
    }));
    
    setContents(transformedData);
    setLoading(false);
  }

  const filteredContents = contents.filter(content => 
    content.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddNewContent = () => {
    navigate('/admin/content/new');
  };
  
  const handleEditContent = (id: string) => {
    navigate(`/admin/content/${id}`);
  };
  
  const handleDeleteContent = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      // Use type assertion to work with the contents table
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id) as { error: any };
      
      if (error) {
        toast.error("Failed to delete content: " + error.message);
      } else {
        toast.success("Content deleted successfully");
        fetchContents();
      }
    }
  };

  const goToMoviesSection = () => {
    navigate('/admin/movies');
  };

  const goToTvShowsSection = () => {
    navigate('/admin/tvshows');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition cursor-pointer" onClick={goToMoviesSection}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Film className="h-16 w-16 text-[#e50914] mb-4" />
              <h2 className="text-2xl font-bold mb-2">Movies</h2>
              <p className="text-gray-400 text-center">
                Manage movies, categories, tags, and playlists
              </p>
              <Button className="mt-4 bg-[#e50914] hover:bg-[#f6121d]">
                Go to Movies
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition cursor-pointer" onClick={goToTvShowsSection}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Tv className="h-16 w-16 text-[#e50914] mb-4" />
              <h2 className="text-2xl font-bold mb-2">TV Shows</h2>
              <p className="text-gray-400 text-center">
                Manage TV shows, episodes, categories, tags, and playlists
              </p>
              <Button className="mt-4 bg-[#e50914] hover:bg-[#f6121d]">
                Go to TV Shows
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Recent Content</h2>
        
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              type="text"
              placeholder="Search content..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            className="bg-[#e50914] hover:bg-[#f6121d] ml-4"
            onClick={handleAddNewContent}
          >
            <Plus className="mr-2" /> Add New Content
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-gray-800 text-gray-400 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">All Content</TabsTrigger>
            <TabsTrigger value="movies" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Movies</TabsTrigger>
            <TabsTrigger value="shows" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">TV Shows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {loading ? (
              <p className="text-center">Loading content...</p>
            ) : filteredContents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContents.map(content => (
                  <Card key={content.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-medium">{content.title}</h3>
                          <div className="flex items-center mt-2 text-gray-400">
                            {content.type === "movie" ? (
                              <><Film className="w-4 h-4 mr-1" /> Movie · {content.duration}</>
                            ) : (
                              <><Tv className="w-4 h-4 mr-1" /> TV Show · {content.seasons} Season{content.seasons !== 1 ? 's' : ''}</>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white"
                            onClick={() => handleEditContent(content.id)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-400"
                            onClick={() => handleDeleteContent(content.id)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center">No content found. Add some new content to get started!</p>
            )}
          </TabsContent>
          
          <TabsContent value="movies" className="mt-6">
            {loading ? (
              <p className="text-center">Loading content...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContents
                  .filter(content => content.type === "movie")
                  .map(content => (
                    <Card key={content.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-medium">{content.title}</h3>
                            <div className="flex items-center mt-2 text-gray-400">
                              <Film className="w-4 h-4 mr-1" /> Movie · {content.duration}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-white"
                              onClick={() => handleEditContent(content.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-400"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="shows" className="mt-6">
            {loading ? (
              <p className="text-center">Loading content...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContents
                  .filter(content => content.type === "show")
                  .map(content => (
                    <Card key={content.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-medium">{content.title}</h3>
                            <div className="flex items-center mt-2 text-gray-400">
                              <Tv className="w-4 h-4 mr-1" /> TV Show · {content.seasons} Season{content.seasons !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-white"
                              onClick={() => handleEditContent(content.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-400"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
