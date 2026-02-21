
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, DbContent } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddMovieForm from "@/components/AddMovieForm";
import MovieCard from "@/components/admin/MovieCard";

const AdminMovies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [movies, setMovies] = useState<DbContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { section } = useParams();
  const activeTab = section || "all";
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
  }, []);

  async function fetchMovies() {
    setLoading(true);
    
    // Fetch movies
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('type', 'movie')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Failed to load movies: " + error.message);
      setLoading(false);
      return;
    }
    
    setMovies(data || []);
    setLoading(false);
  }

  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddNewMovie = () => {
    navigate('/admin/movies/add');
  };
  
  const handleEditMovie = (id: string) => {
    navigate(`/admin/content/${id}`);
  };
  
  const handleDeleteMovie = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Failed to delete movie: " + error.message);
      } else {
        toast.success("Movie deleted successfully");
        fetchMovies();
      }
    }
  };

  const handleNavigateToTab = (tab: string) => {
    if (tab === "all") {
      navigate("/admin/movies");
    } else {
      navigate(`/admin/movies/${tab}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <div className="mt-6">
            {loading ? (
              <p className="text-center">Loading movies...</p>
            ) : filteredMovies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMovies.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onEdit={handleEditMovie}
                    onDelete={handleDeleteMovie}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center">No movies found. Add some movies to get started!</p>
            )}
          </div>
        );
      case "add":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Add New Movie</h2>
            <AddMovieForm />
          </div>
        );
      case "categories":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Movie Categories</h2>
            <p>Manage categories for your movies.</p>
            <Button 
              className="mt-4 bg-[#e50914] hover:bg-[#f6121d]"
              onClick={() => navigate("/admin/movies/categories")}
            >
              Manage Categories
            </Button>
          </div>
        );
      case "tags":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Movie Tags</h2>
            <p>Manage tags for all your content.</p>
            <Button 
              className="mt-4 bg-[#e50914] hover:bg-[#f6121d]"
              onClick={() => navigate("/admin/tags")}
            >
              Manage Tags
            </Button>
          </div>
        );
      case "playlists":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Movie Playlists</h2>
            <p>Manage playlists for your movies.</p>
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
        <h1 className="text-3xl font-bold mb-6">Movie Management</h1>
        
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              type="text"
              placeholder="Search movies..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            className="bg-[#e50914] hover:bg-[#f6121d] ml-4"
            onClick={handleAddNewMovie}
          >
            <Plus className="mr-2" /> Add New Movie
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleNavigateToTab} className="w-full">
          <TabsList className="bg-gray-800 text-gray-400 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">All Movies</TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Add Movie</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Categories</TabsTrigger>
            <TabsTrigger value="tags" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Tags</TabsTrigger>
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

export default AdminMovies;
