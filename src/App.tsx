import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useSSOAutoLogin } from "@/hooks/useSSOAutoLogin";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OtpVerification from "./pages/OtpVerification";
import ProfileSelection from "./pages/ProfileSelection";
import Browse from "./pages/Browse";
import GenreView from "./pages/GenreView";
import CategoryView from "./pages/CategoryView";
import Watch from "./pages/Watch";
import Admin from "./pages/Admin";
import AdminMovies from "./pages/AdminMovies";
import AdminTvShows from "./pages/AdminTvShows";
import AdminTags from "./pages/AdminTags";
import EditContent from "./pages/EditContent";
import UserProfile from "./pages/UserProfile";
import Account from "./pages/Account";
import HelpCenter from "./pages/HelpCenter";
import SecuritySettings from "./pages/SecuritySettings";
import Producers from "./pages/Producers";
import ProducerProfile from "./pages/ProducerProfile";
import ProducerDashboard from "./pages/ProducerDashboard";
import RequireAuth from "./components/RequireAuth";
import RequireProfile from "./components/RequireProfile";
import RequireAdmin from "./components/RequireAdmin";
import Search from "./pages/Search";
import Plans from "./pages/Plans";
import AdminMembershipPlans from "./pages/AdminMembershipPlans";
import AdminTop10 from "./pages/AdminTop10";
import AdminAuthBackgrounds from "./pages/AdminAuthBackgrounds";
import AdminUsers from "./pages/AdminUsers";
import LiveTV from "./pages/LiveTV";
import AdminLiveTV from "./pages/AdminLiveTV";
import AdminLiveTVChannels from "./pages/AdminLiveTVChannels";
import AdminLiveTVPlaylists from "./pages/AdminLiveTVPlaylists";
import AdminLiveTVAds from "./pages/AdminLiveTVAds";
import AdminAdReports from "./pages/AdminAdReports";
import IndieChannels from "./pages/IndieChannels";
import IndieChannelPage from "./pages/IndieChannelPage";
import AdminIndieChannels from "./pages/AdminIndieChannels";
import AdminChannelAnalytics from "./pages/AdminChannelAnalytics";
import AdminCampaigns from "./pages/AdminCampaigns";
import Notifications from "./pages/Notifications";
import Casting from "./pages/Casting";
import CastingCalls from "./pages/CastingCalls";
import TalentProfile from "./pages/TalentProfile";
import TalentEdit from "./pages/TalentEdit";
import TalentSignup from "./pages/TalentSignup";
import AdminTalents from "./pages/AdminTalents";
import AdminCastingCalls from "./pages/AdminCastingCalls";
import AdminCastingBanners from "./pages/AdminCastingBanners";
import CastingShows from "./pages/CastingShows";
import CastingShowDetail from "./pages/CastingShowDetail";
import CrewHiring from "./pages/CrewHiring";
import TalentDashboard from "./pages/TalentDashboard";
import AdminCastingShows from "./pages/AdminCastingShows";
import AdminCastingRoles from "./pages/AdminCastingRoles";
import AdminCastingApplications from "./pages/AdminCastingApplications";
import AdminCastingDashboard from "./pages/AdminCastingDashboard";
import AdminDepartments from "./pages/AdminDepartments";
import AdminCrewPositions from "./pages/AdminCrewPositions";
import AdminCrewApplications from "./pages/AdminCrewApplications";
import DepartmentPage from "./pages/DepartmentPage";
import CrewPositionDetail from "./pages/CrewPositionDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

