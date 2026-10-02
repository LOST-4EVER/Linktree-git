import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { LinktreeData, GitHubConfig } from './types/linktree';
import { DEFAULT_LINKTREE_DATA } from './data/defaultProfile';
import { PublicProfile } from './components/public/PublicProfile';
import { RefreshIcon } from './components/icons/UiSvgIcons';
import {
  STORAGE_KEYS,
  normalizeLinktreeData,
  readCachedData,
  readStorage,
  writeStorage,
  removeStorage,
} from './utils/data';

/**
 * The admin console (all editors + the 45KB standalone-HTML generator) is only
 * needed by the owner, so it is split out of the public bundle. Visitors never
 * download it; it streams in the first time the drawer is opened.
 */
const AdminDrawer = lazy(() =>
  import('./components/admin/AdminDrawer').then((m) => ({ default: m.AdminDrawer }))
);

export default function App() {
  /**
   * Start from the normalized local cache when present so the first paint is
   * instant and shows the owner's most recent edits.
   */
  const [data, setData] = useState<LinktreeData>(() => readCachedData()?.data ?? DEFAULT_LINKTREE_DATA);

  const [isLoading, setIsLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  /** Sticky: once the owner has opened the console we keep it mounted. */
  const [hasOpenedAdmin, setHasOpenedAdmin] = useState(false);

  /**
   * True while there are local edits that have not been published yet. We keep
   * the local copy authoritative in that case instead of overwriting it with
   * the remote data.json on the next load.
   */
  const hasLocalEditsRef = useRef(false);

  const [githubConfig, setGithubConfig] = useState<GitHubConfig>(() => ({
    token: readStorage(STORAGE_KEYS.token) || '',
    owner: readStorage(STORAGE_KEYS.owner) || '',
    repo: readStorage(STORAGE_KEYS.repo) || '',
    branch: readStorage(STORAGE_KEYS.branch) || 'main',
    filePath: readStorage(STORAGE_KEYS.path) || 'data.json',
  }));

  // Fetch data.json once on mount, without clobbering unsaved local edits.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    async function loadData() {
      try {
        const res = await fetch('/data.json', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          console.warn(`data.json responded ${res.status}; keeping local/default profile.`);
          return;
        }
        const json = await res.json();
        if (cancelled) return;

        // Normalize so a malformed file degrades instead of crashing the render.
        const normalized = normalizeLinktreeData(json);

        // Unsaved local edits always win; otherwise refresh the cache.
        if (!hasLocalEditsRef.current) {
          setData(normalized);
          writeStorage(STORAGE_KEYS.dataCache, JSON.stringify(normalized));
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          console.warn('Timed out loading data.json; using local/default profile.');
        } else {
          console.warn('Network error fetching data.json; using local/default profile.', err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  // Open the admin drawer from ?admin=true.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('admin') === 'true') {
      setHasOpenedAdmin(true);
      setIsAdminOpen(true);
    }
  }, []);

  // Ctrl/Cmd + Shift + E toggles the secret admin drawer.
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isTyping =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable);

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      e.preventDefault();
      if (!isTyping) {
        setHasOpenedAdmin(true);
        setIsAdminOpen((prev) => !prev);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleUpdateData = useCallback((newData: LinktreeData) => {
    const normalized = normalizeLinktreeData(newData);
    hasLocalEditsRef.current = true;
    setData(normalized);
    writeStorage(STORAGE_KEYS.dataCache, JSON.stringify(normalized));
    writeStorage(STORAGE_KEYS.localEditAt, String(Date.now()));
  }, []);

  const handleUpdateGitHubConfig = useCallback((newConfig: GitHubConfig) => {
    setGithubConfig(newConfig);
    writeStorage(STORAGE_KEYS.token, newConfig.token);
    writeStorage(STORAGE_KEYS.owner, newConfig.owner);
    writeStorage(STORAGE_KEYS.repo, newConfig.repo);
    writeStorage(STORAGE_KEYS.branch, newConfig.branch);
    writeStorage(STORAGE_KEYS.path, newConfig.filePath);
  }, []);

  /**
   * Keep the document title and share metadata in sync with the profile. A
   * link-in-bio is mostly consumed through previews, so this is user-visible.
   */
  useEffect(() => {
    const { name, bio, avatarUrl } = data.profile;
    const title = name?.trim() ? `${name.trim()} · Links` : 'GitTree Linkhub';
    const description = bio?.trim() || 'Links and social profiles.';

    document.title = title;

    const setMeta = (selector: string, attr: 'content', value: string) => {
      const el = document.head.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);

    const image = avatarUrl?.trim();
    if (image && /^(https?:|data:image\/|\/)/i.test(image)) {
      setMeta('meta[property="og:image"]', 'content', image);
      setMeta('meta[name="twitter:image"]', 'content', image);
    }
  }, [data.profile]);

  /** Keeps ?admin=true in the URL so the session survives a refresh. */
  const handleOpenAdmin = useCallback(() => {
    setHasOpenedAdmin(true);
    setIsAdminOpen(true);
  }, []);

  const handleCloseAdmin = useCallback(() => {
    setIsAdminOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.get('admin') === 'true') {
      url.searchParams.delete('admin');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const handlePublished = useCallback(() => {
    // Published state now matches GitHub, so a later reload may safely refresh.
    hasLocalEditsRef.current = false;
    removeStorage(STORAGE_KEYS.localEditAt);
  }, []);

  return (
    <div className="relative min-h-screen">
      <PublicProfile data={data} isLoading={isLoading} onSecretTrigger={handleOpenAdmin} />

      {/* Only mount the lazy chunk once the drawer has been opened at least
          once, so the public page never pays for it. */}
      {hasOpenedAdmin && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80">
              <RefreshIcon className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="sr-only">Loading admin console…</span>
            </div>
          }
        >
          <AdminDrawer
            isOpen={isAdminOpen}
            onClose={handleCloseAdmin}
            data={data}
            githubConfig={githubConfig}
            onUpdateData={handleUpdateData}
            onUpdateGitHubConfig={handleUpdateGitHubConfig}
            onPublished={handlePublished}
          />
        </Suspense>
      )}
    </div>
  );
}