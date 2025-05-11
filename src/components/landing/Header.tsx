
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-black/95 px-4 py-4 flex items-center justify-between fixed w-full z-50">
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
};

export default Header;
