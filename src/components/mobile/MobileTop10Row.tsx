import { ChevronRight } from "lucide-react";
import ContentLockBadge from "@/components/ContentLockBadge";

interface Top10Item {
  id: string;
  title: string;
  posterUrl: string;
  rank: number;
  requiredPlans?: string[];
}

interface MobileTop10RowProps {
  title: string;
  items: Top10Item[];
  onItemClick: (id: string) => void;
  userPlan?: string;
}

const MobileTop10Row = ({ title, items, onItemClick, userPlan = 'free' }: MobileTop10RowProps) => {
  if (items.length === 0) return null;

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <button className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          See All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className="flex-shrink-0 cursor-pointer group relative"
          >
            {/* Large Rank Number */}
            <div className="absolute -left-3 bottom-0 z-10">
              <span
                className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground/80 to-foreground/20"
                style={{
                  WebkitTextStroke: "2px hsl(var(--primary))",
                }}
              >
                {item.rank}
              </span>
            </div>

            {/* Poster Card */}
            <div className="relative ml-6 w-[90px] aspect-[2/3] rounded-lg overflow-hidden bg-card shadow-lg">
              {item.requiredPlans && (
                <ContentLockBadge 
                  requiredPlans={item.requiredPlans} 
                  userPlan={userPlan} 
                  size="sm" 
                />
              )}
              <img
                src={item.posterUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileTop10Row;
