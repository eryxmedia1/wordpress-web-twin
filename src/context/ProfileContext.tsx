import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface UserProfile {
  id: string;
  account_id: string;
  name: string;
  avatar_color: string;
  avatar_icon: string;
  is_kids: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  isLoading: boolean;
  selectProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  createProfile: (name: string, avatarColor: string, avatarIcon: string, isKids: boolean) => Promise<void>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  refetchProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'zoe_current_profile';

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setCurrentProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('account_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const typedData = (data || []) as UserProfile[];
      setProfiles(typedData);

      // Restore saved profile from localStorage
      const savedProfileId = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfileId && typedData.length > 0) {
        const savedProfile = typedData.find(p => p.id === savedProfileId);
        if (savedProfile) {
          setCurrentProfile(savedProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const selectProfile = (profile: UserProfile) => {
    setCurrentProfile(profile);
    localStorage.setItem(PROFILE_STORAGE_KEY, profile.id);
  };

  const clearProfile = () => {
    setCurrentProfile(null);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  };

  const createProfile = async (name: string, avatarColor: string, avatarIcon: string, isKids: boolean) => {
    if (!user) return;

    if (profiles.length >= 6) {
      throw new Error('Maximum 6 profiles allowed per account');
    }

    const { error } = await supabase
      .from('user_profiles')
      .insert({
        account_id: user.id,
        name,
        avatar_color: avatarColor,
        avatar_icon: avatarIcon,
        is_kids: isKids,
      });

    if (error) throw error;
    await fetchProfiles();
  };

  const updateProfile = async (id: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        name: updates.name,
        avatar_color: updates.avatar_color,
        avatar_icon: updates.avatar_icon,
        is_kids: updates.is_kids,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await fetchProfiles();

    // Update current profile if it was the one being edited
    if (currentProfile?.id === id) {
      const updatedProfile = profiles.find(p => p.id === id);
      if (updatedProfile) {
        setCurrentProfile({ ...updatedProfile, ...updates });
      }
    }
  };

  const deleteProfile = async (id: string) => {
    if (profiles.length <= 1) {
      throw new Error('Cannot delete the last profile');
    }

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // If current profile was deleted, clear it
    if (currentProfile?.id === id) {
      clearProfile();
    }

    await fetchProfiles();
  };

  const refetchProfiles = async () => {
    await fetchProfiles();
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        currentProfile,
        isLoading,
        selectProfile,
        clearProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        refetchProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
