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

  // Countdown overlay before ad
  if (showCountdown && countdownSeconds > 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
        <div className="text-center space-y-6">
          {/* Countdown circle */}
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-primary"
                strokeDasharray={351.86}
                strokeDashoffset={351.86 * (1 - countdownSeconds / 10)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white">
              {countdownSeconds}
            </span>
          </div>
          
          <div className="space-y-2">
            <p className="text-xl text-white font-medium">
              Commercial break in {countdownSeconds} seconds
            </p>
            <p className="text-muted-foreground">
              {adQueueLength} ad{adQueueLength > 1 ? 's' : ''} will play
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No ad to show
  if (!ad || !ad.video_url) {
    return null;
  }

  // Ad playing overlay
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Top bar with ad info */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <span className="bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded">
            AD
          </span>
          <span className="text-white text-sm">
            Ad {currentAdIndex} of {adQueueLength}
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
                "text-white border-white/50 hover:bg-white/20",
                !canSkipNow && "opacity-50"
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

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-white/20">
        <div 
          className="h-full bg-primary transition-all duration-100"
          style={{ 
            width: `${(playedSeconds / (ad.duration_seconds || 30)) * 100}%` 
          }}
        />
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

      {/* Ad name (optional subtle display) */}
      <div className="absolute bottom-6 left-4 z-10">
        <p className="text-white/60 text-xs">{ad.name}</p>
      </div>
    </div>
  );
}
