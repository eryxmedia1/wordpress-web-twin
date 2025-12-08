import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthBackground {
  id: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

const MobileAuthScreen = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch background images from database
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const { data, error } = await supabase
          .from("auth_backgrounds")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) throw error;
        
        const urls = (data || []).map((bg: AuthBackground) => bg.image_url);
        setBackgroundImages(urls);
      } catch (error) {
        console.error("Error fetching auth backgrounds:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();
  }, []);

  // Auto-advance slider only if we have images
  useEffect(() => {
    if (backgroundImages.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <div className="fixed inset-0 bg-background md:hidden">
      {/* Background Image Slider - only show if we have images */}
      {backgroundImages.length > 0 && (
        <div className="absolute inset-0">
          {backgroundImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentImageIndex && !isTransitioning
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-12 px-6">
        {/* Logo */}
        <div className="pt-8">
          <img
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png"
            alt="Zoe RatedTV"
            className="h-16 object-contain"
          />
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Welcome to Zoe RatedTV
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Stream unlimited movies, TV shows, and exclusive content
          </p>
        </div>

        {/* Bottom Buttons */}
        <div className="w-full space-y-3 pb-8">
          <Button
            onClick={() => navigate("/signup")}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
          >
            Try It Free
          </Button>
          
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-foreground/30 text-foreground hover:bg-foreground/10"
          >
            Sign In
          </Button>
        </div>

        {/* Pagination Dots - only show if we have multiple images */}
        {backgroundImages.length > 1 && (
          <div className="flex space-x-2 pb-4">
            {backgroundImages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex
                    ? "bg-primary"
                    : "bg-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAuthScreen;
