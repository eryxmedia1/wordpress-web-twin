
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const RequireAdmin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  console.log("RequireAdmin check:", { user: !!user, isAdmin, isLoading });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but remember where they were trying to go
    console.log("User not logged in, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Special case for the specific email
  if (user.email === 'eryxmedia@gmail.com') {
    console.log("Special admin user detected, granting access");
    return <Outlet />;
  }

  if (!isAdmin) {
    // User is authenticated but not an admin
    console.log("User is not an admin, redirecting to browse");
    return <Navigate to="/browse" state={{ from: location }} replace />;
  }

  console.log("Admin access granted, rendering outlet");
  return <Outlet />;
};

export default RequireAdmin;
