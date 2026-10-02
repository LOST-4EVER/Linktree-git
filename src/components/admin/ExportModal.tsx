import React, { useState } from 'react';
import { LinktreeData } from '../../types/linktree';
import { generateStandaloneHtml } from '../../utils/standaloneHtmlGenerator';
import { DownloadIcon, CopyIcon, CheckIcon, CloseIcon, CodeIcon } from '../icons/UiSvgIcons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LinktreeData;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const standaloneHtml = generateStandaloneHtml(data);

  const handleCopy = () => {
    navigator.clipboard.writeText(standaloneHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <CodeIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Export Standalone index.html
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-xs text-slate-400 leading-relaxed">
            This standalone file requires zero build steps or Node.js runtime. It includes Tailwind
            CSS (via CDN), clean vector SVG icons, secret <code className="text-slate-300">?admin=true</code>{' '}
            / <code className="text-slate-300">Ctrl+Shift+E</code> drawer, and direct GitHub Contents
            API sync. Drop it directly into your GitHub Pages repo or static host.
          </p>

          <div className="relative">
            <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 max-h-72 overflow-x-auto overflow-y-auto leading-relaxed">
              <code>{standaloneHtml.slice(0, 800)}... (truncated preview)</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-500 font-mono">
            {Math.round(standaloneHtml.length / 1024)} KB self-contained
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors"
            >
              {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy HTML Code'}</span>
            </button>

            <button
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
