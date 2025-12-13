import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
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
import TalentDashboard from "./pages/TalentDashboard";
import AdminCastingShows from "./pages/AdminCastingShows";
import AdminCastingRoles from "./pages/AdminCastingRoles";
import AdminCastingApplications from "./pages/AdminCastingApplications";

const queryClient = new QueryClient();

// Auto-refresh component that handles visibility changes and service worker updates
function AppRefreshHandler() {
  const lastVisibleRef = useRef<number>(Date.now());
  const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Check for service worker updates
    const checkForUpdates = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            // Check for waiting service worker (new version available)
            if (registration.waiting) {
              console.log('[App] New version available, reloading...');
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
              return;
            }
            // Check for updates
            await registration.update();
          }
        } catch (error) {
          console.error('[App] Service worker check failed:', error);
        }
      }
    };

    // Handle visibility change - refresh data when returning to app after being away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeAway = now - lastVisibleRef.current;
        
        console.log(`[App] Tab became visible after ${Math.round(timeAway / 1000)}s`);
        
        if (timeAway > STALE_THRESHOLD_MS) {
          console.log('[App] Data may be stale, invalidating queries and checking for updates...');
          // Invalidate all queries to force refresh
          queryClient.invalidateQueries();
          // Check for app updates
          checkForUpdates();
        }
        
        lastVisibleRef.current = now;
      } else {
        // Record when user left
        lastVisibleRef.current = Date.now();
      }
    };

    // Handle online/offline
    const handleOnline = () => {
      console.log('[App] Network restored, invalidating queries...');
      queryClient.invalidateQueries();
    };

    // Initial check on mount
    checkForUpdates();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[App] Service worker updated, reloading...');
        window.location.reload();
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppRefreshHandler />
    <AuthProvider>
      <ProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-otp" element={<OtpVerification />} />
              
              {/* Protected Routes - Requires Auth */}
              <Route element={<RequireAuth />}>
                <Route path="/profiles" element={<ProfileSelection />} />
                
                {/* Routes requiring profile selection */}
                <Route element={<RequireProfile />}>
                  <Route path="/browse" element={<Browse />} />
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
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
