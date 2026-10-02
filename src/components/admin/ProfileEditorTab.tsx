import React, { useRef, useState, useCallback } from 'react';
import { ProfileData, SocialLink, SocialPlatform } from '../../types/linktree';
import { SocialIcon } from '../icons/SocialSvgIcons';
import { TrashIcon, PlusIcon, CameraIcon, WarningIcon } from '../icons/UiSvgIcons';
import { getDefaultUrlForPlatform, isSafeUrl } from '../../utils/url';

interface ProfileEditorTabProps {
  profile: ProfileData;
  socials: SocialLink[];
  onUpdateProfile: (updatedProfile: ProfileData) => void;
  onUpdateSocials: (updatedSocials: SocialLink[]) => void;
}

/**
 * Stable, collision-free id per social row. Using the array index as the React
 * key made inputs hold the wrong value after deleting a row.
 */
function createSocialId(): string {
  return `social-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const AVAILABLE_PLATFORMS: SocialPlatform[] = [
  'github',
  'twitter',
  'linkedin',
  'youtube',
  'instagram',
  'discord',
  'email',
  'website',
  'twitch',
  'substack',
];

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  github: 'GitHub',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  instagram: 'Instagram',
  discord: 'Discord',
  email: 'Email',
  website: 'Website',
  twitch: 'Twitch',
  substack: 'Substack',
};

const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

export const ProfileEditorTab: React.FC<ProfileEditorTabProps> = ({
  profile,
  socials,
  onUpdateProfile,
  onUpdateSocials,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState('');

  // Keys must survive re-renders, so they live in state and are reused for rows
  // that already have one.
  const [keys] = useState<string[]>(() => socials.map(() => createSocialId()));

  const handleProfileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      onUpdateProfile({
        ...profile,
        [name]: type === 'checkbox' ? checked : value,
      });
    },
    [profile, onUpdateProfile]
  );

  /** Downscales an uploaded image to a square 256px JPEG data URL. */
  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setAvatarError('');

      if (!file.type.startsWith('image/')) {
        setAvatarError('That file is not an image.');
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        setAvatarError('Image is larger than 8 MB. Please pick a smaller one.');
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => setAvatarError('Could not read that image. Try another file.');
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl !== 'string') {
          setAvatarError('Could not read that image. Try another file.');
          return;
        }
        const img = new Image();
        img.onerror = () => setAvatarError('That image could not be decoded.');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            setAvatarError('Your browser could not process the image.');
            return;
          }

          // Center-crop to a square, then downscale.
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          onUpdateProfile({ ...profile, avatarUrl: canvas.toDataURL('image/jpeg', 0.85) });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);

      // Allow re-selecting the same file after an error.
      e.target.value = '';
    },
    [profile, onUpdateProfile]
  );

  const handleSocialUrlChange = (index: number, url: string) => {
    const next = [...socials];
    next[index] = { ...next[index], url };
    onUpdateSocials(next);
  };

  /**
   * Switching platform retargets the URL to that platform's shape, but only
   * while it still holds the previous platform's template or is blank.
   */
  const handleSocialPlatformChange = (index: number, platform: SocialPlatform) => {
    const current = socials[index];
    const previousTemplate = getDefaultUrlForPlatform(current.platform);
    const shouldRetarget =
      current.url.trim() === '' ||
      current.url === previousTemplate ||
      current.url === previousTemplate.replace(/\/$/, '');

    const next = [...socials];
    next[index] = {
      platform,
      url: shouldRetarget ? getDefaultUrlForPlatform(platform) : current.url,
    };
    onUpdateSocials(next);
  };

  const handleAddSocial = () => {
    onUpdateSocials([...socials, { platform: 'github', url: getDefaultUrlForPlatform('github') }]);
  };

  const handleRemoveSocial = (index: number) => {
    onUpdateSocials(socials.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 text-slate-200 text-sm">
      {/* Profile details */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Profile Information
        </h4>

        <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
          <div className="relative group shrink-0">
            <div className="w-18 h-18 rounded-full overflow-hidden bg-slate-800 border-2 border-indigo-500/50 flex items-center justify-center shadow-md">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar preview"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-xs text-slate-400 font-bold">GT</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-transform active:scale-90"
              title="Upload a photo from this device"
              aria-label="Upload avatar photo"
            >
              <CameraIcon className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <label htmlFor="avatar-url" className="text-xs font-semibold text-white">
                Avatar
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Upload from device →
              </button>
            </div>
            <input
              id="avatar-url"
              type="text"
              name="avatarUrl"
              value={profile.avatarUrl}
              onChange={handleProfileChange}
              placeholder="/avatar.jpg or https://…"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {avatarError && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <WarningIcon className="w-3.5 h-3.5 shrink-0" />
                {avatarError}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              maxLength={80}
              required
            />
          </div>
          <div>
            <label htmlFor="profile-handle" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Handle / Username
            </label>
            <input
              id="profile-handle"
              type="text"
              name="handle"
              value={profile.handle}
              onChange={handleProfileChange}
              placeholder="e.g. @alexrivera"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              maxLength={60}
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-bio" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Bio Description
          </label>
          <textarea
            id="profile-bio"
            name="bio"
            rows={3}
            value={profile.bio}
            onChange={handleProfileChange}
            placeholder="Tell your visitors about yourself, what you build, or links you share…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            maxLength={400}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label htmlFor="profile-location" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Location
            </label>
            <input
              id="profile-location"
              type="text"
              name="location"
              value={profile.location || ''}
              onChange={handleProfileChange}
              placeholder="e.g. San Francisco, CA"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              maxLength={80}
            />
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <label htmlFor="profile-verified" className="text-xs font-semibold text-white block cursor-pointer">
                Verified Badge
              </label>
              <span className="text-[10px] text-slate-400">Shows the checkmark on your avatar</span>
            </div>
            <input
              id="profile-verified"
              type="checkbox"
              name="verified"
              checked={profile.verified}
              onChange={handleProfileChange}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Socials */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Social Links ({socials.length})
            </h4>
            <p className="text-[11px] text-slate-500">Shown as a row of icons under your bio</p>
          </div>
          <button
            type="button"
            onClick={handleAddSocial}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold shrink-0"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add Social</span>
          </button>
        </div>

        {socials.length > 0 ? (
          <ul className="space-y-2.5">
            {socials.map((social, idx) => {
              const key = keys[idx] ?? createSocialId();
              const urlInvalid = Boolean(social.url.trim()) && !isSafeUrl(social.url);
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                    <SocialIcon platform={social.platform} className="w-4 h-4" />
                  </div>

                  <select
                    value={social.platform}
                    onChange={(e) =>
                      handleSocialPlatformChange(idx, e.target.value as SocialPlatform)
                    }
                    aria-label={`Social platform for row ${idx + 1}`}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-medium max-w-[7.5rem] shrink-0"
                  >
                    {AVAILABLE_PLATFORMS.map((plat) => (
                      <option key={plat} value={plat}>
                        {PLATFORM_LABEL[plat]}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    inputMode="url"
                    value={social.url}
                    onChange={(e) => handleSocialUrlChange(idx, e.target.value)}
                    placeholder="https://…"
                    aria-label={`${PLATFORM_LABEL[social.platform]} URL`}
                    aria-invalid={urlInvalid || undefined}
                    className={`flex-1 min-w-0 bg-slate-900 border rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono ${
                      urlInvalid
                        ? 'border-rose-700 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveSocial(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                    title="Remove social link"
                    aria-label={`Remove ${PLATFORM_LABEL[social.platform]} link`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">
            No social links yet. Add one to show icons under your bio.
          </p>
        )}
      </div>
    </div>
  );
};