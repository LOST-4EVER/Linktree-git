import { LinktreeData } from '../types/linktree';
import { normalizeLinktreeData, toPublishableData } from './data';

/**
 * Escapes text for safe interpolation into HTML text nodes and attributes.
 * Without this, a bio containing `<script>` becomes live markup.
 */
function escapeHtml(value: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serializes data for embedding inside a <script> block.
 * `</script>` inside a string literal terminates the block early, and the JS
 * engine then chokes on the rest of the document, so `<` is escaped as a
 * unicode escape. Same for U+2028/U+2029, which are invalid in JS strings.
 */
function serializeForScript(value: unknown): string {
  return JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Generates the complete, self-contained single-file `index.html` Linktree alternative
 * using HTML5, Tailwind CSS (via CDN), and Vanilla JavaScript.
 */
export function generateStandaloneHtml(rawData: LinktreeData): string {
  // Normalize first: the exported page renders without the React runtime's
  // safety nets, so it must not depend on a well-formed payload.
  const initialData = toPublishableData(normalizeLinktreeData(rawData));
  const serializedInitial = serializeForScript(initialData);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(initialData.profile.name || 'Linktree Alternative')}</title>
  <meta name="description" content="${escapeHtml(initialData.profile.bio || 'Linktree alternative')}">
  <meta property="og:title" content="${escapeHtml(initialData.profile.name || 'Linktree Alternative')}">
  <meta property="og:description" content="${escapeHtml(initialData.profile.bio || 'Linktree alternative')}">
  <meta property="og:type" content="profile">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#0f172a">
  <!-- Tailwind CSS v4 browser build: the v3 Play CDN is deprecated and would
       render the custom utilities below incorrectly. -->
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    /* Smooth transition for theme backgrounds and glassmorphism */
    .glass-surface {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    /* Custom scrollbars */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.6); }
    ::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.5); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.8); }
    /* Touch optimization */
    button, a { touch-action: manipulation; }
    /* Honor reduced-motion preferences */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body class="min-h-screen antialiased transition-colors duration-500 flex flex-col justify-between selection:bg-indigo-500/30">

  <!-- ========================================================================= -->
  <!-- 1. PUBLIC VIEW (Default for all visitors - Read-only with secret gesture) -->
  <!-- ========================================================================= -->
  <main id="app-root" class="w-full flex-1 flex flex-col items-center justify-between p-4 sm:p-8">
    <div class="w-full max-w-md mx-auto my-auto flex flex-col items-center pt-6 sm:pt-8 pb-10 sm:pb-12">
      <!-- Avatar & Verified Badge (Secret Triple-Tap trigger for owner on phone) -->
      <div id="avatar-trigger" class="relative mb-5 group cursor-pointer select-none">
        <div id="avatar-container" class="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 transition-transform duration-300 hover:scale-105 active:scale-95 shadow-xl">
          <img id="profile-avatar" src="" alt="Avatar" class="w-full h-full rounded-full object-cover bg-slate-800" onerror="handleAvatarError()">
          <div id="profile-avatar-fallback" class="hidden w-full h-full rounded-full flex items-center justify-center font-bold text-2xl text-white select-none"></div>
        </div>
        <div id="verified-badge" class="hidden absolute bottom-1 right-1 p-1 rounded-full shadow-md text-white flex items-center justify-center">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 2.25A2.25 2.25 0 0 0 6.643 3.6L5.34 6.222a2.25 2.25 0 0 1-1.258 1.055L1.31 8.01a2.25 2.25 0 0 0-1.488 2.378l.386 2.903a2.25 2.25 0 0 1-.223 1.625l-1.303 2.622a2.25 2.25 0 0 0 .574 2.748l2.27 1.874a2.25 2.25 0 0 1 .74 1.468l.42 2.898a2.25 2.25 0 0 0 2.227 1.933l2.926-.062a2.25 2.25 0 0 1 1.572.583l2.17 1.988a2.25 2.25 0 0 0 2.793.136l2.368-1.748a2.25 2.25 0 0 1 1.636-.376l2.909.43a2.25 2.25 0 0 0 2.457-1.626l.904-2.788a2.25 2.25 0 0 1 1.052-1.261l2.624-1.3a2.25 2.25 0 0 0 1.074-2.604l-.865-2.8a2.25 2.25 0 0 1 .082-1.638l1.378-2.584a2.25 2.25 0 0 0-.67-2.727l-2.34-1.785a2.25 2.25 0 0 1-.784-1.445l-.337-2.909a2.25 2.25 0 0 0-2.288-1.99l-2.927.135a2.25 2.25 0 0 1-1.597-.512L15.357.653a2.25 2.25 0 0 0-2.806-.06L10.24 2.247a2.25 2.25 0 0 1-1.64.003zM16.28 9.22a.75.75 0 0 0-1.06-1.06l-4.72 4.72-1.72-1.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l5.25-5.25z"/></svg>
        </div>
      </div>

      <!-- Identity -->
      <div class="text-center mb-6 px-4">
        <h1 id="profile-name" class="text-xl sm:text-2xl font-bold tracking-tight mb-1"></h1>
        <p id="profile-handle" class="text-xs sm:text-sm font-medium tracking-wide mb-3 opacity-80"></p>
        <p id="profile-bio" class="text-xs sm:text-sm leading-relaxed max-w-sm mx-auto opacity-90"></p>
      </div>

      <!-- Socials Row (SVG Icons) -->
      <nav id="socials-container" class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mb-7 sm:mb-8"></nav>

      <!-- Custom Links Stack -->
      <section id="links-container" class="w-full flex flex-col gap-3 px-1 sm:px-2"></section>
    </div>

    <!-- Quiet Public Footer (Secret tap also supported) -->
    <footer id="profile-footer" class="w-full text-center py-4 text-xs font-mono opacity-40 select-none cursor-pointer"></footer>
  </main>

  <!-- ==================================================== -->
  <!-- 2. SECRET ADMIN DRAWER (Only via ?admin=true or keys) -->
  <!-- ==================================================== -->
  <aside id="admin-drawer" class="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800 z-50 transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col max-h-screen">
    <!-- Mobile Top Drag Bar -->
    <div class="sm:hidden w-full flex justify-center pt-2.5 pb-1 bg-slate-900/80">
      <div class="w-10 h-1 rounded-full bg-slate-700"></div>
    </div>

    <!-- Drawer Header -->
    <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <h2 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Admin Console</h2>
          <span class="text-[10px] text-slate-400">Triple-tap avatar or <code class="text-indigo-300">?admin=true</code></span>
        </div>
      </div>
      <button id="close-admin-btn" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Admin Navigation Tabs -->
    <nav class="grid grid-cols-4 border-b border-slate-800 bg-slate-900/40 text-xs shrink-0">
      <button data-tab="links" class="admin-tab py-3 px-1 font-semibold text-center text-indigo-400 border-b-2 border-indigo-500">Links</button>
      <button data-tab="profile" class="admin-tab py-3 px-1 font-medium text-center text-slate-400 hover:text-slate-200">Profile</button>
      <button data-tab="theme" class="admin-tab py-3 px-1 font-medium text-center text-slate-400 hover:text-slate-200">Theme</button>
      <button data-tab="github" class="admin-tab py-3 px-1 font-medium text-center text-slate-400 hover:text-slate-200">GitHub</button>
    </nav>

    <!-- Scrollable Tab Content Panes -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      <!-- TAB 1: LINKS CRUD -->
      <section id="tab-links" class="admin-pane space-y-4">
        <div class="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white">Custom Links</h4>
            <p class="text-[11px] text-slate-400">Reorder, feature, and edit buttons</p>
          </div>
          <button id="add-link-btn" class="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition-transform">+ Add Link</button>
        </div>
        <div id="admin-links-list" class="space-y-2.5"></div>
      </section>

      <!-- TAB 2: PROFILE & BIO -->
      <section id="tab-profile" class="admin-pane hidden space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Display Name</label>
          <input id="input-name" type="text" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Handle / Username</label>
          <input id="input-handle" type="text" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Bio</label>
          <textarea id="input-bio" rows="3" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"></textarea>
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Avatar URL</label>
          <input id="input-avatar" type="text" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500">
        </div>
        <div class="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <label for="input-verified" class="text-xs font-semibold text-slate-300 cursor-pointer">Show Verified Badge</label>
          <input id="input-verified" type="checkbox" class="w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-600">
        </div>
      </section>

      <!-- TAB 3: THEME & STYLES -->
      <section id="tab-theme" class="admin-pane hidden space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Background Gradient/Color (CSS)</label>
          <input id="input-bg" type="text" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Button Style</label>
          <select id="select-button-style" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
            <option value="glass">Glassmorphic</option>
            <option value="rounded">Rounded Box</option>
            <option value="pill">Pill (Fully Rounded)</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Accent Color (Hex)</label>
          <div class="flex items-center gap-2">
            <input id="input-accent-picker" type="color" class="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer">
            <input id="input-accent-hex" type="text" class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500">
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Text Contrast</label>
          <select id="select-text-color" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
            <option value="light">Light Text (For dark backgrounds)</option>
            <option value="dark">Dark Text (For light backgrounds)</option>
          </select>
        </div>
      </section>

      <!-- TAB 4: GITHUB SYNC -->
      <section id="tab-github" class="admin-pane hidden space-y-4 text-xs">
        <div class="bg-indigo-950/40 border border-indigo-900/60 rounded-xl p-3.5 text-indigo-300 leading-relaxed">
          Sync updates directly to your GitHub repository using GitHub Contents API.
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Personal Access Token (PAT) *</label>
          <input id="input-gh-token" type="password" placeholder="ghp_..." class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500">
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5">Owner (User/Org) *</label>
            <input id="input-gh-owner" type="text" placeholder="octocat" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5">Repo Name *</label>
            <input id="input-gh-repo" type="text" placeholder="linktree" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5">Branch</label>
            <input id="input-gh-branch" type="text" value="main" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5">Target File</label>
            <input id="input-gh-path" type="text" value="data.json" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500">
          </div>
        </div>
        <button id="save-gh-creds-btn" class="w-full py-3 bg-slate-800 hover:bg-slate-750 active:scale-[0.99] text-slate-200 rounded-xl font-medium transition-all">
          Save Credentials Locally
        </button>
      </section>
    </div>

    <!-- Drawer Footer Actions (Thumb Zone) -->
    <div class="p-4 border-t border-slate-800 bg-slate-900/95 space-y-2.5 shrink-0">
      <div id="publish-status-banner" class="hidden p-3 rounded-xl text-xs"></div>
      <button id="publish-to-github-btn" class="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px]">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 16l-4-4-4 4"/><path d="M12 12v9"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg>
        <span>Publish to GitHub (Commit data.json)</span>
      </button>
    </div>
  </aside>

  <!-- ========================================== -->
  <!-- 3. VANILLA JAVASCRIPT APPLICATION LOGIC   -->
  <!-- ========================================== -->
  <script>
    // Built-in fallback profile data
    const DEFAULT_DATA = ${serializedInitial};

    // Global in-memory state with fast local storage restore
    let state = (() => {
      const cached = localStorage.getItem('gittree_data_cache');
      if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
      }
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    })();

    let githubConfig = {
      token: localStorage.getItem('gittree_token') || '',
      owner: localStorage.getItem('gittree_owner') || '',
      repo: localStorage.getItem('gittree_repo') || '',
      branch: localStorage.getItem('gittree_branch') || 'main',
      filePath: localStorage.getItem('gittree_path') || 'data.json'
    };

    // Vector SVG Icons Registry
    const SVG_ICONS = {
      globe: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      github: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>',
      twitter: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
      linkedin: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.8v8.37h-2.8v-8.37M7.86 6.5a1.63 1.63 0 1 0 0 3.25 1.63 1.63 0 0 0 0-3.25z"/></svg>',
      youtube: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
      discord: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
      email: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
      article: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>',
      calendar: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      newsletter: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      external: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
    };

    function utf8ToBase64(str) {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
      }
      return window.btoa(binary);
    }

    /* Only http/https/mailto/tel may become an href. Anything else
       (javascript:, data:) is rendered as inert text instead. */
    const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

    function safeUrl(raw) {
      const value = String(raw == null ? '' : raw).trim();
      if (!value) return null;
      if (value.startsWith('/') || value.startsWith('#')) return value;
      const match = /^([a-z][a-z0-9+.-]*):/i.exec(value);
      if (!match) return 'https://' + value;
      return SAFE_PROTOCOLS.indexOf(match[1].toLowerCase() + ':') !== -1 ? value : null;
    }

    /* Escapes text before it is placed into innerHTML. */
    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function displayHost(raw) {
      const safe = safeUrl(raw);
      if (!safe || safe.charAt(0) === '/' || safe.charAt(0) === '#') return '';
      try {
        return new URL(safe).hostname.replace(/^www\\./, '');
      } catch (e) {
        return '';
      }
    }

    function initials(name) {
      const source = String(name || '').trim();
      if (!source) return 'GT';
      return source.split(/\\s+/).filter(Boolean).map(function (p) { return p.charAt(0); })
        .slice(0, 2).join('').toUpperCase();
    }

    function renderPublic() {
      const { profile, socials, links, theme } = state;
      const isDark = theme.textColor !== 'dark';

      document.body.style.background = theme.backgroundValue;
      document.body.style.color = isDark ? '#f8fafc' : '#0f172a';

      const avatarEl = document.getElementById('profile-avatar');
      const fallbackEl = document.getElementById('profile-avatar-fallback');
      const containerEl = document.getElementById('avatar-container');
      
      containerEl.style.background = 'linear-gradient(135deg, ' + theme.accentColor + ', ' + theme.accentColor + '44)';

      if (profile.avatarUrl) {
        // Only render the img when the source is a plausible image reference.
        if (/^(https?:|data:image)/i.test(profile.avatarUrl) || profile.avatarUrl.charAt(0) === '/') {
          avatarEl.src = profile.avatarUrl;
          avatarEl.alt = profile.name || 'Avatar';
          avatarEl.classList.remove('hidden');
          fallbackEl.classList.add('hidden');
        } else {
          avatarEl.classList.add('hidden');
          fallbackEl.classList.remove('hidden');
          fallbackEl.style.backgroundColor = theme.accentColor;
          fallbackEl.textContent = initials(profile.name);
        }
      } else {
        avatarEl.classList.add('hidden');
        fallbackEl.classList.remove('hidden');
        fallbackEl.style.backgroundColor = theme.accentColor;
        fallbackEl.textContent = initials(profile.name);
      }

      const badgeEl = document.getElementById('verified-badge');
      if (profile.verified) {
        badgeEl.classList.remove('hidden');
        badgeEl.style.backgroundColor = theme.accentColor;
      } else {
        badgeEl.classList.add('hidden');
      }

      document.getElementById('profile-name').textContent = profile.name;
      document.getElementById('profile-handle').textContent = profile.handle + (profile.location ? ' · ' + profile.location : '');
      document.getElementById('profile-bio').textContent = profile.bio || '';
      document.getElementById('profile-footer').textContent = profile.name || 'GitTree';

      const socialsContainer = document.getElementById('socials-container');
      socialsContainer.innerHTML = '';
      (socials || []).forEach(social => {
        if (!social || !social.url) return;
        const href = safeUrl(social.url);
        const surface = theme.buttonStyle === 'glass'
          ? 'p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
          : 'p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 bg-slate-900/80 hover:bg-slate-800 text-slate-200';
        const label = escapeHtml(social.platform) + (displayHost(social.url) ? ' — ' + escapeHtml(displayHost(social.url)) : '');
        const icon = SVG_ICONS[social.platform] || SVG_ICONS.globe;

        // An unsafe URL renders as an inert, visibly-disabled chip.
        if (!href) {
          const span = document.createElement('span');
          span.className = surface + ' opacity-40 cursor-not-allowed';
          span.title = label + ' (invalid link)';
          span.setAttribute('aria-disabled', 'true');
          span.innerHTML = icon;
          socialsContainer.appendChild(span);
          return;
        }

        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = surface;
        a.setAttribute('aria-label', label);
        a.title = label;
        a.innerHTML = icon;
        socialsContainer.appendChild(a);
      });

      const linksContainer = document.getElementById('links-container');
      linksContainer.innerHTML = '';
      (links || []).filter(function (l) { return l && l.active !== false; }).forEach(link => {
        const href = safeUrl(link.url);
        const accent = link.customAccent || theme.accentColor;

        let radius = 'rounded-2xl';
        if (theme.buttonStyle === 'pill') radius = 'rounded-full';
        if (theme.buttonStyle === 'rounded') radius = 'rounded-xl';

        const surface = theme.buttonStyle === 'glass'
          ? (isDark ? 'bg-white/10 hover:bg-white/15 border border-white/15 text-white' : 'bg-white/80 hover:bg-white border border-slate-200 text-slate-900')
          : (isDark ? 'bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-100' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-900');

        const classes = 'group relative flex items-center justify-between w-full px-4 sm:px-5 py-3.5 sm:py-4 transition-all duration-200 transform hover:-translate-y-0.5 min-h-[56px] ' + radius + ' ' + surface;

        const iconHtml = SVG_ICONS[link.icon] || SVG_ICONS.globe;
        const highlightHtml = link.highlight
          ? '<span class="absolute -top-2 right-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shadow-sm" style="background-color: ' + escapeHtml(accent) + '">' + escapeHtml(link.badgeText || 'Featured') + '</span>'
          : '';

        // Every interpolated value is escaped: title, subtitle and badge text
        // are user-authored and would otherwise be parsed as markup.
        const inner =
          highlightHtml +
          '<div class="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl" style="background-color: ' + escapeHtml(accent) + '1a">' + iconHtml + '</div>' +
          '<div class="flex-1 min-w-0 mx-3 sm:mx-4 text-center">' +
            '<h3 class="text-xs sm:text-sm font-semibold truncate">' + escapeHtml(link.title || 'Untitled') + '</h3>' +
            (link.subtitle ? '<p class="text-[11px] sm:text-xs truncate opacity-70 mt-0.5">' + escapeHtml(link.subtitle) + '</p>' : '') +
          '</div>' +
          '<div class="flex items-center justify-center w-6 h-6 shrink-0 opacity-40 group-hover:opacity-100">' + SVG_ICONS.external + '</div>';

        const host = displayHost(link.url);
        const title = escapeHtml(link.title || 'Untitled') + (host ? ' — ' + escapeHtml(host) : '');

        const el = document.createElement(href ? 'a' : 'div');
        if (href) {
          el.href = href;
          el.target = '_blank';
          el.rel = 'noopener noreferrer';
          el.title = title;
        } else {
          el.className += ' cursor-not-allowed opacity-60';
          el.title = title + ' (invalid link)';
          el.setAttribute('aria-disabled', 'true');
        }
        el.className = classes;
        el.innerHTML = inner;

        if (link.highlight) {
          el.style.borderColor = accent + '88';
          el.style.boxShadow = '0 10px 25px -5px ' + accent + '25';
        }
        el.onmouseenter = function () {
          el.style.borderColor = accent + '99';
          el.style.boxShadow = '0 10px 25px -5px ' + accent + '33';
        };
        el.onmouseleave = function () {
          if (link.highlight) {
            el.style.borderColor = accent + '88';
            el.style.boxShadow = '0 10px 25px -5px ' + accent + '25';
          } else {
            el.style.borderColor = '';
            el.style.boxShadow = '';
          }
        };

        linksContainer.appendChild(el);
      });
    }

    function handleAvatarError() {
      const avatarEl = document.getElementById('profile-avatar');
      const fallbackEl = document.getElementById('profile-avatar-fallback');
      avatarEl.classList.add('hidden');
      fallbackEl.classList.remove('hidden');
      fallbackEl.style.backgroundColor = state.theme.accentColor;
      fallbackEl.textContent = initials(state.profile.name);
    }

    // Secret Admin Drawer Controls
    const adminDrawer = document.getElementById('admin-drawer');

    function openAdmin() {
      adminDrawer.classList.remove('translate-x-full');
      populateAdminFields();
    }

    function closeAdmin() {
      adminDrawer.classList.add('translate-x-full');
    }

    document.getElementById('close-admin-btn').addEventListener('click', closeAdmin);

    // Tab Navigation
    document.querySelectorAll('.admin-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tab = tabBtn.getAttribute('data-tab');
        document.querySelectorAll('.admin-tab').forEach(btn => {
          btn.classList.remove('text-indigo-400', 'border-b-2', 'border-indigo-500');
          btn.classList.add('text-slate-400');
        });
        tabBtn.classList.add('text-indigo-400', 'border-b-2', 'border-indigo-500');
        tabBtn.classList.remove('text-slate-400');

        document.querySelectorAll('.admin-pane').forEach(p => p.classList.add('hidden'));
        document.getElementById('tab-' + tab).classList.remove('hidden');
      });
    });

    function populateAdminFields() {
      document.getElementById('input-name').value = state.profile.name || '';
      document.getElementById('input-handle').value = state.profile.handle || '';
      document.getElementById('input-bio').value = state.profile.bio || '';
      document.getElementById('input-avatar').value = state.profile.avatarUrl || '';
      document.getElementById('input-verified').checked = !!state.profile.verified;

      document.getElementById('input-bg').value = state.theme.backgroundValue || '';
      document.getElementById('select-button-style').value = state.theme.buttonStyle || 'glass';
      document.getElementById('input-accent-hex').value = state.theme.accentColor || '#6366f1';
      document.getElementById('input-accent-picker').value = state.theme.accentColor || '#6366f1';
      document.getElementById('select-text-color').value = state.theme.textColor || 'light';

      document.getElementById('input-gh-token').value = githubConfig.token;
      document.getElementById('input-gh-owner').value = githubConfig.owner;
      document.getElementById('input-gh-repo').value = githubConfig.repo;
      document.getElementById('input-gh-branch').value = githubConfig.branch;
      document.getElementById('input-gh-path').value = githubConfig.filePath;

      renderAdminLinksList();
    }

    function renderAdminLinksList() {
      const listEl = document.getElementById('admin-links-list');
      listEl.innerHTML = '';
      (state.links || []).forEach((link, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs';
        // Titles and URLs are escaped: they are user-authored.
        row.innerHTML = 
          '<div class="flex-1 min-w-0 pr-2">' +
            '<div class="font-semibold text-white truncate">' + escapeHtml(link.title || 'Untitled') + '</div>' +
            '<div class="text-slate-500 truncate font-mono text-[10px]">' + escapeHtml(link.url || 'No URL') + '</div>' +
          '</div>' +
          '<div class="flex items-center gap-1 shrink-0">' +
            '<button onclick="moveLink(' + idx + ', -1)" class="p-2 text-slate-400 hover:text-white disabled:opacity-20" title="Move Up" aria-label="Move up">↑</button>' +
            '<button onclick="moveLink(' + idx + ', 1)" class="p-2 text-slate-400 hover:text-white disabled:opacity-20" title="Move Down" aria-label="Move down">↓</button>' +
            '<button onclick="deleteLink(' + idx + ')" class="p-2 text-rose-400 hover:text-rose-300" title="Delete" aria-label="Delete">✕</button>' +
          '</div>';
        listEl.appendChild(row);
      });
    }

    window.moveLink = function(index, dir) {
      const target = index + dir;
      if (target < 0 || target >= state.links.length) return;
      const tmp = state.links[index];
      state.links[index] = state.links[target];
      state.links[target] = tmp;
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderAdminLinksList();
      renderPublic();
    };

    window.deleteLink = function(index) {
      state.links.splice(index, 1);
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderAdminLinksList();
      renderPublic();
    };

    document.getElementById('add-link-btn').addEventListener('click', () => {
      const title = prompt('Enter link title:');
      if (!title) return;
      const url = prompt('Enter destination URL:', 'https://');
      if (!url) return;
      state.links.unshift({
        id: 'link-' + Date.now(),
        title: title,
        url: url,
        icon: 'globe',
        highlight: false,
        active: true
      });
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderAdminLinksList();
      renderPublic();
    });

    ['input-name', 'input-handle', 'input-bio', 'input-avatar'].forEach(id => {
      document.getElementById(id).addEventListener('input', e => {
        const map = { 'input-name': 'name', 'input-handle': 'handle', 'input-bio': 'bio', 'input-avatar': 'avatarUrl' };
        state.profile[map[id]] = e.target.value;
        localStorage.setItem('gittree_data_cache', JSON.stringify(state));
        renderPublic();
      });
    });

    document.getElementById('input-verified').addEventListener('change', e => {
      state.profile.verified = e.target.checked;
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderPublic();
    });

    document.getElementById('input-bg').addEventListener('input', e => {
      state.theme.backgroundValue = e.target.value;
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderPublic();
    });

    document.getElementById('select-button-style').addEventListener('change', e => {
      state.theme.buttonStyle = e.target.value;
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderPublic();
    });

    document.getElementById('select-text-color').addEventListener('change', e => {
      state.theme.textColor = e.target.value;
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderPublic();
    });

    const accentPicker = document.getElementById('input-accent-picker');
    const accentHex = document.getElementById('input-accent-hex');
    accentPicker.addEventListener('input', e => {
      accentHex.value = e.target.value;
      state.theme.accentColor = e.target.value;
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderPublic();
    });
    accentHex.addEventListener('input', e => {
      accentPicker.value = e.target.value;
      state.theme.accentColor = e.target.value;
      localStorage.setItem('gittree_data_cache', JSON.stringify(state));
      renderPublic();
    });

    document.getElementById('save-gh-creds-btn').addEventListener('click', () => {
      githubConfig.token = document.getElementById('input-gh-token').value.trim();
      githubConfig.owner = document.getElementById('input-gh-owner').value.trim();
      githubConfig.repo = document.getElementById('input-gh-repo').value.trim();
      githubConfig.branch = document.getElementById('input-gh-branch').value.trim() || 'main';
      githubConfig.filePath = document.getElementById('input-gh-path').value.trim() || 'data.json';

      localStorage.setItem('gittree_token', githubConfig.token);
      localStorage.setItem('gittree_owner', githubConfig.owner);
      localStorage.setItem('gittree_repo', githubConfig.repo);
      localStorage.setItem('gittree_branch', githubConfig.branch);
      localStorage.setItem('gittree_path', githubConfig.filePath);

      showStatus('Credentials saved to localStorage!', 'success');
    });

    // GitHub Contents API Commit
    document.getElementById('publish-to-github-btn').addEventListener('click', async () => {
      const { token, owner, repo, branch, filePath } = githubConfig;

      if (!token || !owner || !repo) {
        showStatus('Please configure GitHub Token, Owner, and Repo in the GitHub tab first!', 'error');
        document.querySelector('[data-tab="github"]').click();
        return;
      }

      showStatus('Fetching repository file SHA...', 'info');

      try {
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        const getUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + cleanPath + '?ref=' + encodeURIComponent(branch);
        
        let existingSha = null;
        const getRes = await fetch(getUrl, {
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': 'Bearer ' + token,
            'X-GitHub-Api-Version': '2022-11-28'
          },
          signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
        });

        if (getRes.ok) {
          const fileData = await getRes.json();
          existingSha = fileData.sha;
        } else if (getRes.status !== 404) {
          throw new Error('Could not access repository: HTTP ' + getRes.status);
        }

        showStatus('Committing update to GitHub...', 'info');
        const jsonContent = JSON.stringify(state, null, 2);
        const base64Content = utf8ToBase64(jsonContent);

        const payload = {
          message: 'chore: update profile and links via GitTree [skip ci]',
          content: base64Content,
          branch: branch
        };

        if (existingSha) {
          payload.sha = existingSha;
        }

        const putUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + cleanPath;
        const putRes = await fetch(putUrl, {
          method: 'PUT',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
        }).catch(function (err) {
          if (err && err.message && err.message.indexOf('GitHub') !== -1) throw err;
          throw new Error('Could not reach the GitHub API. Check your connection and try again.');
        });

        if (!putRes.ok) {
          const errData = await putRes.json().catch(() => ({}));
          if (putRes.status === 409) {
            throw new Error('Conflict detected: data.json changed on GitHub at the same time. Reload and publish again.');
          } else if (putRes.status === 401) {
            throw new Error('Authentication failed (401). Check that your token is valid.');
          } else if (putRes.status === 403 && putRes.headers.get('x-ratelimit-remaining') === '0') {
            throw new Error('GitHub API rate limit reached. Try again in a few minutes.');
          }
          throw new Error(errData.message || 'GitHub commit failed (HTTP ' + putRes.status + ')');
        }

        const putResult = await putRes.json();
        showStatus('Committed successfully to GitHub!' + (putResult.commit?.html_url ? ' [View Commit](' + putResult.commit.html_url + ')' : ''), 'success');
      } catch (err) {
        showStatus(err.message || 'Commit failed.', 'error');
      }
    });

    function showStatus(msg, type) {
      const banner = document.getElementById('publish-status-banner');
      banner.classList.remove('hidden', 'bg-emerald-950', 'text-emerald-300', 'bg-rose-950', 'text-rose-300', 'bg-slate-800', 'text-slate-300');
      if (type === 'success') {
        banner.classList.add('bg-emerald-950', 'text-emerald-300', 'border', 'border-emerald-800');
      } else if (type === 'error') {
        banner.classList.add('bg-rose-950', 'text-rose-300', 'border', 'border-rose-800');
      } else {
        banner.classList.add('bg-slate-800', 'text-slate-300');
      }
      // The message may embed a commit link; anything else is escaped.
      banner.innerHTML = escapeHtml(msg).replace(
        /\\[([^\\]]+)\\]\\((https:\\/\\/[^)\\s]+)\\)/g,
        function (_match, label, url) {
          return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="underline">' + label + '</a>';
        }
      );
    }

    // Secret Mobile Triple-Tap Trigger
    let tapCount = 0;
    let lastTap = 0;
    function handleSecretTap() {
      const now = Date.now();
      if (now - lastTap < 500) {
        tapCount += 1;
      } else {
        tapCount = 1;
      }
      lastTap = now;

      if (tapCount >= 3) {
        tapCount = 0;
        if (adminDrawer.classList.contains('translate-x-full')) {
          openAdmin();
        } else {
          closeAdmin();
        }
      }
    }

    document.getElementById('avatar-trigger').addEventListener('click', handleSecretTap);
    document.getElementById('profile-footer').addEventListener('click', handleSecretTap);

    // URL parameter & shortcut
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      openAdmin();
    }

    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        if (adminDrawer.classList.contains('translate-x-full')) {
          openAdmin();
        } else {
          closeAdmin();
        }
      } else if (e.key === 'Escape' && !adminDrawer.classList.contains('translate-x-full')) {
        closeAdmin();
      }
    });

    async function initApp() {
      try {
        const res = await fetch('data.json');
        if (res.ok) {
          const json = await res.json();
          state = json;
          localStorage.setItem('gittree_data_cache', JSON.stringify(json));
        }
      } catch (e) {
        console.warn('Using cache/fallback profile', e);
      }
      renderPublic();
    }

    initApp();
  </script>
</body>
</html>`;
}
