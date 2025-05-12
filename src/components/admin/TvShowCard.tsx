
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tv, Trash } from "lucide-react";
import { DbContent } from "@/integrations/supabase/client";

type TvShowCardProps = {
  show: DbContent & { seasonCount: number };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const TvShowCard = ({ show, onEdit, onDelete }: TvShowCardProps) => {
  return (
    <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-medium">{show.title}</h3>
            <div className="flex items-center mt-2 text-gray-400">
              <Tv className="w-4 h-4 mr-1" /> TV Show • {show.seasonCount} Season{show.seasonCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white"
              onClick={() => onEdit(show.id)}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-red-500 hover:text-red-400"
              onClick={() => onDelete(show.id)}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TvShowCard;
