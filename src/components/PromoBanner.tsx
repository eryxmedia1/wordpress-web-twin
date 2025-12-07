import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface PromoBannerProps {
  title: string;
  subtitle: string;
  date: string;
  imageUrl: string;
}

const PromoBanner = ({ title, subtitle, date, imageUrl }: PromoBannerProps) => {
  return (
    <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden group cursor-pointer">
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-between px-8 md:px-12">
        <div className="space-y-2">
          <p className="text-purple-400 text-sm font-medium">{subtitle}</p>
          <h3 className="text-2xl md:text-4xl font-bold text-white">{title}</h3>
          <p className="text-gray-300 text-sm">{date}</p>
        </div>
        
        <Button 
          variant="outline" 
          className="border-white/30 text-white hover:bg-white/20 gap-2"
        >
          <Play className="w-4 h-4" />
          Watch Trailer
        </Button>
      </div>
    </div>
  );
};

export default PromoBanner;
