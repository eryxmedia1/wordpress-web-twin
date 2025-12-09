import { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Ad {
  id: string;
  name: string;
  type: 'video' | 'vast';
  video_url: string | null;
  vast_tag_url: string | null;
  duration_seconds: number;
}

interface AdBreakOverlayProps {
  ad: Ad | null;
  position: 'pre' | 'mid' | 'post' | null;
  countdownSeconds: number;
  showCountdown: boolean;
  adQueueLength: number;
  currentAdIndex?: number;
  canSkip?: boolean;
  skipAfterSeconds?: number;
  onAdComplete: () => void;
  onSkip?: () => void;
}

export function AdBreakOverlay({
  ad,
  position,
  countdownSeconds,
  showCountdown,
  adQueueLength,
  currentAdIndex = 1,
  canSkip = false,
  skipAfterSeconds = 5,
  onAdComplete,
  onSkip,
}: AdBreakOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [canSkipNow, setCanSkipNow] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  // Reset skip state when ad changes
  useEffect(() => {
    setPlayedSeconds(0);
    setCanSkipNow(false);
  }, [ad?.id]);

  // Check if user can skip
  useEffect(() => {
    if (canSkip && playedSeconds >= skipAfterSeconds) {
      setCanSkipNow(true);
    }
  }, [playedSeconds, canSkip, skipAfterSeconds]);

  const handleProgress = (state: { playedSeconds: number }) => {
    setPlayedSeconds(state.playedSeconds);
  };

  const handleEnded = () => {
    onAdComplete();
  };

  const handleSkip = () => {
    if (canSkipNow && onSkip) {
      onSkip();
    }
  };

  // Countdown overlay bar before ad pod
  if (showCountdown && countdownSeconds > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
        <div className="bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-sm border-b border-primary/30 px-4 py-3 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Countdown badge */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center bg-primary/10">
                  <span className="text-2xl font-bold text-primary animate-pulse">
                    {countdownSeconds}
                  </span>
                </div>
                {/* Rotating progress indicator */}
                <svg 
                  className="absolute inset-0 w-12 h-12 transform -rotate-90"
                  viewBox="0 0 48 48"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-primary/20"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-primary"
                    strokeDasharray={138.23}
                    strokeDashoffset={138.23 * (1 - countdownSeconds / 10)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
              </div>
              
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">
                  AD BREAK in {countdownSeconds}...
                </span>
                <span className="text-sm text-muted-foreground">
                  {adQueueLength} ad{adQueueLength > 1 ? 's' : ''} will play
                </span>
              </div>
            </div>
            
            {/* Visual indicator */}
            <div className="hidden sm:flex items-center gap-2">
              {Array.from({ length: adQueueLength }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 rounded-full bg-primary/50"
                />
              ))}
            </div>
          </div>
          
          {/* Progress bar at bottom of countdown bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(countdownSeconds / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // No ad to show
  if (!ad || !ad.video_url) {
    return null;
  }

  // Ad playing overlay - fullscreen
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Top bar with ad info */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <span className="bg-primary/90 text-primary-foreground text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider">
            AD
          </span>
          <span className="text-white text-sm font-medium">
            Ad {currentAdIndex} of {adQueueLength}
          </span>
          <span className="text-white/60 text-sm hidden sm:block">
            — Your show will resume shortly
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-white hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          
          {canSkip && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={!canSkipNow}
              className={cn(
                "text-white border-white/50 hover:bg-white/20 transition-all",
                !canSkipNow && "opacity-50 cursor-not-allowed"
              )}
            >
              {canSkipNow ? (
                <>
                  Skip Ad <X className="ml-1 h-4 w-4" />
                </>
              ) : (
                `Skip in ${Math.ceil(skipAfterSeconds - playedSeconds)}s`
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Ad progress indicators - show which ad in pod */}
      <div className="absolute top-16 left-4 z-10 flex items-center gap-1.5">
        {Array.from({ length: adQueueLength }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "w-8 h-1 rounded-full transition-all",
              i < currentAdIndex ? "bg-primary" : 
              i === currentAdIndex - 1 ? "bg-primary" : 
              "bg-white/30"
            )}
          />
        ))}
      </div>

      {/* Video player */}
      <ReactPlayer
        ref={playerRef}
        url={ad.video_url}
        playing={true}
        muted={isMuted}
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onEnded={handleEnded}
        onError={(e) => {
          console.error('Ad playback error:', e);
          onAdComplete();
        }}
        config={{
          file: {
            attributes: {
              style: { objectFit: 'contain' },
            },
          },
        }}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0 
        }}
      />

      {/* Bottom bar with progress */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent pb-4 pt-12 px-4">
        {/* Ad name */}
        <p className="text-white/60 text-xs mb-2">{ad.name}</p>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100 rounded-full"
            style={{ 
              width: `${(playedSeconds / (ad.duration_seconds || 30)) * 100}%` 
            }}
          />
        </div>
        
        {/* Time remaining */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-white/60 text-xs">
            {Math.ceil(playedSeconds)}s
          </span>
          <span className="text-white/60 text-xs">
            {ad.duration_seconds}s
          </span>
        </div>
      </div>
    </div>
  );
}