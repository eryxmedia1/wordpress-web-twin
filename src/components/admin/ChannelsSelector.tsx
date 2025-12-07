import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CHANNELS = [
  "Zoe RatedTV",
  "MadFaceTV",
  "AyiTV",
  "MyPureTV",
  "Yard MonTV",
  "Indie Films",
  "More Networks"
];

interface ChannelsSelectorProps {
  selectedChannels: string[];
  onChannelsChange: (channels: string[]) => void;
}

export const ChannelsSelector = ({ selectedChannels, onChannelsChange }: ChannelsSelectorProps) => {
  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      onChannelsChange(selectedChannels.filter(c => c !== channel));
    } else {
      onChannelsChange([...selectedChannels, channel]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Channels / Networks</Label>
      <p className="text-sm text-muted-foreground">
        Select which channels/networks this content belongs to
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
        {CHANNELS.map((channel) => (
          <div
            key={channel}
            className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            onClick={() => toggleChannel(channel)}
          >
            <Checkbox
              id={`channel-${channel}`}
              checked={selectedChannels.includes(channel)}
              onCheckedChange={() => toggleChannel(channel)}
            />
            <Label
              htmlFor={`channel-${channel}`}
              className="cursor-pointer text-sm font-medium"
            >
              {channel}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelsSelector;
