
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [showAd, setShowAd] = useState(false);
  const [adTime, setAdTime] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hide controls after inactivity
  useEffect(() => {
    let timeout: number;
    
    const handleMovement = () => {
      setShowControls(true);
      clearTimeout(timeout);
      
      timeout = window.setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    window.addEventListener('mousemove', handleMovement);
    window.addEventListener('touchstart', handleMovement);
    
    handleMovement();
    
    return () => {
      window.removeEventListener('mousemove', handleMovement);
      window.removeEventListener('touchstart', handleMovement);
      clearTimeout(timeout);
    };
  }, [isPlaying]);
  
  // Simulate video loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Check if free user and show ad (simulated)
      if (!isSubscribed) {
        setShowAd(true);
        const adInterval = setInterval(() => {
          setAdTime(prev => {
            if (prev <= 1) {
              clearInterval(adInterval);
              setShowAd(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(adInterval);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [isSubscribed]);
  
  // Simulate progress
  useEffect(() => {
    if (!isPlaying || showAd || isLoading) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 0.1;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, showAd, isLoading]);
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      {/* Video Element */}
      <div className="absolute inset-0 bg-black z-0">
        {showAd ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
            <p className="text-white text-2xl mb-4">Advertisement</p>
            <p className="text-white">Your video will resume in {adTime} seconds</p>
            <Button 
              className="mt-4 bg-[#e50914] hover:bg-[#f6121d]"
              onClick={() => {
                toast.success("Upgraded to ad-free plan!");
                setIsSubscribed(true);
                setShowAd(false);
              }}
            >
              Upgrade to remove ads
            </Button>
          </div>
        ) : (
          <video 
            className="w-full h-full object-cover"
            autoPlay={isPlaying}
            muted={isMuted}
            poster="https://picsum.photos/1920/1080?random=1"
          >
            {/* In a real implementation, you would integrate with Vimeo here */}
            <source src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      
      {/* Video Controls */}
      {showControls && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/80 transition-opacity duration-300">
          {/* Top Bar */}
          <div className="p-4 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={handleBack}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="ml-4 text-white text-xl">
              {id?.includes('featured') ? 'Featured Title' : `Title ${id}`}
            </h1>
          </div>
          
          {/* Bottom Bar */}
          <div className="p-4 space-y-2">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-600 rounded-full">
              <div 
                className="h-full bg-red-600 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-6 w-6" />
                  ) : (
                    <Volume2 className="h-6 w-6" />
                  )}
                </Button>
                
                <span className="text-white text-sm">
                  {Math.floor(progress * 60 / 100)}:{String(Math.floor((progress * 60) % 60)).padStart(2, '0')} / 
                  1:00
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
