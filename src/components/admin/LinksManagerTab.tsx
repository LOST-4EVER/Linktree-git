import React, { useState } from 'react';
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
} from '../icons/UiSvgIcons';

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

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const nextLinks = [...links];
    const temp = nextLinks[index - 1];
    nextLinks[index - 1] = nextLinks[index];
    nextLinks[index] = temp;
    onUpdateLinks(nextLinks);
  };

  const handleMoveDown = (index: number) => {
    if (index === links.length - 1) return;
    const nextLinks = [...links];
    const temp = nextLinks[index + 1];
    nextLinks[index + 1] = nextLinks[index];
    nextLinks[index] = temp;
    onUpdateLinks(nextLinks);
  };

  const handleMoveToTop = (index: number) => {
    if (index === 0) return;
    const nextLinks = [...links];
    const item = nextLinks.splice(index, 1)[0];
    nextLinks.unshift(item);
    onUpdateLinks(nextLinks);
  };

  const handleMoveToBottom = (index: number) => {
    if (index === links.length - 1) return;
    const nextLinks = [...links];
    const item = nextLinks.splice(index, 1)[0];
    nextLinks.push(item);
    onUpdateLinks(nextLinks);
  };

  const handleDelete = (id: string) => {
    onUpdateLinks(links.filter((l) => l.id !== id));
  };

  const handleToggleActive = (id: string) => {
    onUpdateLinks(
      links.map((l) => (l.id === id ? { ...l, active: !l.active } : l))
    );
  };

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

  return (
    <div className="space-y-4 text-slate-200 text-sm">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Custom Links ({links.length})
          </h4>
          <p className="text-[11px] text-slate-400">Tap any link to edit details & icons</p>
        </div>
        <button
          type="button"
          onClick={handleStartCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Link</span>
        </button>
      </div>

      {/* Links List */}
      {links.length > 0 ? (
        <div className="space-y-2.5">
          {links.map((link, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === links.length - 1;

            return (
              <div
                key={link.id}
                className={`p-3 rounded-2xl border transition-all ${
                  link.active
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-950/60 border-slate-900 opacity-60'
                }`}
              >
                {/* Main Link Header Info (Tap to edit) */}
                <div
                  onClick={() => handleStartEdit(link)}
                  className="flex items-center gap-3 cursor-pointer group select-none"
                >
                  <div
                    className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      color: link.customAccent || theme.accentColor,
                      backgroundColor: `${link.customAccent || theme.accentColor}18`,
                    }}
                  >
                    <LinkIconComponent icon={link.icon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-semibold truncate text-white group-hover:text-indigo-300 transition-colors">
                        {link.title}
                      </h5>
                      {link.highlight && (
                        <span
                          className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded text-white shadow-xs"
                          style={{ backgroundColor: link.customAccent || theme.accentColor }}
                        >
                          {link.badgeText || 'Featured'}
                        </span>
                      )}
                    </div>
                    {link.subtitle && (
                      <p className="text-[11px] text-slate-400 truncate">{link.subtitle}</p>
                    )}
                    <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                      {link.url}
                    </p>
                  </div>

                  <div className="p-2 text-slate-400 group-hover:text-indigo-400 transition-colors">
                    <EditIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Quick Touch Controls Row (Mobile Ergonomics) */}
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-xs">
                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(link.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      link.active
                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/80'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {link.active ? 'Visible' : 'Hidden'}
                  </button>

                  {/* Reorder and Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveToTop(idx)}
                      disabled={isFirst}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition-colors"
                      title="Move to Top"
                    >
                      <MoveToTopIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={isFirst}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUpIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={isLast}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDownIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveToBottom(idx)}
                      disabled={isLast}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition-colors"
                      title="Move to Bottom"
                    >
                      <MoveToBottomIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${link.title}"?`)) {
                          handleDelete(link.id);
                        }
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
                      title="Delete Link"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

      {/* Advanced Mobile Bottom Sheet */}
      <LinkEditBottomSheet
        isOpen={isBottomSheetOpen}
        link={selectedLink}
        isNew={isCreatingNew}
        theme={theme}
        onSave={handleSaveFromBottomSheet}
        onDelete={handleDelete}
        onClose={() => {
          setIsBottomSheetOpen(false);
          setSelectedLink(null);
        }}
      />
    </div>
  );
};
