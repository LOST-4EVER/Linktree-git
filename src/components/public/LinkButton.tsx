import React, { useState } from 'react';
import { CustomLink, ThemeConfig } from '../../types/linktree';
import { LinkIconComponent, ExternalLinkIcon } from '../icons/UiSvgIcons';

interface LinkButtonProps {
  link: CustomLink;
  theme: ThemeConfig;
  onLinkClick?: (id: string) => void;
}

export const LinkButton: React.FC<LinkButtonProps> = ({ link, theme, onLinkClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!link.active) return null;

  const activeAccent = link.customAccent || theme.accentColor;

  // Determine radius based on theme
  const getRadiusClass = () => {
    switch (theme.buttonStyle) {
      case 'pill':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-xl';
      case 'glass':
      default:
        return 'rounded-2xl';
    }
  };

  // Determine surface appearance
  const getSurfaceClass = () => {
    const isDark = theme.textColor !== 'dark';

    if (theme.buttonStyle === 'glass') {
      return isDark
        ? 'bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 backdrop-blur-md text-white shadow-lg shadow-black/20'
        : 'bg-white/75 hover:bg-white/90 active:bg-white border border-slate-200/80 backdrop-blur-md text-slate-900 shadow-sm';
    }

    if (isDark) {
      return 'bg-slate-900/85 hover:bg-slate-800 active:bg-slate-750 border border-slate-800 text-slate-100 shadow-md';
    }

    return 'bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-900 shadow-sm';
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onLinkClick?.(link.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderColor: isHovered || link.highlight ? `${activeAccent}88` : undefined,
        boxShadow:
          isHovered || link.highlight
            ? `0 10px 25px -5px ${activeAccent}25, 0 8px 10px -6px ${activeAccent}20`
            : undefined,
      }}
      className={`group relative flex items-center justify-between w-full px-4 sm:px-5 py-3.5 sm:py-4 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-[0.99] min-h-[56px] ${getRadiusClass()} ${getSurfaceClass()}`}
    >
      {/* Featured / Custom Badge */}
      {link.highlight && (
        <span
          className="absolute -top-2 right-4 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full text-white shadow-sm"
          style={{ backgroundColor: activeAccent }}
        >
          {link.badgeText || 'Featured'}
        </span>
      )}

      {/* Left SVG Icon */}
      <div
        className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl transition-colors duration-200"
        style={{
          backgroundColor: isHovered ? `${activeAccent}20` : 'rgba(128, 128, 128, 0.1)',
          color: isHovered ? activeAccent : 'inherit',
        }}
      >
        <LinkIconComponent icon={link.icon} className="w-5 h-5" />
      </div>

      {/* Title & Subtitle */}
      <div className="flex-1 min-w-0 mx-3 sm:mx-4 text-center">
        <h3 className="text-xs sm:text-sm font-semibold tracking-tight truncate group-hover:opacity-100 transition-opacity">
          {link.title}
        </h3>
        {link.subtitle && (
          <p
            className={`text-[11px] sm:text-xs truncate mt-0.5 ${
              theme.textColor === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {link.subtitle}
          </p>
        )}
      </div>

      {/* External link action icon */}
      <div
        className="flex items-center justify-center w-6 h-6 shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
        style={{ color: isHovered ? activeAccent : 'inherit' }}
      >
        <ExternalLinkIcon className="w-4 h-4" />
      </div>
    </a>
  );
};
