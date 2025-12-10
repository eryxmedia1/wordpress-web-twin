import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import PlansSection from "@/components/landing/PlansSection";
import FaqSection from "@/components/landing/FaqSection";
import Footer from "@/components/landing/Footer";
import MobileSplash from "@/components/mobile/MobileSplash";
import MobileAuthScreen from "@/components/mobile/MobileAuthScreen";

const Index = () => {
  const [email, setEmail] = useState("");
  const isMobile = useIsMobile();
  const [showSplash, setShowSplash] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);

  // Only show splash on mobile
  useEffect(() => {
    if (!isMobile) {
      setShowSplash(false);
      setSplashComplete(true);
    }
  }, [isMobile]);

  // Mobile experience
  if (isMobile) {
    if (showSplash && !splashComplete) {
      return (
        <MobileSplash
          onComplete={() => {
            setShowSplash(false);
            setSplashComplete(true);
          }}
        />
      );
    }
    return <MobileAuthScreen />;
  }

  // Desktop experience
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeroSection email={email} setEmail={setEmail} />
      <PlansSection />
      <FaqSection email={email} setEmail={setEmail} />
      <Footer />
    </div>
  );
};

export default Index;
