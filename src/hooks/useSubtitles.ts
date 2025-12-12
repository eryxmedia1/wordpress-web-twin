import { useState, useCallback, useEffect, useRef } from "react";

export interface Subtitle {
  language: string;
  vttUrl: string;
}

interface UseSubtitlesProps {
  subtitles?: Subtitle[] | null;
  videoElement?: HTMLVideoElement | null;
}

export const useSubtitles = ({ subtitles, videoElement }: UseSubtitlesProps) => {
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const tracksAddedRef = useRef(false);

  // Available languages from subtitles
  const availableLanguages = subtitles?.map(s => s.language) || [];

  // Toggle captions on/off
  const toggleCaptions = useCallback(() => {
    setCaptionsEnabled(prev => !prev);
  }, []);

  // Select a specific language
  const selectLanguage = useCallback((language: string) => {
    setSelectedLanguage(language);
    setCaptionsEnabled(true);
  }, []);

  // Add subtitle tracks to video element
  useEffect(() => {
    if (!videoElement || !subtitles || subtitles.length === 0 || tracksAddedRef.current) return;

    // Clear existing tracks
    const existingTracks = videoElement.querySelectorAll('track');
    existingTracks.forEach(track => track.remove());

    // Add new tracks
    subtitles.forEach((sub, index) => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = sub.language;
      track.srclang = getLanguageCode(sub.language);
      track.src = sub.vttUrl;
      if (index === 0) {
        track.default = true;
        if (!selectedLanguage) {
          setSelectedLanguage(sub.language);
        }
      }
      videoElement.appendChild(track);
    });

    tracksAddedRef.current = true;
  }, [videoElement, subtitles, selectedLanguage]);

  // Update track visibility based on state
  useEffect(() => {
    if (!videoElement) return;

    const tracks = videoElement.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (captionsEnabled && track.label === selectedLanguage) {
        track.mode = 'showing';
      } else {
        track.mode = 'hidden';
      }
    }
  }, [videoElement, captionsEnabled, selectedLanguage]);

  // Reset when video changes
  useEffect(() => {
    tracksAddedRef.current = false;
  }, [subtitles]);

  return {
    captionsEnabled,
    selectedLanguage,
    availableLanguages,
    hasSubtitles: (subtitles?.length || 0) > 0,
    toggleCaptions,
    selectLanguage,
  };
};

// Helper to convert language names to ISO codes
function getLanguageCode(language: string): string {
  const codes: Record<string, string> = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Chinese': 'zh',
    'Hindi': 'hi',
    'Arabic': 'ar',
    'Russian': 'ru',
    'Dutch': 'nl',
    'Polish': 'pl',
    'Turkish': 'tr',
    'Vietnamese': 'vi',
    'Thai': 'th',
    'Indonesian': 'id',
    'Malay': 'ms',
    'Swedish': 'sv',
  };
  return codes[language] || 'en';
}
