import React, { useState, useEffect, useId } from 'react';
import { CustomLink, LinkIconType, ThemeConfig } from '../../types/linktree';
import { IconPickerModal } from './IconPickerModal';
import {
  LinkIconComponent,
  ExternalLinkIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  SparklesIcon,
  WarningIcon,
} from '../icons/UiSvgIcons';
import { normalizeUrl, isSafeUrl, safeHref, getDisplayHost, guessIconForUrl } from '../../utils/url';

interface LinkEditBottomSheetProps {
  isOpen: boolean;
  link: CustomLink | null;
  isNew?: boolean;
  theme: ThemeConfig;
  onSave: (link: CustomLink) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const ACCENT_SWATCHES = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f43f5e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

function createEmptyLink(): CustomLink {
  return {
    // A random suffix avoids id collisions when several links are created in
    // the same millisecond.
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    subtitle: '',
    url: '',
    icon: 'globe',
    highlight: false,
    badgeText: '',
    customAccent: '',
    active: true,
  };
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
  const [formData, setFormData] = useState<CustomLink>(createEmptyLink);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const titleId = useId();

  // Re-seed the form whenever the sheet opens or targets a different link.
  useEffect(() => {
    if (!isOpen) return;
    setFormData(link ? { ...link } : createEmptyLink());
    setShowErrors(false);
  }, [link, isOpen]);

  // Escape closes the icon picker first, then the sheet itself.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      if (isIconPickerOpen) setIsIconPickerOpen(false);
      else onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isIconPickerOpen, onClose]);

  const patch = (updates: Partial<CustomLink>) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  /** Normalizes the URL and auto-picks a matching icon while still defaulting. */
  const handleUrlChange = (raw: string) => {
    const typed = raw;
    const guessed = guessIconForUrl(typed);

    setFormData((prev) => ({
      ...prev,
      url: typed,
      // Only override the icon while it is still the generic placeholder, so a
      // deliberate choice is never overwritten.
      icon: guessed && (!prev.icon || prev.icon === 'globe') ? (guessed as LinkIconType) : prev.icon,
    }));
  };

  if (!isOpen) return null;

  const trimmedTitle = formData.title.trim();
  const trimmedUrl = formData.url.trim();
  const titleError = trimmedTitle.length === 0;
  const urlMissing = trimmedUrl.length === 0;
  const urlUnsafe = !urlMissing && !isSafeUrl(trimmedUrl);
  const hasErrors = titleError || urlMissing || urlUnsafe;

  const normalizedUrl = urlMissing ? '' : normalizeUrl(trimmedUrl);
  const displayHost = getDisplayHost(trimmedUrl);
  const suggestedIcon = guessIconForUrl(trimmedUrl);
  const iconMismatch = Boolean(
    suggestedIcon && formData.icon && suggestedIcon !== formData.icon
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    // Persist the normalized URL so the public view gets a working href.
    onSave({
      ...formData,
      title: trimmedTitle,
      url: normalizedUrl,
      subtitle: formData.subtitle?.trim() || undefined,
      badgeText: formData.badgeText?.trim() || undefined,
      customAccent: formData.customAccent?.trim() || undefined,
    });
    onClose();
  };

  const accent = formData.customAccent || theme.accentColor;
  const previewHref = safeHref(trimmedUrl);

  return (
    <>
      <div
        className="fixed inset-0 z-55 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 slide-in-from-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sm:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-slate-700" />
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 shrink-0">
            <h3 id={titleId} className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              {isNew ? 'Create New Link' : 'Edit Link'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close link editor"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto gt-scroll p-5 space-y-4 text-xs">
            {/* Live preview */}
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Live Card Preview
              </span>
              <div
                className="relative flex items-center justify-between p-4 rounded-2xl border transition-all"
                style={{
                  background:
                    theme.buttonStyle === 'glass' ? 'rgba(255, 255, 255, 0.08)' : '#0f172a',
                  borderColor: formData.highlight ? accent : 'rgba(255, 255, 255, 0.15)',
                  boxShadow: formData.highlight ? `0 10px 25px -5px ${accent}33` : undefined,
                }}
              >
                {formData.highlight && (
                  <span
                    className="absolute -top-2 right-4 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full text-white shadow-sm max-w-[70%] truncate"
                    style={{ backgroundColor: accent }}
                  >
                    {formData.badgeText || 'Featured'}
                  </span>
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  <LinkIconComponent icon={formData.icon} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 mx-3 text-center">
                  <h4 className="text-sm font-semibold truncate text-white">
                    {formData.title || 'Enter a title below…'}
                  </h4>
                  {formData.subtitle && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{formData.subtitle}</p>
                  )}
                  {displayHost && !urlMissing && (
                    <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                      {displayHost}
                    </p>
                  )}
                </div>
                <div className="w-5 h-5 opacity-40 flex items-center justify-center shrink-0">
                  <ExternalLinkIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-3 pt-2">
              <div>
                <label htmlFor="link-title" className="block font-medium text-slate-300 mb-1">
                  Link Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="link-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="e.g. Subscribe to my YouTube channel"
                  aria-invalid={showErrors && titleError}
                  className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none ${
                    showErrors && titleError
                      ? 'border-rose-600 focus:border-rose-500'
                      : 'border-slate-800 focus:border-indigo-500'
                  }`}
                  maxLength={200}
                />
                {showErrors && titleError && (
                  <p className="text-[11px] text-rose-400 mt-1">Give this link a title.</p>
                )}
              </div>

              {/* URL */}
              <div>
                <label htmlFor="link-url" className="block font-medium text-slate-300 mb-1">
                  Destination URL <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="link-url"
                    type="text"
                    inputMode="url"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="example.com/page"
                    aria-invalid={(showErrors && (urlMissing || urlUnsafe)) || undefined}
                    aria-describedby="link-url-hint"
                    className={`flex-1 min-w-0 bg-slate-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono ${
                      showErrors && (urlMissing || urlUnsafe)
                        ? 'border-rose-600 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {previewHref && (
                    <a
                      href={previewHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center transition-colors shrink-0"
                      title={`Open ${displayHost || 'link'} in a new tab`}
                      aria-label="Test destination link in a new tab"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <p id="link-url-hint" className="text-[11px] mt-1.5 text-slate-500 leading-snug">
                  {urlMissing ? (
                    'Paste a link. The https:// prefix is added automatically.'
                  ) : urlUnsafe ? (
                    <span className="text-rose-400 inline-flex items-center gap-1">
                      <WarningIcon className="w-3.5 h-3.5" />
                      Only http, https, mailto, and tel links are supported.
                    </span>
                  ) : normalizedUrl !== trimmedUrl ? (
                    <>Will be saved as <span className="text-slate-300 font-mono">{normalizedUrl}</span></>
                  ) : (
                    <>Opens in a new tab · {displayHost || 'same tab'}</>
                  )}
                </p>

                {iconMismatch && (
                  <button
                    type="button"
                    onClick={() => patch({ icon: suggestedIcon as LinkIconType })}
                    className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                  >
                    Use the {suggestedIcon} icon for this link →
                  </button>
                )}
              </div>

              {/* Subtitle */}
              <div>
                <label htmlFor="link-subtitle" className="block font-medium text-slate-300 mb-1">
                  Subtitle Description (Optional)
                </label>
                <input
                  id="link-subtitle"
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => patch({ subtitle: e.target.value })}
                  placeholder="e.g. Weekly tutorials & source code"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  maxLength={300}
                />
              </div>
            </div>

            {/* Icon picker trigger */}
            <div className="pt-2">
              <span className="block font-medium text-slate-300 mb-1.5">Vector SVG Icon</span>
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(true)}
                className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accent}20`, color: accent }}
                  >
                    <LinkIconComponent icon={formData.icon} className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-xs font-semibold text-white capitalize block truncate">
                      {formData.icon || 'globe'}
                    </span>
                    <span className="block text-[10px] text-slate-500">Tap to change icon</span>
                  </div>
                </div>
                <span className="text-[11px] text-indigo-400 font-medium shrink-0">Browse all →</span>
              </button>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">Feature on top</span>
                    <span className="text-[10px] text-slate-400">Adds an accent glow & badge</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.highlight}
                  onChange={(e) => patch({ highlight: e.target.checked })}
                  className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 shrink-0"
                  aria-label="Feature this link"
                />
              </div>

              {formData.highlight && (
                <div>
                  <label htmlFor="link-badge" className="block font-medium text-slate-300 mb-1">
                    Badge Text (Optional)
                  </label>
                  <input
                    id="link-badge"
                    type="text"
                    value={formData.badgeText || ''}
                    onChange={(e) => patch({ badgeText: e.target.value })}
                    placeholder="e.g. NEW, FEATURED, 50% OFF, LIVE"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    maxLength={40}
                  />
                </div>
              )}

              {/* Per-link accent */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Accent Colour</span>
                    <span className="text-[10px] text-slate-400">
                      Override the profile accent for this link
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => patch({ customAccent: '' })}
                    disabled={!formData.customAccent}
                    className="text-[11px] text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                  >
                    Use theme accent
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ACCENT_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => patch({ customAccent: hex })}
                      aria-label={`Use accent colour ${hex}`}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        (formData.customAccent || '').toLowerCase() === hex
                          ? 'scale-110 border-white ring-2 ring-indigo-500'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.customAccent || theme.accentColor}
                    onChange={(e) => patch({ customAccent: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    aria-label="Pick a custom accent colour"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="font-semibold text-white block">Visibility</span>
                  <span className="text-[10px] text-slate-400">Hide without deleting</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => patch({ active: e.target.checked })}
                  className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 shrink-0"
                  aria-label="Show this link publicly"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
              {!isNew && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${formData.title || 'this link'}"?`)) {
                      onDelete(formData.id);
                      onClose();
                    }
                  }}
                  className="p-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-800/80 transition-colors shrink-0"
                  title="Delete link"
                  aria-label="Delete link"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
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

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        selectedIcon={formData.icon}
        onSelectIcon={(icon) => patch({ icon })}
      />
    </>
  );
};