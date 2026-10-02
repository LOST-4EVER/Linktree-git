import { GitHubConfig, LinktreeData } from '../types/linktree';
import { toPublishableData } from '../utils/data';

/** Every network call is bounded so the UI can never hang on a dead connection. */
const REQUEST_TIMEOUT_MS = 15000;

/** SHA cache TTL. Short: a stale SHA causes a 409, which costs an extra request. */
const SHA_CACHE_TTL_MS = 10000;

interface ShaCacheEntry {
  sha: string | null;
  timestamp: number;
}

const shaCache = new Map<string, ShaCacheEntry>();

function getCacheKey(config: GitHubConfig): string {
  return [
    config.owner.toLowerCase(),
    config.repo.toLowerCase(),
    config.filePath.replace(/^\//, ''),
    config.branch || 'main',
  ].join('/');
}

function stripLeadingSlash(filePath: string): string {
  return (filePath ?? '').replace(/^\/+/, '');
}

/** Escapes a path so special characters do not break the URL structure. */
function encodePathSegments(filePath: string): string {
  return stripLeadingSlash(filePath)
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}

/**
 * Encodes a UTF-8 string to Base64 safely in browser environments without
 * Unicode corruption. Chunked because String.fromCharCode.apply blows the
 * argument limit on large payloads.
 */
export function encodeUtf8ToBase64(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = utf8Bytes.byteLength;
  const CHUNK_SZ = 0x8000;
  for (let i = 0; i < len; i += CHUNK_SZ) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(utf8Bytes.subarray(i, Math.min(i + CHUNK_SZ, len)))
    );
  }
  return btoa(binary);
}

