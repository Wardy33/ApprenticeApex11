declare global {
  function gtag(
    command: "js" | "config" | "event",
    targetIdOrName: string,
    params?: Record<string, any>,
  ): void;
  interface Window {
    gtag?: typeof gtag;
  }
}

declare module "passport" {
  const passport: any;
  export default passport;
}

declare module "passport-google-oauth20" {
  export const Strategy: any;
}

declare module "express-slow-down" {
  const slowDown: any;
  export default slowDown;
}

export {};
