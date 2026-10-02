import {
  LinktreeData,
  CustomLink,
  ProfileData,
  SocialLink,
  SocialPlatform,
  ThemeConfig,
  ButtonStyleType,
  TextColorType,
} from '../types/linktree';
import { DEFAULT_LINKTREE_DATA } from '../data/defaultProfile';

/** localStorage keys used across the app. */
export const STORAGE_KEYS = {
  dataCache: 'gittree_data_cache',
  token: 'gittree_token',
  owner: 'gittree_owner',
  repo: 'gittree_repo',
  branch: 'gittree_branch',
  path: 'gittree_path',
  /** Timestamp of the last local edit, used to warn before overwriting. */
  localEditAt: 'gittree_local_edit_at',
} as const;

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'github',
  'twitter',
  'linkedin',
  'youtube',
  'instagram',
  'discord',
  'email',
  'website',
  'twitch',
  'substack',
];

const BUTTON_STYLES: ButtonStyleType[] = ['rounded', 'pill', 'glass'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * CSS colors accept a very wide range of syntaxes, so we only reject values
 * that could break out of the property or pull in a remote resource.
 * `url(...)` is blocked because a theme value is meant to be a color/gradient.
 */
export function isSafeCssValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 400) return false;
  if (/[<>;{}]/.test(trimmed)) return false;
  if (/url\s*\(/i.test(trimmed)) return false;
  if (/@import|expression\s*\(|javascript:/i.test(trimmed)) return false;
  return true;
}

/** Hex colors are the common case; anything else falls back to the default. */
function normalizeAccentColor(value: unknown, fallback: string): string {
  const raw = asString(value).trim();
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) {
    return raw;
  }
  return fallback;
}

function normalizeProfile(raw: unknown): ProfileData {
  const src = isRecord(raw) ? raw : {};
  const base = DEFAULT_LINKTREE_DATA.profile;
  return {
    name: asString(src.name, base.name),
    handle: asString(src.handle, base.handle),
    bio: asString(src.bio, base.bio),
    avatarUrl: asString(src.avatarUrl, base.avatarUrl),
    verified: asBoolean(src.verified, base.verified),
    location: asOptionalString(src.location) ?? base.location,
  };
}

function normalizeSocials(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((item) => {
      const platform = SOCIAL_PLATFORMS.includes(item.platform as SocialPlatform)
        ? (item.platform as SocialPlatform)
        : 'website';
      return { platform, url: asString(item.url) };
    })
    .filter((social) => social.url.trim().length > 0);
}

function normalizeLinks(raw: unknown): CustomLink[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();

  return raw
    .filter(isRecord)
    .map((item, index): CustomLink => {
      // Ids must be unique: duplicates break React keys and reorder operations.
      let id = asString(item.id).trim();
      if (!id || seenIds.has(id)) {
        id = `link-${index}-${Math.random().toString(36).slice(2, 8)}`;
      }
      seenIds.add(id);

      const accent = asOptionalString(item.customAccent);
      return {
        id,
        title: asString(item.title, 'Untitled link').slice(0, 200),
        subtitle: asOptionalString(item.subtitle)?.slice(0, 300),
        url: asString(item.url),
        icon: asOptionalString(item.icon),
        highlight: asBoolean(item.highlight, false),
        badgeText: asOptionalString(item.badgeText)?.slice(0, 40),
        // Only trust a hex accent here, it is concatenated into color strings.
        customAccent:
          accent && normalizeAccentColor(accent, '') ? normalizeAccentColor(accent, '') : undefined,
        active: asBoolean(item.active, true),
        clickCount: typeof item.clickCount === 'number' ? item.clickCount : undefined,
      };
    })
    // A link with no title and no URL has nothing to render.
    .filter((link) => link.title.trim().length > 0 || link.url.trim().length > 0);
}

function normalizeTheme(raw: unknown): ThemeConfig {
  const src = isRecord(raw) ? raw : {};
  const base = DEFAULT_LINKTREE_DATA.theme;

  const backgroundType =
    src.backgroundType === 'solid' || src.backgroundType === 'gradient'
      ? src.backgroundType
      : base.backgroundType;

  const rawBackground = asString(src.backgroundValue).trim();
  const backgroundValue =
    isSafeCssValue(rawBackground) && backgroundType === 'solid'
      ? rawBackground.startsWith('#') || rawBackground.startsWith('rgb')
        ? rawBackground
        : base.backgroundValue
      : isSafeCssValue(rawBackground)
        ? rawBackground
        : base.backgroundValue;

  const buttonStyle = BUTTON_STYLES.includes(src.buttonStyle as ButtonStyleType)
    ? (src.buttonStyle as ButtonStyleType)
    : base.buttonStyle;

  const textColor: TextColorType = src.textColor === 'dark' ? 'dark' : 'light';

  const fontFamily =
    src.fontFamily === 'serif' || src.fontFamily === 'mono' ? src.fontFamily : 'sans';

  return {
    preset: asString(src.preset, base.preset),
    backgroundType,
    backgroundValue,
    buttonStyle,
    accentColor: normalizeAccentColor(src.accentColor, base.accentColor),
    textColor,
    fontFamily,
  };
}

/**
 * Coerces arbitrary parsed JSON into a complete, renderable LinktreeData.
 * Every field falls back to a safe default, so a malformed or partially
 * written data.json degrades instead of crashing the render.
 */
export function normalizeLinktreeData(raw: unknown): LinktreeData {
  const src = isRecord(raw) ? raw : {};
  return {
    profile: normalizeProfile(src.profile),
    socials: normalizeSocials(src.socials),
    links: normalizeLinks(src.links),
    theme: normalizeTheme(src.theme),
  };
}

/**
 * Builds the full payload written to GitHub. Click counts are runtime-only
 * telemetry and are intentionally stripped so they never cause diff noise.
 */
export function toPublishableData(data: LinktreeData): LinktreeData {
  const normalized = normalizeLinktreeData(data);
  return {
    ...normalized,
    links: normalized.links.map(({ clickCount, ...link }) => link),
  };
}

/**
 * localStorage access throws in Safari private mode and when the quota is
 * exceeded. Returns null instead of taking down the app.
 */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Reads and normalizes the cached profile, or null when there is nothing usable. */
export function readCachedData(): { data: LinktreeData; editedAt: number } | null {
  const raw = readStorage(STORAGE_KEYS.dataCache);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const editedAtRaw = readStorage(STORAGE_KEYS.localEditAt);
    const editedAt = editedAtRaw ? Number(editedAtRaw) || 0 : 0;
    return { data: normalizeLinktreeData(parsed), editedAt };
  } catch {
    return null;
  }
}