import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export function SEOHead({
  title = "ApprenticeApex - UK's Leading Apprenticeship Matching Platform",
  description = "Connect with your perfect apprenticeship opportunity through AI-powered matching. Join thousands of students and employers building the future workforce together.",
  keywords = "apprenticeships, UK apprenticeships, career development, job matching, student opportunities, employer recruitment, skills training, vocational training",
  ogTitle,
  ogDescription,
  ogImage = "/images/og-image.jpg",
  canonicalUrl,
  noIndex = false,
}: SEOHeadProps) {
  
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper function to set meta tag
    const setMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Set meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    
    // Open Graph tags
    setMetaTag('og:title', ogTitle || title, true);
    setMetaTag('og:description', ogDescription || description, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', 'ApprenticeApex', true);
    
    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', ogTitle || title);
    setMetaTag('twitter:description', ogDescription || description);
    setMetaTag('twitter:image', ogImage);
    
    // Additional SEO tags
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    setMetaTag('theme-color', '#ff6b35'); // Orange theme color
    setMetaTag('author', 'ApprenticeApex Ltd');
    setMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    }

    // Schema.org structured data for organization
    const schemaScript = document.getElementById('schema-org');
    if (!schemaScript) {
      const script = document.createElement('script');
      script.id = 'schema-org';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "ApprenticeApex",
        "description": "UK's leading apprenticeship matching platform connecting students with employers through AI-powered matching.",
        "url": "https://apprenticeapex.com",
        "logo": "https://apprenticeapex.com/images/logo.png",
        "sameAs": [
          "https://www.linkedin.com/company/apprenticeapex",
          "https://twitter.com/apprenticeapex",
          "https://www.facebook.com/apprenticeapex"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "hello@apprenticeapex.co.uk",
          "contactType": "customer service",
          "areaServed": "GB",
          "availableLanguage": "English"
        },
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "GB",
          "addressLocality": "London",
          "addressRegion": "England"
        }
      });
      document.head.appendChild(script);
    }

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonicalUrl, noIndex]);

  return null; // This component doesn't render anything
}

// Predefined SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: "ApprenticeApex - Find Your Perfect Apprenticeship Match",
    description: "Discover apprenticeship opportunities that match your skills and aspirations. Join thousands of students building successful careers through our AI-powered platform.",
    keywords: "apprenticeships, UK apprenticeships, career opportunities, job matching, student jobs, vocational training, skills development",
  },
  
  studentSignup: {
    title: "Sign Up - Start Your Apprenticeship Journey | ApprenticeApex",
    description: "Create your free student account and get matched with apprenticeship opportunities that align with your skills and career goals.",
    keywords: "student signup, apprenticeship registration, career opportunities, free account",
  },
  
  companyPortal: {
    title: "Employer Portal - Find Top Apprenticeship Candidates | ApprenticeApex",
    description: "Connect with talented students ready to learn and grow in your organization. Post opportunities and find perfect apprenticeship matches.",
    keywords: "employer portal, apprenticeship recruitment, hire apprentices, talent acquisition, workforce development",
  },
  
  about: {
    title: "About ApprenticeApex - Revolutionizing Apprenticeship Matching",
    description: "Learn about our mission to bridge the skills gap by connecting ambitious students with forward-thinking employers through innovative technology.",
    keywords: "about apprenticeapex, company mission, apprenticeship platform, team, vision",
  },
  
  privacyPolicy: {
    title: "Privacy Policy | ApprenticeApex",
    description: "Learn how ApprenticeApex protects your personal data and privacy when using our apprenticeship matching platform.",
    keywords: "privacy policy, data protection, GDPR compliance, personal information",
    noIndex: true,
  },
  
  termsOfService: {
    title: "Terms of Service | ApprenticeApex",
    description: "Read our terms of service governing the use of ApprenticeApex's apprenticeship matching platform and services.",
    keywords: "terms of service, user agreement, platform rules, legal terms",
    noIndex: true,
  },
  
  cookiePolicy: {
    title: "Cookie Policy | ApprenticeApex",
    description: "Understand how ApprenticeApex uses cookies to enhance your experience on our apprenticeship platform.",
    keywords: "cookie policy, website cookies, tracking, user experience",
    noIndex: true,
  },
  
  acceptableUse: {
    title: "Acceptable Use Policy | ApprenticeApex",
    description: "Guidelines for appropriate behavior and use of the ApprenticeApex apprenticeship platform.",
    keywords: "acceptable use, platform guidelines, user conduct, community standards",
    noIndex: true,
  },
};
