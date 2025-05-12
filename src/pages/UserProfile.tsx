
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, Clock, Film, Plus, Settings, User, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UserProfile = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([
    { id: 1, name: "Main Profile", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MP", isKids: false },
    { id: 2, name: "Kids", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=KD", isKids: true },
  ]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("You must be logged in to view your profile");
          navigate("/login");
          return;
        }
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setIsAdmin(profile?.is_admin || false);
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminStatus();
  }, [navigate]);

  // Mock data for continue watching
  const continueWatching = [
    { id: 1, title: "Stranger Things", progress: 65, image: "https://via.placeholder.com/400x225?text=Stranger+Things", time: "S3:E4 - 24m remaining" },
    { id: 2, title: "The Queen's Gambit", progress: 32, image: "https://via.placeholder.com/400x225?text=The+Queens+Gambit", time: "45m remaining" },
    { id: 3, title: "Breaking Bad", progress: 78, image: "https://via.placeholder.com/400x225?text=Breaking+Bad", time: "S2:E8 - 12m remaining" },
  ];

  // Mock data for saved content
  const savedContent = [
    { id: 1, title: "The Crown", image: "https://via.placeholder.com/400x225?text=The+Crown" },
    { id: 2, title: "Ozark", image: "https://via.placeholder.com/400x225?text=Ozark" },
    { id: 3, title: "Narcos", image: "https://via.placeholder.com/400x225?text=Narcos" },
    { id: 4, title: "The Witcher", image: "https://via.placeholder.com/400x225?text=The+Witcher" },
  ];

  // Mock data for recommendations
  const recommendations = [
    { id: 1, title: "Money Heist", image: "https://via.placeholder.com/400x225?text=Money+Heist", match: "98% Match" },
    { id: 2, title: "Dark", image: "https://via.placeholder.com/400x225?text=Dark", match: "95% Match" },
    { id: 3, title: "Mindhunter", image: "https://via.placeholder.com/400x225?text=Mindhunter", match: "91% Match" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold">Profiles</h1>
          <Button className="bg-[#e50914] hover:bg-[#f6121d] mt-4 md:mt-0">
            <Plus className="mr-2" /> Add Profile
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
          {profiles.map(profile => (
            <div key={profile.id} className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4 cursor-pointer hover:ring-4 hover:ring-[#e50914] transition-all">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-medium">{profile.name}</h3>
              {profile.isKids && <span className="text-sm text-gray-400">Kids</span>}
              <Link to={`/profile/${profile.id}`}>
                <Button variant="outline" className="mt-2">Manage</Button>
              </Link>
            </div>
          ))}
          <div className="flex flex-col items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition">
              <UserPlus className="h-12 w-12 text-gray-400" />
            </div>
            <span className="mt-4 text-lg">Add Profile</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Current Profile: Main Profile</h2>
        
        <Tabs defaultValue="continue" className="w-full">
          <TabsList className="bg-gray-900 text-gray-400 mb-6">
            <TabsTrigger value="continue" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Clock className="mr-2" /> Continue Watching
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Bookmark className="mr-2" /> My List
            </TabsTrigger>
            <TabsTrigger value="recommended" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Film className="mr-2" /> Recommended
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
                <Settings className="mr-2" /> Admin
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="continue">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {continueWatching.map(item => (
                <Link to={`/watch/${item.id}`} key={item.id}>
                  <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:scale-105 transition cursor-pointer">
                    <div className="relative">
                      <img src={item.image} alt={item.title} className="w-full object-cover aspect-video" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <h3 className="text-lg font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-400">{item.time}</p>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                        <div className="h-full bg-[#e50914]" style={{ width: `${item.progress}%` }}></div>
                      </div>
                    </div>
                    <CardContent className="p-4 pt-2">
                      <div className="flex justify-between">
                        <Button variant="ghost" size="sm">Play</Button>
                        <Button variant="ghost" size="sm">Start Over</Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {savedContent.map(item => (
                <Link to={`/watch/${item.id}`} key={item.id}>
                  <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:scale-105 transition cursor-pointer">
                    <div className="relative">
                      <img src={item.image} alt={item.title} className="w-full object-cover aspect-video" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <h3 className="text-lg font-medium">{item.title}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <Button className="w-full bg-[#e50914] hover:bg-[#f6121d]">Play</Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recommended">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendations.map(item => (
                <Link to={`/watch/${item.id}`} key={item.id}>
                  <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:scale-105 transition cursor-pointer">
                    <div className="relative">
                      <img src={item.image} alt={item.title} className="w-full object-cover aspect-video" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <h3 className="text-lg font-medium">{item.title}</h3>
                        <span className="text-sm text-green-500">{item.match}</span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <Button className="w-full bg-[#e50914] hover:bg-[#f6121d]">Play</Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="admin">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Admin Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-medium mb-4">Content Management</h4>
                      <p className="text-gray-400 mb-4">Manage movies, shows, seasons, and episodes</p>
                      <Link to="/admin">
                        <Button className="w-full bg-[#e50914] hover:bg-[#f6121d]">
                          Go to Admin Dashboard
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-medium mb-4">Add New Content</h4>
                      <p className="text-gray-400 mb-4">Create new movies or TV shows</p>
                      <Link to="/admin/content/new">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          Add New Content
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-medium mb-4">User Management</h4>
                      <p className="text-gray-400 mb-4">View and manage user accounts</p>
                      <Button className="w-full bg-gray-700 hover:bg-gray-600">
                        Manage Users
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-medium mb-4">Analytics</h4>
                      <p className="text-gray-400 mb-4">View platform usage and statistics</p>
                      <Button className="w-full bg-gray-700 hover:bg-gray-600">
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
