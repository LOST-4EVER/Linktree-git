import React, { useState } from 'react';
import { GitHubConfig } from '../../types/linktree';
import { verifyGitHubRepo } from '../../services/githubService';
import { KeyIcon, EyeIcon, EyeOffIcon, CheckIcon, RefreshIcon, LockIcon } from '../icons/UiSvgIcons';

interface GitHubSettingsTabProps {
  config: GitHubConfig;
  onSaveConfig: (newConfig: GitHubConfig) => void;
}

export const GitHubSettingsTab: React.FC<GitHubSettingsTabProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<GitHubConfig>(config);
  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    tested: boolean;
    valid?: boolean;
    message?: string;
  }>({ tested: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setVerifyStatus({ tested: false });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
  };

  const handleTestConnection = async () => {
    if (!formData.token || !formData.owner || !formData.repo) {
      setVerifyStatus({
        tested: true,
        valid: false,
        message: 'Please fill in Token, Owner, and Repository fields first.',
      });
      return;
    }

    setIsVerifying(true);
    setVerifyStatus({ tested: false });

    const result = await verifyGitHubRepo(formData);
    setIsVerifying(false);

    if (result.valid) {
      setVerifyStatus({
        tested: true,
        valid: true,
        message: `Connected successfully to '${formData.owner}/${formData.repo}' (${
          result.isPrivate ? 'Private' : 'Public'
        }, default branch: ${result.defaultBranch || 'main'}).`,
      });
      // Auto-save verified config
      onSaveConfig(formData);
    } else {
      setVerifyStatus({
        tested: true,
        valid: false,
        message: result.error || 'Connection failed.',
      });
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 text-slate-200 text-sm">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
          <KeyIcon className="w-4 h-4" />
          <span>GitHub Credentials</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your credentials are saved exclusively in your browser&apos;s{' '}
          <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded">localStorage</code> and
          used solely to commit updates to your <code className="text-slate-300">data.json</code> file via the GitHub REST API.
        </p>
      </div>

      {/* GitHub PAT */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Personal Access Token (PAT) <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            name="token"
            value={formData.token}
            onChange={handleChange}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-10 font-mono text-xs"
            required
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title={showToken ? 'Hide token' : 'Show token'}
          >
            {showToken ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Requires <code className="text-slate-400">repo</code> scope for classic tokens, or{' '}
          <code className="text-slate-400">Contents: Read and write</code> for fine-grained tokens.
        </p>
      </div>

      {/* Repository Owner & Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            GitHub Username/Org <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="owner"
            value={formData.owner}
            onChange={handleChange}
            placeholder="e.g. octocat"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Repository Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="repo"
            value={formData.repo}
            onChange={handleChange}
            placeholder="e.g. my-linktree"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
      </div>

      {/* Branch & Target File Path */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target Branch
          </label>
          <input
            type="text"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            placeholder="main"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Data File Path
          </label>
          <input
            type="text"
            name="filePath"
            value={formData.filePath}
            onChange={handleChange}
            placeholder="data.json"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
          />
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {verifyStatus.tested && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
            verifyStatus.valid
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          {verifyStatus.valid ? (
            <CheckIcon className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <LockIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          )}
          <span className="leading-snug">{verifyStatus.message}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isVerifying}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying...</span>
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
    </form>
  );
};
