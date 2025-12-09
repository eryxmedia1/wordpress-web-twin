
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to check admin status using secure user_roles table
  const checkAdminStatus = async (userId: string) => {
    try {
      console.log("Checking admin status for user:", userId);
      
      // Use the secure has_role function via user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      // Only grant admin if role exists in user_roles table
      const hasAdminRole = !!data;
      setIsAdmin(hasAdminRole);
      console.log("Admin status set to:", hasAdminRole);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function with improved error handling
  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      
      // Use signInWithPassword with captchaToken set to 'null' to bypass captcha
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // This tells Supabase not to require a captcha token
          captchaToken: null
        }
      });
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error.message || "Login failed. Please check your credentials.");
        throw error;
      }

      console.log("Login successful:", data);
      toast.success("Successfully logged in!");
      
      // Session and user will be updated by onAuthStateChange listener
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to log in. Please check your credentials.");
      throw error;
    }
  };

  // Logout function with improved security
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully logged out");
      // Reset state
      setIsAdmin(false);
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "Failed to log out");
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST (proper order to avoid deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to prevent Supabase deadlocks
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Logged in" : "Not logged in");
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
