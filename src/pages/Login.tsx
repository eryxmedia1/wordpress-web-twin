
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // This would be replaced with actual authentication logic
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Successfully logged in!");
      navigate("/browse");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-black/95 px-4 py-4">
        <Link to="/">
          <img 
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
            alt="ZOE" 
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
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full p-4 rounded-md bg-[#333] text-white border border-[#555] focus:outline-none focus:border-[#e50914]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#e50914] hover:bg-[#f6121d] text-white font-medium text-lg p-6"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
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
          
          <div className="mt-16">
            <p className="text-[#737373]">
              New to ZOE? <Link to="/signup" className="text-white hover:underline">Sign up now</Link>.
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
          
          <p className="mt-8 text-sm">Zoetality Is Our Reality</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
