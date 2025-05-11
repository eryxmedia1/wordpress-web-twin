
import { Button } from "@/components/ui/button";
import { Play, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface Content {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  rating?: string;
  year?: string;
  length?: string;
  category?: string;
}

interface HeroBannerProps {
  content: Content;
}

const HeroBanner = ({ content }: HeroBannerProps) => {
  return (
    <div className="relative h-[80vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={content.backdropUrl || content.posterUrl}
          alt={content.title}
          className="w-full h-full object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 md:px-16">
        <div className="max-w-2xl">
          <div className="mb-2 text-xs uppercase tracking-wider text-purple-400">
            NEW ON ZOE RATEDTV • {content.year}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{content.title}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-purple-600 text-white px-2 py-0.5 text-xs rounded-sm">
              {content.rating}/10
            </span>
            {content.year && <span className="text-sm">{content.year}</span>}
            {content.length && <span className="text-sm">{content.length}</span>}
            {content.category && <span className="text-sm">{content.category}</span>}
          </div>
          
          <p className="text-gray-300 mb-8 line-clamp-4 md:line-clamp-none">
            {content.description}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to={`/watch/${content.id}`}>
              <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                <Play className="h-4 w-4" /> Watch Now
              </Button>
            </Link>
            <Button variant="outline" className="border-gray-400 text-white gap-2">
              <Plus className="h-4 w-4" /> My List
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0F0F1F] to-transparent" />
    </div>
  );
};

export default HeroBanner;
