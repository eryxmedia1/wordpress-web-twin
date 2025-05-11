
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Info, Play } from "lucide-react";

// Mock data for content rows
const contentRows = [
  {
    id: 1,
    title: "Popular on Zoe RatedTV",
    items: Array(10).fill(null).map((_, i) => ({
      id: `pop-${i}`,
      title: `Popular Title ${i+1}`,
      image: `https://picsum.photos/300/170?random=${i+1}`,
    }))
  },
  {
    id: 2,
    title: "Trending Now",
    items: Array(10).fill(null).map((_, i) => ({
      id: `trend-${i}`,
      title: `Trending Title ${i+1}`,
      image: `https://picsum.photos/300/170?random=${i+20}`,
    }))
  },
  {
    id: 3,
    title: "New Releases",
    items: Array(10).fill(null).map((_, i) => ({
      id: `new-${i}`,
      title: `New Release ${i+1}`,
      image: `https://picsum.photos/300/170?random=${i+40}`,
    }))
  },
  {
    id: 4,
    title: "Zoe RatedTV Originals",
    items: Array(10).fill(null).map((_, i) => ({
      id: `orig-${i}`,
      title: `Zoe RatedTV Original ${i+1}`,
      image: `https://picsum.photos/300/170?random=${i+60}`,
    }))
  },
];

const Browse = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This would be replaced with actual auth state
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading and auth check
  useEffect(() => {
    setTimeout(() => {
      // For demo, we'll consider user is logged in
      setIsLoggedIn(true);
      setIsLoading(false);
    }, 1500);
  }, []);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoading, isLoggedIn, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <img 
          src="/lovable-uploads/5806b50d-0fbb-4e69-bec1-5c2d43f7d0bd.png" 
          alt="Zoe RatedTV Logo" 
          className="h-20 animate-pulse" 
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="relative w-full h-[80vh] overflow-hidden">
        {/* This would be a video or hero image */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
        <img 
          src="https://picsum.photos/1920/1080?random=1" 
          alt="Hero Banner"
          className="w-full h-full object-cover object-center" 
        />
        
        <div className="absolute bottom-[20%] left-[5%] z-20 max-w-xl">
          <img 
            src="/lovable-uploads/5806b50d-0fbb-4e69-bec1-5c2d43f7d0bd.png" 
            alt="Show Logo" 
            className="w-72 mb-6" 
          />
          <h1 className="text-4xl font-bold mb-4">Featured Title</h1>
          <p className="text-lg mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, justo ac ultricies lacinia, nisl nisl aliquet nisl.
          </p>
          <div className="flex gap-3">
            <Button 
              className="bg-white text-black hover:bg-white/80 font-medium text-lg px-8 gap-2"
              onClick={() => navigate("/watch/featured")}
            >
              <Play className="h-5 w-5" /> Play
            </Button>
            <Button 
              className="bg-gray-500/70 text-white hover:bg-gray-500/90 font-medium text-lg px-8 gap-2"
              onClick={() => navigate("/details/featured")}
            >
              <Info className="h-5 w-5" /> More Info
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content Rows */}
      <div className="mt-[-150px] relative z-30 pb-20">
        {contentRows.map((row) => (
          <div key={row.id} className="px-[5%] mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4">{row.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
              {row.items.slice(0, 5).map((item) => (
                <div 
                  key={item.id} 
                  className="relative rounded-md overflow-hidden cursor-pointer transition-transform hover:scale-105 group"
                  onClick={() => navigate(`/watch/${item.id}`)}
                >
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-auto object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Play className="h-12 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Browse;
