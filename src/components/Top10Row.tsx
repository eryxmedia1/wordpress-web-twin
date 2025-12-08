import { Link } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ContentLockBadge } from "@/components/ContentLockBadge";

interface Top10Item {
  id: string;
  title: string;
  posterUrl: string;
  rank: number;
  requiredPlans?: string[];
}

interface Top10RowProps {
  title: string;
  items: Top10Item[];
  userPlan?: string;
}

const Top10Row = ({ title, items, userPlan = 'free' }: Top10RowProps) => {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/watch/${item.id}`}
              className="relative flex-shrink-0 group flex items-end"
              style={{ minWidth: '180px' }}
            >
              {/* Large Rank Number - Behind the poster */}
              <div className="absolute left-0 bottom-0 z-0 select-none pointer-events-none">
                <span 
                  className="text-[140px] md:text-[180px] font-black leading-none"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '3px hsl(180 60% 45%)',
                    textShadow: '0 0 30px hsl(180 60% 45% / 0.4)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  {item.rank}
                </span>
              </div>
              
              {/* Poster - In front of the number */}
              <div className="relative w-28 md:w-36 h-40 md:h-52 ml-12 md:ml-16 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105 bg-card z-10 shadow-xl">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Lock Badge for restricted content */}
                {item.requiredPlans && item.requiredPlans.length > 0 && (
                  <ContentLockBadge 
                    requiredPlans={item.requiredPlans} 
                    userPlan={userPlan} 
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default Top10Row;
