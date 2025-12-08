import { ReactNode } from "react";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";
import PWAInstallBanner from "./PWAInstallBanner";

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
    <div className="mobile-full-height bg-background md:hidden overflow-y-auto overflow-x-hidden">
      {!hideHeader && <MobileHeader />}
      
      <main className={!hideBottomNav ? "pb-24" : ""}>
        {children}
      </main>

      {!hideBottomNav && <MobileBottomNav />}
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
};

export default MobileLayout;
