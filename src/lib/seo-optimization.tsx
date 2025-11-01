'use client';

import React, { useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  locale?: string;
  alternateLocales?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  priority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export interface StructuredData {
  '@type': string;
  [key: string]: any;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ReviewData {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}

export interface ProductData {
  name: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  sku?: string;
  gtin?: string;
  reviews?: ReviewData[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export interface ArticleData {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image: string;
  articleSection: string;
  wordCount?: number;
  readingTime?: number;
  publisher: {
    name: string;
    logo: string;
  };
}

export interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    email: string;
    contactType: string;
  };
  sameAs?: string[];
}

// ============================================================================
// STRUCTURED DATA GENERATORS
// ============================================================================

export function generateWebsiteStructuredData(
  name: string,
  url: string,
  description: string,
  searchAction?: {
    target: string;
    queryInput: string;
  }
): StructuredData {
  return {
    '@type': 'WebSite',
    name,
    url,
    description,
    ...(searchAction && {
      potentialAction: {
        '@type': 'SearchAction',
        target: searchAction.target,
        'query-input': searchAction.queryInput
      }
    })
  };
}

export function generateOrganizationStructuredData(data: OrganizationData): StructuredData {
  return {
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: {
      '@type': 'ImageObject',
      url: data.logo
    },
    description: data.description,
    ...(data.address && {
      address: {
        '@type': 'PostalAddress',
        ...data.address
      }
    }),
    ...(data.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...data.contactPoint
      }
    }),
    ...(data.sameAs && { sameAs: data.sameAs })
  };
}

export function generateArticleStructuredData(data: ArticleData): StructuredData {
  return {
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    image: {
      '@type': 'ImageObject',
      url: data.image
    },
    author: {
      '@type': 'Person',
      name: data.author
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: data.publisher.logo
      }
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    articleSection: data.articleSection,
    ...(data.wordCount && { wordCount: data.wordCount }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': typeof window !== 'undefined' ? window.location.href : ''
    }
  };
}

export function generateProductStructuredData(data: ProductData): StructuredData {
  return {
    '@type': 'Product',
    name: data.name,
    description: data.description,
    brand: {
      '@type': 'Brand',
      name: data.brand
    },
    category: data.category,
    ...(data.sku && { sku: data.sku }),
    ...(data.gtin && { gtin: data.gtin }),
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.currency,
      availability: `https://schema.org/${data.availability}`,
      itemCondition: `https://schema.org/${data.condition}`,
      url: typeof window !== 'undefined' ? window.location.href : ''
    },
    ...(data.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue,
        reviewCount: data.aggregateRating.reviewCount
      }
    }),
    ...(data.reviews && {
      review: data.reviews.map(review => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating
        },
        reviewBody: review.reviewBody,
        datePublished: review.datePublished
      }))
    })
  };
}

export function generateBreadcrumbStructuredData(items: BreadcrumbItem[]): StructuredData {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function generateFAQStructuredData(faqs: FAQItem[]): StructuredData {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function generateLocalBusinessStructuredData(
  business: OrganizationData & {
    openingHours?: string[];
    telephone?: string;
    priceRange?: string;
    geo?: {
      latitude: number;
      longitude: number;
    };
  }
): StructuredData {
  return {
    '@type': 'LocalBusiness',
    name: business.name,
    url: business.url,
    description: business.description,
    ...(business.address && {
      address: {
        '@type': 'PostalAddress',
        ...business.address
      }
    }),
    ...(business.telephone && { telephone: business.telephone }),
    ...(business.openingHours && { openingHours: business.openingHours }),
    ...(business.priceRange && { priceRange: business.priceRange }),
    ...(business.geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: business.geo.latitude,
        longitude: business.geo.longitude
      }
    })
  };
}

// ============================================================================
// SEO HOOKS
// ============================================================================

