
/// <reference types="vite/client" />

// Add VideoJS type definitions
import videojs from 'video.js';

declare module 'video.js' {
  interface Player {
    ima: {
      initializeAdDisplayContainer: () => void;
      requestAds: () => void;
      [key: string]: any; // Allow for any other IMA properties
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
