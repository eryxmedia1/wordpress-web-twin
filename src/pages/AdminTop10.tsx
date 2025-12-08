import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, X, Search, Trophy, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Content {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  type: string;
  top_rank: number | null;
}

interface SortableItemProps {
  content: Content;
  index: number;
  onRemove: (id: string) => void;
}

const SortableItem = ({ content, index, onRemove }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 mb-2"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-700 rounded"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg">
        <span className="text-2xl font-black text-primary">{index + 1}</span>
      </div>
      
      <div className="w-16 h-24 rounded overflow-hidden bg-gray-700 flex-shrink-0">
        {(content.poster_url || content.backdrop_url) ? (
          <img
            src={content.poster_url || content.backdrop_url || ""}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <h3 className="font-semibold text-white">{content.title}</h3>
        <p className="text-sm text-gray-400 capitalize">{content.type}</p>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(content.id)}
        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

const AdminTop10 = () => {
  const [top10Items, setTop10Items] = useState<Content[]>([]);
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch Top 10 items
      const { data: top10Data, error: top10Error } = await supabase
        .from("contents")
        .select("id, title, poster_url, backdrop_url, type, top_rank")
        .not("top_rank", "is", null)
        .order("top_rank", { ascending: true })
        .limit(10);

      if (top10Error) throw top10Error;
      setTop10Items((top10Data || []) as Content[]);

      // Fetch all content for search
      const { data: allData, error: allError } = await supabase
        .from("contents")
        .select("id, title, poster_url, backdrop_url, type, top_rank")
        .order("created_at", { ascending: false });

      if (allError) throw allError;
      setAllContent((allData || []) as Content[]);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTop10Items((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addToTop10 = (content: Content) => {
    if (top10Items.length >= 10) {
      toast.error("You can only have 10 items in the Top 10 list");
      return;
    }
    if (top10Items.some((item) => item.id === content.id)) {
      toast.error("This item is already in the Top 10");
      return;
    }
    setTop10Items([...top10Items, content]);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const removeFromTop10 = (id: string) => {
    setTop10Items(top10Items.filter((item) => item.id !== id));
  };

  const saveTop10 = async () => {
    setSaving(true);
    try {
      // First, clear all existing top_rank values
      const { error: clearError } = await supabase
        .from("contents")
        .update({ top_rank: null })
        .not("top_rank", "is", null);

      if (clearError) throw clearError;

      // Then set new rankings
      for (let i = 0; i < top10Items.length; i++) {
        const { error } = await supabase
          .from("contents")
          .update({ top_rank: i + 1 })
          .eq("id", top10Items[i].id);

        if (error) throw error;
      }

      toast.success("Top 10 list saved successfully!");
    } catch (error) {
      console.error("Error saving Top 10:", error);
      toast.error("Failed to save Top 10 list");
    } finally {
      setSaving(false);
    }
  };

  const filteredContent = allContent.filter(
    (content) =>
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !top10Items.some((item) => item.id === content.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <AdminNavbar />
        <div className="pt-20 flex items-center justify-center">
          <div className="animate-pulse text-primary text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />
      
      <main className="pt-24 px-4 md:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-white">Top 10 Videos</h1>
            </div>
            
            <Button
              onClick={saveTop10}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? "Saving..." : "Save Order"}
            </Button>
          </div>
          
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Video to Top 10
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left bg-gray-700 border-gray-600 hover:bg-gray-600"
                  >
                    <Search className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">
                      Search for a video to add...
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0 bg-gray-800 border-gray-700" align="start">
                  <Command className="bg-transparent">
                    <CommandInput
                      placeholder="Search videos..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      className="text-white"
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="text-gray-400 py-4 text-center">
                        No videos found.
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredContent.slice(0, 20).map((content) => (
                          <CommandItem
                            key={content.id}
                            value={content.title}
                            onSelect={() => addToTop10(content)}
                            className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2"
                          >
                            <div className="w-12 h-16 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                              {(content.poster_url || content.backdrop_url) ? (
                                <img
                                  src={content.poster_url || content.backdrop_url || ""}
                                  alt={content.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">{content.title}</p>
                              <p className="text-sm text-gray-400 capitalize">{content.type}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Current Top 10 ({top10Items.length}/10)
              </CardTitle>
              <p className="text-sm text-gray-400">
                Drag and drop to reorder the list
              </p>
            </CardHeader>
            <CardContent>
              {top10Items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No videos in Top 10 yet</p>
                  <p className="text-sm">Use the search above to add videos</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={top10Items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {top10Items.map((content, index) => (
                      <SortableItem
                        key={content.id}
                        content={content}
                        index={index}
                        onRemove={removeFromTop10}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminTop10;
