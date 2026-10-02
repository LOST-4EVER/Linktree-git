import React from 'react';
import { ThemeConfig, ButtonStyleType, TextColorType } from '../../types/linktree';
import { THEME_PRESETS } from '../../data/defaultProfile';
import { PaletteIcon, CheckIcon } from '../icons/UiSvgIcons';

interface ThemeEditorTabProps {
  theme: ThemeConfig;
  onUpdateTheme: (theme: ThemeConfig) => void;
}

const ACCENT_SWATCHES = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ffffff', // White
];

export const ThemeEditorTab: React.FC<ThemeEditorTabProps> = ({ theme, onUpdateTheme }) => {
  const handlePresetSelect = (preset: (typeof THEME_PRESETS)[0]) => {
    onUpdateTheme({
      ...theme,
      preset: preset.id,
      backgroundType: preset.backgroundType,
      backgroundValue: preset.backgroundValue,
      buttonStyle: preset.buttonStyle,
      accentColor: preset.accentColor,
      textColor: preset.textColor,
    });
  };

  const handleButtonStyleChange = (buttonStyle: ButtonStyleType) => {
    onUpdateTheme({ ...theme, buttonStyle });
  };

  const handleTextColorChange = (textColor: TextColorType) => {
    onUpdateTheme({ ...theme, textColor });
  };

  const handleAccentChange = (accentColor: string) => {
    onUpdateTheme({ ...theme, accentColor });
  };

  const handleFontChange = (fontFamily: 'sans' | 'serif' | 'mono') => {
    onUpdateTheme({ ...theme, fontFamily });
  };

  const handleBackgroundChange = (backgroundValue: string) => {
    onUpdateTheme({ ...theme, backgroundValue });
  };

  return (
    <div className="space-y-6 text-slate-200 text-sm">
      {/* Preset Palettes */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <PaletteIcon className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Curated Theme Presets
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {THEME_PRESETS.map((p) => {
            const isSelected = theme.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className={`relative p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-slate-900 shadow-md'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                {/* Background miniature swatch */}
                <div
                  className="w-full h-8 rounded-lg mb-2 border border-white/10"
                  style={{ background: p.backgroundValue }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{p.name}</span>
                  {isSelected && <CheckIcon className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Button Appearance */}
      <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Button Styling
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {(['glass', 'rounded', 'pill'] as ButtonStyleType[]).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => handleButtonStyleChange(style)}
              className={`py-2 px-3 text-xs capitalize rounded-lg border transition-all ${
                theme.buttonStyle === style
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 font-semibold'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {style === 'glass' ? 'Glassmorphic' : style}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Picker */}
      <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Dynamic Accent Color
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {ACCENT_SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => handleAccentChange(hex)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                theme.accentColor.toLowerCase() === hex.toLowerCase()
                  ? 'scale-110 border-white ring-2 ring-indigo-500'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}

          {/* Custom Hex Input */}
          <div className="flex items-center gap-1.5 ml-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <input
              type="color"
              value={theme.accentColor}
              onChange={(e) => handleAccentChange(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
            />
            <input
              type="text"
              value={theme.accentColor}
              onChange={(e) => handleAccentChange(e.target.value)}
              className="w-16 bg-transparent text-xs text-slate-200 font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Custom Background CSS */}
      <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Custom Background (CSS)
        </h4>
        <input
          type="text"
          value={theme.backgroundValue}
          onChange={(e) => handleBackgroundChange(e.target.value)}
          placeholder="linear-gradient(...) or #0f172a"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
        />
        <p className="text-[11px] text-slate-500">
          Accepts any valid CSS background gradient, hex color, or radial effect.
        </p>
      </div>

      {/* Font & Contrast */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Typography
          </label>
          <select
            value={theme.fontFamily}
            onChange={(e) =>
              handleFontChange(e.target.value as 'sans' | 'serif' | 'mono')
            }
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="sans">Modern Sans-Serif</option>
            <option value="serif">Editorial Serif</option>
            <option value="mono">Clean Monospace</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Text Luminance
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleTextColorChange('light')}
              className={`py-1.5 px-2 rounded-lg text-xs border ${
                theme.textColor === 'light'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              Light Text
            </button>
            <button
              type="button"
              onClick={() => handleTextColorChange('dark')}
              className={`py-1.5 px-2 rounded-lg text-xs border ${
                theme.textColor === 'dark'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              Dark Text
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
