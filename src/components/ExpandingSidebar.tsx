import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Film, 
  Video, 
  Radio, 
  Tv, 
  ShoppingBag, 
  Search,
  Users,
  Menu,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Users, label: "Casting Calls", path: "/casting" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Home, label: "Home", path: "/browse" },
  { icon: Film, label: "Movies", path: "/category/movie" },
  { icon: Video, label: "Videos", path: "/indie-channels" },
  { icon: Radio, label: "Live Stream", path: "/live" },
  { icon: Tv, label: "TV Shows", path: "/category/tv" },
  { icon: ShoppingBag, label: "Shop", path: "/browse" },
];

const ExpandingSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full z-50 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border-r border-white/10 transition-all duration-300 ease-in-out flex flex-col",
        isExpanded ? "w-56" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo & Menu Toggle */}
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        {isExpanded && (
          <span className="text-xl font-bold text-white animate-fade-in">
            Zoe<span className="text-purple-500">Rated</span>
          </span>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-purple-600 text-white" 
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Account */}
      <div className="p-4 border-t border-white/10">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          {isExpanded && (
            <span className="text-sm font-medium animate-fade-in">Account</span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default ExpandingSidebar;
