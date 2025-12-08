
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Film, Tv, Search, LogOut, Home, Tag, Crown, Trophy, ImageIcon, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  return (
    <header className="bg-black/95 px-4 py-2 flex items-center justify-between fixed w-full z-50 border-b border-gray-800">
      <div className="flex items-center gap-8">
        <Link to="/admin">
          <img 
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
            alt="Zoe RatedTV" 
            className="h-16 object-contain" 
          />
        </Link>
        
        <nav className="hidden md:flex space-x-4">
          <Link to="/admin" className="text-white hover:text-gray-300 transition">Dashboard</Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 text-white hover:text-gray-300">
                <Film className="h-4 w-4 mr-1" />
                Movies
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-gray-800 text-white border-gray-700">
              <DropdownMenuItem>
                <Link to="/admin/movies" className="w-full">All Movies</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/movies/add" className="w-full">Add Movie</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/movies/categories" className="w-full">Categories</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/movies/tags" className="w-full">Tags</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/movies/playlists" className="w-full">Playlists</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 text-white hover:text-gray-300">
                <Tv className="h-4 w-4 mr-1" />
                TV Shows
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-gray-800 text-white border-gray-700">
              <DropdownMenuItem>
                <Link to="/admin/tvshows" className="w-full">All TV Shows</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/tvshows/add" className="w-full">Add TV Show</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/tvshows/categories" className="w-full">Categories</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/tvshows/tags" className="w-full">Tags</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/tvshows/episodes" className="w-full">Episodes</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/tvshows/playlists" className="w-full">Playlists</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link to="/browse" className="flex items-center gap-1 text-white hover:text-gray-300 transition">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link to="/admin/tags" className="flex items-center gap-1 text-white hover:text-gray-300 transition">
            <Tag className="h-4 w-4" />
            Tags
          </Link>
          <Link to="/admin/plans" className="flex items-center gap-1 text-amber-500 hover:text-amber-400 transition">
            <Crown className="h-4 w-4" />
            Plans
          </Link>
          <Link to="/admin/top10" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition">
            <Trophy className="h-4 w-4" />
            Top 10
          </Link>
          <Link to="/admin/auth-backgrounds" className="flex items-center gap-1 text-white hover:text-gray-300 transition">
            <ImageIcon className="h-4 w-4" />
            Backgrounds
          </Link>
          <Link to="/admin/users" className="flex items-center gap-1 text-green-400 hover:text-green-300 transition">
            <Users className="h-4 w-4" />
            Users
          </Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-white">
          <Search className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-gray-800 text-white border-gray-700">
            <DropdownMenuLabel>{user?.email || 'Admin'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/admin/settings" className="w-full">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/" className="w-full">View Site</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:text-destructive/90">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminNavbar;
