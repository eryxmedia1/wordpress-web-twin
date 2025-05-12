
/// <reference types="vite/client" />

// Add VideoJS type definitions
import 'video.js';

// Extend the VideoJS Player type to include IMA plugin
declare module 'video.js' {
  interface Player {
    ima: {
      initializeAdDisplayContainer: () => void;
      requestAds: () => void;
      [key: string]: any;
    };
  }
}

// Declare module for the IMA plugin itself
declare module 'videojs-ima' {
  const ima: {
    (player: any, options?: any): void;
    VERSION: string;
  };
  export default ima;
}
