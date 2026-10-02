import { LinktreeData } from '../types/linktree';

export const DEFAULT_LINKTREE_DATA: LinktreeData = {
  profile: {
    name: "Alex Rivera",
    handle: "@alexrivera",
    bio: "Full-Stack Engineer & Open Source Builder. Crafting modern developer tools, resilient web architecture, and accessible digital products.",
    avatarUrl: "/avatar.jpg",
    verified: true,
    location: "San Francisco, CA"
  },
  socials: [
    { platform: "github", url: "https://github.com" },
    { platform: "twitter", url: "https://x.com" },
    { platform: "linkedin", url: "https://linkedin.com" },
    { platform: "youtube", url: "https://youtube.com" },
    { platform: "discord", url: "https://discord.com" },
    { platform: "email", url: "mailto:hello@alexrivera.dev" }
  ],
  links: [
    {
      id: "link-1",
      title: "Latest Open Source Project",
      subtitle: "High-performance reactive data visualizer",
      url: "https://github.com",
      icon: "github",
      highlight: true,
      active: true
    },
    {
      id: "link-2",
      title: "Engineering Blog & Technical Writing",
      subtitle: "Deep-dives into systems & frontend architecture",
      url: "https://medium.com",
      icon: "article",
      highlight: false,
      active: true
    },
    {
      id: "link-3",
      title: "Interactive Portfolio & Case Studies",
      subtitle: "Explore production applications and client work",
      url: "https://example.com",
      icon: "globe",
      highlight: false,
      active: true
    },
    {
      id: "link-4",
      title: "Weekly Developer Newsletter",
      subtitle: "Curated engineering tips and architecture insights",
      url: "https://substack.com",
      icon: "newsletter",
      highlight: false,
      active: true
    },
    {
      id: "link-5",
      title: "Schedule a 1-on-1 Advisory Call",
      subtitle: "Architecture reviews and career mentoring",
      url: "https://cal.com",
      icon: "calendar",
      highlight: false,
      active: true
    }
  ],
  "theme": {
    "preset": "midnight-obsidian",
    "backgroundType": "gradient",
    "backgroundValue": "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)",
    "buttonStyle": "glass",
    "accentColor": "#6366f1",
    "textColor": "light",
    "fontFamily": "sans"
  }
};

export const THEME_PRESETS = [
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    backgroundType: 'gradient' as const,
    backgroundValue: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
    buttonStyle: 'glass' as const,
    accentColor: '#6366f1',
    textColor: 'light' as const
  },
  {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    backgroundType: 'gradient' as const,
    backgroundValue: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)',
    buttonStyle: 'glass' as const,
    accentColor: '#10b981',
    textColor: 'light' as const
  },
  {
    id: 'sunset-ember',
    name: 'Sunset Ember',
    backgroundType: 'gradient' as const,
    backgroundValue: 'linear-gradient(135deg, #2a0815 0%, #4c0519 50%, #18181b 100%)',
    buttonStyle: 'rounded' as const,
    accentColor: '#f43f5e',
    textColor: 'light' as const
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon',
    backgroundType: 'gradient' as const,
    backgroundValue: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1e1b4b 100%)',
    buttonStyle: 'pill' as const,
    accentColor: '#06b6d4',
    textColor: 'light' as const
  },
  {
    id: 'monochrome-minimal',
    name: 'Monochrome Minimal',
    backgroundType: 'solid' as const,
    backgroundValue: '#09090b',
    buttonStyle: 'rounded' as const,
    accentColor: '#fafafa',
    textColor: 'light' as const
  },
  {
    id: 'clean-sand',
    name: 'Clean Sand (Light)',
    backgroundType: 'gradient' as const,
    backgroundValue: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
    buttonStyle: 'rounded' as const,
    accentColor: '#0f172a',
    textColor: 'dark' as const
  }
];
