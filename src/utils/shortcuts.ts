import {KeyBinding, ShortcutActionId, ShortcutMap} from '../types/snippet';

export interface ShortcutActionMeta {
  id: ShortcutActionId;
  label: string;
  description: string;
  group: 'project' | 'editor';
}

export const SHORTCUT_ACTIONS: ShortcutActionMeta[] = [
  {
    id: 'save',
    label: 'Salvar projeto',
    description: 'Salva o código atual na conta',
    group: 'project',
  },
  {
    id: 'run',
    label: 'Executar código',
    description: 'Executa ou reexecuta o projeto',
    group: 'project',
  },
  {
    id: 'openDictionary',
    label: 'Dicionário HTML, CSS e JS',
    description: 'Abre ou fecha o dicionário de palavras',
    group: 'project',
  },
  {
    id: 'openSaved',
    label: 'Códigos salvos',
    description: 'Abre ou fecha a gaveta de projetos',
    group: 'project',
  },
  {
    id: 'openSettings',
    label: 'Configurações',
    description: 'Abre o painel de configurações',
    group: 'project',
  },
  {
    id: 'autocomplete',
    label: 'Sugestões de código',
    description: 'Abre o autocomplete no cursor',
    group: 'editor',
  },
  {
    id: 'find',
    label: 'Buscar no código',
    description: 'Abre a barra de busca do editor',
    group: 'editor',
  },
  {
    id: 'replace',
    label: 'Buscar e substituir',
    description: 'Abre busca com substituição',
    group: 'editor',
  },
];

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
}

export function getDefaultShortcuts(): ShortcutMap {
  const mac = isMacPlatform();
  return {
    save: {key: 's', ctrl: !mac, alt: false, shift: false, meta: mac},
    run: {key: 'enter', ctrl: !mac, alt: false, shift: false, meta: mac},
    autocomplete: {key: 'space', ctrl: true, alt: false, shift: false, meta: false},
    find: {key: 'f', ctrl: !mac, alt: false, shift: false, meta: mac},
    replace: {key: 'h', ctrl: !mac, alt: false, shift: false, meta: mac},
    openDictionary: {key: 'd', ctrl: false, alt: true, shift: false, meta: false},
    openSaved: {key: 'o', ctrl: !mac, alt: false, shift: true, meta: mac},
    openSettings: {key: ',', ctrl: !mac, alt: false, shift: false, meta: mac},
  };
}

const MODIFIER_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'AltGraph',
  'CapsLock',
  'NumLock',
  'ScrollLock',
]);

export function normalizeKeyFromEvent(event: {
  key: string;
  code?: string;
}): string | null {
  if (!event.key || MODIFIER_KEYS.has(event.key)) return null;

  const code = event.code ?? '';
  if (code === 'Space' || event.key === ' ') return 'space';
  if (code === 'NumpadEnter' || event.key === 'Enter') return 'enter';
  if (event.key === 'Escape') return 'escape';
  if (event.key === 'Tab') return 'tab';
  if (event.key === 'Backspace') return 'backspace';
  if (event.key === 'Delete') return 'delete';

  const keyCodeMatch = /^Key([A-Z])$/.exec(code);
  if (keyCodeMatch) return keyCodeMatch[1].toLowerCase();

  const digitCodeMatch = /^Digit([0-9])$/.exec(code);
  if (digitCodeMatch) return digitCodeMatch[1];

  const fnCodeMatch = /^F([1-9]|1[0-2])$/.exec(code);
  if (fnCodeMatch) return code.toLowerCase();

  if (code === 'Comma') return ',';
  if (code === 'Period') return '.';
  if (code === 'Slash') return '/';
  if (code === 'Backslash') return '\\';
  if (code === 'Semicolon') return ';';
  if (code === 'BracketLeft') return '[';
  if (code === 'BracketRight') return ']';
  if (code === 'Minus') return '-';
  if (code === 'Equal') return '=';
  if (code === 'Quote') return "'";
  if (code === 'Backquote') return '`';

  return event.key.toLowerCase();
}

export function matchesShortcut(
  event: {
    key: string;
    code?: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  },
  binding: KeyBinding
): boolean {
  const normalized = normalizeKeyFromEvent(event);
  if (!normalized || normalized !== binding.key) return false;
  return (
    Boolean(event.ctrlKey) === binding.ctrl &&
    Boolean(event.altKey) === binding.alt &&
    Boolean(event.shiftKey) === binding.shift &&
    Boolean(event.metaKey) === binding.meta
  );
}

export function areBindingsEqual(a: KeyBinding, b: KeyBinding): boolean {
  return (
    a.key === b.key &&
    a.ctrl === b.ctrl &&
    a.alt === b.alt &&
    a.shift === b.shift &&
    a.meta === b.meta
  );
}

