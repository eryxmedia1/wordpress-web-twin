
/// <reference types="vite/client" />

// Add VideoJS IMA plugin type definitions
import videojs from 'video.js';

declare module 'video.js' {
  interface Player {
    ima: {
      initializeAdDisplayContainer: () => void;
      requestAds: () => void;
    };
  }
}

// Declare module for the IMA plugin itself
declare module 'videojs-ima' {
  const ima: any;
  export default ima;
}
