import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LinktreeData } from '../../types/linktree';
import { LinkButton } from './LinkButton';
import { SocialIcon } from '../icons/SocialSvgIcons';
import { VerifiedBadgeIcon } from '../icons/UiSvgIcons';
import { safeHref, getDisplayHost } from '../../utils/url';

interface PublicProfileProps {
  data: LinktreeData;
  isLoading?: boolean;
  onSecretTrigger?: () => void;
}

/**
 * Static class maps so Tailwind's scanner can actually see these names.
 * A template literal like `font-${theme.fontFamily}` produces classes that
 * never make it into the stylesheet, which silently breaks the setting.
 */
const FONT_CLASS: Record<string, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
};

const SOCIAL_LABEL: Record<string, string> = {
  github: 'GitHub',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  instagram: 'Instagram',
  discord: 'Discord',
  email: 'Email',
  website: 'Website',
  twitch: 'Twitch',
  substack: 'Substack',
};

/** Placeholder shown while data.json is still being fetched. */
function ProfileSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center p-4 sm:p-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading profile…</span>
      <main className="w-full max-w-md mx-auto my-auto flex flex-col items-center pt-6 sm:pt-8 pb-10 sm:pb-12">
        <div
          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full mb-5 animate-pulse ${
            isDark ? 'bg-white/10' : 'bg-slate-300/50'
          }`}
        />
        <div
          className={`h-5 w-40 rounded-md mb-3 animate-pulse ${isDark ? 'bg-white/10' : 'bg-slate-300/50'}`}
        />
        <div
          className={`h-3 w-28 rounded-md mb-6 animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-300/40'}`}
        />
        <div className="flex gap-2.5 mb-7">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full animate-pulse ${isDark ? 'bg-white/10' : 'bg-slate-300/50'}`}
            />
          ))}
        </div>
        <div className="w-full flex flex-col gap-3 px-1 sm:px-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-full h-[68px] rounded-2xl animate-pulse ${
                isDark ? 'bg-white/10' : 'bg-slate-300/40'
              }`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export const PublicProfile: React.FC<PublicProfileProps> = React.memo(
  ({ data, isLoading, onSecretTrigger }) => {
    const [imageError, setImageError] = useState(false);
    const { profile, socials, links, theme } = data;

    const tapCountRef = useRef(0);
    const lastTapTimeRef = useRef(0);

    // Secret triple-tap gesture for the owner (3 taps, each within 500ms).
    const handleSecretTap = useCallback(() => {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 500) {
        tapCountRef.current += 1;
      } else {
        tapCountRef.current = 1;
      }
      lastTapTimeRef.current = now;

      if (tapCountRef.current >= 3) {
        tapCountRef.current = 0;
        onSecretTrigger?.();
      }
    }, [onSecretTrigger]);

    const isDark = theme.textColor !== 'dark';
    const fontClass = FONT_CLASS[theme.fontFamily] ?? FONT_CLASS.sans;

    // Reset the fallback if the owner uploads a new avatar that loads fine.
    const avatarSrc = useMemo(() => profile.avatarUrl, [profile.avatarUrl]);
    const showImage = Boolean(avatarSrc) && !imageError;

    const initials = useMemo(() => {
      const source = profile.name?.trim();
      if (!source) return 'GT';
      return source
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }, [profile.name]);

    const visibleSocials = useMemo(
      () => (socials ?? []).filter((social) => Boolean(social.url?.trim())),
      [socials]
    );

    const visibleLinks = useMemo(
      () => (links ?? []).filter((link) => link.active !== false),
      [links]
    );

    const socialSurface = useMemo(() => {
      if (theme.buttonStyle === 'glass') {
        return isDark
          ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white backdrop-blur-sm'
          : 'bg-black/5 hover:bg-black/10 active:bg-black/15 text-slate-800 backdrop-blur-sm';
      }
      return isDark
        ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-200'
        : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm';
    }, [theme.buttonStyle, isDark]);

    if (isLoading) {
      return <ProfileSkeleton isDark={theme.textColor !== 'dark'} />;
    }

    return (
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 transition-colors duration-500 ${fontClass}`}
        style={{
          background: theme.backgroundValue,
          color: isDark ? '#f8fafc' : '#0f172a',
        }}
      >
        <main className="w-full max-w-md mx-auto my-auto flex flex-col items-center pt-6 sm:pt-8 pb-10 sm:pb-12">
          {/* Avatar with initials fallback + secret triple-tap trigger */}
          <div
            onClick={handleSecretTap}
            className="relative mb-5 group cursor-pointer select-none"
            title="Profile Avatar"
          >
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 transition-transform duration-300 group-hover:scale-105 active:scale-95 shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.accentColor}44)`,
              }}
            >
              {showImage ? (
                <img
                  src={avatarSrc}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  decoding="async"
                  loading="eager"
                  onError={() => setImageError(true)}
                  className="w-full h-full rounded-full object-cover bg-slate-800"
                />
              ) : (
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-bold text-2xl text-white select-none"
                  style={{ backgroundColor: theme.accentColor }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
              )}
            </div>

            {profile.verified && (
              <div
                className="absolute bottom-1 right-1 p-1 rounded-full shadow-md text-white flex items-center justify-center"
                style={{ backgroundColor: theme.accentColor }}
                title="Verified Profile"
              >
                <VerifiedBadgeIcon className="w-4 h-4" />
                <span className="sr-only">Verified profile</span>
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="text-center mb-6 px-4">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
              {profile.name}
            </h1>
            <p
              className={`text-xs sm:text-sm font-medium tracking-wide mb-3 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {profile.handle}
              {profile.location && (
                <>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span>{profile.location}</span>
                </>
              )}
            </p>
            {profile.bio && (
              <p
                className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto text-balance ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {profile.bio}
              </p>
            )}
          </div>

          {/* Social icons */}
          {visibleSocials.length > 0 && (
            <nav
              aria-label="Social media profiles"
              className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mb-7 sm:mb-8"
            >
              {visibleSocials.map((social, idx) => {
                const href = safeHref(social.url);
                const label = SOCIAL_LABEL[social.platform] ?? social.platform;
                const host = getDisplayHost(social.url);
                const title = host ? `${label} — ${host}` : label;
                const icon = (
                  <SocialIcon platform={social.platform} className="w-4 h-4 sm:w-5 sm:h-5" />
                );

                // Unsafe or empty URLs still render, but are not clickable.
                if (!href) {
                  return (
                    <span
                      key={`${social.platform}-${idx}`}
                      className={`p-2.5 rounded-full opacity-40 cursor-not-allowed ${socialSurface}`}
                      title={`${title} (invalid link)`}
                      aria-disabled="true"
                    >
                      {icon}
                      <span className="sr-only">{title}</span>
                    </span>
                  );
                }

                return (
                  <a
                    key={`${social.platform}-${idx}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={title}
                    title={title}
                    className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${socialSurface}`}
                  >
                    {icon}
                  </a>
                );
              })}
            </nav>
          )}

          {/* Links */}
          <section
            aria-label="Links"
            className="w-full flex flex-col gap-3 sm:gap-3.5 px-1 sm:px-2"
          >
            {visibleLinks.length > 0 ? (
              visibleLinks.map((link) => <LinkButton key={link.id} link={link} theme={theme} />)
            ) : (
              <div
                className={`text-center py-8 px-4 rounded-2xl border border-dashed ${
                  isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
                }`}
              >
                <p className="text-xs sm:text-sm">No links published yet.</p>
              </div>
            )}
          </section>
        </main>

        <footer
          onClick={handleSecretTap}
          className={`w-full text-center py-4 text-xs font-mono select-none cursor-pointer ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          <span>{profile.name || 'GitTree'}</span>
        </footer>
      </div>
    );
  }
);

PublicProfile.displayName = 'PublicProfile';