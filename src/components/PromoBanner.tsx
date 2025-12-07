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
    <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden group cursor-pointer bg-card">
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12">
        <div className="space-y-2">
          <p className="text-secondary text-sm font-medium uppercase tracking-wider">
            A Zoe Original
          </p>
          <h3 className="text-2xl md:text-4xl font-bold text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm">{date}</p>
        </div>
        
        <Button 
          variant="outline" 
          className="border-border text-foreground hover:bg-muted gap-2"
        >
          <Play className="w-4 h-4" />
          Watch Now
        </Button>
      </div>
    </div>
  );
};

export default PromoBanner;
