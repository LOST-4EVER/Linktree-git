import React, { useState, useRef } from 'react';
import { LinktreeData } from '../../types/linktree';
import { LinkButton } from './LinkButton';
import { SocialIcon } from '../icons/SocialSvgIcons';
import { VerifiedBadgeIcon } from '../icons/UiSvgIcons';

interface PublicProfileProps {
  data: LinktreeData;
  isLoading?: boolean;
  onSecretTrigger?: () => void;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({
  data,
  isLoading,
  onSecretTrigger,
}) => {
  const [imageError, setImageError] = useState(false);
  const { profile, socials, links, theme } = data;

  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  // Secret Triple-Tap gesture for Mobile Owners (3 taps within 800ms)
  const handleSecretTap = () => {
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
  };

  const isDark = theme.textColor !== 'dark';

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 transition-colors duration-500 font-${theme.fontFamily}`}
      style={{
        background: theme.backgroundValue,
        color: isDark ? '#f8fafc' : '#0f172a',
      }}
    >
      {/* Centered Main Profile Container */}
      <main className="w-full max-w-md mx-auto my-auto flex flex-col items-center pt-6 sm:pt-8 pb-10 sm:pb-12">
        {/* Avatar with fallback container & secret triple-tap trigger */}
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
            {!imageError && profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full rounded-full object-cover bg-slate-800"
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center font-bold text-2xl text-white select-none"
                style={{ backgroundColor: theme.accentColor }}
              >
                {profile.name
                  ? profile.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'GT'}
              </div>
            )}
          </div>

          {/* Verified Badge */}
          {profile.verified && (
            <div
              className="absolute bottom-1 right-1 p-1 rounded-full shadow-md text-white flex items-center justify-center"
              style={{ backgroundColor: theme.accentColor }}
              title="Verified Profile"
            >
              <VerifiedBadgeIcon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Identity Headings */}
        <div className="text-center mb-6 px-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 flex items-center justify-center gap-1.5">
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

        {/* Social Icons Row */}
        {socials && socials.length > 0 && (
          <nav
            aria-label="Social media profiles"
            className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mb-7 sm:mb-8"
          >
            {socials.map((social, idx) => (
              <a
                key={`${social.platform}-${idx}`}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.platform}
                className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                  theme.buttonStyle === 'glass'
                    ? isDark
                      ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white backdrop-blur-sm'
                      : 'bg-black/5 hover:bg-black/10 active:bg-black/15 text-slate-800 backdrop-blur-sm'
                    : isDark
                    ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-200'
                    : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'
                }`}
              >
                <SocialIcon platform={social.platform} className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            ))}
          </nav>
        )}

        {/* Links Stack */}
        <section aria-label="Links" className="w-full flex flex-col gap-3 sm:gap-3.5 px-1 sm:px-2">
          {links && links.length > 0 ? (
            links.map((link) => (
              <LinkButton key={link.id} link={link} theme={theme} />
            ))
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

      {/* Quiet, minimalist footer */}
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
};
