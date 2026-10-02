import React, { useRef } from 'react';
import { ProfileData, SocialLink, SocialPlatform } from '../../types/linktree';
import { SocialIcon } from '../icons/SocialSvgIcons';
import { TrashIcon, PlusIcon, CameraIcon } from '../icons/UiSvgIcons';

interface ProfileEditorTabProps {
  profile: ProfileData;
  socials: SocialLink[];
  onUpdateProfile: (updatedProfile: ProfileData) => void;
  onUpdateSocials: (updatedSocials: SocialLink[]) => void;
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

export const ProfileEditorTab: React.FC<ProfileEditorTabProps> = ({
  profile,
  socials,
  onUpdateProfile,
  onUpdateSocials,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    onUpdateProfile({
      ...profile,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize and compress avatar to max 256x256
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        // Cover fill aspect ratio
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        if (ctx) {
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateProfile({
            ...profile,
            avatarUrl: compressedDataUrl,
          });
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSocialUrlChange = (index: number, url: string) => {
    const nextSocials = [...socials];
    nextSocials[index] = { ...nextSocials[index], url };
    onUpdateSocials(nextSocials);
  };

  const handleSocialPlatformChange = (index: number, platform: SocialPlatform) => {
    const nextSocials = [...socials];
    nextSocials[index] = { ...nextSocials[index], platform };
    onUpdateSocials(nextSocials);
  };

  const handleAddSocial = () => {
    onUpdateSocials([...socials, { platform: 'github', url: 'https://' }]);
  };

  const handleRemoveSocial = (index: number) => {
    const nextSocials = socials.filter((_, i) => i !== index);
    onUpdateSocials(nextSocials);
  };

  return (
    <div className="space-y-6 text-slate-200 text-sm">
      {/* Basic Profile Details */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Profile Information
        </h4>

        {/* Avatar Photo Picker & URL */}
        <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
          <div className="relative group shrink-0">
            <div className="w-18 h-18 rounded-full overflow-hidden bg-slate-800 border-2 border-indigo-500/50 flex items-center justify-center shadow-md">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-400 font-bold">GT</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-transform active:scale-90"
              title="Upload photo from phone"
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-white">Avatar Photo</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Upload from phone &rarr;
              </button>
            </div>
            <input
              type="text"
              name="avatarUrl"
              value={profile.avatarUrl}
              onChange={handleProfileChange}
              placeholder="/avatar.jpg or https://..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Display Name & Handle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Handle / Username
            </label>
            <input
              type="text"
              name="handle"
              value={profile.handle}
              onChange={handleProfileChange}
              placeholder="e.g. @alexrivera"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Bio Description
          </label>
          <textarea
            name="bio"
            rows={3}
            value={profile.bio}
            onChange={handleProfileChange}
            placeholder="Tell your visitors about yourself, what you build, or links you share..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
          />
        </div>

        {/* Location & Verified Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location</label>
            <input
              type="text"
              name="location"
              value={profile.location || ''}
              onChange={handleProfileChange}
              placeholder="e.g. San Francisco, CA"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Verified Badge</span>
              <span className="text-[10px] text-slate-400">Shows verification checkmark</span>
            </div>
            <input
              type="checkbox"
              name="verified"
              checked={profile.verified}
              onChange={handleProfileChange}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Social Accounts Section */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Social Links ({socials.length})
            </h4>
            <p className="text-[11px] text-slate-500">Rendered with crisp SVG vector icons</p>
          </div>
          <button
            type="button"
            onClick={handleAddSocial}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add Social</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {socials.map((social, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5"
            >
              {/* Platform Selector with Live SVG Icon */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                  <SocialIcon platform={social.platform} className="w-4 h-4" />
                </div>
                <select
                  value={social.platform}
                  onChange={(e) =>
                    handleSocialPlatformChange(idx, e.target.value as SocialPlatform)
                  }
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 capitalize font-medium"
                >
                  {AVAILABLE_PLATFORMS.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL Input */}
              <input
                type="text"
                value={social.url}
                onChange={(e) => handleSocialUrlChange(idx, e.target.value)}
                placeholder="https://..."
                className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemoveSocial(idx)}
                className="p-2 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                title="Remove social link"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
