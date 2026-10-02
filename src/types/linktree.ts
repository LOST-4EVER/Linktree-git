export type SocialPlatform = 
  | 'github' 
  | 'twitter' 
  | 'linkedin' 
  | 'youtube' 
  | 'instagram' 
  | 'discord' 
  | 'email' 
  | 'website' 
  | 'twitch' 
  | 'substack';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export type LinkIconType = 
  | 'globe' 
  | 'github' 
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'instagram'
  | 'discord'
  | 'email'
  | 'article' 
  | 'calendar' 
  | 'newsletter' 
  | 'video' 
  | 'shop' 
  | 'code' 
  | 'sparkle' 
  | 'book'
  | 'music'
  | 'podcast'
  | 'figma'
  | 'download'
  | 'chat'
  | 'heart'
  | 'star'
  | 'coffee'
  | 'terminal'
  | 'folder';

export interface CustomLink {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  icon?: LinkIconType | string;
  highlight?: boolean;
  badgeText?: string;
  customAccent?: string;
  active: boolean;
  clickCount?: number;
}

export type ButtonStyleType = 'rounded' | 'pill' | 'glass';
export type TextColorType = 'light' | 'dark';

export interface ThemeConfig {
  preset: string;
  backgroundType: 'gradient' | 'solid';
  backgroundValue: string;
  buttonStyle: ButtonStyleType;
  accentColor: string;
  textColor: TextColorType;
  fontFamily: 'sans' | 'serif' | 'mono';
}

export interface ProfileData {
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  verified: boolean;
  location?: string;
}

export interface LinktreeData {
  profile: ProfileData;
  socials: SocialLink[];
  links: CustomLink[];
  theme: ThemeConfig;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}

export interface CommitState {
  status: 'idle' | 'fetching-sha' | 'committing' | 'success' | 'error';
  message: string;
  commitUrl?: string;
  sha?: string;
  durationMs?: number;
  payloadBytes?: number;
}
