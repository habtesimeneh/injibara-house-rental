import axios from 'axios';
import CITY_CONFIG from '../config/cityConfig';

let metaCache = null;

/**
 * Helper function to safely update or append a meta tag in document head
 */
export function setMetaTag(attrName, attrValue, content) {
  if (!content) return;
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Dynamically updates document HTML head with provided SEO meta properties
 */
export function applySEOMeta({ title, description, keywords, ogImage, canonical }) {
  if (title) {
    document.title = title;
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'twitter:title', title);
  }

  if (description) {
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'twitter:description', description);
  }

  if (keywords) {
    setMetaTag('name', 'keywords', keywords);
  }

  if (ogImage) {
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'twitter:image', ogImage);
  }

  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }
}

/**
 * Injects JSON-LD structured data for better rich snippets in search results
 */
export function applyStructuredData(data) {
  let script = document.getElementById('seo-structured-data');
  if (!script) {
    script = document.createElement('script');
    script.id = 'seo-structured-data';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Fetches all route SEO meta settings from backend and caches them in memory
 */
export async function fetchAllSEOMeta(forceRefresh = false) {
  if (metaCache && !forceRefresh) {
    return metaCache;
  }
  
  let retries = 3;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      const res = await axios.get('/api/settings/seo');
      metaCache = Array.isArray(res.data) ? res.data : [];
      return metaCache;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error('Failed to load SEO meta settings after retries:', err);
        // Do NOT set metaCache to empty array, so we can try to fetch it again next time
        return [];
      }
      console.warn(`Failed to load SEO meta settings, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  return [];
}

/**
 * Automatically applies SEO meta tags for a specific path route
 */
export async function syncSEOForRoute(currentPath) {
  const allMeta = await fetchAllSEOMeta();
  const metaList = Array.isArray(allMeta) ? allMeta : [];
  const matched = metaList.find((m) => m && m.route_path === currentPath);

  if (matched) {
    applySEOMeta({
      title: matched.title,
      description: matched.description,
      keywords: matched.keywords,
      ogImage: matched.og_image,
      canonical: window.location.href,
    });
  } else {
    // Default fallback values if path isn't explicitly configured
    const defaultKeywords = `${CITY_CONFIG.brandNameAm}, ${CITY_CONFIG.cityNameAm} ቤት ኪራይ, ${CITY_CONFIG.cityNameAm} የቤት ደላላ, ${CITY_CONFIG.cityNameEn} house rent, ${CITY_CONFIG.cityNameEn} rentals, ${CITY_CONFIG.cityNameEn} house broker, Ethiopia real estate, የቤት ኪራይ እንጅባራ, ቤቶች በእንጅባራ, የንግድ ሱቆች ኪራይ, ደላላ እንጅባራ, አፓርታማ ኪራይ, ቪላ ኪራይ, ስቱዲዮ ኪራይ, ኮንዶሚኒየም ኪራይ`;
    
    applySEOMeta({
      title: `${CITY_CONFIG.brandNameAm} | ${CITY_CONFIG.brandNameEn}`,
      description: `${CITY_CONFIG.heroSubtitleAm}. Rent verified houses and commercial shops in ${CITY_CONFIG.cityNameEn}, Ethiopia. Explore listings in Kebele 01, Kebele 02, University Area and more.`,
      keywords: defaultKeywords,
      canonical: window.location.href,
    });

    // Apply JSON-LD for the organization/portal
    applyStructuredData({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": CITY_CONFIG.brandNameEn,
      "alternateName": CITY_CONFIG.brandNameAm,
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${window.location.origin}/houses?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    });
  }
}
