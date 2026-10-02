import React, { useState, useEffect } from 'react';
import { GitHubConfig } from '../../types/linktree';
import { verifyGitHubRepo, clearGitHubShaCache } from '../../services/githubService';
import {
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  RefreshIcon,
  LockIcon,
  WarningIcon,
} from '../icons/UiSvgIcons';

interface GitHubSettingsTabProps {
  config: GitHubConfig;
  onSaveConfig: (newConfig: GitHubConfig) => void;
}

type VerifyState =
  | { tested: false }
  | { tested: true; valid: boolean; message: string };

const FIELD_CLASS =
  'w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500';

export const GitHubSettingsTab: React.FC<GitHubSettingsTabProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<GitHubConfig>(config);
  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>({ tested: false });

  // Keep the form in sync when the parent config changes (e.g. after a save).
  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setVerifyState({ tested: false });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed: GitHubConfig = {
      token: formData.token.trim(),
      owner: formData.owner.trim(),
      repo: formData.repo.trim(),
      branch: formData.branch.trim() || 'main',
      filePath: formData.filePath.trim() || 'data.json',
    };
    onSaveConfig(trimmed);
    setFormData(trimmed);
    setVerifyState({
      tested: true,
      valid: true,
      message: 'Credentials saved to this browser.',
    });
  };

  const handleTestConnection = async () => {
    if (!formData.token.trim() || !formData.owner.trim() || !formData.repo.trim()) {
      setVerifyState({
        tested: true,
        valid: false,
        message: 'Fill in the token, owner, and repository fields first.',
      });
      return;
    }

    setIsVerifying(true);
    setVerifyState({ tested: false });

    const result = await verifyGitHubRepo({
      ...formData,
      token: formData.token.trim(),
      owner: formData.owner.trim(),
      repo: formData.repo.trim(),
    });
    setIsVerifying(false);

    if (!result.valid) {
      setVerifyState({ tested: true, valid: false, message: result.error || 'Connection failed.' });
      return;
    }

    // Adopt the repository's real default branch when the user left it alone or
    // typed a branch that does not exist. Publishing to a wrong branch fails
    // with an opaque 404 otherwise.
    const detected = result.defaultBranch;
    const typedBranch = formData.branch.trim();
    let nextBranch = typedBranch;
    let branchNote = '';

    if (detected) {
      if (!typedBranch || typedBranch === 'main' || typedBranch === 'master') {
        nextBranch = detected;
        branchNote = ` Branch set to "${detected}".`;
      } else if (typedBranch !== detected) {
        branchNote = ` Note: the default branch is "${detected}", not "${typedBranch}".`;
      }
    }

    const permissionNote =
      result.canPush === false
        ? ' ⚠ This token can read but not write to the repository — publishing will fail.'
        : '';

    const nextConfig: GitHubConfig = {
      ...formData,
      token: formData.token.trim(),
      owner: formData.owner.trim(),
      repo: formData.repo.trim(),
      branch: nextBranch,
      filePath: formData.filePath.trim() || 'data.json',
    };

    setFormData(nextConfig);
    // Switching repository invalidates any cached blob SHA.
    if (nextConfig.owner !== config.owner || nextConfig.repo !== config.repo) {
      clearGitHubShaCache();
    }
    onSaveConfig(nextConfig);

    setVerifyState({
      tested: true,
      valid: result.canPush !== false,
      message: `Connected to ${nextConfig.owner}/${nextConfig.repo} (${
        result.isPrivate ? 'private' : 'public'
      }).${branchNote || ` Default branch: ${detected || 'unknown'}.`}${permissionNote}`,
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 text-slate-200 text-sm">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
          <KeyIcon className="w-4 h-4" />
          <span>GitHub Credentials</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Credentials stay in this browser&apos;s <code className="text-slate-300">localStorage</code>{' '}
          and are sent only to <code className="text-slate-300">api.github.com</code> when you
          publish. Use a fine-grained token limited to a single repository with{' '}
          <code className="text-slate-300">Contents: Read and write</code>.
        </p>
      </div>

      {/* Token */}
      <div>
        <label htmlFor="gh-token" className="block text-xs font-semibold text-slate-300 mb-1.5">
          Personal Access Token <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <input
            id="gh-token"
            type={showToken ? 'text' : 'password'}
            name="token"
            value={formData.token}
            onChange={handleChange}
            placeholder="github_pat_… or ghp_…"
            autoComplete="off"
            spellCheck={false}
            className={`${FIELD_CLASS} pr-10 font-mono text-xs`}
            required
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title={showToken ? 'Hide token' : 'Show token'}
            aria-label={showToken ? 'Hide token' : 'Show token'}
          >
            {showToken ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Classic tokens need the <code className="text-slate-400">repo</code> scope; fine-grained
          tokens need <code className="text-slate-400">Contents: Read and write</code>.
        </p>
      </div>

      {/* Owner + repo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gh-owner" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Owner (user/org) <span className="text-rose-400">*</span>
          </label>
          <input
            id="gh-owner"
            type="text"
            name="owner"
            value={formData.owner}
            onChange={handleChange}
            placeholder="octocat"
            autoComplete="off"
            spellCheck={false}
            className={FIELD_CLASS}
            required
          />
        </div>
        <div>
          <label htmlFor="gh-repo" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Repository <span className="text-rose-400">*</span>
          </label>
          <input
            id="gh-repo"
            type="text"
            name="repo"
            value={formData.repo}
            onChange={handleChange}
            placeholder="my-linktree"
            autoComplete="off"
            spellCheck={false}
            className={FIELD_CLASS}
            required
          />
        </div>
      </div>

      {/* Branch + path */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gh-branch" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Branch
          </label>
          <input
            id="gh-branch"
            type="text"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            placeholder="main"
            autoComplete="off"
            spellCheck={false}
            className={`${FIELD_CLASS} font-mono text-xs`}
          />
        </div>
        <div>
          <label htmlFor="gh-path" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Data File Path
          </label>
          <input
            id="gh-path"
            type="text"
            name="filePath"
            value={formData.filePath}
            onChange={handleChange}
            placeholder="data.json"
            autoComplete="off"
            spellCheck={false}
            className={`${FIELD_CLASS} font-mono text-xs`}
          />
          <p className="text-[10px] text-slate-500 mt-1">Must match the file this site loads.</p>
        </div>
      </div>

      {/* Feedback */}
      {verifyState.tested && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
            verifyState.valid
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          {verifyState.valid ? (
            <CheckIcon className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <LockIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          )}
          <span className="leading-snug break-words">{verifyState.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isVerifying}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying…</span>
            </>
          ) : (
            <>
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>Test Connection</span>
            </>
          )}
        </button>

        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-colors"
        >
          <CheckIcon className="w-3.5 h-3.5" />
          <span>Save Credentials</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-snug">
        <WarningIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
        A token stored in a browser can be read by any script running on this origin. Use a
        narrowly-scoped token, and prefer the standalone export on a domain you control.
      </p>
    </form>
  );
};