import { Label } from "@/components/ui/label";

const CHANNELS = [
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
        {CHANNELS.map((channel) => {
          const isSelected = selectedChannels.includes(channel);
          return (
            <div
              key={channel}
              className={`flex items-center space-x-2 p-3 rounded-lg transition-colors cursor-pointer ${
                isSelected ? 'bg-primary/20 border border-primary' : 'bg-muted/50 hover:bg-muted'
              }`}
              onClick={() => toggleChannel(channel)}
            >
              <input
                type="checkbox"
                id={`channel-${channel}`}
                checked={isSelected}
                onChange={() => {}} // Handled by div onClick
                className="rounded bg-gray-700 border-gray-600 pointer-events-none"
              />
              <Label
                htmlFor={`channel-${channel}`}
                className="cursor-pointer text-sm font-medium pointer-events-none"
              >
                {channel}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelsSelector;
