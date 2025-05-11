
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This would be replaced with actual auth state

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
            alt="ZOE" 
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
              alt="ZOE" 
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
    <header className={`px-4 py-2 flex items-center justify-between fixed w-full z-50 transition-colors ${isScrolled ? 'bg-black' : 'bg-black/80'}`}>
      <div className="flex items-center gap-8">
        <Link to="/browse">
          <img 
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
            alt="ZOE" 
            className="h-16 object-contain" 
          />
        </Link>
        
        <nav className="hidden md:flex space-x-4">
          <Link to="/browse" className="text-white hover:text-gray-300 transition">Home</Link>
          <Link to="/browse/tv" className="text-white hover:text-gray-300 transition">TV Shows</Link>
          <Link to="/browse/movies" className="text-white hover:text-gray-300 transition">Movies</Link>
          <Link to="/browse/new" className="text-white hover:text-gray-300 transition">New & Popular</Link>
          <Link to="/browse/mylist" className="text-white hover:text-gray-300 transition">My List</Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-white">
          <Search className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="text-white">
          <Bell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded bg-blue-600"></div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/profile" className="w-full">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/account" className="w-full">Account Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/logout" className="w-full">Sign Out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
