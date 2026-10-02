import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LinktreeData,
  GitHubConfig,
  CommitState,
  ProfileData,
  SocialLink,
  CustomLink,
  ThemeConfig,
} from '../../types/linktree';
import { commitDataToGitHub } from '../../services/githubService';
import { GitHubSettingsTab } from './GitHubSettingsTab';
import { ProfileEditorTab } from './ProfileEditorTab';
import { LinksManagerTab } from './LinksManagerTab';
import { ThemeEditorTab } from './ThemeEditorTab';
import { ExportModal } from './ExportModal';
import {
  CloseIcon,
  CloudUploadIcon,
  RefreshIcon,
  CodeIcon,
  CheckIcon,
  LockIcon,
  LinkIconSymbol,
  UserIcon,
  PaletteIcon,
  KeyIcon,
} from '../icons/UiSvgIcons';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: LinktreeData;
  githubConfig: GitHubConfig;
  onUpdateData: (newData: LinktreeData) => void;
  onUpdateGitHubConfig: (newConfig: GitHubConfig) => void;
  /** Called after a successful publish so the app can trust the remote copy. */
  onPublished?: () => void;
}

type AdminTab = 'links' | 'profile' | 'theme' | 'github';

const TABS: Array<{ id: AdminTab; label: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'links', label: 'Links', Icon: LinkIconSymbol },
  { id: 'profile', label: 'Profile', Icon: UserIcon },
  { id: 'theme', label: 'Theme', Icon: PaletteIcon },
  { id: 'github', label: 'GitHub', Icon: KeyIcon },
];

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  onClose,
  data,
  githubConfig,
  onUpdateData,
  onUpdateGitHubConfig,
  onPublished,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('links');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [commitState, setCommitState] = useState<CommitState>({
    status: 'idle',
    message: '',
  });
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isPublishing = commitState.status === 'fetching-sha' || commitState.status === 'committing';

  const handleUpdateProfile = useCallback(
    (profile: ProfileData) => onUpdateData({ ...data, profile }),
    [data, onUpdateData]
  );

  const handleUpdateSocials = useCallback(
    (socials: SocialLink[]) => onUpdateData({ ...data, socials }),
    [data, onUpdateData]
  );

  const handleUpdateLinks = useCallback(
    (links: CustomLink[]) => onUpdateData({ ...data, links }),
    [data, onUpdateData]
  );

  const handleUpdateTheme = useCallback(
    (theme: ThemeConfig) => onUpdateData({ ...data, theme }),
    [data, onUpdateData]
  );

  // Escape closes the drawer. Any Escape pressed inside an open nested modal is
  // handled by that modal first, which is why we check the export state.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isExportOpen) {
          setIsExportOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isExportOpen, onClose]);

  // Lock background scrolling while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Move focus into the drawer when it opens so keyboard users land inside it.
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  const handlePublishToGitHub = async () => {
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
      setActiveTab('github');
      setCommitState({
        status: 'error',
        message: 'Add your GitHub token, owner, and repository before publishing.',
      });
      return;
    }

    setCommitState({ status: 'fetching-sha', message: 'Checking the current file SHA on GitHub…' });

    try {
      setCommitState({
        status: 'committing',
        message: 'Uploading your profile and links to GitHub…',
      });

      const result = await commitDataToGitHub(githubConfig, data);

      setCommitState({
        status: 'success',
        message: 'Published to GitHub.',
        commitUrl: result.commitUrl,
        sha: result.sha,
        durationMs: result.durationMs,
        payloadBytes: result.payloadBytes,
      });

      onPublished?.();
    } catch (err: unknown) {
      setCommitState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown GitHub API error',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 animate-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin Console"
        className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800 z-50 flex flex-col max-h-screen font-sans slide-in-from-right"
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1 bg-slate-900/80 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <LockIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                Admin Console
              </h2>
              <span className="text-[10px] text-slate-400 truncate block">
                Secret mode · triple-tap avatar or{' '}
                <code className="text-indigo-300">?admin=true</code>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Export a standalone index.html"
              aria-label="Export standalone HTML"
            >
              <CodeIcon className="w-4 h-4" />
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close admin drawer (Esc)"
              aria-label="Close admin drawer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav
          role="tablist"
          aria-label="Admin sections"
          className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/40 text-xs shrink-0"
        >
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            const count = id === 'links' ? (data.links?.length ?? 0) : null;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`admin-tab-${id}`}
                aria-selected={isActive}
                aria-controls={`admin-panel-${id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(id)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                  e.preventDefault();
                  const index = TABS.findIndex((t) => t.id === activeTab);
                  const delta = e.key === 'ArrowRight' ? 1 : -1;
                  const next = TABS[(index + delta + TABS.length) % TABS.length];
                  setActiveTab(next.id);
                  document.getElementById(`admin-tab-${next.id}`)?.focus();
                }}
                className={`py-3 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold text-center transition-colors border-b-2 ${
                  isActive
                    ? 'text-indigo-400 border-indigo-500 bg-indigo-950/20'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {label}
                  {count !== null ? ` (${count})` : ''}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Panels */}
        <div className="flex-1 overflow-y-auto gt-scroll p-4 sm:p-6 space-y-6">
          <div
            role="tabpanel"
            id="admin-panel-links"
            aria-labelledby="admin-tab-links"
            hidden={activeTab !== 'links'}
          >
            {activeTab === 'links' && (
              <LinksManagerTab links={data.links} theme={data.theme} onUpdateLinks={handleUpdateLinks} />
            )}
          </div>

          <div
            role="tabpanel"
            id="admin-panel-profile"
            aria-labelledby="admin-tab-profile"
            hidden={activeTab !== 'profile'}
          >
            {activeTab === 'profile' && (
              <ProfileEditorTab
                profile={data.profile}
                socials={data.socials}
                onUpdateProfile={handleUpdateProfile}
                onUpdateSocials={handleUpdateSocials}
              />
            )}
          </div>

          <div
            role="tabpanel"
            id="admin-panel-theme"
            aria-labelledby="admin-tab-theme"
            hidden={activeTab !== 'theme'}
          >
            {activeTab === 'theme' && <ThemeEditorTab theme={data.theme} onUpdateTheme={handleUpdateTheme} />}
          </div>

          <div
            role="tabpanel"
            id="admin-panel-github"
            aria-labelledby="admin-tab-github"
            hidden={activeTab !== 'github'}
          >
            {activeTab === 'github' && (
              <GitHubSettingsTab
                config={githubConfig}
                onSaveConfig={(cfg) => {
                  onUpdateGitHubConfig(cfg);
                  setCommitState({ status: 'idle', message: '' });
                }}
              />
            )}
          </div>
        </div>

        {/* Footer: publish */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-2.5 shrink-0 safe-bottom">
          {commitState.status !== 'idle' && commitState.message && (
            <div
              role="status"
              aria-live="polite"
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                commitState.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : commitState.status === 'error'
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                    : 'bg-indigo-950/40 border-indigo-800/80 text-indigo-300'
              }`}
            >
              {isPublishing ? (
                <RefreshIcon className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-indigo-400" />
              ) : commitState.status === 'success' ? (
                <CheckIcon className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <CloseIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}

              <div className="min-w-0 flex-1">
                <p className="leading-snug font-medium break-words">{commitState.message}</p>
                {typeof commitState.durationMs === 'number' && (
                  <p className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                    {commitState.durationMs}ms ·{' '}
                    {Math.round(((commitState.payloadBytes ?? 0) / 1024) * 10) / 10} KB payload
                  </p>
                )}
                {commitState.commitUrl && (
                  <a
                    href={commitState.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] underline mt-1 text-emerald-400 hover:text-emerald-300 font-mono break-all"
                  >
                    View commit on GitHub &rarr;
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePublishToGitHub}
              disabled={isPublishing}
              className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-xs shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isPublishing ? (
                <>
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                  <span>Syncing with GitHub…</span>
                </>
              ) : (
                <>
                  <CloudUploadIcon className="w-4 h-4" />
                  <span>Publish to GitHub</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="p-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Export a standalone index.html"
              aria-label="Export standalone HTML"
            >
              <CodeIcon className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] text-slate-500 text-center">
            Changes are saved in this browser until you publish them to GitHub.
          </p>
        </div>
      </aside>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} data={data} />
    </>
  );
};