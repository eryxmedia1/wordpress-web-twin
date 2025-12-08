import { ReactNode } from "react";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";

interface MobileLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
}

const MobileLayout = ({ 
  children, 
  hideHeader = false,
  hideBottomNav = false 
}: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background md:hidden">
      {!hideHeader && <MobileHeader />}
      
      <main className={!hideBottomNav ? "pb-20" : ""}>
        {children}
      </main>

      {!hideBottomNav && <MobileBottomNav />}
    </div>
  );
};

export default MobileLayout;
