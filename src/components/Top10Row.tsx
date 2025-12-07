import { Link } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Top10Item {
  id: string;
  title: string;
  posterUrl: string;
  rank: number;
}

interface Top10RowProps {
  title: string;
  items: Top10Item[];
}

const Top10Row = ({ title, items }: Top10RowProps) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/watch/${item.id}`}
              className="relative flex-shrink-0 group"
            >
              {/* Large Rank Number */}
              <div className="absolute -left-4 bottom-0 z-10">
                <span 
                  className="text-8xl md:text-9xl font-black text-transparent bg-clip-text"
                  style={{
                    WebkitTextStroke: '2px rgba(139, 92, 246, 0.8)',
                    textShadow: '0 0 40px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {item.rank}
                </span>
              </div>
              
              {/* Poster */}
              <div className="relative w-32 md:w-40 h-48 md:h-56 ml-8 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
