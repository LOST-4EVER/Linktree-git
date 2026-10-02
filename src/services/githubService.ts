import { GitHubConfig, LinktreeData } from '../types/linktree';

// In-memory SHA cache to reduce redundant GET roundtrips
const shaCache = new Map<string, { sha: string; timestamp: number }>();

function getCacheKey(config: GitHubConfig): string {
  return `${config.owner.toLowerCase()}/${config.repo.toLowerCase()}/${config.filePath}/${config.branch || 'main'}`;
}

/**
 * Encodes a UTF-8 string to Base64 safely in browser environments without Unicode corruption.
 */
export function encodeUtf8ToBase64(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = utf8Bytes.byteLength;
  const CHUNK_SZ = 0x8000; // 32KB chunking for performance
  for (let i = 0; i < len; i += CHUNK_SZ) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(utf8Bytes.subarray(i, Math.min(i + CHUNK_SZ, len)))
    );
  }
  return btoa(binary);
}

/**
 * Decodes Base64 to a UTF-8 string safely in browser environments.
 */
export function decodeBase64ToUtf8(base64: string): string {
  const binaryString = atob(base64.replace(/\s/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Fetches the current file blob SHA and content from GitHub.
 * Uses intelligent short-lived cache and checks GitHub if needed.
 */
export async function getGitHubFileSha(
  config: GitHubConfig,
  forceFresh = false
): Promise<{ sha: string | null; exists: boolean }> {
  const cacheKey = getCacheKey(config);
  const cached = shaCache.get(cacheKey);

  // If cached within the last 15 seconds and not forcing fresh, return cached SHA
  if (!forceFresh && cached && Date.now() - cached.timestamp < 15000) {
    return { sha: cached.sha, exists: true };
  }

  const { token, owner, repo, branch, filePath } = config;
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${encodeURIComponent(
    branch || 'main'
  )}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (res.status === 404) {
    shaCache.delete(cacheKey);
    return { sha: null, exists: false };
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.message || `Failed to fetch file SHA (HTTP ${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  const sha = data.sha || null;
  if (sha) {
    shaCache.set(cacheKey, { sha, timestamp: Date.now() });
  }
  return { sha, exists: true };
}

/**
 * Verifies repository access and token permissions.
 */
export async function verifyGitHubRepo(config: GitHubConfig): Promise<{
  valid: boolean;
  defaultBranch?: string;
  isPrivate?: boolean;
  error?: string;
}> {
  const { token, owner, repo } = config;
  if (!token || !owner || !repo) {
    return { valid: false, error: 'Token, Owner, and Repo are required.' };
  }

  const url = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.trim()}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (res.status === 401) {
      return { valid: false, error: 'Bad credentials: Check your Personal Access Token (PAT).' };
    }
    if (res.status === 404) {
      return {
        valid: false,
        error: `Repository '${owner}/${repo}' not found or token lacks 'repo' scope access.`,
      };
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { valid: false, error: err.message || `GitHub returned HTTP ${res.status}` };
    }

    const data = await res.json();
    return {
      valid: true,
      defaultBranch: data.default_branch,
      isPrivate: data.private,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error verifying repository';
    return { valid: false, error: message };
  }
}

/**
 * Commits updated Linktree data to the GitHub repository using the GitHub Contents API.
 * Includes performance metrics (duration, byte size), conflict auto-retry, and SHA caching.
 */
export async function commitDataToGitHub(
  config: GitHubConfig,
  data: LinktreeData,
  customMessage?: string
): Promise<{
  success: boolean;
  commitUrl?: string;
  sha?: string;
  durationMs: number;
  payloadBytes: number;
}> {
  const startTime = performance.now();
  const { token, owner, repo, branch, filePath } = config;
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const cacheKey = getCacheKey(config);

  // Step 1: Format and Base64-encode the payload
  const formattedJson = JSON.stringify(data, null, 2);
  const payloadBytes = new TextEncoder().encode(formattedJson).length;
  const base64Content = encodeUtf8ToBase64(formattedJson);

  // Step 2: Retrieve existing SHA
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
    branch: branch || 'main',
  };

  if (currentSha) {
    commitPayload.sha = currentSha;
  }

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  // Execute PUT request
  let res = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(commitPayload),
  });

  // Step 3: Conflict Recovery (409 Conflict): If SHA was outdated, fetch fresh SHA and retry once
  if (res.status === 409) {
    const fresh = await getGitHubFileSha(config, true);
    if (fresh.sha) {
      commitPayload.sha = fresh.sha;
      res = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(commitPayload),
      });
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    let msg = errorBody.message || `Failed to commit to GitHub (HTTP ${res.status})`;
    if (res.status === 409) {
      msg = 'Conflict detected: The file was updated on GitHub. Please refresh and try again.';
    } else if (res.status === 401) {
      msg = 'Authentication failed. Please verify your Personal Access Token in settings.';
    } else if (res.status === 404) {
      msg = `Repository '${owner}/${repo}' or branch '${branch}' not found.`;
    }
    throw new Error(msg);
  }

  const result = await res.json();
  const newSha = result.content?.sha;

  if (newSha) {
    shaCache.set(cacheKey, { sha: newSha, timestamp: Date.now() });
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    success: true,
    commitUrl: result.commit?.html_url,
    sha: newSha,
    durationMs,
    payloadBytes,
  };
}
