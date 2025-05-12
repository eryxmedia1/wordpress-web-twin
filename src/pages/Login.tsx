
import { useState } from "react";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get the path the user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || "/browse";
  
  // If already logged in, redirect to the intended page
  if (user) {
    navigate(from, { replace: true });
    return null;
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error.message || "Login failed. Please check your credentials.");
        return;
      }

      console.log("Login successful:", data);
      toast.success("Successfully logged in!");
      
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
                className="w-full p-4 rounded-md bg-[#333] text-white border border-[#555] focus:outline-none focus:border-[#e50914]"
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
                  className="w-full p-4 rounded-md bg-[#333] text-white border border-[#555] focus:outline-none focus:border-[#e50914]"
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
              className="w-full bg-[#e50914] hover:bg-[#f6121d] text-white font-medium text-lg p-6"
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
            
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setUseOtp(!useOtp)}
                className="text-[#b3b3b3] text-sm hover:underline"
              >
                {useOtp ? "Use password to sign in" : "Use a verification code instead"}
              </button>
            </div>
          </form>
          
          <div className="mt-16">
            <p className="text-[#737373]">
              New to Zoe RatedTV? <Link to="/signup" className="text-white hover:underline">Sign up now</Link>.
            </p>
            
            <p className="text-[#737373] text-xs mt-4">
              This page is protected by Google reCAPTCHA to ensure you're not a bot.
            </p>
          </div>
        </div>
      </div>
      
      <footer className="bg-black/75 py-8 px-4 text-[#737373] border-t border-[#333]">
        <div className="max-w-6xl mx-auto">
          <p className="mb-6">Questions? Call 1-800-555-5555</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <a href="#" className="hover:underline">FAQ</a>
            <a href="#" className="hover:underline">Help Center</a>
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Privacy</a>
          </div>
          
          <p className="mt-8 text-sm">Zoe RatedTV Is Our Reality</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
