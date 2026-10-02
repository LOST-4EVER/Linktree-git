import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LinktreeData } from '../../types/linktree';
import { generateStandaloneHtml } from '../../utils/standaloneHtmlGenerator';
import {
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  CloseIcon,
  CodeIcon,
  WarningIcon,
} from '../icons/UiSvgIcons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LinktreeData;
}

const PREVIEW_CHARS = 1200;

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  // Generating the file is expensive; only do it while the modal is open.
  const standaloneHtml = useMemo(
    () => (isOpen ? generateStandaloneHtml(data) : ''),
    [isOpen, data]
  );

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setCopyError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  /** Falls back to a hidden textarea when the async Clipboard API is blocked. */
  const copyToClipboard = useCallback(async (text: string) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        /* fall through to the legacy path */
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(standaloneHtml);
    if (ok) {
      setCopyError('');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(false);
      setCopyError('Copying was blocked by the browser. Use Download instead.');
    }
  }, [copyToClipboard, standaloneHtml]);

  const handleDownload = () => {
    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const sizeKb = Math.round(standaloneHtml.length / 1024);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Export standalone HTML"
        className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-200 slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CodeIcon className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white truncate">
              Export Standalone index.html
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close export dialog"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto gt-scroll">
          <p className="text-xs text-slate-400 leading-relaxed">
            A single self-contained file — no build step, no Node.js, no dependencies. It includes
            your profile, every link and social icon as inline SVG, the secret{' '}
            <code className="text-slate-300">?admin=true</code> /{' '}
            <code className="text-slate-300">Ctrl+Shift+E</code> drawer, and GitHub publishing. Drop
            it into any GitHub Pages repo or static host.
          </p>

          <div className="relative">
            <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 max-h-72 overflow-auto gt-scroll leading-relaxed">
              <code>
                {standaloneHtml.slice(0, PREVIEW_CHARS)}
                {standaloneHtml.length > PREVIEW_CHARS ? '\n… (truncated preview)' : ''}
              </code>
            </pre>
          </div>

          {copyError && (
            <p
              role="alert"
              className="text-[11px] text-rose-400 flex items-center gap-1.5"
            >
              <WarningIcon className="w-3.5 h-3.5 shrink-0" />
              {copyError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50 shrink-0 flex-wrap">
          <span className="text-xs text-slate-500 font-mono">
            {sizeKb} KB self-contained
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
              <span>{copied ? 'Copied' : 'Copy HTML'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Download index.html</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};