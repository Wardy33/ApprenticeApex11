export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;

  const GA_ID = (import.meta as any).env?.VITE_GA_ID as string | undefined;
  if (!GA_ID) return;

  // Prevent double init
  if (document.getElementById('ga4-script')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.id = 'ga4-script';
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // @ts-ignore
  function gtag(){(window as any).dataLayer.push(arguments);} // eslint-disable-line
  // @ts-ignore
  (window as any).gtag = gtag;
  // @ts-ignore
  gtag('js', new Date().toISOString());
  // @ts-ignore
  gtag('config', GA_ID, { anonymize_ip: true });
}


