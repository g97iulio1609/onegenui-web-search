/**
 * Image domain classification — reliable vs unreliable sources.
 */

/** Domains that typically serve valid, high-quality images. */
export const RELIABLE_DOMAINS = new Set([
  "unsplash.com",
  "images.unsplash.com",
  "images.pexels.com",
  "cdn.pixabay.com",
  "cache.marriott.com",
  "photos.hotelbeds.com",
  "cf.bstatic.com",
  "q-xx.bstatic.com",
  "images.trvl-media.com",
  "media-cdn.tripadvisor.com",
  "lh3.googleusercontent.com",
  "i.ytimg.com",
]);

/** Domains known to be problematic or placeholder services. */
export const UNRELIABLE_DOMAINS = new Set([
  "placeholder.com",
  "via.placeholder.com",
  "example.com",
  "placehold.it",
  "dummyimage.com",
  "picsum.photos",
]);

function matchesDomainSet(url: string, domainSet: Set<string>): boolean {
  try {
    const hostname = new URL(url).hostname;
    return (
      domainSet.has(hostname) ||
      Array.from(domainSet).some((d) => hostname.endsWith(`.${d}`))
    );
  } catch {
    return false;
  }
}

export function isReliableDomain(url: string): boolean {
  return matchesDomainSet(url, RELIABLE_DOMAINS);
}

export function isUnreliableDomain(url: string): boolean {
  try {
    new URL(url);
  } catch {
    return true; // Invalid URL = unreliable
  }
  return matchesDomainSet(url, UNRELIABLE_DOMAINS);
}
