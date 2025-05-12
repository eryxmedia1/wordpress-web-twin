
import { useState, useEffect } from "react";
import { supabase, DbContent } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TvShowCard from "./TvShowCard";

type TvShowWithSeasonCount = DbContent & {
  seasonCount: number;
};

type TvShowsListProps = {
  searchTerm: string;
  onEdit: (id: string) => void;
  onRefresh: () => void;
};

const TvShowsList = ({ searchTerm, onEdit, onRefresh }: TvShowsListProps) => {
  const [tvShows, setTvShows] = useState<TvShowWithSeasonCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTvShows();
  }, []);

  async function fetchTvShows() {
    setLoading(true);
    
    try {
      // First, fetch all TV shows
      const { data: shows, error } = await supabase
        .from('contents')
        .select('*')
        .eq('type', 'show')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // For each show, count its seasons
      const showsWithSeasonCounts = await Promise.all((shows || []).map(async (show) => {
        const { count, error: countError } = await supabase
          .from('seasons')
          .select('*', { count: 'exact', head: true })
          .eq('content_id', show.id);
        
        return {
          ...show,
          seasonCount: count || 0
        };
      }));
      
      setTvShows(showsWithSeasonCounts);
    } catch (error: any) {
      toast.error("Failed to load TV shows: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteTvShow = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this TV show?")) {
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Failed to delete TV show: " + error.message);
      } else {
        toast.success("TV show deleted successfully");
        onRefresh(); // Trigger parent component to refresh
        fetchTvShows(); // Also refresh local state
      }
    }
  };

  const filteredTvShows = tvShows.filter(show => 
    show.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <p className="text-center">Loading TV shows...</p>;
  }

  if (filteredTvShows.length === 0) {
    return <p className="text-center">No TV shows found. Add some TV shows to get started!</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTvShows.map(show => (
        <TvShowCard 
          key={show.id} 
          show={show} 
          onEdit={onEdit} 
          onDelete={handleDeleteTvShow}
        />
      ))}
    </div>
  );
};

export default TvShowsList;
