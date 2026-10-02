import React, { useState, useCallback } from 'react';
import { CustomLink, ThemeConfig } from '../../types/linktree';
import { LinkEditBottomSheet } from './LinkEditBottomSheet';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MoveToTopIcon,
  MoveToBottomIcon,
  TrashIcon,
  EditIcon,
  PlusIcon,
  LinkIconComponent,
  SparklesIcon,
  EyeOffIcon,
} from '../icons/UiSvgIcons';
import { getDisplayHost, isSafeUrl } from '../../utils/url';

interface LinksManagerTabProps {
  links: CustomLink[];
  theme: ThemeConfig;
  onUpdateLinks: (links: CustomLink[]) => void;
}

export const LinksManagerTab: React.FC<LinksManagerTabProps> = ({
  links,
  theme,
  onUpdateLinks,
}) => {
  const [selectedLink, setSelectedLink] = useState<CustomLink | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  /** Reorders by moving one item from `from` to `to`; out-of-range is a no-op. */
  const moveLink = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= links.length) return;
      const next = [...links];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onUpdateLinks(next);
    },
    [links, onUpdateLinks]
  );

  const handleDelete = useCallback(
    (id: string) => onUpdateLinks(links.filter((l) => l.id !== id)),
    [links, onUpdateLinks]
  );

  const handleToggleActive = useCallback(
    (id: string) =>
      onUpdateLinks(links.map((l) => (l.id === id ? { ...l, active: l.active === false } : l))),
    [links, onUpdateLinks]
  );

  const handleSaveFromBottomSheet = (updatedLink: CustomLink) => {
    if (isCreatingNew) {
      onUpdateLinks([updatedLink, ...links]);
    } else {
      onUpdateLinks(links.map((l) => (l.id === updatedLink.id ? updatedLink : l)));
    }
  };

  const handleStartCreate = () => {
    setSelectedLink(null);
    setIsCreatingNew(true);
    setIsBottomSheetOpen(true);
  };

  const handleStartEdit = (link: CustomLink) => {
    setSelectedLink(link);
    setIsCreatingNew(false);
    setIsBottomSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsBottomSheetOpen(false);
    setSelectedLink(null);
  };

  const visibleCount = links.filter((l) => l.active !== false).length;

  return (
    <div className="space-y-4 text-slate-200 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        <div className="min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Custom Links ({links.length})
          </h4>
          <p className="text-[11px] text-slate-400">
            {links.length === 0
              ? 'Add your first link below'
              : `${visibleCount} visible · tap a link to edit`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Link</span>
        </button>
      </div>

      {links.length > 0 ? (
        <ul className="space-y-2.5">
          {links.map((link, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === links.length - 1;
            const isVisible = link.active !== false;
            const host = getDisplayHost(link.url);
            const hasBrokenUrl = !link.url.trim() || !isSafeUrl(link.url);
            const accent = link.customAccent || theme.accentColor;

            return (
              <li
                key={link.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isVisible ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-950/60 border-slate-800/60'
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleStartEdit(link)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStartEdit(link);
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer group select-none rounded-lg focus-visible:outline-2 focus-visible:outline-indigo-400"
                >
                  <div
                    className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 transition-colors"
                    style={{ color: accent, backgroundColor: `${accent}18` }}
                  >
                    <LinkIconComponent icon={link.icon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h5
                        className={`text-xs font-semibold truncate transition-colors ${
                          isVisible ? 'text-white group-hover:text-indigo-300' : 'text-slate-400'
                        }`}
                      >
                        {link.title || <span className="italic text-slate-500">Untitled link</span>}
                      </h5>
                      {link.highlight && (
                        <span
                          className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded text-white shadow-xs shrink-0 max-w-[8rem] truncate"
                          style={{ backgroundColor: accent }}
                        >
                          {link.badgeText || 'Featured'}
                        </span>
                      )}
                      {!isVisible && (
                        <EyeOffIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </div>
                    {link.subtitle && (
                      <p className="text-[11px] text-slate-400 truncate">{link.subtitle}</p>
                    )}
                    <p
                      className={`text-[10px] truncate font-mono mt-0.5 ${
                        hasBrokenUrl ? 'text-rose-400' : 'text-slate-500'
                      }`}
                      title={hasBrokenUrl ? 'This link has a missing or unsupported URL' : link.url}
                    >
                      {hasBrokenUrl ? `⚠ ${link.url || 'No URL set'}` : host || link.url}
                    </p>
                  </div>

                  <div className="p-2 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0">
                    <EditIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Row actions */}
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(link.id)}
                    aria-pressed={isVisible}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      isVisible
                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/80'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isVisible ? 'Visible' : 'Hidden'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveLink(idx, 0)}
                      disabled={isFirst}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                      title="Move to top"
                      aria-label={`Move "${link.title}" to top`}
                    >
                      <MoveToTopIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLink(idx, idx - 1)}
                      disabled={isFirst}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                      title="Move up"
                      aria-label={`Move "${link.title}" up`}
                    >
                      <ArrowUpIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLink(idx, idx + 1)}
                      disabled={isLast}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                      title="Move down"
                      aria-label={`Move "${link.title}" down`}
                    >
                      <ArrowDownIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLink(idx, links.length - 1)}
                      disabled={isLast}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                      title="Move to bottom"
                      aria-label={`Move "${link.title}" to bottom`}
                    >
                      <MoveToBottomIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${link.title || 'this link'}"?`)) {
                          handleDelete(link.id);
                        }
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
                      title="Delete link"
                      aria-label={`Delete "${link.title}"`}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
          <SparklesIcon className="w-8 h-8 text-indigo-400 mx-auto" />
          <div>
            <h5 className="text-sm font-semibold text-white">No links yet</h5>
            <p className="text-xs text-slate-400 mt-0.5">
              Add your portfolio, social profiles, latest videos, or products.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md inline-flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create First Link</span>
          </button>
        </div>
      )}

      <LinkEditBottomSheet
        isOpen={isBottomSheetOpen}
        link={selectedLink}
        isNew={isCreatingNew}
        theme={theme}
        onSave={handleSaveFromBottomSheet}
        onDelete={handleDelete}
        onClose={handleCloseSheet}
      />
    </div>
  );
};