import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
}

interface IndieChannelSelectorProps {
  selectedChannelId: string | null;
  onChannelChange: (channelId: string | null) => void;
}

export const IndieChannelSelector = ({
  selectedChannelId,
  onChannelChange,
}: IndieChannelSelectorProps) => {
  const [channels, setChannels] = useState<IndieChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from("indie_channels")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching indie channels:", error);
      } else {
        setChannels(data || []);
      }
      setLoading(false);
    };

    fetchChannels();
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-foreground">Indie Channel (Optional)</Label>
      <Select
        value={selectedChannelId || "none"}
        onValueChange={(value) => onChannelChange(value === "none" ? null : value)}
      >
        <SelectTrigger className="bg-muted border-border">
          <SelectValue placeholder={loading ? "Loading..." : "Select an indie channel"} />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="none">None</SelectItem>
          {channels.map((channel) => (
            <SelectItem key={channel.id} value={channel.id}>
              {channel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Assign this content to an indie channel to feature it on their page
      </p>
    </div>
  );
};
