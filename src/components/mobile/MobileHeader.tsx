import { Cast, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MobileHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
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

        {/* Right icons */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-foreground hover:text-primary transition-colors">
            <Cast className="w-5 h-5" />
          </button>
          <button className="p-2 text-foreground hover:text-primary transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
