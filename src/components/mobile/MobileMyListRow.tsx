import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import MobileContentRow from "./MobileContentRow";

interface FavoriteItem {
  id: string;
  content_id: string;
  contents: {
    id: string;
    title: string;
    poster_url: string | null;
    rating: string | null;
    release_year: number | null;
    genre: string | null;
    video_url: string | null;
    trailer_url: string | null;
  };
}

interface MobileMyListRowProps {
  onItemClick: (id: string) => void;
  seeAllLink?: string;
}

const MobileMyListRow = ({ onItemClick, seeAllLink }: MobileMyListRowProps) => {
  const { currentProfile } = useProfile();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyList = useCallback(async () => {
    if (!currentProfile?.id) return;

    const { data, error } = await supabase
      .from("favorites")
      .select(`
        id,
        content_id,
        contents (
          id,
          title,
          poster_url,
          rating,
          release_year,
          genre,
          video_url,
          trailer_url
        )
      `)
      .eq("profile_id", currentProfile.id)
      .order("created_at", { ascending: false })
      .limit(15);

    if (!error && data) {
      setItems(data as unknown as FavoriteItem[]);
    }
    setIsLoading(false);
  }, [currentProfile?.id]);

  useEffect(() => {
    fetchMyList();
  }, [fetchMyList]);

  // Real-time subscription for favorites changes
  useEffect(() => {
    if (!currentProfile?.id) return;

    const channel = supabase
      .channel('mobile-my-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `profile_id=eq.${currentProfile.id}`
        },
        () => {
          fetchMyList();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfile?.id, fetchMyList]);

  if (isLoading || items.length === 0) return null;

  const mappedItems = items
    .filter(item => item.contents)
    .map((item) => ({
      id: item.contents.id,
      title: item.contents.title,
      posterUrl: item.contents.poster_url || "/placeholder.svg",
      rating: item.contents.rating || undefined,
      year: item.contents.release_year?.toString() || undefined,
      genre: item.contents.genre || undefined,
      videoUrl: item.contents.video_url,
      trailerUrl: item.contents.trailer_url,
    }));

  return (
    <MobileContentRow
      title="My List"
      items={mappedItems}
      onItemClick={onItemClick}
      seeAllLink={seeAllLink}
    />
  );
};

export default MobileMyListRow;
