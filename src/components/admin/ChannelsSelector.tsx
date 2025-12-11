import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATIC_CHANNELS = [
  "Zoe RatedTV",
  "MadFaceTV",
  "AyiTV",
  "MyPureTV",
  "Yard MonTV",
  "Indie Films",
  "More Networks",
  "Boss Mogul TV",
  "Caught On Camera",
  "Cap Village Media",
  "Funny Videos",
  "Dramatic Videos",
  "Podcast Universe"
];

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
}

interface ChannelsSelectorProps {
  selectedChannels: string[];
  onChannelsChange: (channels: string[]) => void;
}

export const ChannelsSelector = ({ selectedChannels, onChannelsChange }: ChannelsSelectorProps) => {
  const [indieChannels, setIndieChannels] = useState<IndieChannel[]>([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Combine static channels with indie channels
  const allChannels = [
    ...STATIC_CHANNELS,
    ...indieChannels.map(c => c.name)
  ];

  const fetchIndieChannels = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('indie_channels')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');
    
    if (data) {
      setIndieChannels(data);
    }
    if (error) {
      console.error('Error fetching indie channels:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIndieChannels();
  }, []);

  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      onChannelsChange(selectedChannels.filter(c => c !== channel));
    } else {
      onChannelsChange([...selectedChannels, channel]);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error("Please enter a channel name");
      return;
    }

    // Check if channel already exists
    const existingChannel = allChannels.find(
      c => c.toLowerCase() === newChannelName.trim().toLowerCase()
    );
    if (existingChannel) {
      toast.error("Channel already exists");
      return;
    }

    setIsCreating(true);
    
    // Generate slug from name
    const slug = newChannelName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('indie_channels')
      .insert({
        name: newChannelName.trim(),
        slug,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message || "Failed to create channel");
    } else if (data) {
      toast.success("Channel created successfully");
      setIndieChannels(prev => [...prev, data]);
      // Auto-select the new channel
      onChannelsChange([...selectedChannels, data.name]);
      setNewChannelName("");
    }
    
    setIsCreating(false);
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Channels / Networks</Label>
      <p className="text-sm text-muted-foreground">
        Select which channels/networks this content belongs to
      </p>
      
      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading channels...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {/* Deduplicate channels - prefer indie channels over static ones */}
          {[...new Set(allChannels)].map((channel, index) => {
            const isSelected = selectedChannels.includes(channel);
            const indieChannel = indieChannels.find(c => c.name === channel);
            const isIndieChannel = !!indieChannel;
            // Use indie channel ID if available, otherwise use index-prefixed name for uniqueness
            const uniqueKey = indieChannel?.id || `static-${index}-${channel}`;
            return (
              <div
                key={uniqueKey}
                className={`flex items-center space-x-2 p-3 rounded-lg transition-colors cursor-pointer ${
                  isSelected ? 'bg-primary/20 border border-primary' : 'bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => toggleChannel(channel)}
              >
                <input
                  type="checkbox"
                  id={`channel-${uniqueKey}`}
                  checked={isSelected}
                  onChange={() => {}}
                  className="rounded bg-gray-700 border-gray-600 pointer-events-none"
                />
                <Label
                  htmlFor={`channel-${uniqueKey}`}
                  className="cursor-pointer text-sm font-medium pointer-events-none flex-1"
                >
                  {channel}
                  {isIndieChannel && (
                    <span className="ml-1 text-xs text-primary">(Indie)</span>
                  )}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Indie Channel */}
      <div className="mt-4 p-4 border border-dashed border-border rounded-lg bg-muted/30">
        <Label className="text-sm font-medium mb-2 block">Create New Indie Channel</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter channel name..."
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateChannel();
              }
            }}
          />
          <Button 
            onClick={handleCreateChannel} 
            disabled={isCreating || !newChannelName.trim()}
            size="sm"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Create
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChannelsSelector;