import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Tv, Plus, Search, Trash } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, DbContent } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddTVShowForm from "@/components/AddTVShowForm";

type TvShowWithSeasonCount = DbContent & {
  seasonCount: number;
};

const AdminTvShows = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tvShows, setTvShows] = useState<TvShowWithSeasonCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { section } = useParams();
  const activeTab = section || "all";
  const navigate = useNavigate();

  useEffect(() => {
    fetchTvShows();
  }, []);

  async function fetchTvShows() {
    setLoading(true);
    
    try {
      // First, fetch all TV shows
      const { data: shows, error } = await supabase
        .from('contents')
        .select('*')
        .eq('type', 'show')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // For each show, count its seasons
      const showsWithSeasonCounts = await Promise.all((shows || []).map(async (show) => {
        const { count, error: countError } = await supabase
          .from('seasons')
          .select('*', { count: 'exact', head: true })
          .eq('content_id', show.id);
        
        return {
          ...show,
          seasonCount: count || 0
        };
      }));
      
      setTvShows(showsWithSeasonCounts);
    } catch (error: any) {
      toast.error("Failed to load TV shows: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTvShows = tvShows.filter(show => 
    show.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddNewTvShow = () => {
    navigate('/admin/tvshows/add');
  };
  
  const handleEditTvShow = (id: string) => {
    navigate(`/admin/content/${id}`);
  };
  
  const handleDeleteTvShow = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this TV show?")) {
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Failed to delete TV show: " + error.message);
      } else {
        toast.success("TV show deleted successfully");
        fetchTvShows();
      }
    }
  };

  const handleNavigateToTab = (tab: string) => {
    if (tab === "all") {
      navigate("/admin/tvshows");
    } else {
      navigate(`/admin/tvshows/${tab}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <div className="mt-6">
            {loading ? (
              <p className="text-center">Loading TV shows...</p>
            ) : filteredTvShows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTvShows.map(show => (
                  <Card key={show.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-medium">{show.title}</h3>
                          <div className="flex items-center mt-2 text-gray-400">
                            <Tv className="w-4 h-4 mr-1" /> TV Show • {show.seasonCount} Season{show.seasonCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white"
                            onClick={() => handleEditTvShow(show.id)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-400"
                            onClick={() => handleDeleteTvShow(show.id)}
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
              <p className="text-center">No TV shows found. Add some TV shows to get started!</p>
            )}
          </div>
        );
      case "add":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Add New TV Show</h2>
            <AddTVShowForm onClose={() => navigate('/admin/tvshows')} />
          </div>
        );
      case "categories":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">TV Show Categories</h2>
            <p>Manage categories for your TV shows.</p>
            <Button 
              className="mt-4 bg-[#e50914] hover:bg-[#f6121d]"
              onClick={() => navigate("/admin/tvshows/categories")}
            >
              Manage Categories
            </Button>
          </div>
        );
      case "tags":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">TV Show Tags</h2>
            <p>Manage tags for all your content.</p>
            <Button 
              className="mt-4 bg-[#e50914] hover:bg-[#f6121d]"
              onClick={() => navigate("/admin/tags")}
            >
              Manage Tags
            </Button>
          </div>
        );
      case "episodes":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">TV Show Episodes</h2>
            <p>Select a TV show from the list to manage its episodes.</p>
          </div>
        );
      case "playlists":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">TV Show Playlists</h2>
            <p>Manage playlists for your TV shows.</p>
          </div>
        );
      default:
        return (
          <div className="mt-6">
            <p className="text-center">Section not found</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <h1 className="text-3xl font-bold mb-6">TV Show Management</h1>
        
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              type="text"
              placeholder="Search TV shows..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            className="bg-[#e50914] hover:bg-[#f6121d] ml-4"
            onClick={handleAddNewTvShow}
          >
            <Plus className="mr-2" /> Add New TV Show
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleNavigateToTab} className="w-full">
          <TabsList className="bg-gray-800 text-gray-400 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">All TV Shows</TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Add TV Show</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Categories</TabsTrigger>
            <TabsTrigger value="tags" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Tags</TabsTrigger>
            <TabsTrigger value="episodes" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Episodes</TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Playlists</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminTvShows;
