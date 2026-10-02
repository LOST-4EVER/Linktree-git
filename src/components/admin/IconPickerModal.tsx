import React, { useState, useMemo, useEffect } from 'react';
import { LinkIconType } from '../../types/linktree';
import { LinkIconComponent, SearchIcon, CloseIcon, CheckIcon } from '../icons/UiSvgIcons';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon?: string;
  onSelectIcon: (icon: LinkIconType) => void;
}

type IconCategory = 'social' | 'media' | 'tools' | 'general';

interface IconDefinition {
  id: LinkIconType;
  label: string;
  category: IconCategory;
}

const ALL_ICONS: IconDefinition[] = [
  // General & Web
  { id: 'globe', label: 'Website', category: 'general' },
  { id: 'sparkle', label: 'Featured / AI', category: 'general' },
  { id: 'star', label: 'Star / Bookmark', category: 'general' },
  { id: 'heart', label: 'Favorite / Sponsor', category: 'general' },
  { id: 'coffee', label: 'Buy Me a Coffee', category: 'general' },
  { id: 'chat', label: 'Chat / Contact', category: 'general' },
  { id: 'folder', label: 'Projects / Files', category: 'general' },
  { id: 'download', label: 'Download / Asset', category: 'general' },

  // Social & Dev
  { id: 'github', label: 'GitHub', category: 'social' },
  { id: 'twitter', label: 'X / Twitter', category: 'social' },
  { id: 'linkedin', label: 'LinkedIn', category: 'social' },
  { id: 'discord', label: 'Discord Community', category: 'social' },
  { id: 'email', label: 'Email / Inquiries', category: 'social' },

  // Media & Content
  { id: 'youtube', label: 'YouTube Video', category: 'media' },
  { id: 'video', label: 'Stream / Watch', category: 'media' },
  { id: 'instagram', label: 'Instagram', category: 'media' },
  { id: 'music', label: 'Music / Track', category: 'media' },
  { id: 'podcast', label: 'Podcast Episode', category: 'media' },
  { id: 'article', label: 'Blog / Article', category: 'media' },
  { id: 'newsletter', label: 'Substack / Newsletter', category: 'media' },
  { id: 'book', label: 'Book / Guide', category: 'media' },

  // Tools & Commerce
  { id: 'code', label: 'Source Code / Snippet', category: 'tools' },
  { id: 'terminal', label: 'CLI / Terminal', category: 'tools' },
  { id: 'figma', label: 'Figma Design', category: 'tools' },
  { id: 'calendar', label: 'Book Call / Cal.com', category: 'tools' },
  { id: 'shop', label: 'Store / Merch', category: 'tools' },
];

const CATEGORIES: Array<{ id: IconCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'social', label: 'Social' },
  { id: 'media', label: 'Media' },
  { id: 'tools', label: 'Tools' },
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIcon,
  onSelectIcon,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<IconCategory | 'all'>('all');

  // Reset filters each time the picker opens so it never reopens empty.
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Escape closes the picker.
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

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ALL_ICONS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        item.label.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.category.includes(query)
      );
    });
  }, [search, activeCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select an icon"
        className="bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100 slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white">Select Icon</h3>
            <p className="text-[11px] text-slate-400">
              {filteredIcons.length} of {ALL_ICONS.length} icons
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close icon picker"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search + categories */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-3 shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons (github, shop, code…)"
              aria-label="Search icons"
              autoFocus
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={activeCategory === cat.id}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-[11px] font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 overflow-y-auto gt-scroll">
          {filteredIcons.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-10">
              No icons match “{search}”. Try a different search or pick “All”.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredIcons.map((item) => {
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectIcon(item.id);
                      onClose();
                    }}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-95 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      <LinkIconComponent icon={item.id} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{item.id}</div>
                    </div>
                    {isSelected && <CheckIcon className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};