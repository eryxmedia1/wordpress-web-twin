import { useEffect, useState } from "react";

interface MobileSplashProps {
  onComplete: () => void;
  duration?: number;
}

const MobileSplash = ({ onComplete, duration = 2500 }: MobileSplashProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-background flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated Logo */}
      <div className="flex flex-col items-center animate-pulse">
        <img
          src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png"
          alt="Zoe RatedTV"
          className="h-24 object-contain animate-scale-in"
        />
        
        {/* Loading indicator */}
        <div className="mt-8 flex space-x-1.5">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
};

export default MobileSplash;
