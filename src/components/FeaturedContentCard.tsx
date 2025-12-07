import { Button } from "@/components/ui/button";
import { Play, Info, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface FeaturedContentCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  rating: string;
  duration: string;
  genre: string;
}

const FeaturedContentCard = ({
  id,
  title,
  description,
  imageUrl,
  rating,
  duration,
  genre
}: FeaturedContentCardProps) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#2d1b4e]">
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="relative w-full md:w-1/2 h-64 md:h-80">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a2e] hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] to-transparent md:hidden" />
        </div>
        
        {/* Content Section */}
        <div className="relative w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-3">
            <span className="px-3 py-1 bg-purple-600/30 text-purple-400 text-xs font-medium rounded-full">
              {genre}
            </span>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{rating}</span>
            </div>
            <span className="text-gray-400 text-sm">{duration}</span>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h3>
          
          <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
            {description}
          </p>
          
          <div className="flex gap-3">
            <Button asChild className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Link to={`/watch/${id}`}>
                <Play className="w-4 h-4" />
                Watch Now
              </Link>
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
              <Info className="w-4 h-4" />
              Detail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedContentCard;
