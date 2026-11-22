import {SyntaxThemeId} from '../types/snippet';

export type SyntaxTokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'tag'
  | 'attr'
  | 'prop'
  | 'fn'
  | 'operator'
  | 'type'
  | 'punctuation';

export interface SyntaxThemeDefinition {
  id: SyntaxThemeId;
  name: string;
  tone: 'auto' | 'dark' | 'light';
  toneLabel: string;
  isDark: boolean;
  bg: string;
  chromeBg: string;
  gutterBg: string;
  border: string;
  text: string;
  mutedText: string;
  gutterText: string;
  activeTabBg: string;
  activeTabText: string;
  caret: string;
  selectionBg: string;
  tokens: Record<SyntaxTokenType, string>;
}

const TREKS_LIGHT_SCHEME: SyntaxThemeDefinition = {
  id: 'treks-auto',
  name: 'Treks Adaptável',
  tone: 'auto',
  toneLabel: 'Automático',
  isDark: false,
  bg: '#ffffff',
  chromeBg: '#fafafa',
  gutterBg: '#f9fafb',
  border: '#e5e5e5',
  text: '#171717',
  mutedText: '#737373',
  gutterText: '#a3a3a3',
  activeTabBg: '#ffffff',
  activeTabText: '#171717',
  caret: '#171717',
  selectionBg: 'rgba(37, 99, 235, 0.18)',
  tokens: {
    keyword: '#be185d',
    string: '#047857',
    comment: '#737373',
    number: '#b45309',
    tag: '#0369a1',
    attr: '#7c3aed',
    prop: '#0284c7',
    fn: '#6d28d9',
    operator: '#525252',
    type: '#0f766e',
    punctuation: '#737373',
  },
};

const TREKS_DARK_SCHEME: SyntaxThemeDefinition = {
  id: 'treks-auto',
  name: 'Treks Adaptável',
  tone: 'auto',
  toneLabel: 'Automático',
  isDark: true,
  bg: '#0a0a0a',
  chromeBg: '#121212',
  gutterBg: '#0f0f0f',
  border: '#262626',
  text: '#f5f5f5',
  mutedText: '#a3a3a3',
  gutterText: '#525252',
  activeTabBg: '#262626',
  activeTabText: '#fafafa',
  caret: '#fafafa',
  selectionBg: 'rgba(96, 165, 250, 0.25)',
  tokens: {
    keyword: '#f472b6',
    string: '#6ee7b7',
    comment: '#737373',
    number: '#fbbf24',
    tag: '#38bdf8',
    attr: '#c4b5fd',
    prop: '#7dd3fc',
    fn: '#a78bfa',
    operator: '#a3a3a3',
    type: '#5eead4',
    punctuation: '#737373',
  },
};

