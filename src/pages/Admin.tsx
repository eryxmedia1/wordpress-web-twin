
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Tv, Plus, Search, Upload } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for demonstration
  const mockVideos = [
    { id: 1, title: "Stranger Things", type: "show", seasons: 4 },
    { id: 2, title: "The Queen's Gambit", type: "show", seasons: 1 },
    { id: 3, title: "Extraction", type: "movie", duration: "1h 58m" },
    { id: 4, title: "The Irishman", type: "movie", duration: "3h 29m" },
  ];

  const filteredVideos = mockVideos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
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
          
          <Button className="bg-[#e50914] hover:bg-[#f6121d] ml-4">
            <Plus className="mr-2" /> Add New Content
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-gray-800 text-gray-400 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">All Content</TabsTrigger>
            <TabsTrigger value="movies" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Movies</TabsTrigger>
            <TabsTrigger value="shows" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">TV Shows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <Card key={video.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium">{video.title}</h3>
                      <div className="flex items-center mt-2 text-gray-400">
                        {video.type === "movie" ? (
                          <><Film className="w-4 h-4 mr-1" /> Movie · {video.duration}</>
                        ) : (
                          <><Tv className="w-4 h-4 mr-1" /> TV Show · {video.seasons} Season{video.seasons > 1 ? 's' : ''}</>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-white">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="movies" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos
                .filter(video => video.type === "movie")
                .map(video => (
                  <Card key={video.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-medium">{video.title}</h3>
                          <div className="flex items-center mt-2 text-gray-400">
                            <Film className="w-4 h-4 mr-1" /> Movie · {video.duration}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-white">Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="shows" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos
                .filter(video => video.type === "show")
                .map(video => (
                  <Card key={video.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-medium">{video.title}</h3>
                          <div className="flex items-center mt-2 text-gray-400">
                            <Tv className="w-4 h-4 mr-1" /> TV Show · {video.seasons} Season{video.seasons > 1 ? 's' : ''}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-white">Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
