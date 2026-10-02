import React, { useState } from 'react';
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
}

type AdminTab = 'links' | 'profile' | 'theme' | 'github';

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  onClose,
  data,
  githubConfig,
  onUpdateData,
  onUpdateGitHubConfig,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('links');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [commitState, setCommitState] = useState<CommitState>({
    status: 'idle',
    message: '',
  });

  const handleUpdateProfile = (profile: ProfileData) => {
    onUpdateData({ ...data, profile });
  };

  const handleUpdateSocials = (socials: SocialLink[]) => {
    onUpdateData({ ...data, socials });
  };

  const handleUpdateLinks = (links: CustomLink[]) => {
    onUpdateData({ ...data, links });
  };

  const handleUpdateTheme = (theme: ThemeConfig) => {
    onUpdateData({ ...data, theme });
  };

  // Publish to GitHub via Contents API PUT endpoint
  const handlePublishToGitHub = async () => {
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
      setActiveTab('github');
      setCommitState({
        status: 'error',
        message: 'Please provide GitHub Token, Username/Org, and Repository first.',
      });
      return;
    }

    setCommitState({
      status: 'fetching-sha',
      message: 'Checking existing file blob SHA on GitHub...',
    });

    try {
      setCommitState({
        status: 'committing',
        message: 'Encoding Base64 payload and dispatching commit to GitHub API...',
      });

      const result = await commitDataToGitHub(githubConfig, data);

      setCommitState({
        status: 'success',
        message: 'Successfully committed to GitHub!',
        commitUrl: result.commitUrl,
        sha: result.sha,
        durationMs: result.durationMs,
        payloadBytes: result.payloadBytes,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown GitHub API error';
      setCommitState({
        status: 'error',
        message: msg,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with tap to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Responsive Slide-over / Full Screen Drawer */}
      <aside
        className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800 z-50 flex flex-col font-sans max-h-screen"
        aria-label="Admin Drawer"
      >
        {/* Mobile Top Drag Indicator */}
        <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1 bg-slate-900/80">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <LockIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                Admin Console
              </h2>
              <span className="text-[10px] text-slate-400">
                Secret mode · Triple-tap avatar or <code className="text-indigo-300">?admin=true</code>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Export Standalone HTML button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Export Standalone index.html"
            >
              <CodeIcon className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close admin drawer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Optimized Segmented Tab Bar */}
        <nav className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/40 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('links')}
            className={`py-3 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold text-center transition-colors border-b-2 ${
              activeTab === 'links'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-950/20'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <LinkIconSymbol className="w-4 h-4 shrink-0" />
            <span className="truncate">Links ({data.links?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold text-center transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-950/20'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`py-3 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold text-center transition-colors border-b-2 ${
              activeTab === 'theme'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-950/20'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <PaletteIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Theme</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`py-3 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold text-center transition-colors border-b-2 ${
              activeTab === 'github'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-950/20'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <KeyIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">GitHub</span>
          </button>
        </nav>

        {/* Tab Content Area (Smooth Scroll) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'links' && (
            <LinksManagerTab
              links={data.links}
              theme={data.theme}
              onUpdateLinks={handleUpdateLinks}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileEditorTab
              profile={data.profile}
              socials={data.socials}
              onUpdateProfile={handleUpdateProfile}
              onUpdateSocials={handleUpdateSocials}
            />
          )}

          {activeTab === 'theme' && (
            <ThemeEditorTab theme={data.theme} onUpdateTheme={handleUpdateTheme} />
          )}

          {activeTab === 'github' && (
            <GitHubSettingsTab
              config={githubConfig}
              onSaveConfig={(cfg) => {
                onUpdateGitHubConfig(cfg);
                setCommitState({
                  status: 'idle',
                  message: 'Credentials updated and stored in localStorage.',
                });
              }}
            />
          )}
        </div>

        {/* Drawer Bottom Bar: Commit Status & Thumb-Friendly Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-2.5 shrink-0 safe-bottom">
          {/* Commit Feedback Banner */}
          {commitState.status !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                commitState.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : commitState.status === 'error'
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                  : 'bg-indigo-950/40 border-indigo-800/80 text-indigo-300'
              }`}
            >
              {commitState.status === 'committing' || commitState.status === 'fetching-sha' ? (
                <RefreshIcon className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-indigo-400" />
              ) : commitState.status === 'success' ? (
                <CheckIcon className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <CloseIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}

              <div className="min-w-0 flex-1">
                <p className="leading-snug font-medium">{commitState.message}</p>
                {commitState.durationMs && (
                  <p className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                    {commitState.durationMs}ms · {Math.round((commitState.payloadBytes || 0) / 1024 * 10) / 10} KB payload
                  </p>
                )}
                {commitState.commitUrl && (
                  <a
                    href={commitState.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] underline mt-1 text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    View commit on GitHub &rarr;
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Primary Action Button (Thumb Zone) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePublishToGitHub}
              disabled={
                commitState.status === 'fetching-sha' || commitState.status === 'committing'
              }
              className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-xs shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {commitState.status === 'committing' || commitState.status === 'fetching-sha' ? (
                <>
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                  <span>Syncing with GitHub...</span>
                </>
              ) : (
                <>
                  <CloudUploadIcon className="w-4 h-4" />
                  <span>Publish to GitHub (Commit data.json)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsExportOpen(true)}
              className="p-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Download or copy standalone index.html"
            >
              <CodeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Standalone Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={data}
      />
    </>
  );
};
