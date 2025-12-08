import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, isLoading: authLoading } = useAuth();
  
  // Get the path the user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || "/profiles";
  
  // Redirect logged-in users via useEffect to prevent render issues
  useEffect(() => {
    if (user && !authLoading) {
      setIsRedirecting(true);
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  // Show loading state while checking auth or redirecting
  if (authLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <img 
          src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
          alt="Zoe RatedTV" 
          className="h-20 object-contain mb-8 animate-pulse" 
        />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    
    if (useOtp) {
      // OTP login flow
      await handleOtpLogin();
    } else {
      // Password login flow
      if (!password.trim() || password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      
      await handlePasswordLogin();
    }
  };

  const handlePasswordLogin = async () => {
    setIsLoading(true);
    
    try {
      // Use the login function from AuthContext instead of direct supabase call
      // This handles the captcha issue by properly managing auth state
      await login(email, password);
      
      // Navigation happens automatically in useEffect when user state updates
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Only allow existing users
        }
      });
      
      if (error) {
        console.error("OTP login error:", error);
        toast.error(error.message || "Failed to send verification code");
        setIsLoading(false);
        return;
      }
      
      toast.success("Verification code sent to your email");
      // Redirect to OTP verification page
      navigate("/verify-otp", { 
        state: { 
          email,
          from: location.state?.from
        } 
      });
    } catch (error: any) {
      console.error("OTP login error:", error);
      toast.error("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-black/95 px-4 py-4">
        <Link to="/">
          <img 
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
            alt="Zoe RatedTV" 
            className="h-16 object-contain" 
          />
        </Link>
      </header>
      
      <div className="flex-1 flex items-center justify-center px-4" style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://assets.nflxext.com/ffe/siteui/vlv3/dc1cf82d-97c9-409f-b7c8-6ac1718946d6/14a8fe85-b6f4-4c06-8eaf-eccf3276d557/US-en-20230911-popsignuptwoweeks-perspective_alpha_website_large.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
        <div className="bg-black/75 p-8 rounded-md w-full max-w-md">
          <h1 className="text-white text-3xl font-bold mb-6">Sign In</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                placeholder="Email address"
                className="w-full p-4 rounded-md bg-muted text-foreground border border-border focus:outline-none focus:border-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            {!useOtp && (
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-4 rounded-md bg-muted text-foreground border border-border focus:outline-none focus:border-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!useOtp}
                  autoComplete="current-password"
                  minLength={6}
                />
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg p-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {useOtp ? "Sending Code..." : "Signing In..."}
                </>
              ) : (useOtp ? "Email me a login code" : "Sign In")}
            </Button>
            
            <div className="flex items-center justify-between text-[#b3b3b3]">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 bg-[#333] border-[#555]" 
                />
                <label htmlFor="remember" className="ml-2 text-sm">Remember me</label>
              </div>
              
              <a href="#" className="text-sm hover:underline">Need help?</a>
            </div>
            
          </form>
          
          <div className="mt-8 text-center">
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
