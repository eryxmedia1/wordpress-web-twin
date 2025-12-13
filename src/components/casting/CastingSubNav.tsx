import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, Megaphone, Film, UserPlus, Clapperboard, UserCog } from "lucide-react";

const castingNavItems = [
  { label: "Talents", path: "/casting", icon: Users },
  { label: "Casting Calls", path: "/casting/calls", icon: Megaphone },
  { label: "Shows Being Cast", path: "/casting/shows", icon: Film },
  { label: "Crew Hiring", path: "/casting/crew", icon: Clapperboard },
  { label: "Join as Talent", path: "/talent/signup", icon: UserPlus },
  { label: "Join as Crew", path: "/talent/signup?type=crew", icon: UserCog },
];

export function CastingSubNav() {
  const location = useLocation();

  return (
    <nav className="mt-16 bg-card/95 backdrop-blur-sm border-b border-border sticky top-[64px] z-40">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {castingNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
