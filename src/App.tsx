
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
import Watch from "./pages/Watch";
import Admin from "./pages/Admin";
import EditContent from "./pages/EditContent";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

// Mock authentication for demo purposes
const isAuthenticated = false; // Change to true to test authenticated routes

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
            path="/admin" 
            element={<Admin />} 
          />
          <Route 
            path="/admin/content/:id" 
            element={<EditContent />} 
          />
          <Route 
            path="/admin/content/new" 
            element={<EditContent />} 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
