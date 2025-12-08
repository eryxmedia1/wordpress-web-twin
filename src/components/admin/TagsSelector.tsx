import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Tag, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DbTag {
  id: string;
  name: string;
  slug: string;
  content_type: string | null;
}

interface TagsSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  contentType?: "movie" | "show" | "all";
}

export const TagsSelector = ({ selectedTagIds, onTagsChange, contentType = "all" }: TagsSelectorProps) => {
  const [tags, setTags] = useState<DbTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tags')
        .select('id, name, slug, content_type')
        .order('name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreating(true);
    try {
      const slug = newTagName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const tagData = {
        name: newTagName.trim(),
        slug,
        content_type: contentType === "all" ? null : contentType
      };

      const { data, error } = await supabase
        .from('tags')
        .insert(tagData as any)
        .select()
        .single();

      if (error) throw error;
      
      const newTag = data as unknown as DbTag;

      setTags([...tags, newTag]);
      onTagsChange([...selectedTagIds, newTag.id]);
      setNewTagName("");
      setShowNewTagInput(false);
      toast.success(`Tag "${newTagName}" created`);
    } catch (error: any) {
      console.error("Error creating tag:", error);
      toast.error(error.message || "Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = contentType === "all" || !tag.content_type || tag.content_type === contentType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <Tag className="w-4 h-4" /> Tags
        </Label>
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <Tag className="w-4 h-4" /> Tags
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowNewTagInput(!showNewTagInput)}
        >
          <Plus className="w-4 h-4 mr-1" /> New Tag
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Select tags to help users discover similar content through recommendations
      </p>

      {showNewTagInput && (
        <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
          <Input
            placeholder="Enter tag name..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateTag();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleCreateTag}
            disabled={creating || !newTagName.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {creating ? "Adding..." : "Add"}
          </Button>
        </div>
      )}

      {tags.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-muted/50 pl-9"
          />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 max-h-64 overflow-y-auto p-1">
        {filteredTags.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full py-4 text-center">
            {searchTerm ? "No tags match your search" : "No tags available. Create one above!"}
          </p>
        ) : (
          filteredTags.map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-colors cursor-pointer ${
                selectedTagIds.includes(tag.id) 
                  ? "bg-primary/20 border border-primary/50" 
                  : "bg-muted/50 hover:bg-muted border border-transparent"
              }`}
              onClick={() => toggleTag(tag.id)}
            >
              <Checkbox
                id={`tag-${tag.id}`}
                checked={selectedTagIds.includes(tag.id)}
                onCheckedChange={() => toggleTag(tag.id)}
              />
              <Label
                htmlFor={`tag-${tag.id}`}
                className="cursor-pointer text-sm font-medium truncate"
              >
                {tag.name}
              </Label>
            </div>
          ))
        )}
      </div>

      {selectedTagIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
};

export default TagsSelector;
