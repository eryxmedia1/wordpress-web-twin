import { useState, useEffect, useCallback, memo } from "react";
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

export const TagsSelector = memo(({ selectedTagIds, onTagsChange, contentType = "all" }: TagsSelectorProps) => {
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

  const toggleTag = useCallback((tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  }, [selectedTagIds, onTagsChange]);

  const handleCreateTags = useCallback(async () => {
    if (!newTagName.trim()) return;

    setCreating(true);
    try {
      // Split by comma and clean up each tag name
      const tagNames = newTagName
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (tagNames.length === 0) return;

      const newTagIds: string[] = [];
      const createdTags: DbTag[] = [];

      for (const tagName of tagNames) {
        const slug = tagName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Check if tag already exists
        const existingTag = tags.find(t => t.slug === slug || t.name.toLowerCase() === tagName.toLowerCase());
        if (existingTag) {
          if (!selectedTagIds.includes(existingTag.id)) {
            newTagIds.push(existingTag.id);
          }
          continue;
        }

        const tagData = {
          name: tagName,
          slug,
          content_type: contentType === "all" ? null : contentType
        };

        const { data, error } = await supabase
          .from('tags')
          .insert(tagData as any)
          .select()
          .single();

        if (error) {
          console.error(`Error creating tag "${tagName}":`, error);
          continue;
        }
        
        const newTag = data as unknown as DbTag;
        createdTags.push(newTag);
        newTagIds.push(newTag.id);
      }

      if (createdTags.length > 0) {
        setTags(prevTags => [...prevTags, ...createdTags]);
      }
      
      if (newTagIds.length > 0) {
        onTagsChange([...selectedTagIds, ...newTagIds]);
      }

      setNewTagName("");
      setShowNewTagInput(false);
      
      if (createdTags.length > 0) {
        toast.success(`${createdTags.length} tag${createdTags.length !== 1 ? 's' : ''} created`);
      } else if (newTagIds.length > 0) {
        toast.success(`${newTagIds.length} existing tag${newTagIds.length !== 1 ? 's' : ''} selected`);
      }
    } catch (error: any) {
      console.error("Error creating tags:", error);
      toast.error(error.message || "Failed to create tags");
    } finally {
      setCreating(false);
    }
  }, [newTagName, tags, selectedTagIds, onTagsChange, contentType]);

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
        <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
          <Input
            placeholder="Enter tag names separated by commas (e.g., Comedy, Drama, Action)"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateTags();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
            <Button
              type="button"
              onClick={handleCreateTags}
              disabled={creating || !newTagName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {creating ? "Adding..." : "Add Tags"}
            </Button>
          </div>
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
            >
              <Checkbox
                id={`tag-${tag.id}`}
                checked={selectedTagIds.includes(tag.id)}
                onCheckedChange={() => toggleTag(tag.id)}
              />
              <Label
                htmlFor={`tag-${tag.id}`}
                className="cursor-pointer text-sm font-medium truncate"
                onClick={(e) => {
                  e.preventDefault();
                  toggleTag(tag.id);
                }}
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
});

TagsSelector.displayName = "TagsSelector";

export default TagsSelector;
