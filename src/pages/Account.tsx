import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, Crown, Settings, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const Account = () => {
  const { user, isAdmin } = useAuth();
  const { currentProfile } = useProfile();
  const isMobile = useIsMobile();

  const accountSections = [
    {
      title: "Membership & Billing",
      description: "Manage your subscription and payment methods",
      icon: Crown,
      link: "/plans",
    },
    {
      title: "Profile Settings",
      description: "Edit your profile information and preferences",
      icon: User,
      link: "/profile",
    },
    {
      title: "Security",
      description: "Password and security settings",
      icon: Shield,
      link: "/account/security",
    },
    {
      title: "Preferences",
      description: "Language, notifications, and display settings",
      icon: Settings,
      link: "#",
      onClick: () => toast.info("Preferences settings coming soon"),
    },
  ];

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
          <p className="text-muted-foreground mb-8">
            Manage your account settings and preferences
          </p>

          {/* User Info Card */}
          <Card className="mb-8 bg-card/50 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: currentProfile?.avatar_color || "#d4af37" }}
                >
                  <User className="w-8 h-8 text-background" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentProfile?.name || "User"}
                  </h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Sections */}
          <div className="space-y-4">
            {accountSections.map((section) => (
              <Card 
                key={section.title} 
                className="bg-card/50 border-border hover:bg-card/70 transition-colors cursor-pointer"
                onClick={section.onClick}
              >
                {section.onClick ? (
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <section.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                ) : (
                  <Link to={section.link}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <section.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{section.title}</h3>
                          <p className="text-sm text-muted-foreground">{section.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Link>
                )}
              </Card>
            ))}
          </div>

          <Separator className="my-8" />

          {/* Quick Links */}
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" asChild>
              <Link to="/profiles">Manage Profiles</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/help">Help Center</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );

  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return content;
};

export default Account;
