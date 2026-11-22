import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  LanguageTab,
  ShortcutMap,
  SyntaxThemeId,
  WebTab,
} from '../types/snippet';
import {
  ParsedColorMatch,
  RgbaColor,
  findColorsInCode,
} from '../utils/colors';
import {CodeDiagnostic} from '../utils/diagnostics';
import {
  applyElectricIndent,
  applyEnterAutoIndent,
  applyTabIndent,
} from '../utils/autoIndent';
import {playKeystrokeSound} from '../utils/sound';
import {formatShortcutText, matchesShortcut} from '../utils/shortcuts';
import {
  AutocompleteItem,
  AutocompleteResult,
  applyAutocompleteInsertion,
  getAutocompleteSuggestions,
} from '../utils/autocomplete';
import {tokenizeCode} from '../utils/syntaxHighlight';
import {SyntaxTokenType, getSyntaxTheme} from '../utils/syntaxThemes';
import {AutocompletePopup} from './AutocompletePopup';
import {ColorPalettePopover} from './ColorPalettePopover';

interface CodeEditorProps {
  webTabs: WebTab[];
  activeTab: LanguageTab;
  html: string;
  css: string;
  js: string;
  diagnostics: CodeDiagnostic[];
  typingSoundEnabled: boolean;
  typingSoundVolume: number;
  syntaxTheme: SyntaxThemeId;
  appTheme: 'light' | 'dark';
  shortcuts: ShortcutMap;
  allowGlobalFindShortcut?: boolean;
  onTabChange: (tab: LanguageTab) => void;
  onRemoveWebTab: (tab: WebTab) => void;
  onRestoreWebTab: (tab: WebTab) => void;
  onChangeCode: (tab: LanguageTab, value: string) => void;
  onSaveShortcut: () => void;
  onRunShortcut: () => void;
}

const WEB_TABS: {id: WebTab; label: string; shortLabel?: string}[] = [
  {id: 'html', label: 'HTML'},
  {id: 'css', label: 'CSS'},
  {id: 'js', label: 'JavaScript', shortLabel: 'JS'},
];

const PLACEHOLDERS: Record<LanguageTab, string> = {
  html: '<!-- Escreva a estrutura HTML aqui -->',
  css: '/* Escreva os estilos CSS aqui */',
  js: '// Escreva a lógica JavaScript aqui',
};

interface PickerTarget {
  tab: LanguageTab;
  start: number;
  end: number;
  color: RgbaColor;
  lineColors?: ParsedColorMatch[];
  anchorRect: {top: number; left: number; bottom: number; right: number};
}

const DEFAULT_SWATCH_COLOR: RgbaColor = {r: 37, g: 99, b: 235, a: 1};

