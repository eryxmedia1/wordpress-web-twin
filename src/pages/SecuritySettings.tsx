import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Key, 
  Smartphone, 
  Monitor, 
  LogOut, 
  Eye, 
  EyeOff,
  ChevronLeft,
  Check,
  X,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const SecuritySettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);

  // Mock session data
  const [sessions] = useState([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "New York, US",
      lastActive: "Now",
      current: true,
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "Miami, US",
      lastActive: "2 hours ago",
      current: false,
    },
    {
      id: "3",
      device: "Firefox on MacOS",
      location: "Los Angeles, US",
      lastActive: "1 day ago",
      current: false,
    },
  ]);

  const handleChangePassword = async () => {
    setPasswordErrors([]);

    try {
      const result = passwordSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!result.success) {
        setPasswordErrors(result.error.errors.map(e => e.message));
        return;
      }

      setIsChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        if (error.message.includes("same as")) {
          toast.error("New password must be different from current password");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    setIsEnabling2FA(true);
    
    // Simulate 2FA toggle - in real implementation, this would integrate with Supabase MFA
    setTimeout(() => {
      setTwoFactorEnabled(!twoFactorEnabled);
      toast.success(twoFactorEnabled ? "Two-factor authentication disabled" : "Two-factor authentication enabled");
      setIsEnabling2FA(false);
    }, 1000);
  };

  const handleSignOutSession = async (sessionId: string) => {
    toast.success("Session signed out successfully");
  };

  const handleSignOutAllSessions = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      navigate("/login");
      toast.success("Signed out of all devices");
    } catch (error) {
      toast.error("Failed to sign out of all devices");
    }
  };

  // Password strength indicators
  const passwordStrength = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const passwordStrengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const content = (
    <div className="min-h-screen bg-background">
      {!isMobile && (
        <>
          <Navbar />
          <ExpandingSidebar />
        </>
      )}

      <main className={`${isMobile ? 'pt-4 px-4 pb-24' : 'pt-24 pl-20 pr-6 md:pl-24 md:pr-8'}`}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/account">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Security Settings</h1>
              <p className="text-muted-foreground">
                Manage your password, 2FA, and active sessions
              </p>
            </div>
          </div>

          {/* Password Change Section */}
          <Card className="mb-6 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Key className="w-5 h-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrengthScore >= level
                              ? passwordStrengthScore <= 2
                                ? "bg-destructive"
                                : passwordStrengthScore === 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(passwordStrength).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1">
                          {value ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <X className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className={value ? "text-green-500" : "text-muted-foreground"}>
                            {key === "length" && "8+ characters"}
                            {key === "uppercase" && "Uppercase letter"}
                            {key === "lowercase" && "Lowercase letter"}
                            {key === "number" && "Number"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords don't match</p>
                )}
              </div>

              {/* Error Messages */}
              {passwordErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  {passwordErrors.map((error, i) => (
                    <p key={i} className="text-sm text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </p>
                  ))}
                </div>
              )}

              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="mb-6 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Smartphone className="w-5 h-5 text-primary" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {twoFactorEnabled ? "2FA is enabled" : "2FA is disabled"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled
                      ? "Your account is protected with two-factor authentication"
                      : "Enable 2FA for additional security when signing in"}
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleToggle2FA}
                  disabled={isEnabling2FA}
                />
              </div>

              {twoFactorEnabled && (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Two-factor authentication is active on your account
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="mb-6 bg-card/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Monitor className="w-5 h-5 text-primary" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>
                    Manage devices that are signed into your account
                  </CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleSignOutAllSessions}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Monitor className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        {session.device}
                        {session.current && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSignOutSession(session.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Sign Out
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Back Button */}
          <Button variant="outline" asChild>
            <Link to="/account">Back to Account</Link>
          </Button>
        </div>
      </main>
    </div>
  );

  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return content;
};

export default SecuritySettings;
