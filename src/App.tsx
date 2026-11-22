import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {User, onAuthStateChanged, signInWithPopup, signOut} from 'firebase/auth';
import {
  BookOpen,
  FilePlus2,
  FolderOpen,
  LogIn,
  LogOut,
  Moon,
  Save,
  Settings,
  Sun,
  UserRoundCheck,
} from 'lucide-react';
import {AuthModal} from './components/AuthModal';
import {CodeEditor} from './components/CodeEditor';
import {DictionaryView} from './components/DictionaryView';
import {LivePreviewPane} from './components/LivePreviewPane';
import {RunPage} from './components/RunPage';
import {SavedDrawer} from './components/SavedDrawer';
import {SettingsModal} from './components/SettingsModal';
import {ShortcutsModal} from './components/ShortcutsModal';
import {TopBar} from './components/TopBar';
import {auth, googleProvider} from './firebase';
import {
  ALL_WEB_TABS,
  MAX_CODE_LENGTH,
  MAX_TITLE_LENGTH,
  createUserSnippet,
  deleteUserSnippet,
  ensureUserProfile,
  sanitizeWebTabs,
  subscribeUserSnippets,
  updateUserProfileDetails,
  updateUserSnippet,
} from './services/firestoreSnippets';
import {
  AppPage,
  ConsoleEntry,
  LanguageTab,
  ShortcutMap,
  Snippet,
  SoundSettings,
  SyntaxThemeId,
  UserProfileData,
  ViewportMode,
  WebTab,
} from './types/snippet';
import {buildPreviewDocument, buildStandaloneHtml} from './utils/runner';
import {CodeDiagnostic, analyzeCode} from './utils/diagnostics';
import {formatShortcutText, matchesShortcut} from './utils/shortcuts';
import {
  GuestProfile,
  loadDraft,
  loadGuestProfile,
  loadShortcuts,
  loadSoundSettings,
  loadSyntaxTheme,
  loadTheme,
  saveDraft,
  saveGuestProfile,
  saveShortcuts,
  saveSoundSettings,
  saveSyntaxTheme,
  saveTheme,
  triggerFileDownload,
} from './utils/storage';
import {useAnimatedPresence} from './utils/useAnimatedPresence';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `traco-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugifyFilename(title: string): string {
  const cleaned = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'projeto-treks';
}

function getInitials(name: string | null, email: string | null): string {
  const source = (name || email || 'U').trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function App() {
  const initialDraft = useMemo(() => loadDraft(null), []);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  const [webTabs, setWebTabs] = useState<WebTab[]>(
    () => initialDraft?.webTabs ?? [...ALL_WEB_TABS]
  );
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(
    () => initialDraft?.activeSnippetId ?? null
  );
  const [title, setTitle] = useState<string>(() => initialDraft?.title ?? 'Sem título');
  const [html, setHtml] = useState<string>(
    () => initialDraft?.html ?? '<main>\n  <h1>Olá</h1>\n</main>'
  );
  const [css, setCss] = useState<string>(
    () =>
      initialDraft?.css ??
      'body {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n}'
  );
  const [js, setJs] = useState<string>(() => initialDraft?.js ?? '');

  const [page, setPage] = useState<AppPage>('editor');
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LanguageTab>(
    () => initialDraft?.webTabs?.[0] ?? 'html'
  );
  const [viewport, setViewport] = useState<ViewportMode>('full');
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const [runCounter, setRunCounter] = useState(0);
  const [executedTitle, setExecutedTitle] = useState(title);
  const [executedDoc, setExecutedDoc] = useState('');
  const activeRunIdRef = useRef<string>('');
  const pendingSaveAfterAuthRef = useRef(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showConsole, setShowConsole] = useState(false);

  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfile>(() => loadGuestProfile());
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => loadSoundSettings());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [syntaxTheme, setSyntaxTheme] = useState<SyntaxThemeId>(() => loadSyntaxTheme());
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => loadShortcuts());
  const [diagnostics, setDiagnostics] = useState<CodeDiagnostic[]>(() =>
    analyzeCode(html, css, js, webTabs)
  );
  const [toast, setToast] = useState<string | null>(null);
  const [renderedToast, setRenderedToast] = useState<string | null>(null);
  const toastPresence = useAnimatedPresence(Boolean(toast), 150);
  const toastTimerRef = useRef<number | null>(null);
  const latestProjectRef = useRef({
    title,
    webTabs,
    html,
    css,
    js,
  });
  latestProjectRef.current = {title, webTabs, html, css, js};

  if (syncError) {
    throw syncError;
  }

  const showToast = useCallback((message: string) => {
    setToast(message);
    setRenderedToast(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2600);
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveSyntaxTheme(syntaxTheme);
  }, [syntaxTheme]);

  useEffect(() => {
    saveShortcuts(shortcuts);
  }, [shortcuts]);

  // Track desktop (>= 1024px) vs mobile viewport
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };
    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Resizable split divider on desktop
  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(72, Math.max(28, ratio));
      setSplitPercent(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit]);

  // Analyze code for syntax errors and unknown tags/properties/identifiers
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDiagnostics(analyzeCode(html, css, js, webTabs));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [html, css, js, webTabs]);

  // Close account dropdown when clicking outside
  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isAccountMenuOpen]);

  // Firebase Auth listener + per-user Firestore snippets subscription
  useEffect(() => {
    let unsubscribeSnippets: (() => void) | null = null;
    let cancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      if (unsubscribeSnippets) {
        unsubscribeSnippets();
        unsubscribeSnippets = null;
      }

      setAvatarFailed(false);
      setUser(nextUser);
      setIsAuthReady(true);

      if (!nextUser) {
        setUserProfile(null);
        setSnippets([]);
        setIsLoadingSnippets(false);
        setActiveSnippetId(null);
        return;
      }

      setIsLoadingSnippets(true);
      try {
        const profile = await ensureUserProfile(nextUser);
        if (cancelled) return;
        setUserProfile(profile);

        unsubscribeSnippets = subscribeUserSnippets(
          nextUser.uid,
          (items) => {
            setSnippets(items);
            setIsLoadingSnippets(false);
          },
          (err) => {
            setIsLoadingSnippets(false);
            setSyncError(err);
          }
        );

        // If user triggered Save right before signing in, save their current code immediately
        if (pendingSaveAfterAuthRef.current) {
          pendingSaveAfterAuthRef.current = false;
          const newId = createId();
          const current = latestProjectRef.current;
          const activeTabs = current.webTabs;
          await createUserSnippet(nextUser.uid, newId, {
            title: current.title,
            mode: 'web',
            webTabs: activeTabs,
            html: activeTabs.includes('html') ? current.html : '',
            css: activeTabs.includes('css') ? current.css : '',
            js: activeTabs.includes('js') ? current.js : '',
          });
          setActiveSnippetId(newId);
          showToast('Código armazenado na sua conta');
        }
      } catch (err) {
        if (!cancelled) {
          setIsLoadingSnippets(false);
          setSyncError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
      if (unsubscribeSnippets) {
        unsubscribeSnippets();
      }
    };
    // Intentionally subscribe once on mount; pending save reads latest refs/state via closure when triggered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist current draft scoped to user (or guest)
  useEffect(() => {
    saveDraft(
      {
        activeSnippetId,
        title,
        webTabs,
        html,
        css,
        js,
      },
      user?.uid ?? null
    );
  }, [activeSnippetId, title, webTabs, html, css, js, user?.uid]);

  const effectiveHtml = webTabs.includes('html') ? html : '';
  const effectiveCss = webTabs.includes('css') ? css : '';
  const effectiveJs = webTabs.includes('js') ? js : '';

  const activeSavedSnippet = useMemo(
    () => snippets.find((item) => item.id === activeSnippetId) ?? null,
    [snippets, activeSnippetId]
  );

  const isDirty = useMemo(() => {
    if (!activeSavedSnippet) return true;
    const savedTabs = sanitizeWebTabs(activeSavedSnippet.webTabs);
    const tabsChanged =
      savedTabs.length !== webTabs.length ||
      savedTabs.some((tab, index) => webTabs[index] !== tab);
    return (
      activeSavedSnippet.title !== title ||
      tabsChanged ||
      activeSavedSnippet.html !== effectiveHtml ||
      activeSavedSnippet.css !== effectiveCss ||
      activeSavedSnippet.js !== effectiveJs
    );
  }, [
    activeSavedSnippet,
    title,
    webTabs,
    effectiveHtml,
    effectiveCss,
    effectiveJs,
  ]);

  const executeCode = useCallback(
    (
      overrideCode?: {
        title: string;
        webTabs?: WebTab[];
        html: string;
        css: string;
        js: string;
      },
      openFullPage?: boolean
    ) => {
      const nextTitle = overrideCode ? overrideCode.title : title;
      const shouldOpenFullPage = openFullPage ?? !isDesktop;

      setExecutedTitle(nextTitle);
      setIsSavedOpen(false);
      setIsDictionaryOpen(false);

      const nextTabs = overrideCode?.webTabs ?? webTabs;
      const nextHtml = nextTabs.includes('html')
        ? overrideCode
          ? overrideCode.html
          : html
        : '';
      const nextCss = nextTabs.includes('css')
        ? overrideCode
          ? overrideCode.css
          : css
        : '';
      const nextJs = nextTabs.includes('js')
        ? overrideCode
          ? overrideCode.js
          : js
        : '';
      const runId = createId();

      activeRunIdRef.current = runId;
      setConsoleEntries([]);
      if (shouldOpenFullPage) {
        setShowConsole(false);
      }
      setExecutedDoc(buildPreviewDocument(nextHtml, nextCss, nextJs, runId));
      setRunCounter((prev) => prev + 1);
      if (shouldOpenFullPage) {
        setPage('run');
      }
    },
    [title, webTabs, html, css, js, isDesktop]
  );

  // Real-time live preview update on desktop as user types
  useEffect(() => {
    if (!isDesktop || !liveEnabled) return;

    const delay = runCounter === 0 ? 0 : 280;
    const timer = window.setTimeout(() => {
      const runId = createId();
      activeRunIdRef.current = runId;
      setConsoleEntries([]);
      setExecutedTitle(title);
      setExecutedDoc(buildPreviewDocument(effectiveHtml, effectiveCss, effectiveJs, runId));
      setRunCounter((prev) => prev + 1);
    }, delay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDesktop,
    liveEnabled,
    title,
    effectiveHtml,
    effectiveCss,
    effectiveJs,
  ]);

  // Receive console output from sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (
        !data ||
        typeof data !== 'object' ||
        data.source !== 'traco-runner' ||
        data.runId !== activeRunIdRef.current
      ) {
        return;
      }
      const level =
        data.level === 'error' || data.level === 'warn' || data.level === 'info'
          ? data.level
          : 'log';

      const entry: ConsoleEntry = {
        id: createId(),
        level,
        message: typeof data.message === 'string' ? data.message : String(data.message),
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setConsoleEntries((prev) => [...prev.slice(-99), entry]);
      if (level === 'error') {
        setShowConsole(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      setIsAccountMenuOpen(false);
      showToast('Conta conectada');
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('popup-closed-by-user')
          ? 'Login cancelado.'
          : 'Não foi possível entrar com sua conta Google. Tente novamente.';
      setAuthError(message);
      pendingSaveAfterAuthRef.current = false;
    } finally {
      setIsSigningIn(false);
    }
  }, [showToast]);

  const handleSignOut = useCallback(async () => {
    setIsAccountMenuOpen(false);
    setIsSavedOpen(false);
    try {
      await signOut(auth);
      setActiveSnippetId(null);
      setSnippets([]);
      showToast('Você saiu da conta');
    } catch {
      showToast('Erro ao sair da conta');
    }
  }, [showToast]);

  const handleSaveSnippet = useCallback(async () => {
    if (!user) {
      pendingSaveAfterAuthRef.current = true;
      setAuthError(null);
      setIsAuthModalOpen(true);
      return;
    }

    const trimmedTitle = title.trim().slice(0, MAX_TITLE_LENGTH) || 'Sem título';
    setIsSaving(true);
    try {
      if (activeSavedSnippet) {
        await updateUserSnippet(user.uid, activeSavedSnippet.id, {
          title: trimmedTitle,
          mode: 'web',
          webTabs,
          html: effectiveHtml,
          css: effectiveCss,
          js: effectiveJs,
        });
        setTitle(trimmedTitle);
        showToast('Alterações armazenadas');
      } else {
        const newId = createId();
        await createUserSnippet(user.uid, newId, {
          title: trimmedTitle,
          mode: 'web',
          webTabs,
          html: effectiveHtml,
          css: effectiveCss,
          js: effectiveJs,
        });
        setActiveSnippetId(newId);
        setTitle(trimmedTitle);
        showToast('Código armazenado na sua conta');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    activeSavedSnippet,
    title,
    webTabs,
    effectiveHtml,
    effectiveCss,
    effectiveJs,
    showToast,
  ]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isAuthModalOpen) {
          setIsAuthModalOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isAccountMenuOpen) {
          setIsAccountMenuOpen(false);
        } else if (isSavedOpen) {
          setIsSavedOpen(false);
        } else if (isDictionaryOpen) {
          setIsDictionaryOpen(false);
        } else if (page === 'run') {
          setPage('editor');
        }
        return;
      }

      if (isSettingsOpen || isShortcutsOpen || isAuthModalOpen) {
        return;
      }

      if (matchesShortcut(event, shortcuts.save)) {
        event.preventDefault();
        void handleSaveSnippet();
      } else if (matchesShortcut(event, shortcuts.run)) {
        event.preventDefault();
        executeCode();
      } else if (matchesShortcut(event, shortcuts.openSaved)) {
        event.preventDefault();
        setIsSettingsOpen(false);
        setIsSavedOpen((prev) => !prev);
      } else if (matchesShortcut(event, shortcuts.openSettings)) {
        event.preventDefault();
        setIsSavedOpen(false);
        setIsSettingsOpen(true);
      } else if (matchesShortcut(event, shortcuts.openDictionary)) {
        event.preventDefault();
        setIsSavedOpen(false);
        setIsSettingsOpen(false);
        setPage('editor');
        setIsDictionaryOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    handleSaveSnippet,
    executeCode,
    shortcuts,
    page,
    isDictionaryOpen,
    isSavedOpen,
    isSettingsOpen,
    isShortcutsOpen,
    isAuthModalOpen,
    isAccountMenuOpen,
  ]);

  const handleChangeCode = (tab: LanguageTab, value: string) => {
    const bounded = value.slice(0, MAX_CODE_LENGTH);
    if (tab === 'html') setHtml(bounded);
    else if (tab === 'css') setCss(bounded);
    else setJs(bounded);
  };

  const handleRemoveWebTab = (tab: WebTab) => {
    if (webTabs.length <= 1 || !webTabs.includes(tab)) {
      showToast('Mantenha pelo menos uma linguagem ativa no projeto');
      return;
    }
    const nextTabs = webTabs.filter((item) => item !== tab);
    setWebTabs(nextTabs);
    if (activeTab === tab) {
      setActiveTab(nextTabs[0]);
    }
    const names: Record<WebTab, string> = {
      html: 'HTML',
      css: 'CSS',
      js: 'JavaScript',
    };
    showToast(`${names[tab]} removido do projeto`);
  };

  const handleRestoreWebTab = (tab: WebTab) => {
    if (webTabs.includes(tab)) {
      setActiveTab(tab);
      return;
    }
    const nextTabs = ALL_WEB_TABS.filter((item) => item === tab || webTabs.includes(item));
    setWebTabs(nextTabs);
    setActiveTab(tab);
    const names: Record<WebTab, string> = {
      html: 'HTML',
      css: 'CSS',
      js: 'JavaScript',
    };
    showToast(`${names[tab]} adicionado de volta`);
  };

  const handleNewBlank = () => {
    setActiveSnippetId(null);
    setTitle('Sem título');
    setWebTabs([...ALL_WEB_TABS]);
    setHtml('<main>\n  <h1>Olá</h1>\n</main>');
    setCss('body {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n}');
    setJs('');
    setActiveTab('html');
    setIsDictionaryOpen(false);
    showToast('Novo rascunho criado');
  };

  const handleOpenSnippet = (snippet: Snippet, runImmediately = false) => {
    const nextWebTabs = sanitizeWebTabs(snippet.webTabs);
    setActiveSnippetId(snippet.id);
    setTitle(snippet.title);
    setWebTabs(nextWebTabs);
    setHtml(snippet.html);
    setCss(snippet.css);
    setJs(snippet.js);
    setActiveTab(nextWebTabs[0]);
    setIsSavedOpen(false);
    setIsDictionaryOpen(false);
    if (runImmediately) {
      executeCode(
        {
          title: snippet.title,
          webTabs: nextWebTabs,
          html: snippet.html,
          css: snippet.css,
          js: snippet.js,
        },
        !isDesktop
      );
    } else {
      setPage('editor');
      showToast(`Projeto "${snippet.title}" aberto`);
    }
  };

  const handleDuplicateSnippet = async (snippet: Snippet) => {
    if (!user) return;
    try {
      const copyId = createId();
      const copyTitle = `${snippet.title} (cópia)`.slice(0, MAX_TITLE_LENGTH);
      await createUserSnippet(user.uid, copyId, {
        title: copyTitle,
        mode: 'web',
        webTabs: sanitizeWebTabs(snippet.webTabs),
        html: snippet.html,
        css: snippet.css,
        js: snippet.js,
      });
      showToast('Cópia armazenada');
    } catch (err) {
      setSyncError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserSnippet(user.uid, id);
      if (activeSnippetId === id) {
        setActiveSnippetId(null);
      }
      showToast('Projeto removido');
    } catch (err) {
      setSyncError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDownloadCurrent = () => {
    const content = buildStandaloneHtml(title, effectiveHtml, effectiveCss, effectiveJs);
    triggerFileDownload(`${slugifyFilename(title)}.html`, content, 'text/html;charset=utf-8');
    showToast('Arquivo .html exportado');
  };

  const handleDownloadSnippet = (snippet: Snippet) => {
    const snippetTabs = sanitizeWebTabs(snippet.webTabs);
    const content = buildStandaloneHtml(
      snippet.title,
      snippetTabs.includes('html') ? snippet.html : '',
      snippetTabs.includes('css') ? snippet.css : '',
      snippetTabs.includes('js') ? snippet.js : ''
    );
    triggerFileDownload(
      `${slugifyFilename(snippet.title)}.html`,
      content,
      'text/html;charset=utf-8'
    );
    showToast('Arquivo .html exportado');
  };

  const handleExportBackup = () => {
    const payload = JSON.stringify(snippets, null, 2);
    triggerFileDownload('treks-projetos-salvos.json', payload, 'application/json;charset=utf-8');
    showToast('Backup exportado');
  };

  const handleImportBackup = async (file: File) => {
    if (!user) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        showToast('Arquivo JSON inválido');
        return;
      }

      let importedCount = 0;
      for (const item of parsed) {
        if (
          typeof item === 'object' &&
          item !== null &&
          typeof item.title === 'string' &&
          typeof item.html === 'string' &&
          typeof item.css === 'string' &&
          typeof item.js === 'string'
        ) {
          await createUserSnippet(user.uid, createId(), {
            title: item.title,
            mode: 'web',
            webTabs: sanitizeWebTabs(item.webTabs),
            html: item.html,
            css: item.css,
            js: item.js,
          });
          importedCount += 1;
        }
      }

      if (importedCount === 0) {
        showToast('Nenhum projeto válido encontrado');
        return;
      }
      showToast(`${importedCount} projeto(s) importado(s)`);
    } catch {
      showToast('Não foi possível ler ou importar o arquivo');
    }
  };

  const handleChangeSoundSettings = (next: SoundSettings) => {
    setSoundSettings(next);
    saveSoundSettings(next);
  };

  const handleSaveProfile = async (nextName: string, nextPhoto: string) => {
    setAvatarFailed(false);
    if (!user) {
      const updatedGuest = {
        displayName: nextName.trim(),
        photoURL: nextPhoto.trim(),
      };
      setGuestProfile(updatedGuest);
      saveGuestProfile(updatedGuest);
      showToast('Perfil salvo localmente');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateUserProfileDetails(user, {
        displayName: nextName,
        photoURL: nextPhoto,
      });
      setUserProfile(updated);
      showToast('Perfil atualizado');
    } catch (err) {
      setSyncError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const profileName = user
    ? userProfile?.displayName || user.displayName || ''
    : guestProfile.displayName;
  const profilePhoto = user
    ? userProfile?.photoURL ?? user.photoURL ?? ''
    : guestProfile.photoURL;

  const activeSection = isSettingsOpen
    ? 'settings'
    : isSavedOpen
    ? 'saved'
    : isDictionaryOpen
    ? 'dictionary'
    : 'studio';

  if (page === 'run') {
    return (
      <>
        <RunPage
          title={executedTitle}
          srcDoc={executedDoc}
          runCounter={runCounter}
          viewport={viewport}
          consoleEntries={consoleEntries}
          showConsole={showConsole}
          onBackToEditor={() => setPage('editor')}
          onRerun={() => executeCode()}
          onExportHtml={handleDownloadCurrent}
          onChangeViewport={setViewport}
          onToggleConsole={() => setShowConsole((prev) => !prev)}
          onClearConsole={() => setConsoleEntries([])}
        />
        {toastPresence.shouldRender && renderedToast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium shadow-md ${
              toastPresence.state === 'closing' ? 'anim-toast-out' : 'anim-slide-up'
            }`}
          >
            {renderedToast}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="h-dvh w-screen flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <TopBar
        savedCount={snippets.length}
        activeSection={activeSection}
        runShortcutLabel={formatShortcutText(shortcuts.run)}
        dictionaryShortcutLabel={formatShortcutText(shortcuts.openDictionary)}
        onSelectStudio={() => {
          setIsSavedOpen(false);
          setIsSettingsOpen(false);
          setIsDictionaryOpen(false);
        }}
        onOpenDictionary={() => {
          setIsSavedOpen(false);
          setIsSettingsOpen(false);
          setIsDictionaryOpen(true);
        }}
        onOpenSaved={() => {
          setIsSettingsOpen(false);
          setIsSavedOpen(true);
        }}
        onOpenSettings={() => {
          setIsSavedOpen(false);
          setIsSettingsOpen(true);
        }}
        onExportHtml={handleDownloadCurrent}
        onRun={() => executeCode()}
      />

      {/* Workspace toolbar: project name, save/store actions, account, theme */}
      <div className="h-12 shrink-0 px-3 sm:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <input
            type="text"
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Nome do projeto"
            title="Clique para editar o nome do projeto"
            placeholder="Nome do projeto..."
            className="min-w-0 w-full max-w-[130px] sm:max-w-xs px-0.5 py-0.5 text-sm font-semibold bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-neutral-100 focus:outline-none truncate transition-colors"
          />

          <span className="hidden sm:inline text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap shrink-0">
            {!user
              ? 'Modo local'
              : activeSavedSnippet
              ? isDirty
                ? 'Alterações não salvas'
                : 'Salvo na conta'
              : 'Novo na conta'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsDictionaryOpen((prev) => !prev)}
            aria-label={isDictionaryOpen ? 'Voltar ao editor' : 'Abrir dicionário'}
            title={`Dicionário (${formatShortcutText(shortcuts.openDictionary)})`}
            className={`md:hidden inline-flex items-center gap-1 p-1.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.95] cursor-pointer ${
              isDictionaryOpen
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setIsSavedOpen(true)}
            aria-label="Abrir códigos salvos"
            className="md:hidden inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.95] cursor-pointer tabular-nums"
          >
            <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{snippets.length}</span>
          </button>

          <button
            type="button"
            onClick={handleNewBlank}
            aria-label="Novo rascunho"
            title="Novo rascunho"
            className="inline-flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Novo</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSaveSnippet()}
            disabled={isSaving}
            title={`Salvar na sua conta (${formatShortcutText(shortcuts.save)})`}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 disabled:opacity-50 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Configurações"
            title="Configurações"
            className="md:hidden p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.95] cursor-pointer"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* User Account Control */}
          {!isAuthReady ? (
            <div className="w-8 sm:w-20 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          ) : !user ? (
            <button
              type="button"
              onClick={() => void handleSignIn()}
              disabled={isSigningIn}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 disabled:opacity-50 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">
                {isSigningIn ? 'Entrando...' : 'Entrar'}
              </span>
            </button>
          ) : (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                aria-expanded={isAccountMenuOpen}
                aria-label="Conta do usuário"
                className="inline-flex items-center gap-2 p-1 sm:pr-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                {profilePhoto && !avatarFailed ? (
                  <img
                    src={profilePhoto}
                    alt={profileName || 'Foto da conta'}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {getInitials(profileName || null, user.email)}
                  </span>
                )}
                <span className="hidden md:inline text-xs font-medium text-neutral-800 dark:text-neutral-200 max-w-[110px] truncate">
                  {profileName?.split(' ')[0] || user.email}
                </span>
              </button>

              {isAccountMenuOpen && (
                <div className="anim-dropdown-in origin-top-right absolute right-0 mt-2 w-60 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg py-2 z-30">
                  <div className="px-3.5 py-2 border-b border-neutral-100 dark:border-neutral-900">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {profileName || 'Usuário'}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setIsSavedOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors duration-150 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Meus códigos ({snippets.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors duration-150 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Configurações e perfil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSignIn()}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors duration-150 cursor-pointer"
                  >
                    <UserRoundCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Trocar de conta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="w-full px-3.5 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors duration-150 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
            className="hidden sm:inline-flex p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Sun className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop: side-by-side code + real-time preview; Mobile: dedicated full-screen editor; or Dictionary */}
      {isDictionaryOpen ? (
        <DictionaryView onBackToEditor={() => setIsDictionaryOpen(false)} />
      ) : (
        <main
          ref={splitContainerRef}
          className="anim-page-in flex-1 min-h-0 flex flex-row overflow-hidden relative"
        >
          <div
            style={isDesktop ? {flexBasis: `${splitPercent}%`} : undefined}
            className={`${
              isDesktop ? 'h-full shrink-0 grow-0' : 'flex-1 h-full'
            } min-w-0 min-h-0`}
          >
            <CodeEditor
              webTabs={webTabs}
              activeTab={activeTab}
              html={html}
              css={css}
              js={js}
              diagnostics={diagnostics}
              typingSoundEnabled={soundSettings.enabled}
              typingSoundVolume={soundSettings.volume}
              syntaxTheme={syntaxTheme}
              appTheme={theme}
              shortcuts={shortcuts}
              allowGlobalFindShortcut={
                !isSavedOpen &&
                !isSettingsOpen &&
                !isShortcutsOpen &&
                !isAuthModalOpen &&
                !isDictionaryOpen &&
                page === 'editor'
              }
              onTabChange={setActiveTab}
              onRemoveWebTab={handleRemoveWebTab}
              onRestoreWebTab={handleRestoreWebTab}
              onChangeCode={handleChangeCode}
              onSaveShortcut={() => void handleSaveSnippet()}
              onRunShortcut={() => executeCode()}
            />
          </div>

          {isDesktop && (
            <>
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Redimensionar editor e visualização"
                onMouseDown={() => setIsDraggingSplit(true)}
                className="w-1.5 shrink-0 cursor-col-resize bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-400 dark:hover:bg-neutral-600 transition-colors"
              />

              <div className="anim-page-in flex-1 h-full min-w-0 min-h-0 relative">
                {isDraggingSplit && <div className="absolute inset-0 z-20 cursor-col-resize" />}
                <LivePreviewPane
                  title={title}
                  srcDoc={executedDoc}
                  runCounter={runCounter}
                  viewport={viewport}
                  liveEnabled={liveEnabled}
                  consoleEntries={consoleEntries}
                  showConsole={showConsole}
                  onToggleLive={() => setLiveEnabled((prev) => !prev)}
                  onRerun={() => executeCode(undefined, false)}
                  onExpandFullPage={() => executeCode(undefined, true)}
                  onChangeViewport={setViewport}
                  onToggleConsole={() => setShowConsole((prev) => !prev)}
                  onClearConsole={() => setConsoleEntries([])}
                />
              </div>
            </>
          )}
        </main>
      )}

      <SavedDrawer
        isOpen={isSavedOpen}
        user={user}
        isAuthReady={isAuthReady}
        isLoadingSnippets={isLoadingSnippets}
        isSigningIn={isSigningIn}
        snippets={snippets}
        activeSnippetId={activeSnippetId}
        onClose={() => setIsSavedOpen(false)}
        onSignIn={() => void handleSignIn()}
        onSignOut={() => void handleSignOut()}
        onSaveCurrent={() => void handleSaveSnippet()}
        onOpenSnippet={handleOpenSnippet}
        onDuplicateSnippet={(snippet) => void handleDuplicateSnippet(snippet)}
        onDownloadHtml={handleDownloadSnippet}
        onDeleteSnippet={(id) => void handleDeleteSnippet(id)}
        onExportBackup={handleExportBackup}
        onImportBackup={(file) => void handleImportBackup(file)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        user={user}
        profileName={profileName}
        profilePhoto={profilePhoto}
        isSavingProfile={isSavingProfile}
        soundSettings={soundSettings}
        theme={theme}
        syntaxTheme={syntaxTheme}
        shortcuts={shortcuts}
        onClose={() => setIsSettingsOpen(false)}
        onSaveProfile={handleSaveProfile}
        onSignIn={() => {
          setIsSettingsOpen(false);
          void handleSignIn();
        }}
        onChangeSoundSettings={handleChangeSoundSettings}
        onChangeTheme={setTheme}
        onChangeSyntaxTheme={setSyntaxTheme}
        onChangeShortcuts={setShortcuts}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        shortcuts={shortcuts}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        isSigningIn={isSigningIn}
        errorMessage={authError}
        onClose={() => {
          pendingSaveAfterAuthRef.current = false;
          setIsAuthModalOpen(false);
        }}
        onSignIn={() => void handleSignIn()}
      />

      {toastPresence.shouldRender && renderedToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium shadow-md ${
            toastPresence.state === 'closing' ? 'anim-toast-out' : 'anim-slide-up'
          }`}
        >
          {renderedToast}
        </div>
      )}
    </div>
  );
}
