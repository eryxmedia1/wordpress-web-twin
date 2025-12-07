import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface Subtitle {
  language: string;
  vttUrl: string;
}

interface SubtitlesSelectorProps {
  subtitles: Subtitle[];
  onSubtitlesChange: (subtitles: Subtitle[]) => void;
}

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Japanese", "Korean", "Chinese", "Hindi", "Arabic", "Russian"
];

export const SubtitlesSelector = ({
  subtitles,
  onSubtitlesChange,
}: SubtitlesSelectorProps) => {
  const [subtitleInput, setSubtitleInput] = useState({ language: "English", vttUrl: "" });

  const addSubtitle = () => {
    if (subtitleInput.vttUrl.trim()) {
      onSubtitlesChange([...subtitles, { ...subtitleInput }]);
      setSubtitleInput({ language: "English", vttUrl: "" });
    }
  };

  const removeSubtitle = (index: number) => {
    onSubtitlesChange(subtitles.filter((_, i) => i !== index));
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="py-3">
        <CardTitle className="text-sm text-white">Subtitles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {subtitles.length > 0 && (
          <div className="rounded border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left p-2 text-white">Language</th>
                  <th className="text-left p-2 text-white">VTT URL</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {subtitles.map((sub, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="p-2 text-gray-300">{sub.language}</td>
                    <td className="p-2 text-gray-400 truncate max-w-[200px]">{sub.vttUrl}</td>
                    <td className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubtitle(index)}
                        className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex gap-2">
          <select
            value={subtitleInput.language}
            onChange={(e) => setSubtitleInput({ ...subtitleInput, language: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white rounded p-2 text-sm"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <Input
            placeholder="VTT URL (e.g., https://example.com/subs.vtt)"
            value={subtitleInput.vttUrl}
            onChange={(e) => setSubtitleInput({ ...subtitleInput, vttUrl: e.target.value })}
            className="flex-1 bg-gray-700 border-gray-600 text-white"
          />
          <Button type="button" onClick={addSubtitle} size="sm" className="bg-primary">
            Add Row
          </Button>
        </div>
        <p className="text-xs text-gray-400">
          You can use an external VTT URL to add subtitles to your video.
        </p>
      </CardContent>
    </Card>
  );
};