export const SYNTAX_THEMES: SyntaxThemeDefinition[] = [
  TREKS_LIGHT_SCHEME,
  {
    id: 'monokai',
    name: 'Monokai',
    tone: 'dark',
    toneLabel: 'Escuro',
    isDark: true,
    bg: '#272822',
    chromeBg: '#20211c',
    gutterBg: '#22231e',
    border: '#3a3b32',
    text: '#f8f8f2',
    mutedText: '#908f83',
    gutterText: '#75715e',
    activeTabBg: '#2f3029',
    activeTabText: '#f8f8f2',
    caret: '#f8f8f0',
    selectionBg: 'rgba(166, 226, 46, 0.22)',
    tokens: {
      keyword: '#f92672',
      string: '#e6db74',
      comment: '#75715e',
      number: '#ae81ff',
      tag: '#f92672',
      attr: '#a6e22e',
      prop: '#66d9ef',
      fn: '#a6e22e',
      operator: '#f92672',
      type: '#66d9ef',
      punctuation: '#a8a89a',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    tone: 'dark',
    toneLabel: 'Escuro',
    isDark: true,
    bg: '#282a36',
    chromeBg: '#21222c',
    gutterBg: '#242631',
    border: '#3a3d4e',
    text: '#f8f8f2',
    mutedText: '#8c94b8',
    gutterText: '#6272a4',
    activeTabBg: '#343746',
    activeTabText: '#f8f8f2',
    caret: '#f8f8f2',
    selectionBg: 'rgba(68, 71, 90, 0.72)',
    tokens: {
      keyword: '#ff79c6',
      string: '#f1fa8c',
      comment: '#6272a4',
      number: '#bd93f9',
      tag: '#ff79c6',
      attr: '#50fa7b',
      prop: '#8be9fd',
      fn: '#50fa7b',
      operator: '#ff79c6',
      type: '#8be9fd',
      punctuation: '#b6b8c7',
    },
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    tone: 'light',
    toneLabel: 'Claro',
    isDark: false,
    bg: '#ffffff',
    chromeBg: '#f6f8fa',
    gutterBg: '#fafbfc',
    border: '#d0d7de',
    text: '#24292f',
    mutedText: '#6e7781',
    gutterText: '#8c959f',
    activeTabBg: '#ffffff',
    activeTabText: '#24292f',
    caret: '#0969da',
    selectionBg: 'rgba(9, 105, 218, 0.16)',
    tokens: {
      keyword: '#cf222e',
      string: '#0a3069',
      comment: '#6e7781',
      number: '#0550ae',
      tag: '#116329',
      attr: '#8250df',
      prop: '#0550ae',
      fn: '#8250df',
      operator: '#cf222e',
      type: '#953800',
      punctuation: '#57606a',
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    tone: 'dark',
    toneLabel: 'Escuro',
    isDark: true,
    bg: '#0d1117',
    chromeBg: '#161b22',
    gutterBg: '#0d1117',
    border: '#30363d',
    text: '#e6edf3',
    mutedText: '#8b949e',
    gutterText: '#6e7681',
    activeTabBg: '#1f242c',
    activeTabText: '#e6edf3',
    caret: '#58a6ff',
    selectionBg: 'rgba(56, 139, 253, 0.28)',
    tokens: {
      keyword: '#ff7b72',
      string: '#a5d6ff',
      comment: '#8b949e',
      number: '#79c0ff',
      tag: '#7ee787',
      attr: '#d2a8ff',
      prop: '#79c0ff',
      fn: '#d2a8ff',
      operator: '#ff7b72',
      type: '#ffa657',
      punctuation: '#8b949e',
    },
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    tone: 'dark',
    toneLabel: 'Escuro',
    isDark: true,
    bg: '#282c34',
    chromeBg: '#21252b',
    gutterBg: '#242830',
    border: '#383e4a',
    text: '#abb2bf',
    mutedText: '#7f848e',
    gutterText: '#5c6370',
    activeTabBg: '#2c313c',
    activeTabText: '#e5e9f0',
    caret: '#528bff',
    selectionBg: 'rgba(82, 139, 255, 0.26)',
    tokens: {
      keyword: '#c678dd',
      string: '#98c379',
      comment: '#5c6370',
      number: '#d19a66',
      tag: '#e06c75',
      attr: '#d19a66',
      prop: '#56b6c2',
      fn: '#61afef',
      operator: '#56b6c2',
      type: '#e5c07b',
      punctuation: '#848b98',
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    tone: 'light',
    toneLabel: 'Claro',
    isDark: false,
    bg: '#fdf6e3',
    chromeBg: '#eee8d5',
    gutterBg: '#f6efdc',
    border: '#ddd6c1',
    text: '#586e75',
    mutedText: '#93a1a1',
    gutterText: '#93a1a1',
    activeTabBg: '#fdf6e3',
    activeTabText: '#073642',
    caret: '#586e75',
    selectionBg: 'rgba(38, 139, 210, 0.18)',
    tokens: {
      keyword: '#859900',
      string: '#2aa198',
      comment: '#93a1a1',
      number: '#d33682',
      tag: '#268bd2',
      attr: '#b58900',
      prop: '#268bd2',
      fn: '#268bd2',
      operator: '#859900',
      type: '#cb4b16',
      punctuation: '#657b83',
    },
  },
];

export function isSyntaxThemeId(value: unknown): value is SyntaxThemeId {
  return (
    value === 'treks-auto' ||
    value === 'monokai' ||
    value === 'dracula' ||
    value === 'github-light' ||
    value === 'github-dark' ||
    value === 'one-dark' ||
    value === 'solarized-light'
  );
}

export function getSyntaxTheme(
  id: SyntaxThemeId,
  appTheme: 'light' | 'dark'
): SyntaxThemeDefinition {
  if (id === 'treks-auto') {
    return appTheme === 'dark' ? TREKS_DARK_SCHEME : TREKS_LIGHT_SCHEME;
  }
  return SYNTAX_THEMES.find((item) => item.id === id) ?? TREKS_LIGHT_SCHEME;
}
