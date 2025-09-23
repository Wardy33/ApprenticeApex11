// Global declarations for optional analytics
declare global {
  interface Window {
    dataLayer?: any[];
  }
  // Google Analytics gtag function (if present)
  function gtag(command: string, eventName: string, params?: Record<string, any>): void;
}

export {};


