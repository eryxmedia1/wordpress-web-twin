
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, User, Film, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  NavigationMenu, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuItem
} from "@/components/ui/navigation-menu";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // This would be replaced with actual auth state
  const [searchQuery, setSearchQuery] = useState("");

  // Change navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';
  
  // Don't show full navbar on login/signup pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return (
      <header className="bg-black/95 px-4 py-4 flex items-center">
        <Link to="/">
          <img 
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
            alt="Zoe RatedTV" 
            className="h-16 object-contain" 
          />
        </Link>
      </header>
    );
  }

  if (!isLoggedIn && isLandingPage) {
    return (
      <header className={`px-4 py-4 flex items-center justify-between fixed w-full z-50 transition-colors ${isScrolled ? 'bg-black' : 'bg-transparent'}`}>
        <div className="flex items-center">
          <Link to="/">
            <img 
              src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
              alt="Zoe RatedTV" 
              className="h-16 object-contain" 
            />
          </Link>
        </div>
        
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
    );
  }

  // Full navbar for logged-in users
  return (
    <header className={`px-4 py-2 flex flex-col fixed w-full z-50 transition-colors ${isScrolled ? 'bg-black' : 'bg-black/80'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/browse">
            <img 
              src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
              alt="Zoe RatedTV" 
              className="h-16 object-contain" 
            />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/50 border border-gray-600 rounded-full px-4 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 w-40 focus:w-56 transition-all"
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              className="absolute right-0 top-0 text-gray-400"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          <Button variant="ghost" size="icon" className="text-white">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-white">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 text-white border-gray-700">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800">
                <Link to="/profile" className="w-full flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800">
                <Link to="/profile/watchlist" className="w-full flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  <span>My List</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800">
                <Link to="/account" className="w-full flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Account Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800">
                <Link to="/logout" className="w-full">
                  Sign Out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <NavigationMenu className="max-w-none justify-start mt-1">
        <NavigationMenuList className="gap-1">
          <NavigationMenuItem>
            <Link to="/browse" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-gray-800 ${location.pathname === '/browse' ? 'text-white font-medium' : 'text-gray-300'}`}>
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/tv" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-gray-800 ${location.pathname === '/browse/tv' ? 'text-white font-medium' : 'text-gray-300'}`}>
              TV Shows
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/movies" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-gray-800 ${location.pathname === '/browse/movies' ? 'text-white font-medium' : 'text-gray-300'}`}>
              Movies
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/new" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-gray-800 ${location.pathname === '/browse/new' ? 'text-white font-medium' : 'text-gray-300'}`}>
              New & Popular
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/mylist" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-gray-800 ${location.pathname === '/browse/mylist' ? 'text-white font-medium' : 'text-gray-300'}`}>
              My List
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/genres" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-gray-800 ${location.pathname === '/browse/genres' ? 'text-white font-medium' : 'text-gray-300'}`}>
              Browse by Genres
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};

export default Navbar;
