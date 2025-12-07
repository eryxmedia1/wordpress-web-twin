import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, User, Pencil, HelpCircle, ArrowRightLeft, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem
} from "@/components/ui/navigation-menu";
import { useProfile, UserProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProfile, profiles, selectProfile } = useProfile();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(12);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleProfileSwitch = (profile: UserProfile) => {
    selectProfile(profile);
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return (
      <header className="bg-background/95 px-4 py-4 flex items-center">
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

  if (!user && isLandingPage) {
    return (
      <header className={`px-4 py-4 flex items-center justify-between fixed w-full z-50 transition-colors ${isScrolled ? 'bg-background' : 'bg-transparent'}`}>
        <Link to="/">
          <img 
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
            alt="Zoe RatedTV" 
            className="h-16 object-contain" 
          />
        </Link>
        <Link to="/login">
          <Button variant="outline" className="bg-transparent border-foreground text-foreground hover:bg-foreground/10">
            Sign In
          </Button>
        </Link>
      </header>
    );
  }

  return (
    <header className={`px-4 py-2 flex flex-col fixed w-full z-50 transition-colors ${isScrolled ? 'bg-background' : 'bg-background/80'}`}>
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
          {/* Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/50 border border-border rounded-full px-4 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-40 focus:w-56 transition-all text-foreground"
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              className="absolute right-0 top-0 text-muted-foreground"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Kids Link */}
          <Link 
            to="/browse/kids" 
            className="hidden md:block text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Kids
          </Link>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-foreground">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {notificationCount}
              </span>
            )}
          </Button>
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-foreground p-1">
                <div 
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: currentProfile?.avatar_color || "#d4af37" }}
                >
                  <User className="h-5 w-5 text-background" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-sm border-border">
              {/* Profile List */}
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Switch Profile</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <LayoutGrid className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <List className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileSwitch(profile)}
                    className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors ${
                      currentProfile?.id === profile.id ? "bg-accent" : ""
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: profile.avatar_color || "#d4af37" }}
                    >
                      <User className="h-4 w-4 text-background" />
                    </div>
                    <span className="text-sm text-foreground">{profile.name}</span>
                  </button>
                ))}
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/profiles" className="flex items-center gap-3 px-4 py-2">
                  <Pencil className="h-4 w-4" />
                  <span>Manage Profiles</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/transfer-profile" className="flex items-center gap-3 px-4 py-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Transfer Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/account" className="flex items-center gap-3 px-4 py-2">
                  <User className="h-4 w-4" />
                  <span>Account</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/help" className="flex items-center gap-3 px-4 py-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help Center</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem 
                onClick={handleSignOut}
                className="cursor-pointer px-4 py-2"
              >
                Sign out of Zoe RatedTV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <NavigationMenu className="max-w-none justify-start mt-1">
        <NavigationMenuList className="gap-1">
          <NavigationMenuItem>
            <Link to="/browse" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-accent ${location.pathname === '/browse' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/tv" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-accent ${location.pathname === '/browse/tv' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              TV Shows
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/movies" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-accent ${location.pathname === '/browse/movies' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Movies
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/new" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-accent ${location.pathname === '/browse/new' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              New & Popular
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/mylist" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-accent ${location.pathname === '/browse/mylist' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              My List
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/browse/genres" className={`text-sm px-3 py-1 rounded-sm transition duration-200 hover:bg-accent ${location.pathname === '/browse/genres' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Browse by Genres
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};

export default Navbar;
