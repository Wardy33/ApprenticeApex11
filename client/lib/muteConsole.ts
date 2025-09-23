// Mute console methods in production unless explicitly enabled via ?debug=true
(() => {
  if (typeof window === 'undefined') return;
  const isDev = process.env.NODE_ENV === 'development';
  const debugEnabled = window.location.search.includes('debug=true');
  if (isDev || debugEnabled) return;

  const noop = () => {};
  try {
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.debug = noop as any;
    console.info = noop as any;
  } catch {}
})();


