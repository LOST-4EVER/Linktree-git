import type { LinkIconType, SocialPlatform } from '../types/linktree';

/**
 * Protocols we are willing to render as a navigable link.
 * Anything else (javascript:, data:, vbscript:, file:...) is rejected.
 */
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** True when the string looks like it already carries an explicit scheme. */
function hasScheme(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

/**
 * Trims and fills in a missing scheme so that "example.com" becomes
 * "https://example.com". Returns an empty string for blank input.
 *
 * Site-relative paths (e.g. "/avatar.jpg") are intentionally left untouched
 * because they are valid same-origin references.
 */
export function normalizeUrl(raw: string | undefined | null): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';

  // Already schemed, or explicitly unsafe -> hand back untouched so callers
  // can decide what to do with it (isSafeUrl will reject unsafe schemes).
  if (hasScheme(trimmed)) return trimmed;
  // Protocol-relative URL
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  // Site-relative path
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;

  // Bare host / "www.example.com" / "example.com/path"
  return `https://${trimmed}`;
}

/**
 * Returns true when the URL is safe to use as an href.
 * Empty/invalid input, unknown protocols and script protocols are rejected.
 */
export function isSafeUrl(raw: string | undefined | null): boolean {
  const value = (raw ?? '').trim();
  if (!value) return false;

  // Site-relative paths and fragments are same-origin and always safe.
  if (value.startsWith('/') || value.startsWith('#')) return true;

  if (!hasScheme(value)) {
    // Scheme-less values get normalized to https, so they are safe.
    return true;
  }

  try {
    const protocol = new URL(value).protocol.toLowerCase();
    return SAFE_PROTOCOLS.has(protocol);
  } catch {
    return false;
  }
}

/**
 * The href to actually render. Unsafe or empty URLs produce `undefined` so the
 * caller can render a non-navigable element instead of a dangerous link.
 */
export function safeHref(raw: string | undefined | null): string | undefined {
  if (!isSafeUrl(raw)) return undefined;
  const value = normalizeUrl(raw);
  return value || undefined;
}

/**
 * `mailto:` and `tel:` links should open in the same tab, everything else in
 * a new one. Prevents a jarring new-tab jump for email clients.
 */
export function isExternalHttpUrl(raw: string | undefined | null): boolean {
  const value = (raw ?? '').trim().toLowerCase();
  return value.startsWith('http://') || value.startsWith('https://');
}

/**
 * Human-readable host for an URL, used in the editor as a destination hint.
 * Returns an empty string when the host cannot be determined.
 */
export function getDisplayHost(raw: string | undefined | null): string {
  const value = normalizeUrl(raw);
  if (!value || value.startsWith('/') || value.startsWith('#')) return '';
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** The label used for the favicon badge shown in the link editor. */
const DOMAIN_ICONS: Array<{ test: (host: string) => boolean; icon: LinkIconType }> = [
  { test: (h) => h.endsWith('github.com') || h.endsWith('github.io'), icon: 'github' },
  { test: (h) => h.includes('twitter.com') || h === 'x.com', icon: 'twitter' },
  { test: (h) => h.includes('linkedin.com'), icon: 'linkedin' },
  { test: (h) => h.includes('youtube.com') || h.includes('youtu.be'), icon: 'youtube' },
  { test: (h) => h.includes('instagram.com'), icon: 'instagram' },
  { test: (h) => h.includes('discord.gg') || h.includes('discord.com'), icon: 'discord' },
  { test: (h) => h.includes('twitch.tv'), icon: 'video' },
  { test: (h) => h.includes('substack.com'), icon: 'newsletter' },
  { test: (h) => h.includes('medium.com') || h.includes('dev.to') || h.includes('hashnode'), icon: 'article' },
  { test: (h) => h.includes('cal.com') || h.includes('calendly.com'), icon: 'calendar' },
  { test: (h) => h.includes('figma.com'), icon: 'figma' },
  { test: (h) => h.includes('spotify.com') || h.includes('soundcloud.com') || h.includes('bandcamp.com'), icon: 'music' },
  { test: (h) => h.includes('podcasts') || h.includes('podcast'), icon: 'podcast' },
  { test: (h) => h.includes('gumroad.com') || h.includes('shopify.com') || h.endsWith('shop'), icon: 'shop' },
  { test: (h) => h.includes('amazon.'), icon: 'shop' },
  { test: (h) => h.includes('github.com'), icon: 'code' },
  { test: (h) => h.includes('npmjs.com') || h.includes('crates.io') || h.includes('pypi.org'), icon: 'terminal' },
  { test: (h) => h.includes('dribbble.com') || h.includes('behance.net'), icon: 'sparkle' },
  { test: (h) => h.includes('ko-fi.com') || h.includes('buymeacoffee.com'), icon: 'coffee' },
];

/**
 * Best-effort icon guess for a pasted URL. Returns undefined when nothing
 * matches so the caller keeps whatever the user already picked.
 */
export function guessIconForUrl(raw: string | undefined | null): LinkIconType | undefined {
  const host = getDisplayHost(raw).toLowerCase();
  if (!host) return undefined;
  return DOMAIN_ICONS.find((rule) => rule.test(host))?.icon;
}

/**
 * A sensible starting URL when a social platform is selected, so the editor
 * does not open on a bare "https://".
 */
export function getDefaultUrlForPlatform(platform: SocialPlatform): string {
  switch (platform) {
    case 'email':
      return 'mailto:';
    case 'website':
      return 'https://';
    case 'github':
      return 'https://github.com/';
    case 'twitter':
      return 'https://x.com/';
    case 'linkedin':
      return 'https://linkedin.com/in/';
    case 'youtube':
      return 'https://youtube.com/@';
    case 'instagram':
      return 'https://instagram.com/';
    case 'discord':
      return 'https://discord.gg/';
    case 'twitch':
      return 'https://twitch.tv/';
    case 'substack':
      return 'https://';
    default:
      return 'https://';
  }
}