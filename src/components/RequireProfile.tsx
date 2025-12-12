import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useProfile } from "@/context/ProfileContext";
import { Loader2 } from "lucide-react";

const PROFILE_STORAGE_KEY = 'zoe_current_profile';

const RequireProfile = () => {
  const { currentProfile, isLoading, profiles } = useProfile();
  const location = useLocation();

  // Check if there's a pending profile in localStorage waiting to be restored
  const hasPendingProfile = localStorage.getItem(PROFILE_STORAGE_KEY);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  // If no profile selected but we have a pending one and profiles are loaded,
  // wait briefly for restoration instead of redirecting
  if (!currentProfile && hasPendingProfile && profiles.length > 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-foreground">Restoring profile...</p>
      </div>
    );
  }

  if (!currentProfile) {
    // Redirect to profile selection but remember where they were trying to go
    return <Navigate to="/profiles" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireProfile;
