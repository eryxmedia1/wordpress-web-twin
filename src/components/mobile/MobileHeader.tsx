import { useState } from "react";
import { Cast, Bell, Menu, Home, Film, Tv, Radio, Heart, User, Crown, HelpCircle, LogOut, ChevronDown, Clapperboard, Users, Layers } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Avatar icon mapping
const AVATAR_ICONS: Record<string, string> = {
  smile: "😊",
  star: "⭐",
  heart: "❤️",
  fire: "🔥",
  music: "🎵",
  game: "🎮",
  movie: "🎬",
  book: "📚",
};

const MobileHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { currentProfile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [moviesOpen, setMoviesOpen] = useState(false);
  const [tvShowsOpen, setTvShowsOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItemClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive(path)
        ? "bg-primary/20 text-primary"
        : "text-foreground hover:bg-muted"
    }`;

  const subMenuItemClass = (path: string) =>
    `flex items-center gap-3 px-4 py-2.5 pl-12 rounded-lg transition-colors text-sm ${
      isActive(path)
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const getAvatarIcon = () => {
    if (currentProfile?.avatar_icon) {
      return AVATAR_ICONS[currentProfile.avatar_icon] || currentProfile.avatar_icon;
    }
    return currentProfile?.name?.charAt(0) || user?.email?.charAt(0) || "U";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent md:hidden">
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        {/* Left side - Menu and Logo */}
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="p-2 text-foreground hover:text-primary transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-background border-r border-border p-0 overflow-y-auto">
              {/* Profile Section */}
              <div className="p-6 bg-gradient-to-b from-primary/10 to-transparent">
                <div className="flex items-center gap-3">
                  <Avatar 
                    className="h-12 w-12 border-2 border-primary"
                    style={{ backgroundColor: currentProfile?.avatar_color || "hsl(var(--primary))" }}
                  >
                    <AvatarFallback 
                      className="text-lg"
                      style={{ backgroundColor: currentProfile?.avatar_color || "hsl(var(--primary))" }}
                    >
                      {getAvatarIcon()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {currentProfile?.name || "Guest"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || "Not signed in"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-1">
                {/* Main Navigation */}
                <button
                  onClick={() => handleNavigate("/browse")}
                  className={menuItemClass("/browse")}
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>

                {/* Movies with submenu */}
                <Collapsible open={moviesOpen} onOpenChange={setMoviesOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className={`${menuItemClass("/browse/movies")} justify-between`}>
                      <div className="flex items-center gap-3">
                        <Film className="w-5 h-5" />
                        <span>Movies</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${moviesOpen ? "rotate-180" : ""}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    <button onClick={() => handleNavigate("/category/movie")} className={subMenuItemClass("/category/movie")}>
                      All Movies
                    </button>
                    <button onClick={() => handleNavigate("/genre/action?type=movie")} className={subMenuItemClass("/genre/action")}>
                      Action
                    </button>
                    <button onClick={() => handleNavigate("/genre/comedy?type=movie")} className={subMenuItemClass("/genre/comedy")}>
                      Comedy
                    </button>
                    <button onClick={() => handleNavigate("/genre/drama?type=movie")} className={subMenuItemClass("/genre/drama")}>
                      Drama
                    </button>
                    <button onClick={() => handleNavigate("/genre/horror?type=movie")} className={subMenuItemClass("/genre/horror")}>
                      Horror
                    </button>
                    <button onClick={() => handleNavigate("/genre/romance?type=movie")} className={subMenuItemClass("/genre/romance")}>
                      Romance
                    </button>
                  </CollapsibleContent>
                </Collapsible>

                {/* TV Shows with submenu */}
                <Collapsible open={tvShowsOpen} onOpenChange={setTvShowsOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className={`${menuItemClass("/browse/tv")} justify-between`}>
                      <div className="flex items-center gap-3">
                        <Tv className="w-5 h-5" />
                        <span>TV Shows</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${tvShowsOpen ? "rotate-180" : ""}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    <button onClick={() => handleNavigate("/category/tv")} className={subMenuItemClass("/category/tv")}>
                      All TV Shows
                    </button>
                    <button onClick={() => handleNavigate("/genre/drama?type=show")} className={subMenuItemClass("/genre/drama")}>
                      Drama
                    </button>
                    <button onClick={() => handleNavigate("/genre/comedy?type=show")} className={subMenuItemClass("/genre/comedy")}>
                      Comedy
                    </button>
                    <button onClick={() => handleNavigate("/genre/reality?type=show")} className={subMenuItemClass("/genre/reality")}>
                      Reality
                    </button>
                    <button onClick={() => handleNavigate("/genre/documentary?type=show")} className={subMenuItemClass("/genre/documentary")}>
                      Documentaries
                    </button>
                  </CollapsibleContent>
                </Collapsible>

                <button
                  onClick={() => handleNavigate("/live")}
                  className={menuItemClass("/live")}
                >
                  <Radio className="w-5 h-5" />
                  <span>Live TV</span>
                </button>

                <button
                  onClick={() => handleNavigate("/indie-channels")}
                  className={menuItemClass("/indie-channels")}
                >
                  <Layers className="w-5 h-5" />
                  <span>Channels</span>
                </button>

                <button
                  onClick={() => handleNavigate("/casting")}
                  className={menuItemClass("/casting")}
                >
                  <Clapperboard className="w-5 h-5" />
                  <span>Casting Calls</span>
                </button>

                <button
                  onClick={() => handleNavigate("/casting/crew")}
                  className={menuItemClass("/casting/crew")}
                >
                  <Users className="w-5 h-5" />
                  <span>Crew Hiring</span>
                </button>

                <Separator className="my-3" />

                {/* Collections */}
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Collections
                </p>

                <button
                  onClick={() => handleNavigate("/browse/mylist")}
                  className={menuItemClass("/browse/mylist")}
                >
                  <Heart className="w-5 h-5" />
                  <span>My List</span>
                </button>

                <button
                  onClick={() => handleNavigate("/notifications")}
                  className={menuItemClass("/notifications")}
                >
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </button>

                <Separator className="my-3" />

                {/* Account Section */}
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account
                </p>

                <button
                  onClick={() => handleNavigate("/account")}
                  className={menuItemClass("/account")}
                >
                  <User className="w-5 h-5" />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={() => handleNavigate("/plans")}
                  className={menuItemClass("/plans")}
                >
                  <Crown className="w-5 h-5" />
                  <span>Manage Subscription</span>
                </button>

                <button
                  onClick={() => handleNavigate("/help")}
                  className={menuItemClass("/help")}
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Help Center</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleNavigate("/admin")}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-gold/20 text-gold hover:bg-gold/30"
                  >
                    <Crown className="w-5 h-5" />
                    <span>Admin Dashboard</span>
                  </button>
                )}

                <Separator className="my-3" />

                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-destructive hover:bg-destructive/10 w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigate("/login")}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                  >
                    <User className="w-5 h-5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div 
            className="cursor-pointer"
            onClick={() => navigate("/browse")}
          >
            <img 
              src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
              alt="Zoe RatedTV" 
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-foreground hover:text-primary transition-colors">
            <Cast className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate("/notifications")}
            className="p-2 text-foreground hover:text-primary transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
