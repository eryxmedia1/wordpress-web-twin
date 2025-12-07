import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, UserProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Smile, Star, Heart, Zap, Crown, Ghost } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import ProfileEditor from '@/components/ProfileEditor';

const AVATAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  smile: Smile,
  star: Star,
  heart: Heart,
  zap: Zap,
  crown: Crown,
  ghost: Ghost,
};

const ProfileSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profiles, isLoading, selectProfile, createProfile, updateProfile, deleteProfile } = useProfile();
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectProfile = (profile: UserProfile) => {
    if (isManaging) {
      setEditingProfile(profile);
    } else {
      selectProfile(profile);
      navigate('/browse');
    }
  };

  const handleCreateProfile = () => {
    setIsCreating(true);
  };

  const handleSaveProfile = async (name: string, avatarColor: string, avatarIcon: string, isKids: boolean) => {
    if (editingProfile) {
      await updateProfile(editingProfile.id, { name, avatar_color: avatarColor, avatar_icon: avatarIcon, is_kids: isKids });
      setEditingProfile(null);
    } else {
      await createProfile(name, avatarColor, avatarIcon, isKids);
      setIsCreating(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    await deleteProfile(id);
    setEditingProfile(null);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (editingProfile || isCreating) {
    return (
      <ProfileEditor
        profile={editingProfile || undefined}
        onSave={handleSaveProfile}
        onCancel={() => {
          setEditingProfile(null);
          setIsCreating(false);
        }}
        onDelete={editingProfile ? () => handleDeleteProfile(editingProfile.id) : undefined}
        canDelete={profiles.length > 1}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header with logo and sign out */}
      <div className="absolute top-4 right-4">
        <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
          Sign Out
        </Button>
      </div>

      {/* Logo */}
      <div className="mb-8">
        <img 
          src="/lovable-uploads/5806b50d-0fbb-4e69-bec1-5c2d43f7d0bd.png" 
          alt="Zoe RatedTV" 
          className="h-16 object-contain"
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Who's watching?</h1>
      <p className="text-muted-foreground mb-10">Select a profile to continue</p>

      {/* Profile Grid */}
      <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
        {profiles.map((profile) => {
          const IconComponent = AVATAR_ICONS[profile.avatar_icon] || Smile;
          return (
            <button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              className="group flex flex-col items-center transition-transform hover:scale-105"
            >
              <div 
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg flex items-center justify-center mb-2 border-2 border-transparent group-hover:border-foreground transition-colors"
                style={{ backgroundColor: profile.avatar_color }}
              >
                <IconComponent className="w-12 h-12 md:w-16 md:h-16 text-white" />
                {profile.is_kids && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    KIDS
                  </span>
                )}
                {isManaging && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Pencil className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm md:text-base">
                {profile.name}
              </span>
            </button>
          );
        })}

        {/* Add Profile Button */}
        {profiles.length < 6 && (
          <button
            onClick={handleCreateProfile}
            className="group flex flex-col items-center transition-transform hover:scale-105"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg flex items-center justify-center mb-2 border-2 border-muted-foreground/30 group-hover:border-foreground bg-muted/20 transition-colors">
              <Plus className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground group-hover:text-foreground" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm md:text-base">
              Add Profile
            </span>
          </button>
        )}
      </div>

      {/* Manage Profiles Button */}
      <Button
        variant={isManaging ? "default" : "outline"}
        onClick={() => setIsManaging(!isManaging)}
        className="mt-10"
      >
        {isManaging ? 'Done' : 'Manage Profiles'}
      </Button>
    </div>
  );
};

export default ProfileSelection;
