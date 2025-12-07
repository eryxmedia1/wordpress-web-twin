import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useProfile } from "@/context/ProfileContext";
import { Loader2 } from "lucide-react";

const RequireProfile = () => {
  const { currentProfile, isLoading } = useProfile();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-foreground">Loading...</p>
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
