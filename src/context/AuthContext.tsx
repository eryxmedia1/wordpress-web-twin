
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

  // Function to check admin status
  const checkAdminStatus = async (userId: string) => {
    try {
      console.log("Checking admin status for user:", userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error checking admin status:", error);
        toast.error("Error checking admin status");
        throw error;
      }
      
      console.log("Admin check result:", profile);
      // Force admin status for this specific email
      if (user?.email === 'eryxmedia@gmail.com') {
        console.log("Special user found, granting admin access");
        setIsAdmin(true);
        // Update the profile to ensure they're an admin in the database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', userId);
        
        if (updateError) {
          console.error("Error updating admin status:", updateError);
        }
      } else {
        setIsAdmin(profile?.is_admin || false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      // If there's an error, still grant admin to the specified email
      if (user?.email === 'eryxmedia@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      console.log("Login successful:", data);
      
      // Session and user will be updated by onAuthStateChange listener
      toast.success("Successfully logged in!");
    } catch (error: any) {
      console.error("Login error:", error);
      // If it's the special email, try signing up instead
      if (email === 'eryxmedia@gmail.com') {
        try {
          console.log("Attempting to create account for special user");
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: 'Admin User',
              }
            }
          });

          if (error) {
            console.error("Signup error:", error);
            toast.error(error.message || "Failed to create account");
            throw error;
          }

          console.log("Account created:", data);
          toast.success("Account created and logged in!");
        } catch (signupError: any) {
          console.error("Signup error:", signupError);
          toast.error(signupError.message || "Failed to login or create account");
          throw signupError;
        }
      } else {
        toast.error(error.message || "Failed to log in. Please check your credentials.");
        throw error;
      }
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully logged out");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "Failed to log out");
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
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