export function CodeEditor({
  webTabs,
  activeTab,
  html,
  css,
  js,
  diagnostics,
  typingSoundEnabled,
  typingSoundVolume,
  syntaxTheme,
  appTheme,
  shortcuts,
  allowGlobalFindShortcut = true,
  onTabChange,
  onRemoveWebTab,
  onRestoreWebTab,
  onChangeCode,
  onSaveShortcut,
  onRunShortcut,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const lineHighlightRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const soundPlayedInKeyDownRef = useRef(false);
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [cursorPos, setCursorPos] = useState(0);
  const [lastChosenColor, setLastChosenColor] = useState<RgbaColor>(DEFAULT_SWATCH_COLOR);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [autocomplete, setAutocomplete] = useState<{
    result: AutocompleteResult;
    anchorRect: {top: number; left: number; lineHeight: number};
  } | null>(null);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const fallbackWebTab: WebTab = webTabs[0] ?? 'html';
  const effectiveTab: LanguageTab = webTabs.includes(activeTab)
    ? activeTab
    : fallbackWebTab;
  const enabledWebTabs = WEB_TABS.filter((tab) => webTabs.includes(tab.id));
  const removedWebTabs = WEB_TABS.filter((tab) => !webTabs.includes(tab.id));
  const values: Record<LanguageTab, string> = {html, css, js};
  const currentCode = values[effectiveTab];

  const latestCodeRef = useRef(currentCode);
  latestCodeRef.current = currentCode;
  const activeTabRef = useRef(effectiveTab);
  activeTabRef.current = effectiveTab;
  const htmlRef = useRef(html);
  htmlRef.current = html;
  const pickerTargetRef = useRef<PickerTarget | null>(pickerTarget);
  pickerTargetRef.current = pickerTarget;
  const autocompleteRef = useRef(autocomplete);
  autocompleteRef.current = autocomplete;
  const autocompleteIndexRef = useRef(autocompleteIndex);
  autocompleteIndexRef.current = autocompleteIndex;

  const prevTabRef = useRef<LanguageTab>(effectiveTab);
  const [switchAnim, setSwitchAnim] = useState<{
    kind: 'next' | 'prev';
    parity: 0 | 1;
  } | null>(null);

  useEffect(() => {
    const prevTab = prevTabRef.current;
    if (prevTab !== effectiveTab) {
      const order: LanguageTab[] = ['html', 'css', 'js'];
      const dir =
        order.indexOf(effectiveTab) >= order.indexOf(prevTab) ? 'next' : 'prev';
      setSwitchAnim((prev) => ({kind: dir, parity: prev?.parity === 1 ? 0 : 1}));
    }
    prevTabRef.current = effectiveTab;
  }, [effectiveTab]);

  useEffect(() => {
    setPickerTarget(null);
    setAutocomplete(null);
    setAutocompleteIndex(0);
  }, [effectiveTab]);

  const lineCount = useMemo(() => {
    if (!currentCode) return 1;
    return currentCode.split('\n').length;
  }, [currentCode]);

  const charCount = currentCode.length;

  const lineCounts = useMemo(
    () => ({
      html: html.trim() ? html.split('\n').length : 0,
      css: css.trim() ? css.split('\n').length : 0,
      js: js.trim() ? js.split('\n').length : 0,
    }),
    [html, css, js]
  );

  const diagnosticsByTab = useMemo(() => {
    const grouped: Record<LanguageTab, CodeDiagnostic[]> = {
      html: [],
      css: [],
      js: [],
    };
    for (const item of diagnostics) {
      grouped[item.tab].push(item);
    }
    return grouped;
  }, [diagnostics]);

  const currentTabDiagnostics = diagnosticsByTab[effectiveTab];

  const lineSeverityMap = useMemo(() => {
    const map = new Map<number, 'error' | 'warning'>();
    for (const item of currentTabDiagnostics) {
      const prev = map.get(item.line);
      if (prev !== 'error') {
        map.set(item.line, item.severity);
      }
    }
    return map;
  }, [currentTabDiagnostics]);

  const diagnosticMessagesByLine = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const item of currentTabDiagnostics) {
      const list = map.get(item.line) ?? [];
      list.push(item.message);
      map.set(item.line, list);
    }
    return map;
  }, [currentTabDiagnostics]);

  const diagnosticRanges = useMemo(() => {
    if (lineSeverityMap.size === 0 || !currentCode) {
      return [] as {start: number; end: number; severity: 'error' | 'warning'}[];
    }
    const ranges: {start: number; end: number; severity: 'error' | 'warning'}[] = [];
    const lines = currentCode.split('\n');
    let offset = 0;

    for (let i = 0; i < lines.length; i += 1) {
      const lineText = lines[i];
      const lineNum = i + 1;
      const severity = lineSeverityMap.get(lineNum);
      if (severity && lineText.length > 0) {
        const leadingMatch = lineText.match(/^[ \t]*/);
        const trailingMatch = lineText.match(/[ \t]*$/);
        const leadLen = leadingMatch ? leadingMatch[0].length : 0;
        const trailLen = trailingMatch ? trailingMatch[0].length : 0;
        const start = offset + leadLen;
        const end = offset + lineText.length - trailLen;
        if (end > start) {
          ranges.push({start, end, severity});
        }
      }
      offset += lineText.length + 1;
    }

    return ranges;
  }, [currentCode, lineSeverityMap]);

  const colorsInCurrentCode = useMemo(
    () => findColorsInCode(currentCode, effectiveTab),
    [currentCode, effectiveTab]
  );

  const colorsByLine = useMemo(() => {
    const map = new Map<number, ParsedColorMatch[]>();
    for (const item of colorsInCurrentCode) {
      const list = map.get(item.line) ?? [];
      list.push(item);
      map.set(item.line, list);
    }
    return map;
  }, [colorsInCurrentCode]);

  const searchMatches = useMemo(() => {
    if (!isSearchOpen || !searchQuery) return [] as {start: number; end: number}[];
    const haystack = matchCase ? currentCode : currentCode.toLowerCase();
    const needle = matchCase ? searchQuery : searchQuery.toLowerCase();
    const found: {start: number; end: number}[] = [];
    let pos = 0;
    while (pos <= haystack.length - needle.length) {
      const idx = haystack.indexOf(needle, pos);
      if (idx === -1) break;
      found.push({start: idx, end: idx + needle.length});
      pos = idx + Math.max(1, needle.length);
      if (found.length >= 2000) break;
    }
    return found;
  }, [isSearchOpen, searchQuery, matchCase, currentCode]);

  const safeActiveMatchIndex = useMemo(() => {
    if (searchMatches.length === 0) return -1;
    return Math.min(activeMatchIndex, searchMatches.length - 1);
  }, [activeMatchIndex, searchMatches.length]);

  const scrollToRange = useCallback(
    (start: number, end: number) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const before = latestCodeRef.current.slice(0, start);
      const lastNl = before.lastIndexOf('\n');
      const lineIdx = before.split('\n').length - 1;
      const col = lastNl === -1 ? start : start - lastNl - 1;

      const targetTop = Math.max(0, lineIdx * 22 - textarea.clientHeight / 3);
      textarea.scrollTop = targetTop;

      const approxCharWidth = 8.15;
      const startX = col * approxCharWidth;
      const endX = (col + (end - start)) * approxCharWidth;
      if (startX < textarea.scrollLeft) {
        textarea.scrollLeft = Math.max(0, startX - 24);
      } else if (endX > textarea.scrollLeft + textarea.clientWidth - 40) {
        textarea.scrollLeft = Math.max(0, endX - textarea.clientWidth + 56);
      }

      if (gutterRef.current) {
        gutterRef.current.scrollTop = textarea.scrollTop;
      }
      if (lineHighlightRef.current) {
        lineHighlightRef.current.scrollTop = textarea.scrollTop;
      }
      if (mirrorRef.current) {
        mirrorRef.current.scrollTop = textarea.scrollTop;
        mirrorRef.current.scrollLeft = textarea.scrollLeft;
      }
    },
    []
  );

  const openSearchBar = useCallback((withReplace = false) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selStart = textarea.selectionStart;
      const selEnd = textarea.selectionEnd;
      if (selEnd > selStart) {
        const selected = latestCodeRef.current.slice(selStart, selEnd);
        if (!selected.includes('\n') && selected.length <= 80) {
          setSearchQuery(selected);
        }
      }
    }
    setIsSearchOpen(true);
    if (withReplace) {
      setShowReplace(true);
    }
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }, []);

  const closeSearchBar = useCallback(() => {
    setIsSearchOpen(false);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, []);

  const goToMatch = useCallback(
    (direction: 1 | -1) => {
      if (searchMatches.length === 0) return;
      const base = safeActiveMatchIndex === -1 ? 0 : safeActiveMatchIndex;
      const next = (base + direction + searchMatches.length) % searchMatches.length;
      setActiveMatchIndex(next);
      const match = searchMatches[next];
      scrollToRange(match.start, match.end);
    },
    [searchMatches, safeActiveMatchIndex, scrollToRange]
  );

  const handleReplaceCurrent = () => {
    if (safeActiveMatchIndex === -1 || !searchMatches[safeActiveMatchIndex]) return;
    const match = searchMatches[safeActiveMatchIndex];
    const updated =
      currentCode.slice(0, match.start) + replaceQuery + currentCode.slice(match.end);
    onChangeCode(effectiveTab, updated);
  };

  const handleReplaceAll = () => {
    if (searchMatches.length === 0) return;
    let updated = '';
    let last = 0;
    for (const m of searchMatches) {
      updated += currentCode.slice(last, m.start) + replaceQuery;
      last = m.end;
    }
    updated += currentCode.slice(last);
    onChangeCode(effectiveTab, updated);
    setActiveMatchIndex(0);
  };

  // Scroll to active match whenever search query, case sensitivity, or tab changes
  useEffect(() => {
    if (!isSearchOpen || searchMatches.length === 0) return;
    const idx = Math.min(activeMatchIndex, searchMatches.length - 1);
    const match = searchMatches[Math.max(0, idx)];
    if (match) {
      scrollToRange(match.start, match.end);
    }
  }, [isSearchOpen, searchQuery, matchCase, effectiveTab, searchMatches.length, activeMatchIndex, scrollToRange]);

  // Global Find / Replace shortcuts inside editor view
  useEffect(() => {
    if (!allowGlobalFindShortcut) return;
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (matchesShortcut(event, shortcuts.find)) {
        event.preventDefault();
        openSearchBar(false);
      } else if (matchesShortcut(event, shortcuts.replace)) {
        event.preventDefault();
        openSearchBar(true);
      }
    };
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [allowGlobalFindShortcut, openSearchBar, shortcuts.find, shortcuts.replace]);

  const editorScheme = useMemo(
    () => getSyntaxTheme(syntaxTheme, appTheme),
    [syntaxTheme, appTheme]
  );

  const syntaxTokens = useMemo(
    () => tokenizeCode(currentCode, effectiveTab),
    [currentCode, effectiveTab]
  );

  const mirrorSegments = useMemo(() => {
    if (
      syntaxTokens.length === 0 &&
      colorsInCurrentCode.length === 0 &&
      searchMatches.length === 0 &&
      diagnosticRanges.length === 0
    ) {
      return [
        {
          text: currentCode,
          tokenType: null as SyntaxTokenType | null,
          color: null as ParsedColorMatch | null,
          searchState: null as 'active' | 'match' | null,
          diagnosticSeverity: null as 'error' | 'warning' | null,
        },
      ];
    }

    const boundaries = new Set<number>([0, currentCode.length]);
    for (const t of syntaxTokens) {
      boundaries.add(t.start);
      boundaries.add(t.end);
    }
    for (const c of colorsInCurrentCode) {
      boundaries.add(c.start);
      boundaries.add(c.end);
    }
    for (const m of searchMatches) {
      boundaries.add(m.start);
      boundaries.add(m.end);
    }
    for (const d of diagnosticRanges) {
      boundaries.add(d.start);
      boundaries.add(d.end);
    }
    const sorted = Array.from(boundaries).sort((a, b) => a - b);
    const activeMatch =
      safeActiveMatchIndex >= 0 ? searchMatches[safeActiveMatchIndex] : null;

    const parts: {
      text: string;
      tokenType: SyntaxTokenType | null;
      color: ParsedColorMatch | null;
      searchState: 'active' | 'match' | null;
      diagnosticSeverity: 'error' | 'warning' | null;
    }[] = [];

    let tokIdx = 0;
    let colIdx = 0;
    let searchIdx = 0;
    let diagIdx = 0;

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const s = sorted[i];
      const e = sorted[i + 1];
      if (s === e) continue;

      while (tokIdx < syntaxTokens.length && syntaxTokens[tokIdx].end <= s) {
        tokIdx += 1;
      }
      const tokenType =
        tokIdx < syntaxTokens.length &&
        syntaxTokens[tokIdx].start <= s &&
        syntaxTokens[tokIdx].end >= e
          ? syntaxTokens[tokIdx].type
          : null;

      while (colIdx < colorsInCurrentCode.length && colorsInCurrentCode[colIdx].end <= s) {
        colIdx += 1;
      }
      const color =
        colIdx < colorsInCurrentCode.length &&
        colorsInCurrentCode[colIdx].start <= s &&
        colorsInCurrentCode[colIdx].end >= e
          ? colorsInCurrentCode[colIdx]
          : null;

      while (searchIdx < searchMatches.length && searchMatches[searchIdx].end <= s) {
        searchIdx += 1;
      }
      let searchState: 'active' | 'match' | null = null;
      if (activeMatch && s >= activeMatch.start && e <= activeMatch.end) {
        searchState = 'active';
      } else if (
        searchIdx < searchMatches.length &&
        searchMatches[searchIdx].start <= s &&
        searchMatches[searchIdx].end >= e
      ) {
        searchState = 'match';
      }

      while (diagIdx < diagnosticRanges.length && diagnosticRanges[diagIdx].end <= s) {
        diagIdx += 1;
      }
      const diagnosticSeverity =
        diagIdx < diagnosticRanges.length &&
        diagnosticRanges[diagIdx].start <= s &&
        diagnosticRanges[diagIdx].end >= e
          ? diagnosticRanges[diagIdx].severity
          : null;

      parts.push({
        text: currentCode.slice(s, e),
        tokenType,
        color,
        searchState,
        diagnosticSeverity,
      });
    }
    return parts;
  }, [
    currentCode,
    syntaxTokens,
    colorsInCurrentCode,
    searchMatches,
    safeActiveMatchIndex,
    diagnosticRanges,
  ]);

  const computeCaretAnchorRect = useCallback(
    (textarea: HTMLTextAreaElement, code: string, offset: number) => {
      const rect = textarea.getBoundingClientRect();
      const style = window.getComputedStyle(textarea);
      const padLeft = parseFloat(style.paddingLeft) || 16;
      const padTop = parseFloat(style.paddingTop) || 16;
      const lineHeight = parseFloat(style.lineHeight) || 22;

      const before = code.slice(0, offset);
      const lastNl = before.lastIndexOf('\n');
      const lineIndex = before.split('\n').length - 1;
      const lineBeforeCursor = lastNl === -1 ? before : before.slice(lastNl + 1);

      if (!measureCanvasRef.current) {
        measureCanvasRef.current = document.createElement('canvas');
      }
      const ctx = measureCanvasRef.current.getContext('2d');
      let textWidth = lineBeforeCursor.length * 8.15;
      if (ctx) {
        ctx.font = style.font;
        textWidth = ctx.measureText(lineBeforeCursor).width;
      }

      return {
        top: rect.top + padTop + lineIndex * lineHeight - textarea.scrollTop,
        left: rect.left + padLeft + textWidth - textarea.scrollLeft,
        lineHeight,
      };
    },
    []
  );

  const refreshAutocomplete = useCallback(
    (code: string, pos: number, manual: boolean) => {
      if (pickerTargetRef.current) {
        setAutocomplete(null);
        setAutocompleteIndex(0);
        return;
      }
      const textarea = textareaRef.current;
      if (!textarea) {
        setAutocomplete(null);
        return;
      }
      const result = getAutocompleteSuggestions(
        activeTabRef.current,
        code,
        pos,
        htmlRef.current,
        manual
      );
      if (!result || result.items.length === 0) {
        setAutocomplete(null);
        setAutocompleteIndex(0);
        return;
      }
      const anchorRect = computeCaretAnchorRect(textarea, code, pos);
      setAutocomplete({result, anchorRect});
      setAutocompleteIndex(0);
    },
    [computeCaretAnchorRect]
  );

  const acceptAutocomplete = useCallback(
    (item: AutocompleteItem) => {
      const current = autocompleteRef.current;
      if (!current) return;
      const tab = activeTabRef.current;
      const applied = applyAutocompleteInsertion(
        latestCodeRef.current,
        current.result.replaceStart,
        current.result.replaceEnd,
        item.insertText
      );
      latestCodeRef.current = applied.value;
      setCursorPos(applied.cursorPos);
      setAutocomplete(null);
      setAutocompleteIndex(0);
      onChangeCode(tab, applied.value);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          textarea.selectionStart = applied.cursorPos;
          textarea.selectionEnd = applied.cursorPos;
        }
      });
    },
    [onChangeCode]
  );

  const syncCursorPos = () => {
    if (textareaRef.current) {
      setCursorPos(textareaRef.current.selectionStart ?? 0);
    }
  };

  const openColorPickerForLine = (
    lineMatches: ParsedColorMatch[],
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAutocomplete(null);
    const rect = event.currentTarget.getBoundingClientRect();
    const preferred =
      lineMatches.find((m) => cursorPos >= m.start && cursorPos <= m.end) ?? lineMatches[0];
    const initialColor = preferred.isPending ? lastChosenColor : preferred.rgba;
    if (!preferred.isPending) {
      setLastChosenColor(preferred.rgba);
    }
    setPickerTarget({
      tab: effectiveTab,
      start: preferred.start,
      end: preferred.end,
      color: initialColor,
      lineColors: lineMatches,
      anchorRect: {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
      },
    });
  };

  const handlePaletteColorChange = (colorCode: string, rgba: RgbaColor) => {
    const target = pickerTargetRef.current;
    if (!target || target.tab !== activeTabRef.current) return;
    setLastChosenColor(rgba);
    const code = latestCodeRef.current;
    let prefix = '';
    if (
      target.start === target.end &&
      target.start > 0 &&
      code[target.start - 1] === ':'
    ) {
      prefix = ' ';
    }
    const replacement = prefix + colorCode;
    const updated = code.slice(0, target.start) + replacement + code.slice(target.end);
    const newStart = target.start + prefix.length;
    const newEnd = newStart + colorCode.length;

    const nextTarget: PickerTarget = {
      ...target,
      start: newStart,
      end: newEnd,
      color: rgba,
    };
    pickerTargetRef.current = nextTarget;
    setPickerTarget(nextTarget);
    latestCodeRef.current = updated;
    onChangeCode(target.tab, updated);
  };

  const jumpToLine = (lineNumber: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const lines = currentCode.split('\n');
    const targetIdx = Math.max(0, Math.min(lineNumber - 1, lines.length - 1));
    let offset = 0;
    for (let i = 0; i < targetIdx; i += 1) {
      offset += lines[i].length + 1;
    }
    textarea.focus();
    textarea.setSelectionRange(offset, offset + lines[targetIdx].length);
    setCursorPos(offset);
    textarea.scrollTop = Math.max(0, targetIdx * 22 - textarea.clientHeight / 3);
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
    if (lineHighlightRef.current) {
      lineHighlightRef.current.scrollTop = textarea.scrollTop;
    }
    if (mirrorRef.current) {
      mirrorRef.current.scrollTop = textarea.scrollTop;
      mirrorRef.current.scrollLeft = textarea.scrollLeft;
    }
  };

  const handleScroll = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (autocompleteRef.current) {
      setAutocomplete(null);
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
    if (lineHighlightRef.current) {
      lineHighlightRef.current.scrollTop = textarea.scrollTop;
    }
    if (mirrorRef.current) {
      mirrorRef.current.scrollTop = textarea.scrollTop;
      mirrorRef.current.scrollLeft = textarea.scrollLeft;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = event.metaKey || event.ctrlKey;

    if (matchesShortcut(event.nativeEvent, shortcuts.save)) {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopPropagation();
      setAutocomplete(null);
      onSaveShortcut();
      return;
    }

    if (matchesShortcut(event.nativeEvent, shortcuts.run)) {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopPropagation();
      setAutocomplete(null);
      onRunShortcut();
      return;
    }

    const textarea = event.currentTarget;
    const {selectionStart, selectionEnd, value} = textarea;

    if (matchesShortcut(event.nativeEvent, shortcuts.autocomplete)) {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopPropagation();
      refreshAutocomplete(value, selectionStart, true);
      return;
    }

    const activeAutocomplete = autocompleteRef.current;
    if (activeAutocomplete && activeAutocomplete.result.items.length > 0) {
      const items = activeAutocomplete.result.items;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setAutocompleteIndex((prev) => (prev + 1) % items.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setAutocompleteIndex((prev) => (prev - 1 + items.length) % items.length);
        return;
      }
      if (event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey && !isMod)) {
        event.preventDefault();
        const safeIdx = Math.min(autocompleteIndexRef.current, items.length - 1);
        const chosen = items[safeIdx] ?? items[0];
        if (chosen) {
          acceptAutocomplete(chosen);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopPropagation();
        setAutocomplete(null);
        return;
      }
      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'Home' ||
        event.key === 'End' ||
        event.key === 'PageUp' ||
        event.key === 'PageDown'
      ) {
        setAutocomplete(null);
      }
    }

    const ignoredKeys = new Set([
      'Shift',
      'Control',
      'Alt',
      'Meta',
      'CapsLock',
      'Escape',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Unidentified',
      'Dead',
    ]);

    const isFnKey = /^F([1-9]|1[0-2])$/i.test(event.key);
    if (
      typingSoundEnabled &&
      !isMod &&
      !event.altKey &&
      !isFnKey &&
      !ignoredKeys.has(event.key)
    ) {
      soundPlayedInKeyDownRef.current = true;
      playKeystrokeSound(typingSoundVolume, event.key);
    } else {
      soundPlayedInKeyDownRef.current = false;
    }

    const commitTextEdit = (edit: {
      value: string;
      selectionStart: number;
      selectionEnd: number;
    }) => {
      event.preventDefault();
      latestCodeRef.current = edit.value;
      setCursorPos(edit.selectionStart);
      setAutocomplete(null);
      onChangeCode(effectiveTab, edit.value);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = edit.selectionStart;
          textareaRef.current.selectionEnd = edit.selectionEnd;
        }
      });
    };

    if (event.key === 'Tab') {
      const edit = applyTabIndent(
        value,
        selectionStart,
        selectionEnd,
        effectiveTab,
        event.shiftKey
      );
      if (edit) {
        commitTextEdit(edit);
      } else {
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Enter') {
      const edit = applyEnterAutoIndent(value, selectionStart, selectionEnd, effectiveTab);
      if (edit) {
        commitTextEdit(edit);
      }
      return;
    }

    if (
      !isMod &&
      !event.altKey &&
      (event.key === '}' ||
        event.key === ']' ||
        event.key === ')' ||
        event.key === '>' ||
        event.key === ':')
    ) {
      const edit = applyElectricIndent(
        value,
        selectionStart,
        selectionEnd,
        event.key,
        effectiveTab
      );
      if (edit) {
        commitTextEdit(edit);
      }
    }
  };

  const switchAnimClass = switchAnim
    ? switchAnim.kind === 'next'
      ? switchAnim.parity === 0
        ? 'anim-tab-next-a'
        : 'anim-tab-next-b'
      : switchAnim.parity === 0
      ? 'anim-tab-prev-a'
      : 'anim-tab-prev-b'
    : '';

  return (
    <section
      aria-label="Editor de código"
      style={{backgroundColor: editorScheme.bg}}
      className="flex flex-col h-full min-h-0 transition-colors duration-200"
    >
      <div
        style={{
          backgroundColor: editorScheme.chromeBg,
          borderColor: editorScheme.border,
          color: editorScheme.mutedText,
        }}
        className="h-12 sm:h-11 shrink-0 px-3 sm:px-4 border-b flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-200"
      >
        <div
          role="tablist"
          aria-label="Linguagens"
          className="anim-tabbar-in flex items-center gap-1 min-w-0 overflow-x-auto"
        >
          {enabledWebTabs.map((tab) => {
            const isActive = effectiveTab === tab.id;
            const count = lineCounts[tab.id];
            const tabIssues = diagnosticsByTab[tab.id];
            const hasError = tabIssues.some((item) => item.severity === 'error');
            return (
              <div
                key={tab.id}
                style={
                  isActive
                    ? {
                        backgroundColor: editorScheme.activeTabBg,
                        color: editorScheme.activeTabText,
                        borderColor: editorScheme.border,
                      }
                    : {
                        color: editorScheme.mutedText,
                        borderColor: 'transparent',
                      }
                }
                className={`anim-chip-in inline-flex items-center rounded-md transition-all duration-150 whitespace-nowrap shrink-0 border ${
                  isActive ? 'shadow-xs' : 'hover:opacity-90'
                }`}
              >
                <button
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => onTabChange(tab.id)}
                  className={`py-1.5 text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-opacity duration-150 active:opacity-80 ${
                    enabledWebTabs.length > 1
                      ? 'pl-2.5 sm:pl-3 pr-1'
                      : 'px-2.5 sm:px-3'
                  }`}
                >
                  {tab.shortLabel ? (
                    <>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </>
                  ) : (
                    <span>{tab.label}</span>
                  )}
                  {tabIssues.length > 0 ? (
                    <span
                      className={`font-mono text-[11px] tabular-nums font-semibold ${
                        hasError
                          ? editorScheme.isDark
                            ? 'text-red-400'
                            : 'text-red-600'
                          : editorScheme.isDark
                          ? 'text-amber-400'
                          : 'text-amber-600'
                      }`}
                    >
                      !{tabIssues.length}
                    </span>
                  ) : (
                    count > 0 && (
                      <span
                        style={{color: editorScheme.gutterText}}
                        className="hidden sm:inline font-mono text-[11px] tabular-nums"
                      >
                        {count}
                      </span>
                    )
                  )}
                </button>

                {enabledWebTabs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveWebTab(tab.id)}
                    title={`Apagar ${tab.label} deste projeto`}
                    aria-label={`Apagar ${tab.label} deste projeto`}
                    className={`mr-1 p-0.5 rounded transition-all duration-150 active:scale-90 cursor-pointer ${
                      editorScheme.isDark
                        ? 'hover:text-red-400 hover:bg-white/10'
                        : 'hover:text-red-600 hover:bg-black/5'
                    }`}
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}

          {removedWebTabs.length > 0 && (
            <div className="flex items-center gap-1 pl-0.5 shrink-0">
              {removedWebTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onRestoreWebTab(tab.id)}
                  title={`Trazer ${tab.label} de volta ao projeto`}
                  aria-label={`Trazer ${tab.label} de volta ao projeto`}
                  style={{
                    borderColor: editorScheme.border,
                    color: editorScheme.mutedText,
                  }}
                  className={`anim-chip-in inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium rounded-md border border-dashed transition-all duration-150 active:scale-[0.96] whitespace-nowrap shrink-0 cursor-pointer ${
                    editorScheme.isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
                >
                  <Plus className="w-3 h-3" aria-hidden="true" />
                  <span>{tab.shortLabel ?? tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => (isSearchOpen ? closeSearchBar() : openSearchBar(false))}
            aria-label="Buscar no código"
            aria-expanded={isSearchOpen}
            title={`Buscar no código (${formatShortcutText(shortcuts.find)})`}
            style={
              isSearchOpen
                ? {
                    backgroundColor: editorScheme.activeTabText,
                    color: editorScheme.activeTabBg,
                  }
                : {color: editorScheme.mutedText}
            }
            className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
              isSearchOpen
                ? ''
                : editorScheme.isDark
                ? 'hover:bg-white/10 hover:text-white'
                : 'hover:bg-black/5 hover:text-neutral-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Buscar</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            style={{color: editorScheme.mutedText}}
            className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
              editorScheme.isDark
                ? 'hover:bg-white/10 hover:text-white'
                : 'hover:bg-black/5 hover:text-neutral-900'
            }`}
          >
            {copied ? (
              <>
                <Check
                  className={`anim-pop-in w-3.5 h-3.5 ${
                    editorScheme.isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                  aria-hidden="true"
                />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onChangeCode(effectiveTab, '')}
            disabled={!currentCode}
            aria-label="Limpar código da aba atual"
            title="Limpar"
            style={{color: editorScheme.mutedText}}
            className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs font-medium disabled:opacity-35 disabled:pointer-events-none rounded-md transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
              editorScheme.isDark
                ? 'hover:text-red-400 hover:bg-white/10'
                : 'hover:text-red-600 hover:bg-black/5'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <div
          role="search"
          aria-label="Buscar e substituir no código"
          style={{
            backgroundColor: editorScheme.chromeBg,
            borderColor: editorScheme.border,
            color: editorScheme.mutedText,
          }}
          className="anim-slide-down shrink-0 px-3 sm:px-4 py-2 border-b space-y-2"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowReplace((prev) => !prev)}
              aria-label={showReplace ? 'Ocultar substituição' : 'Mostrar substituição'}
              title={
                showReplace
                  ? 'Ocultar substituir'
                  : `Substituir (${formatShortcutText(shortcuts.replace)})`
              }
              style={{color: editorScheme.mutedText}}
              className={`p-1 rounded transition-all duration-150 active:scale-90 shrink-0 cursor-pointer ${
                editorScheme.isDark
                  ? 'hover:text-white hover:bg-white/10'
                  : 'hover:text-neutral-900 hover:bg-black/5'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  showReplace ? 'rotate-0' : '-rotate-90'
                }`}
                aria-hidden="true"
              />
            </button>

            <div className="relative flex-1 min-w-0 flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveMatchIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    goToMatch(e.shiftKey ? -1 : 1);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSearchBar();
                  }
                }}
                placeholder="Buscar no código..."
                aria-label="Texto para buscar"
                style={{
                  backgroundColor: editorScheme.bg,
                  borderColor: editorScheme.border,
                  color: editorScheme.text,
                }}
                className="w-full min-w-0 pl-2.5 pr-8 py-1 text-xs font-mono border rounded-md focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setMatchCase((prev) => !prev);
                  setActiveMatchIndex(0);
                }}
                aria-pressed={matchCase}
                title="Diferenciar maiúsculas de minúsculas"
                style={
                  matchCase
                    ? {
                        backgroundColor: editorScheme.activeTabText,
                        color: editorScheme.activeTabBg,
                      }
                    : {color: editorScheme.mutedText}
                }
                className="absolute right-1 px-1 py-0.5 text-[10px] font-mono font-semibold rounded transition-colors cursor-pointer"
              >
                Aa
              </button>
            </div>

            <span
              style={{color: editorScheme.mutedText}}
              className="text-[11px] font-mono tabular-nums whitespace-nowrap shrink-0 min-w-[3.2rem] text-center"
            >
              {!searchQuery
                ? '0'
                : searchMatches.length === 0
                ? '0 de 0'
                : `${safeActiveMatchIndex + 1} de ${searchMatches.length}`}
            </span>

            <button
              type="button"
              onClick={() => goToMatch(-1)}
              disabled={searchMatches.length === 0}
              aria-label="Resultado anterior"
              title="Anterior (Shift + Enter)"
              style={{color: editorScheme.mutedText}}
              className={`p-1 disabled:opacity-35 disabled:pointer-events-none rounded transition-all duration-150 active:scale-90 shrink-0 cursor-pointer ${
                editorScheme.isDark
                  ? 'hover:text-white hover:bg-white/10'
                  : 'hover:text-neutral-900 hover:bg-black/5'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => goToMatch(1)}
              disabled={searchMatches.length === 0}
              aria-label="Próximo resultado"
              title="Próximo (Enter)"
              style={{color: editorScheme.mutedText}}
              className={`p-1 disabled:opacity-35 disabled:pointer-events-none rounded transition-all duration-150 active:scale-90 shrink-0 cursor-pointer ${
                editorScheme.isDark
                  ? 'hover:text-white hover:bg-white/10'
                  : 'hover:text-neutral-900 hover:bg-black/5'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={closeSearchBar}
              aria-label="Fechar busca"
              title="Fechar (Esc)"
              style={{color: editorScheme.mutedText}}
              className={`p-1 rounded transition-all duration-150 active:scale-90 shrink-0 cursor-pointer ${
                editorScheme.isDark
                  ? 'hover:text-white hover:bg-white/10'
                  : 'hover:text-neutral-900 hover:bg-black/5'
              }`}
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {showReplace && (
            <div className="anim-collapse-in flex items-center gap-1.5 pl-6 min-w-0">
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleReplaceCurrent();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSearchBar();
                  }
                }}
                placeholder="Substituir por..."
                aria-label="Texto para substituir"
                style={{
                  backgroundColor: editorScheme.bg,
                  borderColor: editorScheme.border,
                  color: editorScheme.text,
                }}
                className="flex-1 min-w-0 px-2.5 py-1 text-xs font-mono border rounded-md focus:outline-none"
              />
              <button
                type="button"
                onClick={handleReplaceCurrent}
                disabled={searchMatches.length === 0}
                style={{
                  backgroundColor: editorScheme.bg,
                  borderColor: editorScheme.border,
                  color: editorScheme.text,
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-md border hover:opacity-85 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Substituir
              </button>
              <button
                type="button"
                onClick={handleReplaceAll}
                disabled={searchMatches.length === 0}
                style={{
                  backgroundColor: editorScheme.bg,
                  borderColor: editorScheme.border,
                  color: editorScheme.text,
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-md border hover:opacity-85 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Todas
              </button>
            </div>
          )}
        </div>
      )}

      <div
        className={`relative flex-1 min-h-0 flex overflow-hidden ${switchAnimClass}`}
      >
        <div
          ref={gutterRef}
          style={{
            backgroundColor: editorScheme.gutterBg,
            borderColor: editorScheme.border,
            color: editorScheme.gutterText,
          }}
          className="w-13 sm:w-16 shrink-0 pt-4 pb-10 pr-2 sm:pr-2.5 pl-1.5 text-right font-mono text-[13px] leading-[22px] select-none overflow-hidden border-r tabular-nums transition-colors duration-200"
        >
          {Array.from({length: lineCount}, (_, index) => {
            const lineNum = index + 1;
            const severity = lineSeverityMap.get(lineNum);
            const lineMessages = diagnosticMessagesByLine.get(lineNum);
            const lineColors = colorsByLine.get(lineNum);
            const firstColor = lineColors && lineColors.length > 0 ? lineColors[0] : null;
            return (
              <div
                key={index}
                title={lineMessages ? lineMessages.join('\n') : undefined}
                className={`h-[22px] flex items-center justify-end gap-1.5 rounded-l-sm pr-0.5 ${
                  severity === 'error'
                    ? editorScheme.isDark
                      ? 'bg-red-500/15 text-red-400 font-semibold'
                      : 'bg-red-500/10 text-red-600 font-semibold'
                    : severity === 'warning'
                    ? editorScheme.isDark
                      ? 'bg-red-500/[0.09] text-red-400 font-semibold'
                      : 'bg-red-500/[0.06] text-red-600 font-semibold'
                    : ''
                }`}
              >
                {firstColor && (
                  <button
                    type="button"
                    onClick={(e) => openColorPickerForLine(lineColors!, e)}
                    title={
                      firstColor.isPending
                        ? 'Escolher cor na paleta'
                        : `Cor: ${firstColor.raw} (clique para mudar)`
                    }
                    aria-label={
                      firstColor.isPending
                        ? `Escolher cor para a linha ${lineNum}`
                        : `Mudar cor da linha ${lineNum}`
                    }
                    className={`anim-chip-in w-3 h-3 rounded-[3px] shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150 ${
                      firstColor.isPending
                        ? 'border border-neutral-500 dark:border-neutral-400'
                        : 'border border-black/20 dark:border-white/25'
                    }`}
                    style={
                      firstColor.isPending
                        ? {
                            backgroundImage:
                              'linear-gradient(45deg, #d4d4d4 25%, transparent 25%), linear-gradient(-45deg, #d4d4d4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d4 75%), linear-gradient(-45deg, transparent 75%, #d4d4d4 75%)',
                            backgroundSize: '6px 6px',
                            backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0',
                          }
                        : {backgroundColor: firstColor.rgbaCss}
                    }
                  />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        <div className="relative flex-1 min-w-0 h-full overflow-hidden">
          <div
            ref={lineHighlightRef}
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none"
          >
            <div className="relative" style={{height: `${lineCount * 22 + 56}px`}}>
              {Array.from(lineSeverityMap.entries()).map(([lineNum, severity]) => (
                <div
                  key={lineNum}
                  style={{top: `${16 + (lineNum - 1) * 22}px`, height: '22px'}}
                  className={`absolute left-0 right-0 ${
                    severity === 'error'
                      ? editorScheme.isDark
                        ? 'bg-red-500/[0.12]'
                        : 'bg-red-500/[0.065]'
                      : editorScheme.isDark
                      ? 'bg-red-500/[0.08]'
                      : 'bg-red-500/[0.04]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            ref={mirrorRef}
            aria-hidden="true"
            style={{color: editorScheme.text}}
            className="treks-code-mirror absolute inset-0 pt-4 pb-10 px-3 sm:px-4 font-mono text-[13.5px] leading-[22px] whitespace-pre overflow-hidden pointer-events-none select-none"
          >
            {mirrorSegments.map((seg, idx) => {
              if (
                !seg.tokenType &&
                !seg.color &&
                !seg.searchState &&
                !seg.diagnosticSeverity
              ) {
                return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
              }
              const shadows: string[] = [];
              if (seg.color) {
                shadows.push(
                  `inset 0 -2px 0 0 ${
                    seg.color.isPending ? 'rgba(115, 115, 115, 0.5)' : seg.color.rgbaCss
                  }`
                );
              }
              if (seg.searchState === 'active') {
                shadows.push('inset 0 0 0 1px rgba(217, 119, 6, 0.7)');
              }
              const hasDiagnostic = seg.diagnosticSeverity !== null;
              return (
                <span
                  key={idx}
                  style={{
                    color: seg.tokenType ? editorScheme.tokens[seg.tokenType] : undefined,
                    backgroundColor:
                      seg.searchState === 'active'
                        ? 'rgba(245, 158, 11, 0.36)'
                        : seg.searchState === 'match'
                        ? 'rgba(250, 204, 21, 0.2)'
                        : undefined,
                    boxShadow: shadows.length > 0 ? shadows.join(', ') : undefined,
                    textDecorationLine: hasDiagnostic ? 'underline' : undefined,
                    textDecorationStyle: hasDiagnostic ? 'wavy' : undefined,
                    textDecorationColor:
                      seg.diagnosticSeverity === 'error'
                        ? '#ef4444'
                        : seg.diagnosticSeverity === 'warning'
                        ? 'rgba(239, 68, 68, 0.85)'
                        : undefined,
                    textDecorationThickness: hasDiagnostic ? '1.25px' : undefined,
                    textUnderlineOffset: hasDiagnostic ? '3px' : undefined,
                    textDecorationSkipInk: hasDiagnostic ? 'none' : undefined,
                  }}
                >
                  {seg.text}
                </span>
              );
            })}
            {currentCode.endsWith('\n') ? ' ' : null}
          </div>

          <textarea
            ref={textareaRef}
            value={currentCode}
            onChange={(e) => {
              if (typingSoundEnabled && !soundPlayedInKeyDownRef.current) {
                playKeystrokeSound(typingSoundVolume);
              }
              soundPlayedInKeyDownRef.current = false;
              const nextValue = e.target.value;
              const nextPos = e.target.selectionStart ?? 0;
              latestCodeRef.current = nextValue;
              setCursorPos(nextPos);
              onChangeCode(effectiveTab, nextValue);
              refreshAutocomplete(nextValue, nextPos, false);
            }}
            onClick={() => {
              syncCursorPos();
              setAutocomplete(null);
            }}
            onKeyUp={syncCursorPos}
            onSelect={syncCursorPos}
            onBlur={() => setAutocomplete(null)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label={`Código ${effectiveTab.toUpperCase()}`}
            placeholder={PLACEHOLDERS[effectiveTab]}
            style={
              {
                caretColor: editorScheme.caret,
                '--treks-editor-selection': editorScheme.selectionBg,
                '--treks-editor-placeholder': editorScheme.mutedText,
              } as React.CSSProperties
            }
            className="treks-code-input relative z-10 w-full h-full resize-none py-4 px-3 sm:px-4 bg-transparent font-mono text-[13.5px] leading-[22px] text-transparent focus:outline-none overflow-auto whitespace-pre"
          />
        </div>
      </div>

      {diagnostics.length > 0 && showDiagnostics && (
        <div
          role="region"
          aria-label="Avisos de código"
          style={{
            backgroundColor: editorScheme.chromeBg,
            borderColor: editorScheme.border,
          }}
          className="anim-slide-up max-h-32 shrink-0 border-t overflow-y-auto divide-y divide-black/5 dark:divide-white/5"
        >
          {currentTabDiagnostics.length === 0 ? (
            <div
              style={{color: editorScheme.mutedText}}
              className="px-3 sm:px-4 py-2 text-xs flex items-center justify-between gap-2"
            >
              <span>
                Sem avisos nesta aba. Há {diagnostics.length}{' '}
                {diagnostics.length === 1 ? 'aviso em outra aba' : 'avisos em outras abas'}.
              </span>
              <button
                type="button"
                onClick={() => onTabChange(diagnostics[0].tab)}
                style={{color: editorScheme.text}}
                className="font-medium underline cursor-pointer shrink-0"
              >
                Ver em {diagnostics[0].tab.toUpperCase()}
              </button>
            </div>
          ) : (
            currentTabDiagnostics.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpToLine(item.line)}
                className={`w-full px-3 sm:px-4 py-2 text-left text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                  editorScheme.isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}
              >
                {item.severity === 'error' ? (
                  <AlertCircle
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      editorScheme.isDark ? 'text-red-400' : 'text-red-600'
                    }`}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      editorScheme.isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`font-medium shrink-0 tabular-nums ${
                    item.severity === 'error'
                      ? editorScheme.isDark
                        ? 'text-red-300'
                        : 'text-red-700'
                      : editorScheme.isDark
                      ? 'text-amber-300'
                      : 'text-amber-700'
                  }`}
                >
                  {item.severity === 'error' ? 'Erro' : 'Aviso'} · L{item.line}
                </span>
                <span style={{color: editorScheme.text}} className="break-words">
                  {item.message}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <div
        style={{
          backgroundColor: editorScheme.chromeBg,
          borderColor: editorScheme.border,
          color: editorScheme.mutedText,
        }}
        className="h-8 shrink-0 px-3 sm:px-4 border-t flex items-center justify-between gap-3 text-[11px] transition-colors duration-200"
      >
        {diagnostics.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 font-medium hover:underline transition-all duration-150 active:scale-[0.98] cursor-pointer truncate ${
              editorScheme.isDark ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              {diagnostics.length} {diagnostics.length === 1 ? 'aviso no código' : 'avisos no código'}
            </span>
            <ChevronDown
              className={`w-3 h-3 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                showDiagnostics ? 'rotate-0' : 'rotate-180'
              }`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="truncate hidden sm:inline">
            {formatShortcutText(shortcuts.save)} para salvar ·{' '}
            {formatShortcutText(shortcuts.run)} para executar
          </span>
        )}
        <span className="font-mono tabular-nums whitespace-nowrap shrink-0 ml-auto">
          {lineCount} {lineCount === 1 ? 'linha' : 'linhas'} · {charCount} caracteres
        </span>
      </div>
      {autocomplete && autocomplete.result.items.length > 0 && !pickerTarget && (
        <AutocompletePopup
          items={autocomplete.result.items}
          activeIndex={Math.min(
            autocompleteIndex,
            autocomplete.result.items.length - 1
          )}
          query={autocomplete.result.query}
          anchorRect={autocomplete.anchorRect}
          onSelect={acceptAutocomplete}
          onHoverIndex={setAutocompleteIndex}
        />
      )}
      {pickerTarget && (
        <ColorPalettePopover
          initialColor={pickerTarget.color}
          anchorRect={pickerTarget.anchorRect}
          lineColors={
            colorsByLine.get(
              currentCode.slice(0, pickerTarget.start).split('\n').length
            ) ?? pickerTarget.lineColors
          }
          activeMatchStart={pickerTarget.start}
          onSelectLineColor={(match) => {
            const initialColor = match.isPending ? lastChosenColor : match.rgba;
            if (!match.isPending) {
              setLastChosenColor(match.rgba);
            }
            setPickerTarget((prev) =>
              prev
                ? {
                    ...prev,
                    start: match.start,
                    end: match.end,
                    color: initialColor,
                  }
                : null
            );
          }}
          onChangeColor={handlePaletteColorChange}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </section>
  );
}
