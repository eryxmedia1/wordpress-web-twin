import { useState } from 'react';
import { UserProfile } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Smile, Star, Heart, Zap, Crown, Ghost, Trash2, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const AVATAR_COLORS = [
  '#d4af37', // Gold (brand color)
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#9b59b6', // Purple
  '#e67e22', // Orange
  '#1abc9c', // Teal
  '#f39c12', // Yellow
];

const AVATAR_ICONS = [
  { id: 'smile', icon: Smile, label: 'Smile' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'heart', icon: Heart, label: 'Heart' },
  { id: 'zap', icon: Zap, label: 'Zap' },
  { id: 'crown', icon: Crown, label: 'Crown' },
  { id: 'ghost', icon: Ghost, label: 'Ghost' },
];

interface ProfileEditorProps {
  profile?: UserProfile;
  onSave: (name: string, avatarColor: string, avatarIcon: string, isKids: boolean) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  canDelete?: boolean;
}

const ProfileEditor = ({ profile, onSave, onCancel, onDelete, canDelete = true }: ProfileEditorProps) => {
  const [name, setName] = useState(profile?.name || '');
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color || AVATAR_COLORS[0]);
  const [avatarIcon, setAvatarIcon] = useState(profile?.avatar_icon || 'smile');
  const [isKids, setIsKids] = useState(profile?.is_kids || false);
  const [isLoading, setIsLoading] = useState(false);

  const SelectedIcon = AVATAR_ICONS.find(i => i.id === avatarIcon)?.icon || Smile;

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await onSave(name.trim(), avatarColor, avatarIcon, isKids);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsLoading(true);
    try {
      await onDelete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <button 
          onClick={onCancel}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
        {profile ? 'Edit Profile' : 'Add Profile'}
      </h1>

      {/* Avatar Preview */}
      <div 
        className="w-32 h-32 rounded-lg flex items-center justify-center mb-8"
        style={{ backgroundColor: avatarColor }}
      >
        <SelectedIcon className="w-16 h-16 text-white" />
      </div>

      {/* Form */}
      <div className="w-full max-w-md space-y-6">
        {/* Name Input */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter profile name"
            className="bg-muted"
            maxLength={20}
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <Label>Avatar Color</Label>
          <div className="flex flex-wrap gap-3">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setAvatarColor(color)}
                className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                  avatarColor === color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Icon Picker */}
        <div className="space-y-2">
          <Label>Avatar Icon</Label>
          <div className="flex flex-wrap gap-3">
            {AVATAR_ICONS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setAvatarIcon(id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all hover:bg-muted ${
                  avatarIcon === id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                <Icon className="w-6 h-6" />
              </button>
            ))}
          </div>
        </div>

        {/* Kids Profile Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <Label htmlFor="kids-mode" className="text-base font-medium">Kids Profile</Label>
            <p className="text-sm text-muted-foreground">Only show kid-friendly content</p>
          </div>
          <Switch
            id="kids-mode"
            checked={isKids}
            onCheckedChange={setIsKids}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>

          {profile && onDelete && canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" disabled={isLoading}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the profile "{profile.name}" and all associated data including watch history, favorites, and preferences.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