export function useSEO(seoData: SEOData) {
  const pathname = usePathname();
  const router = useRouter();

  const canonicalUrl = useMemo(() => {
    if (seoData.canonical) return seoData.canonical;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${pathname}`;
    }
    return '';
  }, [seoData.canonical, pathname]);

  const structuredDataScript = useMemo(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        generateWebsiteStructuredData(
          'Somleng',
          canonicalUrl,
          seoData.description
        )
      ]
    };

    return JSON.stringify(structuredData);
  }, [canonicalUrl, seoData.description]);

  // Update document title and meta tags
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Update title
    document.title = seoData.title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', seoData.description);
    if (seoData.keywords) {
      updateMetaTag('keywords', seoData.keywords.join(', '));
    }
    if (seoData.author) {
      updateMetaTag('author', seoData.author);
    }

    // Robots meta
    const robotsContent = [
      seoData.noIndex ? 'noindex' : 'index',
      seoData.noFollow ? 'nofollow' : 'follow'
    ].join(', ');
    updateMetaTag('robots', robotsContent);

    // Open Graph
    updateMetaTag('og:title', seoData.title, true);
    updateMetaTag('og:description', seoData.description, true);
    updateMetaTag('og:type', seoData.ogType || 'website', true);
    updateMetaTag('og:url', canonicalUrl, true);
    if (seoData.ogImage) {
      updateMetaTag('og:image', seoData.ogImage, true);
      if (seoData.ogImageWidth) {
        updateMetaTag('og:image:width', seoData.ogImageWidth.toString(), true);
      }
      if (seoData.ogImageHeight) {
        updateMetaTag('og:image:height', seoData.ogImageHeight.toString(), true);
      }
    }
    if (seoData.locale) {
      updateMetaTag('og:locale', seoData.locale, true);
    }

    // Twitter Card
    updateMetaTag('twitter:card', seoData.twitterCard || 'summary_large_image');
    updateMetaTag('twitter:title', seoData.title);
    updateMetaTag('twitter:description', seoData.description);
    if (seoData.ogImage) {
      updateMetaTag('twitter:image', seoData.ogImage);
    }
    if (seoData.twitterSite) {
      updateMetaTag('twitter:site', seoData.twitterSite);
    }
    if (seoData.twitterCreator) {
      updateMetaTag('twitter:creator', seoData.twitterCreator);
    }

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Alternate language links
    if (seoData.alternateLocales) {
      seoData.alternateLocales.forEach(locale => {
        let alternateLink = document.querySelector(`link[rel="alternate"][hreflang="${locale}"]`);
        if (!alternateLink) {
          alternateLink = document.createElement('link');
          alternateLink.setAttribute('rel', 'alternate');
          alternateLink.setAttribute('hreflang', locale);
          document.head.appendChild(alternateLink);
        }
        alternateLink.setAttribute('href', `${canonicalUrl}?lang=${locale}`);
      });
    }

  }, [seoData, canonicalUrl]);

  return {
    canonicalUrl,
    structuredDataScript
  };
}

// ============================================================================
// PERFORMANCE MONITORING FOR SEO
// ============================================================================

export function useSEOPerformanceMonitoring() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

    const checkSEOElements = () => {
      const issues: string[] = [];

      // Check title
      const title = document.querySelector('title');
      if (!title || !title.textContent) {
        issues.push('Missing page title');
      } else if (title.textContent.length > 60) {
        issues.push('Title too long (>60 characters)');
      } else if (title.textContent.length < 30) {
        issues.push('Title too short (<30 characters)');
      }

      // Check meta description
      const description = document.querySelector('meta[name="description"]');
      if (!description || !description.getAttribute('content')) {
        issues.push('Missing meta description');
      } else {
        const descLength = description.getAttribute('content')?.length || 0;
        if (descLength > 160) {
          issues.push('Meta description too long (>160 characters)');
        } else if (descLength < 120) {
          issues.push('Meta description too short (<120 characters)');
        }
      }

      // Check h1 tags
      const h1Tags = document.querySelectorAll('h1');
      if (h1Tags.length === 0) {
        issues.push('Missing h1 tag');
      } else if (h1Tags.length > 1) {
        issues.push('Multiple h1 tags found');
      }

      // Check images without alt text
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      if (imagesWithoutAlt.length > 0) {
        issues.push(`${imagesWithoutAlt.length} images missing alt text`);
      }

      // Check canonical URL
      const canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        issues.push('Missing canonical URL');
      }

      // Check Open Graph
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      
      if (!ogTitle) issues.push('Missing Open Graph title');
      if (!ogDescription) issues.push('Missing Open Graph description');
      if (!ogImage) issues.push('Missing Open Graph image');

      // Report issues
      if (issues.length > 0) {
        console.group('🔍 SEO Issues Detected');
        issues.forEach(issue => console.warn(`⚠️ ${issue}`));
        console.groupEnd();
      } else {
        void 0;
      }
    };

    // Run check after a short delay to allow for dynamic content
    const timeoutId = setTimeout(checkSEOElements, 1000);
    return () => clearTimeout(timeoutId);
  }, []);
}

// ============================================================================
// SOCIAL SHARING UTILITIES
// ============================================================================

export interface SocialShareConfig {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  via?: string;
}

export function generateSocialShareUrls(config: SocialShareConfig) {
  const encodedUrl = encodeURIComponent(config.url);
  const encodedTitle = encodeURIComponent(config.title);
  const encodedDescription = encodeURIComponent(config.description || '');

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${
      config.hashtags ? `&hashtags=${config.hashtags.join(',')}` : ''
    }${config.via ? `&via=${config.via}` : ''}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  };
}

// ============================================================================
// SITEMAP GENERATION UTILITIES
// ============================================================================

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapXML(entries: SitemapEntry[]): string {
  const urlElements = entries.map(entry => `
  <url>
    <loc>${entry.loc}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

// ============================================================================
// ROBOTS.TXT GENERATION
// ============================================================================

export interface RobotsConfig {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  sitemap?: string;
}

export function generateRobotsTxt(configs: RobotsConfig[]): string {
  let robotsTxt = '';

  configs.forEach(config => {
    robotsTxt += `User-agent: ${config.userAgent}\n`;
    
    if (config.disallow) {
      config.disallow.forEach(path => {
        robotsTxt += `Disallow: ${path}\n`;
      });
    }
    
    if (config.allow) {
      config.allow.forEach(path => {
        robotsTxt += `Allow: ${path}\n`;
      });
    }
    
    if (config.crawlDelay) {
      robotsTxt += `Crawl-delay: ${config.crawlDelay}\n`;
    }
    
    robotsTxt += '\n';
  });

  // Add sitemap at the end
  const sitemapConfig = configs.find(config => config.sitemap);
  if (sitemapConfig?.sitemap) {
    robotsTxt += `Sitemap: ${sitemapConfig.sitemap}\n`;
  }

  return robotsTxt;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const SEOOptimization = {
  // Hooks
  useSEO,
  useSEOPerformanceMonitoring,
  
  // Structured Data Generators
  generateWebsiteStructuredData,
  generateOrganizationStructuredData,
  generateArticleStructuredData,
  generateProductStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData,
  generateLocalBusinessStructuredData,
  
  // Social Sharing
  generateSocialShareUrls,
  
  // Technical SEO
  generateSitemapXML,
  generateRobotsTxt
};

export default SEOOptimization;