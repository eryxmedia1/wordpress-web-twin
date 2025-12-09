import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

const RequireAdmin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  console.log("RequireAdmin check:", { user: !!user, isAdmin, isLoading });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log("User not logged in, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    console.log("User is not an admin, showing access denied");
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <div className="bg-card p-8 rounded-lg max-w-md w-full text-center border border-border">
          <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You do not have permission to access the admin area. 
            Please contact an administrator if you believe this is an error.
          </p>
          
          <Button 
            onClick={() => window.location.href = "/browse"} 
            className="w-full bg-primary hover:bg-primary/90"
          >
            Return to Browse
          </Button>
        </div>
      </div>
    );
  }

  console.log("Admin access granted, rendering outlet");
  return <Outlet />;
};

export default RequireAdmin;
