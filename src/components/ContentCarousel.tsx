
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
          <Link 
            key={content.id} 
            to={`/watch/${content.id}`} 
            className="flex-none w-[180px]"
          >
            <div className="relative aspect-[2/3] rounded-md overflow-hidden mb-2">
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
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContentCarousel;
