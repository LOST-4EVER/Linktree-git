import React, { useMemo } from 'react';
import { ThemeConfig, ButtonStyleType, TextColorType } from '../../types/linktree';
import { THEME_PRESETS } from '../../data/defaultProfile';
import { PaletteIcon, CheckIcon, WarningIcon } from '../icons/UiSvgIcons';
import { isSafeCssValue } from '../../utils/data';

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

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export const ThemeEditorTab: React.FC<ThemeEditorTabProps> = ({ theme, onUpdateTheme }) => {
  const isValidHex = HEX_PATTERN.test(theme.accentColor.trim());
  const isValidBackground = isSafeCssValue(theme.backgroundValue);

  /** Applies a preset wholesale, including the preset id. */
  const handlePresetSelect = (preset: (typeof THEME_PRESETS)[number]) => {
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

  // Any manual tweak detaches the theme from its preset so the UI can say so.
  const update = (updates: Partial<ThemeConfig>) =>
    onUpdateTheme({ ...theme, ...updates, preset: 'custom' });

  // Rough luminance check so we can warn about unreadable text/background pairs.
  const contrastWarning = useMemo(() => {
    const bg = theme.backgroundValue;
    // Only solid fills and linear-gradient's final stop are easy to reason about.
    const isLightBackground =
      /^#(f|e|d|c)/i.test(bg.trim()) ||
      /linear-gradient\([^)]*,\s*#(f|e|d|c)/i.test(bg);
    if (isLightBackground && theme.textColor !== 'dark') {
      return 'This background looks light. Switch text to “Dark” for readable contrast.';
    }
    if (!isLightBackground && theme.textColor === 'dark' && !/^#0/.test(bg.trim())) {
      return 'This background looks dark. Light text is usually more readable.';
    }
    return null;
  }, [theme.backgroundValue, theme.textColor]);

  return (
    <div className="space-y-6 text-slate-200 text-sm">
      {/* Presets */}
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
                aria-pressed={isSelected}
                className={`relative p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-slate-900 shadow-md'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-full h-8 rounded-lg mb-2 border border-white/10"
                  style={{ background: p.backgroundValue }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-200 truncate">{p.name}</span>
                  {isSelected && <CheckIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {theme.preset === 'custom' && (
          <p className="text-[11px] text-amber-400/90">
            Custom theme — pick a preset above to start from a known-good style.
          </p>
        )}
      </div>

      {/* Button styling */}
      <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Button Styling
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {(['glass', 'rounded', 'pill'] as ButtonStyleType[]).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => update({ buttonStyle: style })}
              aria-pressed={theme.buttonStyle === style}
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

      {/* Accent colour */}
      <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Accent Colour
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {ACCENT_SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => update({ accentColor: hex })}
              aria-label={`Use accent colour ${hex}`}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                theme.accentColor.toLowerCase() === hex
                  ? 'scale-110 border-white ring-2 ring-indigo-500'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}

          <div className="flex items-center gap-1.5 ml-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <input
              type="color"
              value={isValidHex ? theme.accentColor : DEFAULT_HEX}
              onChange={(e) => update({ accentColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
              aria-label="Pick an accent colour"
            />
            <input
              type="text"
              value={theme.accentColor}
              onChange={(e) => update({ accentColor: e.target.value })}
              aria-invalid={!isValidHex}
              aria-label="Accent colour hex value"
              className={`w-20 bg-transparent text-xs font-mono focus:outline-none ${
                isValidHex ? 'text-slate-200' : 'text-rose-400'
              }`}
              spellCheck={false}
            />
          </div>
        </div>
        {!isValidHex && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1">
            <WarningIcon className="w-3.5 h-3.5 shrink-0" />
            Enter a hex colour like #6366f1. Invalid values fall back to indigo.
          </p>
        )}
      </div>

      {/* Background */}
      <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Custom Background (CSS)
        </h4>
        <input
          type="text"
          value={theme.backgroundValue}
          onChange={(e) => update({ backgroundValue: e.target.value })}
          placeholder="linear-gradient(135deg, #0f172a, #1e1b4b)"
          aria-invalid={!isValidBackground}
          aria-label="Background CSS value"
          spellCheck={false}
          className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none ${
            isValidBackground
              ? 'border-slate-800 text-slate-200 focus:border-indigo-500'
              : 'border-rose-700 text-rose-300'
          }`}
        />
        <p className="text-[11px] text-slate-500 leading-snug">
          Accepts any CSS gradient or colour. Values containing <code>url()</code> or CSS
          statements are rejected.
        </p>
        {contrastWarning && (
          <p className="text-[11px] text-amber-400/90 flex items-start gap-1">
            <WarningIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
            {contrastWarning}
          </p>
        )}
      </div>

      {/* Typography + contrast */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
        <div>
          <label
            htmlFor="theme-font"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
          >
            Typography
          </label>
          <select
            id="theme-font"
            value={theme.fontFamily}
            onChange={(e) => update({ fontFamily: e.target.value as ThemeConfig['fontFamily'] })}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="sans">Modern Sans-Serif</option>
            <option value="serif">Editorial Serif</option>
            <option value="mono">Clean Monospace</option>
          </select>
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Text Luminance
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {(['light', 'dark'] as TextColorType[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ textColor: value })}
                aria-pressed={theme.textColor === value}
                className={`py-1.5 px-2 rounded-lg text-xs border capitalize ${
                  theme.textColor === value
                    ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inline preview */}
      <div className="pt-4 border-t border-slate-800/80">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Preview
        </span>
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-3 border border-slate-800"
          style={{
            background: isValidBackground ? theme.backgroundValue : '#1e293b',
            color: theme.textColor === 'dark' ? '#0f172a' : '#f8fafc',
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg"
            style={{ backgroundColor: isValidHex ? theme.accentColor : DEFAULT_HEX }}
          >
            GT
          </div>
          <p className="text-sm font-bold">Your Name</p>
          <p className="text-[11px] opacity-75">@yourhandle</p>
          <div
            className={`w-full max-w-[15rem] px-4 py-3 text-xs font-semibold ${
              theme.buttonStyle === 'pill'
                ? 'rounded-full'
                : theme.buttonStyle === 'rounded'
                  ? 'rounded-xl'
                  : 'rounded-2xl'
            }`}
            style={{
              background:
                theme.buttonStyle === 'glass'
                  ? 'rgba(255,255,255,0.12)'
                  : theme.textColor === 'dark'
                    ? 'rgba(15,23,42,0.9)'
                    : 'rgba(15,23,42,0.85)',
              border: `1px solid ${isValidHex ? theme.accentColor : DEFAULT_HEX}66`,
            }}
          >
            Sample Link Button
          </div>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_HEX = '#6366f1';