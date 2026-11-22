import React, {useMemo, useRef, useState} from 'react';
import {User} from 'firebase/auth';
import {
  CopyPlus,
  Download,
  FolderOpen,
  LogIn,
  LogOut,
  Play,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {Snippet} from '../types/snippet';
import {formatRelativeTime} from '../utils/storage';
import {useAnimatedPresence} from '../utils/useAnimatedPresence';

interface SavedDrawerProps {
  isOpen: boolean;
  user: User | null;
  isAuthReady: boolean;
  isLoadingSnippets: boolean;
  isSigningIn: boolean;
  snippets: Snippet[];
  activeSnippetId: string | null;
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSaveCurrent: () => void;
  onOpenSnippet: (snippet: Snippet, runImmediately?: boolean) => void;
  onDuplicateSnippet: (snippet: Snippet) => void;
  onDownloadHtml: (snippet: Snippet) => void;
  onDeleteSnippet: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

export function SavedDrawer({
  isOpen,
  user,
  isAuthReady,
  isLoadingSnippets,
  isSigningIn,
  snippets,
  activeSnippetId,
  onClose,
  onSignIn,
  onSignOut,
  onSaveCurrent,
  onOpenSnippet,
  onDuplicateSnippet,
  onDownloadHtml,
  onDeleteSnippet,
  onExportBackup,
  onImportBackup,
}: SavedDrawerProps) {
  const [query, setQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {shouldRender, state} = useAnimatedPresence(isOpen, 170);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const sorted = [...snippets].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!normalized) return sorted;
    return sorted.filter((item) => item.title.toLowerCase().includes(normalized));
  }, [snippets, query]);

  if (!shouldRender) return null;

  const isClosing = state === 'closing';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportBackup(file);
    }
    event.target.value = '';
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-end ${isClosing ? 'pointer-events-none' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Códigos armazenados"
    >
      <div
        className={`fixed inset-0 bg-neutral-950/30 dark:bg-black/60 backdrop-blur-[1px] ${
          isClosing ? 'anim-backdrop-out' : 'anim-backdrop-in'
        }`}
        onClick={onClose}
      />

      <aside
        className={`relative z-10 w-full max-w-md h-full bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 flex flex-col shadow-xl ${
          isClosing ? 'anim-drawer-out' : 'anim-drawer-in'
        }`}
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Códigos armazenados
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums mt-0.5 truncate">
              {user
                ? `${snippets.length} ${snippets.length === 1 ? 'projeto salvo' : 'projetos salvos'} · ${user.email}`
                : 'Entre na sua conta para acessar seus códigos'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {!isAuthReady ? (
          <div className="flex-1 p-6 space-y-3">
            <div className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>
        ) : !user ? (
          <div className="anim-content-in flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Cada usuário tem sua própria biblioteca
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mb-6">
              Entre com sua conta Google para salvar seus projetos HTML, CSS e JS em segurança e acessá-los quando voltar.
            </p>
            <button
              type="button"
              onClick={onSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50 transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isSigningIn ? 'Entrando...' : 'Entrar com Google'}</span>
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-900 flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar projeto..."
                  aria-label="Buscar projeto salvo"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                />
              </div>

              <button
                type="button"
                onClick={onSaveCurrent}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Armazenar atual
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoadingSnippets ? (
                <div className="space-y-3 py-2">
                  <div className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                  <div className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                  <div className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                </div>
              ) : snippets.length === 0 ? (
                <div className="anim-content-in py-12 text-center">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    Nenhum código armazenado nesta conta
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
                    Clique em Salvar no editor ou no botão acima para guardar seus projetos nesta conta.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <p className="anim-content-in text-xs text-neutral-500 dark:text-neutral-400 py-8 text-center">
                  Nenhum projeto encontrado para "{query}".
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-900">
                  {filtered.map((snippet) => {
                    const isCurrent = snippet.id === activeSnippetId;
                    const htmlLines = snippet.html.trim() ? snippet.html.split('\n').length : 0;
                    const cssLines = snippet.css.trim() ? snippet.css.split('\n').length : 0;
                    const jsLines = snippet.js.trim() ? snippet.js.split('\n').length : 0;
                    const activeWebTabs =
                      snippet.webTabs && snippet.webTabs.length > 0
                        ? snippet.webTabs
                        : (['html', 'css', 'js'] as const);

                    return (
                      <li key={snippet.id} className="py-4 first:pt-1 last:pb-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {snippet.title || 'Sem título'}
                              </h3>
                              {isCurrent && (
                                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0">
                                  · Aberto
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums flex-wrap">
                              {activeWebTabs.map((tab, idx) => (
                                <React.Fragment key={tab}>
                                  {idx > 0 && <span aria-hidden="true">·</span>}
                                  <span>
                                    {tab === 'html'
                                      ? `HTML ${htmlLines}`
                                      : tab === 'css'
                                      ? `CSS ${cssLines}`
                                      : `JS ${jsLines}`}
                                  </span>
                                </React.Fragment>
                              ))}
                              <span aria-hidden="true">·</span>
                              <span className="font-sans">
                                {formatRelativeTime(snippet.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onOpenSnippet(snippet, false)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Abrir</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenSnippet(snippet, true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                            <span>Rodar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDuplicateSnippet(snippet)}
                            title="Duplicar"
                            aria-label={`Duplicar ${snippet.title}`}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer"
                          >
                            <CopyPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDownloadHtml(snippet)}
                            title="Baixar arquivo .html"
                            aria-label={`Baixar código de ${snippet.title}`}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteSnippet(snippet.id)}
                            title="Excluir"
                            aria-label={`Excluir ${snippet.title}`}
                            className="p-1.5 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 ml-auto cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Importar</span>
                </button>

                <button
                  type="button"
                  onClick={onExportBackup}
                  disabled={snippets.length === 0}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.97] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Backup</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sair</span>
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
