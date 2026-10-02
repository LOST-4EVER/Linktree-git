import React, { useState, useEffect } from 'react';
import { CustomLink, LinkIconType, ThemeConfig } from '../../types/linktree';
import { IconPickerModal } from './IconPickerModal';
import {
  LinkIconComponent,
  ExternalLinkIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  SparklesIcon,
} from '../icons/UiSvgIcons';

interface LinkEditBottomSheetProps {
  isOpen: boolean;
  link: CustomLink | null;
  isNew?: boolean;
  theme: ThemeConfig;
  onSave: (link: CustomLink) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const LinkEditBottomSheet: React.FC<LinkEditBottomSheetProps> = ({
  isOpen,
  link,
  isNew = false,
  theme,
  onSave,
  onDelete,
  onClose,
}) => {
  const [formData, setFormData] = useState<CustomLink>({
    id: `link-${Date.now()}`,
    title: '',
    subtitle: '',
    url: 'https://',
    icon: 'globe',
    highlight: false,
    badgeText: '',
    customAccent: '',
    active: true,
  });

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  useEffect(() => {
    if (link) {
      setFormData({ ...link });
    } else {
      setFormData({
        id: `link-${Date.now()}`,
        title: '',
        subtitle: '',
        url: 'https://',
        icon: 'globe',
        highlight: false,
        badgeText: '',
        customAccent: '',
        active: true,
      });
    }
  }, [link, isOpen]);

  // Smart URL icon detection
  const handleUrlChange = (url: string) => {
    let autoIcon: LinkIconType | undefined;
    const lower = url.toLowerCase();

    if (lower.includes('github.com')) autoIcon = 'github';
    else if (lower.includes('twitter.com') || lower.includes('x.com')) autoIcon = 'twitter';
    else if (lower.includes('linkedin.com')) autoIcon = 'linkedin';
    else if (lower.includes('youtube.com') || lower.includes('youtu.be')) autoIcon = 'youtube';
    else if (lower.includes('instagram.com')) autoIcon = 'instagram';
    else if (lower.includes('discord.gg') || lower.includes('discord.com')) autoIcon = 'discord';
    else if (lower.includes('substack.com')) autoIcon = 'newsletter';
    else if (lower.includes('medium.com') || lower.includes('dev.to') || lower.includes('blog')) autoIcon = 'article';
    else if (lower.includes('cal.com') || lower.includes('calendly.com')) autoIcon = 'calendar';
    else if (lower.includes('figma.com')) autoIcon = 'figma';
    else if (lower.includes('spotify.com') || lower.includes('soundcloud.com')) autoIcon = 'music';
    else if (lower.includes('apple.com/podcast') || lower.includes('podcasts')) autoIcon = 'podcast';
    else if (lower.includes('gumroad.com') || lower.includes('shop') || lower.includes('store')) autoIcon = 'shop';

    setFormData((prev) => ({
      ...prev,
      url,
      icon: autoIcon && prev.icon === 'globe' ? autoIcon : prev.icon,
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    onSave(formData);
    onClose();
  };

  const activeAccent = formData.customAccent || theme.accentColor;

  return (
    <>
      <div
        className="fixed inset-0 z-55 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden w-full flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-slate-700" />
          </div>

          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {isNew ? 'Create New Link' : 'Edit Link'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Live Visual Preview Card */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Live Card Preview
              </label>
              <div
                className="relative flex items-center justify-between p-4 rounded-2xl border transition-all"
                style={{
                  background:
                    theme.buttonStyle === 'glass'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#0f172a',
                  borderColor: formData.highlight ? activeAccent : 'rgba(255, 255, 255, 0.15)',
                  boxShadow: formData.highlight
                    ? `0 10px 25px -5px ${activeAccent}33`
                    : undefined,
                }}
              >
                {formData.highlight && (
                  <span
                    className="absolute -top-2 right-4 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full text-white shadow-sm"
                    style={{ backgroundColor: activeAccent }}
                  >
                    {formData.badgeText || 'Featured'}
                  </span>
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${activeAccent}20`,
                    color: activeAccent,
                  }}
                >
                  <LinkIconComponent icon={formData.icon} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 mx-3 text-center">
                  <h4 className="text-sm font-semibold truncate text-white">
                    {formData.title || 'Enter a title below...'}
                  </h4>
                  {formData.subtitle && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{formData.subtitle}</p>
                  )}
                </div>
                <div className="w-5 h-5 opacity-40 flex items-center justify-center">
                  <ExternalLinkIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Link Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Subscribe to YouTube Channel"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Destination URL <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                  {formData.url && formData.url !== 'https://' && (
                    <a
                      href={formData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center transition-colors"
                      title="Test destination link in new tab"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Subtitle Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Weekly tutorials & source code"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Icon Picker Trigger */}
            <div className="pt-2">
              <label className="block font-medium text-slate-300 mb-1.5">Vector SVG Icon</label>
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(true)}
                className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${activeAccent}20`, color: activeAccent }}
                  >
                    <LinkIconComponent icon={formData.icon} className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-white capitalize">
                      {formData.icon || 'globe'}
                    </span>
                    <span className="block text-[10px] text-slate-500">Tap to change icon</span>
                  </div>
                </div>
                <span className="text-[11px] text-indigo-400 font-medium">Browse All &rarr;</span>
              </button>
            </div>

            {/* Feature Badges & Active Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-semibold text-white block">Feature on Top</span>
                    <span className="text-[10px] text-slate-400">Adds accent glow & pill badge</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.highlight}
                  onChange={(e) => setFormData({ ...formData, highlight: e.target.checked })}
                  className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {formData.highlight && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Custom Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText || ''}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="e.g. NEW, FEATURED, 50% OFF, LIVE"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="font-semibold text-white block">Visibility Status</span>
                  <span className="text-[10px] text-slate-400">Hide without deleting</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
              {!isNew && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this link?')) {
                      onDelete(formData.id);
                      onClose();
                    }
                  }}
                  className="p-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-800/80 transition-colors"
                  title="Delete link"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckIcon className="w-4 h-4" />
                <span>{isNew ? 'Create Link' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Icon Picker Submodal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        selectedIcon={formData.icon}
        onSelectIcon={(icon) => setFormData({ ...formData, icon })}
      />
    </>
  );
};
