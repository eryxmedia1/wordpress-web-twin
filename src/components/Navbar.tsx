import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ChevronDown, User, Pencil, HelpCircle, ArrowRightLeft, LayoutGrid, List, Settings, Shield, Crown, Store, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { useProfile, UserProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProfile, profiles, selectProfile } = useProfile();
  const { user, logout, isAdmin } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Genre options for dropdown
  const genres = [
    "Action", "Comedy", "Drama", "Documentary", "Family",
    "Horror", "Romance", "Sci-Fi", "Thriller", "Animation"
  ];

  const tvShowCategories = [
    { label: "Drama", path: "/browse/tv?genre=drama" },
    { label: "Comedy", path: "/browse/tv?genre=comedy" },
    { label: "Reality", path: "/browse/tv?genre=reality" },
    { label: "Talk Shows", path: "/browse/tv?genre=talk" },
    { label: "Documentaries", path: "/browse/tv?genre=documentary" },
  ];

  const movieCategories = [
    { label: "Action", path: "/browse/movies?genre=action" },
    { label: "Comedy", path: "/browse/movies?genre=comedy" },
    { label: "Drama", path: "/browse/movies?genre=drama" },
    { label: "Horror", path: "/browse/movies?genre=horror" },
    { label: "Romance", path: "/browse/movies?genre=romance" },
  ];

  return (
    <header className={`pl-20 pr-4 py-2 flex items-center fixed w-full z-50 transition-colors ${isScrolled ? 'bg-background' : 'bg-background/80'}`}>
      {/* Logo - positioned after sidebar space */}
      <Link to="/browse" className="mr-8 flex-shrink-0">
        <img 
          src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
          alt="Zoe RatedTV" 
          className="h-12 object-contain" 
        />
      </Link>
      
      {/* Main Navigation - Paramount+ Style */}
      <nav className="hidden md:flex items-center gap-1">
        <Link
          to="/browse" 
          className={`px-4 py-2 text-sm font-semibold transition-colors hover:text-primary ${
            location.pathname === '/browse' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          HOME
        </Link>

        {/* Shows Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
            SHOWS <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background/95 backdrop-blur-sm border-border min-w-[180px]">
            <DropdownMenuItem asChild>
              <Link to="/browse/tv" className="cursor-pointer">All TV Shows</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {tvShowCategories.map((cat) => (
              <DropdownMenuItem key={cat.label} asChild>
                <Link to={cat.path} className="cursor-pointer">{cat.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Movies Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
            MOVIES <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background/95 backdrop-blur-sm border-border min-w-[180px]">
            <DropdownMenuItem asChild>
              <Link to="/browse/movies" className="cursor-pointer">All Movies</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {movieCategories.map((cat) => (
              <DropdownMenuItem key={cat.label} asChild>
                <Link to={cat.path} className="cursor-pointer">{cat.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collections Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
            COLLECTIONS <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background/95 backdrop-blur-sm border-border min-w-[180px]">
            <DropdownMenuItem asChild>
              <Link to="/browse/new" className="cursor-pointer">New Releases</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/browse/originals" className="cursor-pointer">Zoe Originals</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/browse/trending" className="cursor-pointer">Trending Now</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/browse/top10" className="cursor-pointer">Top 10</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link 
          to="/indie-channels" 
          className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-colors hover:text-primary ${
            location.pathname.startsWith('/indie-channel') ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Store className="w-4 h-4" />
          CHANNELS
        </Link>

        <Link 
          to="/live" 
          className={`px-4 py-2 text-sm font-semibold transition-colors hover:text-primary ${
            location.pathname.startsWith('/live') ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          LIVE TV
        </Link>

        <Link 
          to="/browse/news" 
          className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          NEWS
        </Link>

        <Link 
          to="/browse/mylist" 
          className={`px-4 py-2 text-sm font-semibold transition-colors hover:text-primary ${
            location.pathname === '/browse/mylist' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          MY LIST
        </Link>

        {/* Admin Link - only visible to admins */}
        {isAdmin && (
          <Link 
            to="/admin" 
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors bg-primary/20 rounded-md hover:bg-primary/30 border border-primary/50 ${
              location.pathname.startsWith('/admin') ? 'text-primary bg-primary/30' : 'text-primary'
            }`}
          >
            <Shield className="h-4 w-4" />
            ADMIN
          </Link>
        )}
      </nav>

      {/* Right Side */}
      <div className="flex items-center gap-4 ml-auto">
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

        {/* Notifications */}
        <NotificationBell />
        
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
              <Link to="/profiles" className="flex items-center gap-3 px-4 py-2">
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
              <Link to="/plans" className="flex items-center gap-3 px-4 py-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span>Manage Subscription</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/help" className="flex items-center gap-3 px-4 py-2">
                <HelpCircle className="h-4 w-4" />
                <span>Help Center</span>
              </Link>
            </DropdownMenuItem>

            {/* Admin Link - only show if user is admin */}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-primary">
                    <Settings className="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}

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
    </header>
  );
};

export default Navbar;
