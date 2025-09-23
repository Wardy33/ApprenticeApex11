import { useEffect } from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SeoManagerProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function SeoManager({ title, description, canonicalUrl, breadcrumbs }: SeoManagerProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (title) {
      document.title = title;
    }
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }

    // JSON-LD: Organization + Breadcrumbs
    const ldScripts = Array.from(document.querySelectorAll('script[data-managed="seo-jsonld"]'));
    ldScripts.forEach((el) => el.remove());

    const org = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ApprenticeApex Ltd',
      url: 'https://apprenticeapex.com',
      logo: 'https://apprenticeapex.com/images/logo.png'
    };
    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.setAttribute('data-managed', 'seo-jsonld');
    orgScript.textContent = JSON.stringify(org);
    document.head.appendChild(orgScript);

    if (breadcrumbs && breadcrumbs.length) {
      const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.url
        }))
      };
      const bcScript = document.createElement('script');
      bcScript.type = 'application/ld+json';
      bcScript.setAttribute('data-managed', 'seo-jsonld');
      bcScript.textContent = JSON.stringify(breadcrumbLd);
      document.head.appendChild(bcScript);
    }
  }, [title, description, canonicalUrl, JSON.stringify(breadcrumbs)]);

  return null;
}


