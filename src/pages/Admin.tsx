import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Tv, Plus, Search, Megaphone } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { useNavigate } from "react-router-dom";
import { supabase, DbContent } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AdminContentCard from "@/components/admin/AdminContentCard";

type ContentWithSeasons = DbContent & { seasons?: number };

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [contents, setContents] = useState<ContentWithSeasons[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchContents();
  }, []);

  async function fetchContents() {
    setLoading(true);
    
    try {
      // Fetch movies and shows
      const { data, error } = await supabase
        .from('contents')
        .select(`
          *,
          seasons:seasons(count)
        `)
        .order('created_at', { ascending: false }) as { 
          data: (DbContent & { seasons: { count: number }[] })[] | null; 
          error: any; 
        };
      
      if (error) {
        throw error;
      }

      // Transform data to include season counts
      const transformedData: ContentWithSeasons[] = (data || []).map(item => ({
        ...item,
        seasons: Array.isArray(item.seasons) && item.seasons[0] ? item.seasons[0].count : 0
      }));
      
      setContents(transformedData);
    } catch (error: any) {
      toast.error("Failed to load content: " + error.message);
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
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

  const goToAdManager = () => {
    navigate('/admin/livetv/ads');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition cursor-pointer" onClick={goToMoviesSection}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Film className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Movies</h2>
              <p className="text-gray-400 text-center">
                Manage movies, categories, tags, and playlists
              </p>
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Go to Movies
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition cursor-pointer" onClick={goToTvShowsSection}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Tv className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">TV Shows</h2>
              <p className="text-gray-400 text-center">
                Manage TV shows, episodes, categories, tags, and playlists
              </p>
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Go to TV Shows
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 hover:border-primary/50 transition cursor-pointer" onClick={goToAdManager}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Megaphone className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ad Manager</h2>
              <p className="text-gray-400 text-center">
                Manage ad pods, targeting, placements, and campaigns
              </p>
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Go to Ad Manager
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground ml-4"
            onClick={() => navigate('/admin/content/new')}
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
                  <AdminContentCard
                    key={content.id}
                    content={content}
                    onEdit={handleEditContent}
                    onDelete={handleDeleteContent}
                  />
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
                    <AdminContentCard
                      key={content.id}
                      content={content}
                      onEdit={handleEditContent}
                      onDelete={handleDeleteContent}
                    />
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
                    <AdminContentCard
                      key={content.id}
                      content={content}
                      onEdit={handleEditContent}
                      onDelete={handleDeleteContent}
                    />
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