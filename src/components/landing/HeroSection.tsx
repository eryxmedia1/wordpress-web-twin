
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface HeroSectionProps {
  email: string;
  setEmail: (email: string) => void;
}

const HeroSection = ({ email, setEmail }: HeroSectionProps) => {
  return (
    <section className="bg-black min-h-screen flex items-center justify-center text-white px-4" style={{
      backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://assets.nflxext.com/ffe/siteui/vlv3/dc1cf82d-97c9-409f-b7c8-6ac1718946d6/14a8fe85-b6f4-4c06-8eaf-eccf3276d557/US-en-20230911-popsignuptwoweeks-perspective_alpha_website_large.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}>
      <div className="max-w-3xl mx-auto text-center pt-20">
        <img 
          src="/lovable-uploads/1bd08f45-adec-4e72-a316-e26138e65a8e.png" 
          alt="Zoe RatedTV Logo"
          className="h-40 object-contain mx-auto mb-6" 
        />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Unlimited movies, TV shows, and more.</h1>
        <p className="text-xl md:text-2xl mb-6">Watch anywhere. Cancel anytime.</p>
        <p className="text-xl md:text-lg mb-6">Ready to watch? Enter your email to create or restart your membership.</p>
        
        <div className="flex flex-col md:flex-row gap-2 max-w-lg mx-auto">
          <input 
            type="email" 
            placeholder="Email address" 
            className="flex-1 p-4 text-black rounded-md focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Link to="/signup" className="whitespace-nowrap">
            <Button className="w-full md:w-auto bg-[#D4AF37] hover:bg-[#F1CA45] text-white font-semibold text-lg py-6 px-6 rounded-md">
              Get Started <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

