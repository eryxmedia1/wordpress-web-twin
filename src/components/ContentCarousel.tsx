
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Content {
  id: string;
  title: string;
  posterUrl: string;
  rating?: string;
  year?: string;
  category?: string;
}

interface ContentCarouselProps {
  contents: Content[];
}

const ContentCarousel = ({ contents }: ContentCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftControl, setShowLeftControl] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    
    const { scrollLeft, clientWidth } = carouselRef.current;
    const scrollAmount = direction === "left" 
      ? scrollLeft - clientWidth / 2 
      : scrollLeft + clientWidth / 2;
      
    carouselRef.current.scrollTo({
      left: scrollAmount,
      behavior: "smooth"
    });
  };
  
  const handleScroll = () => {
    if (!carouselRef.current) return;
    setShowLeftControl(carouselRef.current.scrollLeft > 20);
  };
  
  return (
    <div className="relative group">
      {/* Left control */}
      {showLeftControl && (
        <Button 
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 border-none rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      {/* Right control */}
      <Button 
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 border-none rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      
      {/* Content */}
      <div 
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        ref={carouselRef}
        onScroll={handleScroll}
      >
        {contents.map((content) => (
          <div 
            key={content.id}
            className={`flex-none transition-all duration-300 ease-in-out ${
              hoveredId === content.id ? "w-[350px]" : "w-[180px]"
            }`}
            onMouseEnter={() => setHoveredId(content.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {hoveredId === content.id ? (
              <div className="h-full w-full bg-black/90 rounded-lg overflow-hidden border border-gray-800 shadow-xl animate-fade-in">
                <div className="relative">
                  <img 
                    src={content.posterUrl}
                    alt={content.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-bold text-white truncate mb-1">{content.title}</h3>
                    <div className="text-xs text-gray-300 mb-3 flex items-center">
                      {content.year} {content.category && `• ${content.category}`}
                      {content.rating && 
                        <span className="ml-auto bg-purple-600 text-white px-1.5 py-0.5 rounded-sm">
                          {content.rating}
                        </span>
                      }
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link to={`/watch/${content.id}?trailer=true`}>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 rounded-full px-4">
                          <Play className="h-4 w-4 mr-1" />
                          Trailer
                        </Button>
                      </Link>
                      <Link to={`/watch/${content.id}`}>
                        <Button variant="outline" size="sm" className="rounded-full border-white/40 hover:bg-white/10 px-4">
                          <Info className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="block relative cursor-pointer overflow-hidden">
                <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2">
                  <img 
                    src={content.posterUrl}
                    alt={content.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                  {content.rating && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-1.5 py-0.5 text-xs rounded-sm">
                      {content.rating}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium truncate">{content.title}</h3>
                <div className="text-xs text-gray-400">
                  {content.year} {content.category && `• ${content.category}`}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentCarousel;