// Auto-refresh component that handles visibility changes gracefully without forced reloads
function AppRefreshHandler() {
  const lastVisibleRef = useRef<number>(Date.now());
  const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes - increased to reduce disruptions

  useEffect(() => {
    // Handle visibility change - only refresh data, never force reload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeAway = now - lastVisibleRef.current;
        
        if (timeAway > STALE_THRESHOLD_MS) {
          console.log(`[App] Tab visible after ${Math.round(timeAway / 60000)} min, refreshing data...`);
          // Only invalidate queries - no page reload
          queryClient.invalidateQueries();
        }
        
        lastVisibleRef.current = now;
      } else {
        lastVisibleRef.current = Date.now();
      }
    };

    // Handle online/offline - gentle refresh only
    const handleOnline = () => {
      console.log('[App] Network restored, refreshing data...');
      queryClient.invalidateQueries();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}

function SSOGate({ children }: { children: React.ReactNode }) {
  const { isProcessing } = useSSOAutoLogin();
  if (isProcessing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        Signing you in...
      </div>
    );
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppRefreshHandler />
    <AuthProvider>
      <ProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SSOGate>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Browse />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/verify-otp" element={<OtpVerification />} />
                
                {/* Protected Routes - Requires Auth */}
                <Route element={<RequireAuth />}>
                  <Route path="/profiles" element={<ProfileSelection />} />
                  
                  {/* Routes requiring profile selection */}
                  <Route element={<RequireProfile />}>
                    <Route path="/browse/:category" element={<Browse />} />
                    <Route path="/browse/genres" element={<GenreView />} />
                    <Route path="/browse/genres/:genreId" element={<GenreView />} />
                    <Route path="/category/:category" element={<CategoryView />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/plans" element={<Plans />} />
                    <Route path="/watch/:id" element={<Watch />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/profile/:id" element={<UserProfile />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/account/security" element={<SecuritySettings />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/producers" element={<Producers />} />
                    <Route path="/producer-profile/:id" element={<ProducerProfile />} />
                    <Route path="/live" element={<LiveTV />} />
                    <Route path="/live/:channelSlug" element={<LiveTV />} />
                    <Route path="/indie-channels" element={<IndieChannels />} />
                    <Route path="/indie-channel/:slug" element={<IndieChannelPage />} />
                    <Route path="/producer/:slug" element={<ProducerDashboard />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/casting" element={<Casting />} />
                    <Route path="/casting/calls" element={<CastingCalls />} />
                    <Route path="/casting/shows" element={<CastingShows />} />
                    <Route path="/casting/shows/:slug" element={<CastingShowDetail />} />
                    <Route path="/casting/crew" element={<CrewHiring />} />
                    <Route path="/casting/crew/:id" element={<CrewPositionDetail />} />
                    <Route path="/casting/departments/:slug" element={<DepartmentPage />} />
                    <Route path="/talent/:id" element={<TalentProfile />} />
                    <Route path="/talent/edit" element={<TalentEdit />} />
                    <Route path="/talent/signup" element={<TalentSignup />} />
                    <Route path="/talent/dashboard" element={<TalentDashboard />} />
                  </Route>
                </Route>
                
                {/* Admin Routes */}
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/movies" element={<AdminMovies />} />
                  <Route path="/admin/movies/:section" element={<AdminMovies />} />
                  <Route path="/admin/tvshows" element={<AdminTvShows />} />
                  <Route path="/admin/tvshows/:section" element={<AdminTvShows />} />
                  <Route path="/admin/tags" element={<AdminTags />} />
                  <Route path="/admin/plans" element={<AdminMembershipPlans />} />
                  <Route path="/admin/top10" element={<AdminTop10 />} />
                  <Route path="/admin/auth-backgrounds" element={<AdminAuthBackgrounds />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/content/:id" element={<EditContent />} />
                  <Route path="/admin/content/new" element={<EditContent />} />
                  <Route path="/admin/livetv" element={<AdminLiveTV />} />
                  <Route path="/admin/livetv/channels" element={<AdminLiveTVChannels />} />
                  <Route path="/admin/livetv/playlists/:channelId" element={<AdminLiveTVPlaylists />} />
                  <Route path="/admin/livetv/ads" element={<AdminLiveTVAds />} />
                  <Route path="/admin/ad-reports" element={<AdminAdReports />} />
                  <Route path="/admin/indie-channels" element={<AdminIndieChannels />} />
                  <Route path="/admin/channel-analytics" element={<AdminChannelAnalytics />} />
                  <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                  <Route path="/admin/talents" element={<AdminTalents />} />
                  <Route path="/admin/casting-calls" element={<AdminCastingCalls />} />
                  <Route path="/admin/casting-banners" element={<AdminCastingBanners />} />
                  <Route path="/admin/casting-shows" element={<AdminCastingShows />} />
                  <Route path="/admin/casting-roles" element={<AdminCastingRoles />} />
                  <Route path="/admin/casting-applications" element={<AdminCastingApplications />} />
                  <Route path="/admin/casting-dashboard" element={<AdminCastingDashboard />} />
                  <Route path="/admin/departments" element={<AdminDepartments />} />
                  <Route path="/admin/crew-positions" element={<AdminCrewPositions />} />
                  <Route path="/admin/crew-applications" element={<AdminCrewApplications />} />
                </Route>
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SSOGate>
        </TooltipProvider>
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
