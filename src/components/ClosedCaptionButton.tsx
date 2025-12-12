import { Subtitles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ClosedCaptionButtonProps {
  captionsEnabled: boolean;
  selectedLanguage: string | null;
  availableLanguages: string[];
  hasSubtitles: boolean;
  onToggle: () => void;
  onSelectLanguage: (language: string) => void;
  className?: string;
}

export const ClosedCaptionButton = ({
  captionsEnabled,
  selectedLanguage,
  availableLanguages,
  hasSubtitles,
  onToggle,
  onSelectLanguage,
  className,
}: ClosedCaptionButtonProps) => {
  if (!hasSubtitles) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-foreground bg-background/50 hover:bg-background/70 relative",
            captionsEnabled && "ring-2 ring-primary",
            className
          )}
          title="Closed Captions"
        >
          <Subtitles className="h-5 w-5" />
          {captionsEnabled && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border-border">
        <DropdownMenuItem
          onClick={onToggle}
          className="cursor-pointer"
        >
          <span className="mr-2">{captionsEnabled ? "Turn Off" : "Turn On"} Captions</span>
        </DropdownMenuItem>
        
        {availableLanguages.length > 1 && (
          <>
            <DropdownMenuSeparator />
            {availableLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => onSelectLanguage(lang)}
                className="cursor-pointer flex items-center justify-between"
              >
                <span>{lang}</span>
                {selectedLanguage === lang && captionsEnabled && (
                  <Check className="h-4 w-4 text-primary ml-2" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
