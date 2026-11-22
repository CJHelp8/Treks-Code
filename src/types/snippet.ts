export type WebTab = 'html' | 'css' | 'js';

export type LanguageTab = WebTab;

export type AppPage = 'editor' | 'run';

export type ViewportMode = 'full' | 'tablet' | 'mobile';

export type SyntaxThemeId =
  | 'treks-auto'
  | 'monokai'
  | 'dracula'
  | 'github-light'
  | 'github-dark'
  | 'one-dark'
  | 'solarized-light';

export type ShortcutActionId =
  | 'save'
  | 'run'
  | 'autocomplete'
  | 'find'
  | 'replace'
  | 'openDictionary'
  | 'openSaved'
  | 'openSettings';

export interface KeyBinding {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export type ShortcutMap = Record<ShortcutActionId, KeyBinding>;

export interface Snippet {
  id: string;
  ownerId?: string;
  title: string;
  mode?: 'web' | 'python';
  webTabs?: WebTab[];
  html: string;
  css: string;
  js: string;
  python?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export interface SoundSettings {
  enabled: boolean;
  volume: number;
}

export interface ConsoleEntry {
  id: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}
