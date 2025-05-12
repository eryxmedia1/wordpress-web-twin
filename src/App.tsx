
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OtpVerification from "./pages/OtpVerification";
import Browse from "./pages/Browse";
import GenreView from "./pages/GenreView";
import Watch from "./pages/Watch";
import Admin from "./pages/Admin";
import AdminMovies from "./pages/AdminMovies";
import AdminTvShows from "./pages/AdminTvShows";
import EditContent from "./pages/EditContent";
import UserProfile from "./pages/UserProfile";
import Producers from "./pages/Producers";
import ProducerProfile from "./pages/ProducerProfile";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            
            {/* Protected Routes */}
            <Route element={<RequireAuth />}>
              <Route path="/browse" element={<Browse />} />
              <Route path="/browse/:category" element={<Browse />} />
              <Route path="/browse/genres" element={<GenreView />} />
              <Route path="/browse/genres/:genreId" element={<GenreView />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/:id" element={<UserProfile />} />
              <Route path="/producers" element={<Producers />} />
              <Route path="/producer/:id" element={<ProducerProfile />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/movies" element={<AdminMovies />} />
              <Route path="/admin/movies/:section" element={<AdminMovies />} />
              <Route path="/admin/tvshows" element={<AdminTvShows />} />
              <Route path="/admin/tvshows/:section" element={<AdminTvShows />} />
              <Route path="/admin/content/:id" element={<EditContent />} />
              <Route path="/admin/content/new" element={<EditContent />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
