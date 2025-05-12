
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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

const queryClient = new QueryClient();

// Changed to true to allow access to authenticated routes
const isAuthenticated = true;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/browse" 
            element={isAuthenticated ? <Browse /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/browse/:category" 
            element={isAuthenticated ? <Browse /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/browse/genres" 
            element={isAuthenticated ? <GenreView /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/browse/genres/:genreId" 
            element={isAuthenticated ? <GenreView /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/watch/:id" 
            element={isAuthenticated ? <Watch /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile/:id" 
            element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/producers" 
            element={isAuthenticated ? <Producers /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/producer/:id" 
            element={isAuthenticated ? <ProducerProfile /> : <Navigate to="/login" />} 
          />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Admin />} />
          
          {/* Movie Admin Routes */}
          <Route path="/admin/movies" element={<AdminMovies />} />
          <Route path="/admin/movies/:section" element={<AdminMovies />} />
          
          {/* TV Shows Admin Routes */}
          <Route path="/admin/tvshows" element={<AdminTvShows />} />
          <Route path="/admin/tvshows/:section" element={<AdminTvShows />} />
          
          {/* Content Edit Route */}
          <Route path="/admin/content/:id" element={<EditContent />} />
          <Route path="/admin/content/new" element={<EditContent />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
