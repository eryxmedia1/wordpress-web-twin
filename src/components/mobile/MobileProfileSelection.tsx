import { Plus, Pencil, Smile, Star, Heart, Zap, Crown, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/context/ProfileContext";

const AVATAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  smile: Smile,
  star: Star,
  heart: Heart,
  zap: Zap,
  crown: Crown,
  ghost: Ghost,
};

interface MobileProfileSelectionProps {
  profiles: UserProfile[];
  isManaging: boolean;
  maxProfiles?: number;
  onSelectProfile: (profile: UserProfile) => void;
  onCreateProfile: () => void;
  onToggleManage: () => void;
  onSignOut: () => void;
  onUpgrade?: () => void;
}

const MobileProfileSelection = ({
  profiles,
  isManaging,
  maxProfiles = 6,
  onSelectProfile,
  onCreateProfile,
  onToggleManage,
  onSignOut,
  onUpgrade,
}: MobileProfileSelectionProps) => {
  const canAddProfile = profiles.length < maxProfiles;
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:hidden">
      {/* Header with sign out */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Sign Out
        </Button>
      </div>

      {/* Logo */}
      <div className="mb-6">
        <img
          src="/lovable-uploads/5806b50d-0fbb-4e69-bec1-5c2d43f7d0bd.png"
          alt="Zoe RatedTV"
          className="h-12 object-contain"
        />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-1">Who's watching?</h1>
      <p className="text-muted-foreground text-sm mb-8">Select a profile</p>

      {/* 2x2 Grid of Profiles */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {profiles.map((profile) => {
          const IconComponent = AVATAR_ICONS[profile.avatar_icon] || Smile;
          return (
            <button
              key={profile.id}
              onClick={() => onSelectProfile(profile)}
              className="group flex flex-col items-center transition-transform active:scale-95"
            >
              {/* Circular Avatar */}
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center mb-2 border-2 border-transparent group-hover:border-foreground transition-colors shadow-lg"
                style={{ backgroundColor: profile.avatar_color }}
              >
                <IconComponent className="w-10 h-10 text-white" />
                
                {profile.is_kids && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                    KIDS
                  </span>
                )}
                
                {isManaging && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Pencil className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm font-medium">
                {profile.name}
              </span>
            </button>
          );
        })}

        {/* Add Profile Button */}
        {canAddProfile ? (
          <button
            onClick={onCreateProfile}
            className="group flex flex-col items-center transition-transform active:scale-95"
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2 border-2 border-dashed border-muted-foreground/40 group-hover:border-foreground bg-muted/20 transition-colors">
              <Plus className="w-10 h-10 text-muted-foreground group-hover:text-foreground" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm font-medium">
              Add Profile
            </span>
          </button>
        ) : onUpgrade && (
          <button
            onClick={onUpgrade}
            className="group flex flex-col items-center transition-transform active:scale-95"
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2 border-2 border-dashed border-primary/40 group-hover:border-primary bg-primary/10 transition-colors">
              <Plus className="w-10 h-10 text-primary/50 group-hover:text-primary" />
            </div>
            <span className="text-primary/70 group-hover:text-primary transition-colors text-xs font-medium text-center">
              Upgrade for more
            </span>
          </button>
        )}
      </div>

      {/* Manage Profiles Button */}
      <Button
        variant={isManaging ? "default" : "outline"}
        size="sm"
        onClick={onToggleManage}
        className="mt-8"
      >
        {isManaging ? "Done" : "Manage Profiles"}
      </Button>
    </div>
  );
};

export default MobileProfileSelection;
