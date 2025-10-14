// Global type declarations for browser APIs and Node.js globals

declare global {
  // Browser APIs
  interface Window {
    webkitRequestAnimationFrame?: typeof requestAnimationFrame;
    mozRequestAnimationFrame?: typeof requestAnimationFrame;
    msRequestAnimationFrame?: typeof requestAnimationFrame;
    webkitCancelAnimationFrame?: typeof cancelAnimationFrame;
    mozCancelAnimationFrame?: typeof cancelAnimationFrame;
    msCancelAnimationFrame?: typeof cancelAnimationFrame;
  }

  // Node.js globals that might be available in browser context
  namespace NodeJS {
    interface Timer {
      ref?(): Timer;
      unref?(): Timer;
    }
    interface Immediate {
      ref?(): Immediate;
      unref?(): Immediate;
    }
    interface Timeout {
      ref?(): Timeout;
      unref?(): Timeout;
    }
  }

  // Browser APIs that might not be properly typed
  var Image: typeof globalThis.Image;
  var Audio: typeof globalThis.Audio;
  var btoa: typeof globalThis.btoa;
  var atob: typeof globalThis.atob;
  var crypto: typeof globalThis.crypto;
  var screen: typeof globalThis.screen;
  var alert: typeof globalThis.alert;
  var confirm: typeof globalThis.confirm;
  var requestAnimationFrame: typeof globalThis.requestAnimationFrame;
  var cancelAnimationFrame: typeof globalThis.cancelAnimationFrame;
  var requestIdleCallback: typeof globalThis.requestIdleCallback;
  var getComputedStyle: typeof globalThis.getComputedStyle;
  var indexedDB: typeof globalThis.indexedDB;
  var caches: typeof globalThis.caches;
  var setImmediate: (callback: () => void, ...args: any[]) => any;
  
  // Service Worker / Web Worker globals
  var self: typeof globalThis;

  // Node.js specific
  var __dirname: string;
  var require: (id: string) => any;
  var module: {
    exports: any;
  };

  // Testing globals (Jest)
  var jest: typeof import('jest');
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void) => void;
  var test: (name: string, fn: () => void) => void;
  var expect: typeof import('jest').expect;
  var beforeEach: (fn: () => void) => void;
  var afterEach: (fn: () => void) => void;
  var beforeAll: (fn: () => void) => void;
  var afterAll: (fn: () => void) => void;
}

// Export to make this a module
export {};