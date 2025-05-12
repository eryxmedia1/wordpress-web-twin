
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const RequireAdmin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // User is authenticated but not an admin
    return <Navigate to="/browse" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
