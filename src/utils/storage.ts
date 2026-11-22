import {
  ShortcutMap,
  Snippet,
  SoundSettings,
  SyntaxThemeId,
  WebTab,
} from '../types/snippet';
import {getDefaultShortcuts, sanitizeShortcutMap} from './shortcuts';
import {isSyntaxThemeId} from './syntaxThemes';

const SNIPPETS_KEY = 'traco_snippets_v1';
const DRAFT_KEY = 'traco_draft_v1';
const THEME_KEY = 'traco_theme_v1';
const SYNTAX_THEME_KEY = 'traco_syntax_theme_v1';
const SHORTCUTS_KEY = 'traco_shortcuts_v1';
const SOUND_KEY = 'traco_sound_v1';
const GUEST_PROFILE_KEY = 'traco_guest_profile_v1';

export interface DraftState {
  activeSnippetId: string | null;
  title: string;
  webTabs: WebTab[];
  html: string;
  css: string;
  js: string;
}

export interface GuestProfile {
  displayName: string;
  photoURL: string;
}

export function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(SNIPPETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Snippet =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.html === 'string' &&
        typeof item.css === 'string' &&
        typeof item.js === 'string'
    );
  } catch {
    return [];
  }
}

export function saveSnippets(snippets: Snippet[]): void {
  try {
    localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
  } catch {
    // Ignore quota errors gracefully
  }
}

export function loadDraft(userId?: string | null): DraftState | null {
  try {
    const key = userId ? `${DRAFT_KEY}_${userId}` : DRAFT_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.html === 'string' &&
      typeof parsed.css === 'string' &&
      typeof parsed.js === 'string'
    ) {
      const allTabs: WebTab[] = ['html', 'css', 'js'];
      const validSet = new Set<WebTab>();
      if (Array.isArray(parsed.webTabs)) {
        for (const t of parsed.webTabs) {
          if (t === 'html' || t === 'css' || t === 'js') validSet.add(t);
        }
      }
      const webTabs = allTabs.filter((t) => validSet.has(t));

      return {
        activeSnippetId: typeof parsed.activeSnippetId === 'string' ? parsed.activeSnippetId : null,
        title: typeof parsed.title === 'string' ? parsed.title : 'Sem título',
        webTabs: webTabs.length > 0 ? webTabs : [...allTabs],
        html: parsed.html,
        css: parsed.css,
        js: parsed.js,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: DraftState, userId?: string | null): void {
  try {
    const key = userId ? `${DRAFT_KEY}_${userId}` : DRAFT_KEY;
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Ignore storage errors
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}

export function loadSyntaxTheme(): SyntaxThemeId {
  try {
    const saved = localStorage.getItem(SYNTAX_THEME_KEY);
    if (isSyntaxThemeId(saved)) return saved;
  } catch {
    // Ignore
  }
  return 'treks-auto';
}

export function saveSyntaxTheme(theme: SyntaxThemeId): void {
  try {
    localStorage.setItem(SYNTAX_THEME_KEY, theme);
  } catch {
    // Ignore
  }
}

export function loadShortcuts(): ShortcutMap {
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY);
    if (!raw) return getDefaultShortcuts();
    return sanitizeShortcutMap(JSON.parse(raw));
  } catch {
    return getDefaultShortcuts();
  }
}

export function saveShortcuts(shortcuts: ShortcutMap): void {
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
  } catch {
    // Ignore
  }
}

export function loadSoundSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
          volume:
            typeof parsed.volume === 'number' && parsed.volume >= 0.1 && parsed.volume <= 1
              ? parsed.volume
              : 0.55,
        };
      }
    }
  } catch {
    // Ignore
  }
  return {enabled: true, volume: 0.55};
}

export function saveSoundSettings(settings: SoundSettings): void {
  try {
    localStorage.setItem(SOUND_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadGuestProfile(): GuestProfile {
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '',
          photoURL: typeof parsed.photoURL === 'string' ? parsed.photoURL : '',
        };
      }
    }
  } catch {
    // Ignore
  }
  return {displayName: '', photoURL: ''};
}

export function saveGuestProfile(profile: GuestProfile): void {
  try {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export async function compressImageToDataUrl(
  file: File,
  maxLength = 38000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const size = 144;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }

        // Center-crop square avatar
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > maxLength && quality > 0.3) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > maxLength) {
          reject(new Error('Imagem muito grande mesmo após compressão.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 10) return 'agora';
  if (diffSeconds < 60) return `há ${diffSeconds}s`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(timestamp));
}

export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
