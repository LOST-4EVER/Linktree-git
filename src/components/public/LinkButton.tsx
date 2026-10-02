import React, { useState } from 'react';
import { CustomLink, ThemeConfig } from '../../types/linktree';
import { LinkIconComponent, ExternalLinkIcon } from '../icons/UiSvgIcons';
import { safeHref, getDisplayHost } from '../../utils/url';

interface LinkButtonProps {
  link: CustomLink;
  theme: ThemeConfig;
  onLinkClick?: (id: string) => void;
}

const RADIUS_CLASS: Record<ThemeConfig['buttonStyle'], string> = {
  pill: 'rounded-full',
  rounded: 'rounded-xl',
  glass: 'rounded-2xl',
};

export const LinkButton: React.FC<LinkButtonProps> = React.memo(
  ({ link, theme, onLinkClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    // `active === false` means hidden. Explicitly undefined counts as visible so
    // links authored before the flag existed still render.
    if (link.active === false) return null;

    const accent = link.customAccent || theme.accentColor;
    const isDark = theme.textColor !== 'dark';
    const radiusClass = RADIUS_CLASS[theme.buttonStyle] ?? RADIUS_CLASS.glass;

    const surfaceClass =
      theme.buttonStyle === 'glass'
        ? isDark
          ? 'bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 backdrop-blur-md text-white shadow-lg shadow-black/20'
          : 'bg-white/75 hover:bg-white/90 active:bg-white border border-slate-200/80 backdrop-blur-md text-slate-900 shadow-sm'
        : isDark
          ? // `slate-750` is not a real Tailwind step; slate-700 is the intent.
            'bg-slate-900/85 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-slate-100 shadow-md'
          : 'bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-900 shadow-sm';

    const href = safeHref(link.url);
    const host = getDisplayHost(link.url);
    const isEmphasized = isHovered || Boolean(link.highlight);

    const body = (
      <>
        {link.highlight && (
          <span
            className="absolute -top-2 right-4 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full text-white shadow-sm max-w-[70%] truncate"
            style={{ backgroundColor: accent }}
          >
            {link.badgeText || 'Featured'}
          </span>
        )}

        <div
          className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl transition-colors duration-200"
          style={{
            backgroundColor: isHovered ? `${accent}20` : 'rgba(128, 128, 128, 0.1)',
            color: isHovered ? accent : 'inherit',
          }}
        >
          <LinkIconComponent icon={link.icon} className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 mx-3 sm:mx-4 text-center">
          <h3 className="text-xs sm:text-sm font-semibold tracking-tight truncate">
            {link.title}
          </h3>
          {link.subtitle && (
            <p
              className={`text-[11px] sm:text-xs truncate mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {link.subtitle}
            </p>
          )}
        </div>

        <div
          className="flex items-center justify-center w-6 h-6 shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
          style={{ color: isHovered ? accent : 'inherit' }}
        >
          <ExternalLinkIcon className="w-4 h-4" />
        </div>
      </>
    );

    const sharedClasses = `group relative flex items-center justify-between w-full px-4 sm:px-5 py-3.5 sm:py-4 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-[0.99] min-h-[56px] focus-visible:outline-2 focus-visible:outline-offset-2 ${radiusClass} ${surfaceClass}`;

    const sharedStyle = isEmphasized
      ? {
          borderColor: `${accent}88`,
          boxShadow: `0 10px 25px -5px ${accent}25, 0 8px 10px -6px ${accent}20`,
        }
      : undefined;

    // Unsafe or empty URL: render a clearly non-navigable card instead of an
    // anchor, so a bad value can never become a clickable javascript: link.
    if (!href) {
      return (
        <div
          className={`${sharedClasses} cursor-not-allowed opacity-60`}
          style={sharedStyle}
          title={link.url ? 'This link has an unsupported or invalid URL' : 'This link has no URL'}
          aria-disabled="true"
        >
          {body}
        </div>
      );
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onLinkClick?.(link.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        style={sharedStyle}
        className={sharedClasses}
        title={host ? `${link.title} — ${host}` : link.title}
      >
        {body}
      </a>
    );
  }
);

LinkButton.displayName = 'LinkButton';