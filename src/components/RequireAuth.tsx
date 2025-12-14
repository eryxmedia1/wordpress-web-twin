import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const RequireAuth = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isSettling, setIsSettling] = useState(true);

  // Give auth state time to settle after page load/reload
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSettling(false);
    }, 1500); // Wait 1.5s for auth to initialize

    return () => clearTimeout(timer);
  }, []);

  // Show loading while auth is initializing or settling
  if (isLoading || isSettling) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
