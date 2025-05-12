
/// <reference types="vite/client" />

// Add VideoJS type definitions
import videojs from 'video.js';

declare module 'video.js' {
  // Add proper Player type export
  interface Player {
    ima: {
      initializeAdDisplayContainer: () => void;
      requestAds: () => void;
    };
  }
}

// Declare module for the IMA plugin itself
declare module 'videojs-ima' {
  const ima: {
    (player: videojs.Player, options?: any): void;
    VERSION: string;
  };
  export default ima;
}
