import { useMembershipAccess } from './useMembershipAccess';

export interface TierPermissions {
  // Profile & Account
  maxProfiles: number;
  
  // Content Access
  contentAccess: 'limited' | 'most' | 'all';
  
  // Video Quality
  maxQuality: '1080p' | '4k';
  hdrEnabled: boolean;
  
  // Playlists
  canCreatePlaylist: boolean;
  maxPlaylists: number; // -1 = unlimited
  
  // Ads
  showPreroll: boolean;
  showMidroll: boolean;
  showPostroll: boolean;
  maxAdBreaks: number;
  
  // Features
  canSkipIntros: boolean;
  canDownload: boolean;
  bingeMode: boolean;
  
  // Smart Features
  becauseYouWatched: boolean;
  weThinkYoullLove: boolean;
  nextToWatch: boolean;
}

const TIER_PERMISSIONS: Record<string, TierPermissions> = {
  free: {
    maxProfiles: 2,
    contentAccess: 'limited',
    maxQuality: '1080p',
    hdrEnabled: false,
    canCreatePlaylist: false,
    maxPlaylists: 0,
    showPreroll: true,
    showMidroll: true,
    showPostroll: true,
    maxAdBreaks: 4,
    canSkipIntros: false,
    canDownload: false,
    bingeMode: false,
    becauseYouWatched: true,
    weThinkYoullLove: true,
    nextToWatch: true,
  },
  standard: {
    maxProfiles: 4,
    contentAccess: 'most',
    maxQuality: '1080p',
    hdrEnabled: false,
    canCreatePlaylist: true,
    maxPlaylists: 10,
    showPreroll: true,
    showMidroll: true,
    showPostroll: false,
    maxAdBreaks: 2,
    canSkipIntros: false,
    canDownload: false,
    bingeMode: true,
    becauseYouWatched: true,
    weThinkYoullLove: true,
    nextToWatch: true,
  },
  premium: {
    maxProfiles: 6,
    contentAccess: 'all',
    maxQuality: '4k',
    hdrEnabled: true,
    canCreatePlaylist: true,
    maxPlaylists: -1, // unlimited
    showPreroll: false,
    showMidroll: false,
    showPostroll: false,
    maxAdBreaks: 0,
    canSkipIntros: true,
    canDownload: true,
    bingeMode: true,
    becauseYouWatched: true,
    weThinkYoullLove: true,
    nextToWatch: true,
  },
};

export const useTierPermissions = () => {
  const { userPlan, loading } = useMembershipAccess();
  
  const permissions = TIER_PERMISSIONS[userPlan] || TIER_PERMISSIONS.free;
  
  const canAddProfile = (currentCount: number) => currentCount < permissions.maxProfiles;
  
  const canCreateMorePlaylists = (currentCount: number) => {
    if (!permissions.canCreatePlaylist) return false;
    if (permissions.maxPlaylists === -1) return true;
    return currentCount < permissions.maxPlaylists;
  };
  
  const getUpgradeReason = (feature: keyof TierPermissions): string | null => {
    if (feature === 'canCreatePlaylist' && !permissions.canCreatePlaylist) {
      return 'Upgrade to Standard to create custom playlists';
    }
    if (feature === 'canSkipIntros' && !permissions.canSkipIntros) {
      return 'Upgrade to Premium to skip intros';
    }
    if (feature === 'canDownload' && !permissions.canDownload) {
      return 'Upgrade to Premium to download content';
    }
    if (feature === 'hdrEnabled' && !permissions.hdrEnabled) {
      return 'Upgrade to Premium for 4K + HDR quality';
    }
    return null;
  };
  
  return {
    userPlan,
    permissions,
    loading,
    canAddProfile,
    canCreateMorePlaylists,
    getUpgradeReason,
  };
};

export default useTierPermissions;
