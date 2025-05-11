
import { useState } from "react";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PlansSection from "@/components/landing/PlansSection";
import FaqSection from "@/components/landing/FaqSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeroSection email={email} setEmail={setEmail} />
      <FeaturesSection />
      <PlansSection />
      <FaqSection email={email} setEmail={setEmail} />
      <Footer />
    </div>
  );
};

export default Index;
