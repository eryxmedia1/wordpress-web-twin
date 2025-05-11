
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Film, Search } from "lucide-react";

const AdminNavbar = () => {
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
          <Link to="/admin/content/new" className="text-white hover:text-gray-300 transition">Add Content</Link>
          <Link to="/admin/users" className="text-white hover:text-gray-300 transition">Users</Link>
          <Link to="/admin/analytics" className="text-white hover:text-gray-300 transition">Analytics</Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-white">
          <Search className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/admin/settings" className="w-full">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/" className="w-full">View Site</Link>
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

export default AdminNavbar;
