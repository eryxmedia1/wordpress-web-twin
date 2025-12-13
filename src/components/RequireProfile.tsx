import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const RequireProfile = () => {
  const { currentProfile, isLoading } = useProfile();
  const { isLoading: authLoading } = useAuth();
  const location = useLocation();

  // Wait for both auth and profile loading to complete
  if (isLoading || authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  // If no profile selected, redirect to profile selection
  if (!currentProfile) {
    return <Navigate to="/profiles" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireProfile;
