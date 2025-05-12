
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { useNavigate, useParams } from "react-router-dom";
import AddTVShowForm from "@/components/AddTVShowForm";
import TvShowsList from "@/components/admin/TvShowsList";
import CategoriesTab from "@/components/admin/tabs/CategoriesTab";
import TagsTab from "@/components/admin/tabs/TagsTab";
import EpisodesTab from "@/components/admin/tabs/EpisodesTab";
import PlaylistsTab from "@/components/admin/tabs/PlaylistsTab";

const AdminTvShows = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { section } = useParams();
  const activeTab = section || "all";
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddNewTvShow = () => {
    navigate('/admin/tvshows/add');
  };
  
  const handleEditTvShow = (id: string) => {
    navigate(`/admin/content/${id}`);
  };

  const handleNavigateToTab = (tab: string) => {
    if (tab === "all") {
      navigate("/admin/tvshows");
    } else {
      navigate(`/admin/tvshows/${tab}`);
    }
  };

  const refreshList = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <div className="mt-6">
            <TvShowsList 
              searchTerm={searchTerm} 
              onEdit={handleEditTvShow} 
              onRefresh={refreshList}
              key={refreshTrigger} // Force re-render on refresh
            />
          </div>
        );
      case "add":
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Add New TV Show</h2>
            <AddTVShowForm onClose={() => navigate('/admin/tvshows')} />
          </div>
        );
      case "categories":
        return <CategoriesTab />;
      case "tags":
        return <TagsTab />;
      case "episodes":
        return <EpisodesTab />;
      case "playlists":
        return <PlaylistsTab />;
      default:
        return (
          <div className="mt-6">
            <p className="text-center text-white">Section not found</p>
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
