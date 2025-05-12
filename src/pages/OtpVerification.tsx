
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const OtpVerification = () => {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the email from the location state
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If there's no email in state, redirect back to login
      navigate("/login");
    }
  }, [location, navigate]);

  // Path to redirect after verification
  const from = location.state?.from?.pathname || "/browse";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      
      if (error) {
        console.error("OTP verification error:", error);
        toast.error(error.message || "Invalid code. Please try again.");
        return;
      }
      
      // Verification successful
      toast.success("Verification successful!");
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email address is missing");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });
      
      if (error) {
        toast.error(error.message || "Failed to resend code");
        return;
      }
      
      toast.success("Verification code resent to your email");
    } catch (error: any) {
      toast.error("Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-black/95 px-4 py-4">
        <img 
          src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
          alt="Zoe RatedTV" 
          className="h-16 object-contain" 
        />
      </header>
      
      <div className="flex-1 flex items-center justify-center px-4" style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://assets.nflxext.com/ffe/siteui/vlv3/dc1cf82d-97c9-409f-b7c8-6ac1718946d6/14a8fe85-b6f4-4c06-8eaf-eccf3276d557/US-en-20230911-popsignuptwoweeks-perspective_alpha_website_large.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
        <div className="bg-black/75 p-8 rounded-md w-full max-w-md">
          <h1 className="text-white text-3xl font-bold mb-6">Verify Your Email</h1>
          <p className="text-gray-300 mb-6">
            We've sent a verification code to <span className="font-semibold">{email}</span>.
            Enter the 6-digit code below to continue.
          </p>
          
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center mb-4">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#e50914] hover:bg-[#f6121d] text-white font-medium text-lg p-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : "Verify"}
            </Button>
            
            <div className="flex items-center justify-center">
              <button 
                type="button" 
                onClick={handleResendCode}
                className="text-gray-400 hover:text-white text-sm"
                disabled={isLoading}
              >
                Didn't receive a code? Resend
              </button>
            </div>
          </form>
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

export default OtpVerification;