export type CaptureShortcutResult =
  | {ok: true; binding: KeyBinding}
  | {ok: false; reason: 'modifier-only' | 'cancel' | 'needs-modifier'};

export function captureKeyBindingFromEvent(event: {
  key: string;
  code?: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}): CaptureShortcutResult {
  if (MODIFIER_KEYS.has(event.key)) {
    return {ok: false, reason: 'modifier-only'};
  }

  const normalized = normalizeKeyFromEvent(event);
  if (!normalized) {
    return {ok: false, reason: 'modifier-only'};
  }

  const hasMainModifier = Boolean(event.ctrlKey || event.altKey || event.metaKey);

  if (normalized === 'escape' && !hasMainModifier && !event.shiftKey) {
    return {ok: false, reason: 'cancel'};
  }

  const isFunctionKey = /^f([1-9]|1[0-2])$/.test(normalized);
  if (!hasMainModifier && !isFunctionKey) {
    return {ok: false, reason: 'needs-modifier'};
  }

  return {
    ok: true,
    binding: {
      key: normalized,
      ctrl: Boolean(event.ctrlKey),
      alt: Boolean(event.altKey),
      shift: Boolean(event.shiftKey),
      meta: Boolean(event.metaKey),
    },
  };
}

export function findShortcutConflict(
  shortcuts: ShortcutMap,
  targetId: ShortcutActionId,
  candidate: KeyBinding
): ShortcutActionMeta | null {
  for (const action of SHORTCUT_ACTIONS) {
    if (action.id === targetId) continue;
    if (areBindingsEqual(shortcuts[action.id], candidate)) {
      return action;
    }
  }
  return null;
}

export interface DuplicateShortcutGroup {
  bindingText: string;
  actions: ShortcutActionMeta[];
}

export function findDuplicateShortcutGroups(
  shortcuts: ShortcutMap
): DuplicateShortcutGroup[] {
  const groups = new Map<string, DuplicateShortcutGroup>();
  for (const action of SHORTCUT_ACTIONS) {
    const binding = shortcuts[action.id];
    const sig = `${binding.ctrl ? 1 : 0}:${binding.alt ? 1 : 0}:${binding.shift ? 1 : 0}:${
      binding.meta ? 1 : 0
    }:${binding.key}`;
    const existing = groups.get(sig);
    if (existing) {
      existing.actions.push(action);
    } else {
      groups.set(sig, {
        bindingText: formatShortcutText(binding),
        actions: [action],
      });
    }
  }
  return Array.from(groups.values()).filter((group) => group.actions.length > 1);
}

const KEY_LABELS: Record<string, string> = {
  space: 'Espaço',
  enter: 'Enter',
  escape: 'Esc',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Del',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
};

export function formatShortcutKeys(binding: KeyBinding): string[] {
  const keys: string[] = [];
  if (binding.ctrl) keys.push('Ctrl');
  if (binding.alt) keys.push('Alt');
  if (binding.shift) keys.push('Shift');
  if (binding.meta) keys.push('⌘');

  if (KEY_LABELS[binding.key]) {
    keys.push(KEY_LABELS[binding.key]);
  } else if (/^f([1-9]|1[0-2])$/.test(binding.key)) {
    keys.push(binding.key.toUpperCase());
  } else if (binding.key.length === 1) {
    keys.push(binding.key.toUpperCase());
  } else {
    keys.push(binding.key.charAt(0).toUpperCase() + binding.key.slice(1));
  }

  return keys;
}

export function formatShortcutText(binding: KeyBinding): string {
  return formatShortcutKeys(binding).join(' + ');
}

export function isValidKeyBinding(raw: unknown): raw is KeyBinding {
  if (typeof raw !== 'object' || raw === null) return false;
  const candidate = raw as Partial<KeyBinding>;
  return (
    typeof candidate.key === 'string' &&
    candidate.key.length > 0 &&
    candidate.key.length <= 24 &&
    typeof candidate.ctrl === 'boolean' &&
    typeof candidate.alt === 'boolean' &&
    typeof candidate.shift === 'boolean' &&
    typeof candidate.meta === 'boolean'
  );
}

export function sanitizeShortcutMap(raw: unknown): ShortcutMap {
  const defaults = getDefaultShortcuts();
  if (typeof raw !== 'object' || raw === null) return defaults;
  const record = raw as Record<string, unknown>;
  const result: ShortcutMap = {...defaults};
  for (const action of SHORTCUT_ACTIONS) {
    const candidate = record[action.id];
    if (isValidKeyBinding(candidate)) {
      result[action.id] = candidate;
    }
  }
  return result;
}