/** Decodes Base64 to a UTF-8 string safely in browser environments. */
export function decodeBase64ToUtf8(base64: string): string {
  const binaryString = atob(base64.replace(/\s/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

interface GitHubError {
  message: string;
  documentationUrl?: string;
  /** Seconds until the rate limit resets, when GitHub reports it. */
  resetSeconds?: number;
}

/**
 * Turns a non-2xx GitHub response into a message that tells the user what to
 * actually do. Raw GitHub messages are frequently unhelpful for token issues.
 */
async function describeError(res: Response, context: string): Promise<GitHubError> {
  const body = (await res.json().catch(() => ({}))) as {
    message?: string;
    documentation_url?: string;
  };

  const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
  const rateLimitReset = res.headers.get('x-ratelimit-reset');

  if (res.status === 401) {
    return {
      message:
        'Authentication failed (401). Your token was rejected — check that it is valid and not expired.',
    };
  }

  if (res.status === 403) {
    if (rateLimitRemaining === '0') {
      const resetAt = rateLimitReset ? Number(rateLimitReset) * 1000 : 0;
      const minutes = resetAt ? Math.max(1, Math.ceil((resetAt - Date.now()) / 60000)) : null;
      return {
        message: minutes
          ? `GitHub API rate limit reached (403). Try again in about ${minutes} minute${
              minutes === 1 ? '' : 's'
            }.`
          : 'GitHub API rate limit reached (403). Try again shortly.',
        documentationUrl: 'https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api',
      };
    }
    return {
      message: `Forbidden (403) while ${context}. The token is missing the required permissions, or branch protection is blocking writes.`,
    };
  }

  if (res.status === 404) {
    return { message: `Not found (404) while ${context}. Check the repository, branch, and file path.` };
  }

  if (res.status === 422) {
    return {
      message: `Validation failed (422) while ${context}. ${body.message || 'The request was rejected as invalid.'}`,
    };
  }

  return {
    message: body.message || `${context} failed (HTTP ${res.status}).`,
    documentationUrl: body.documentation_url,
  };
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/** fetch with an AbortController-based timeout. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error('GitHub request timed out. Check your connection and try again.');
    }
    throw new Error(
      'Could not reach the GitHub API. Check your connection, then try again.'
    );
  } finally {
    clearTimeout(timer);
  }
}

export interface GitHubFileInfo {
  sha: string | null;
  exists: boolean;
}

/**
 * Fetches the current file blob SHA from GitHub, with a short-lived cache.
 * Returns exists=false when the file has not been created yet.
 */
export async function getGitHubFileSha(
  config: GitHubConfig,
  forceFresh = false
): Promise<GitHubFileInfo> {
  const cacheKey = getCacheKey(config);
  const cached = shaCache.get(cacheKey);

  if (
    !forceFresh &&
    cached &&
    cached.sha &&
    Date.now() - cached.timestamp < SHA_CACHE_TTL_MS
  ) {
    return { sha: cached.sha, exists: true };
  }

  const { token, owner, repo, branch, filePath } = config;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodePathSegments(
    filePath
  )}?ref=${encodeURIComponent(branch || 'main')}`;

  const res = await fetchWithTimeout(url, { method: 'GET', headers: authHeaders(token) });

  if (res.status === 404) {
    shaCache.delete(cacheKey);
    return { sha: null, exists: false };
  }

  if (!res.ok) {
    const error = await describeError(res, 'fetching the file SHA');
    throw new Error(error.message);
  }

  const data = await res.json();
  const sha = typeof data?.sha === 'string' ? data.sha : null;
  shaCache.set(cacheKey, { sha, timestamp: Date.now() });
  return { sha, exists: true };
}

export interface RepoVerification {
  valid: boolean;
  defaultBranch?: string;
  isPrivate?: boolean;
  /** Whether the token can push, based on the repo's reported permissions. */
  canPush?: boolean;
  error?: string;
}

/**
 * Verifies repository access and reports the token's write permission, so the
 * settings tab can warn before a publish attempt fails.
 */
export async function verifyGitHubRepo(config: GitHubConfig): Promise<RepoVerification> {
  const { token, owner, repo } = config;
  if (!token.trim() || !owner.trim() || !repo.trim()) {
    return { valid: false, error: 'Token, Owner, and Repo are all required.' };
  }

  const url = `https://api.github.com/repos/${encodeURIComponent(owner.trim())}/${encodeURIComponent(
    repo.trim()
  )}`;

  try {
    const res = await fetchWithTimeout(url, { method: 'GET', headers: authHeaders(token) });

    if (!res.ok) {
      const error = await describeError(res, 'verifying repository access');
      return { valid: false, error: error.message };
    }

    const data = await res.json();
    return {
      valid: true,
      defaultBranch: data?.default_branch,
      isPrivate: data?.private,
      canPush: data?.permissions?.push === true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error verifying repository';
    return { valid: false, error: message };
  }
}

export interface CommitResult {
  success: boolean;
  commitUrl?: string;
  sha?: string;
  durationMs: number;
  payloadBytes: number;
}

/**
 * Commits the Linktree data to GitHub via the Contents API, with SHA-conflict
 * auto-retry. Click counts are stripped so they never produce diff noise.
 */
export async function commitDataToGitHub(
  config: GitHubConfig,
  data: LinktreeData,
  customMessage?: string
): Promise<CommitResult> {
  const startTime = performance.now();
  const { token, owner, repo, branch, filePath } = config;

  if (!token.trim() || !owner.trim() || !repo.trim()) {
    throw new Error('A GitHub token, owner, and repository are required to publish.');
  }

  const cacheKey = getCacheKey(config);
  const targetBranch = (branch || 'main').trim();
  const encodedPath = encodePathSegments(filePath);

  // Format and encode the payload.
  const formattedJson = JSON.stringify(toPublishableData(data), null, 2);
  const payloadBytes = new TextEncoder().encode(formattedJson).length;
  const base64Content = encodeUtf8ToBase64(formattedJson);

  let { sha: currentSha } = await getGitHubFileSha(config);

  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const commitMessage =
    customMessage || `chore(gittree): update profile and links [${nowStr} UTC] [skip ci]`;

  const commitPayload: {
    message: string;
    content: string;
    branch: string;
    sha?: string;
  } = {
    message: commitMessage,
    content: base64Content,
    branch: targetBranch,
  };

  if (currentSha) {
    commitPayload.sha = currentSha;
  }

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
  const putInit: RequestInit = {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(commitPayload),
  };

  let res = await fetchWithTimeout(putUrl, putInit);

  // Conflict recovery: our SHA was stale, so refetch and retry exactly once.
  if (res.status === 409) {
    const fresh = await getGitHubFileSha(config, true);
    if (fresh.sha) {
      commitPayload.sha = fresh.sha;
      res = await fetchWithTimeout(putUrl, putInit);
    }
  }

  if (!res.ok) {
    const error = await describeError(res, 'committing to GitHub');
    if (res.status === 409) {
      throw new Error(
        'Conflict detected: data.json was updated on GitHub at the same time. Reload and publish again.'
      );
    }
    throw new Error(error.message);
  }

  const result = await res.json();
  const newSha = result?.content?.sha;

  if (newSha) {
    shaCache.set(cacheKey, { sha: newSha, timestamp: Date.now() });
  }

  return {
    success: true,
    commitUrl: result?.commit?.html_url,
    sha: newSha,
    durationMs: Math.round(performance.now() - startTime),
    payloadBytes,
  };
}

/** Clears cached SHAs, e.g. after switching repositories. */
export function clearGitHubShaCache(): void {
  shaCache.clear();
}