
import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const RequireAdmin = () => {
  const { user, isAdmin, isLoading, setUserAsAdmin } = useAuth();
  const location = useLocation();
  const [isPromoting, setIsPromoting] = useState(false);

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

  // Admin check - offer to make the user an admin if they're not already
  if (!isAdmin) {
    // User is authenticated but not an admin
    console.log("User is not an admin, offering admin promotion option");
    
    const handlePromoteToAdmin = async () => {
      setIsPromoting(true);
      await setUserAsAdmin();
      setIsPromoting(false);
    };

    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="mb-6">You do not have permission to access this area. Would you like to become an admin?</p>
          
          <Button 
            onClick={handlePromoteToAdmin}
            className="bg-[#e50914] hover:bg-[#f6121d] w-full"
            disabled={isPromoting}
          >
            {isPromoting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Promoting to Admin...
              </>
            ) : (
              "Become Admin"
            )}
          </Button>
          
          <Button 
            onClick={() => window.location.href = "/browse"} 
            variant="ghost" 
            className="mt-4 w-full"
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
