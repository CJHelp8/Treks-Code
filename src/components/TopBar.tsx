import {Play} from 'lucide-react';

interface TopBarProps {
  savedCount: number;
  activeSection: 'studio' | 'dictionary' | 'saved' | 'settings';
  runShortcutLabel?: string;
  dictionaryShortcutLabel?: string;
  onSelectStudio: () => void;
  onOpenDictionary: () => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onExportHtml: () => void;
  onRun: () => void;
}

export function TopBar({
  savedCount,
  activeSection,
  runShortcutLabel = 'Ctrl + Enter',
  dictionaryShortcutLabel = 'Alt + D',
  onSelectStudio,
  onOpenDictionary,
  onOpenSaved,
  onOpenSettings,
  onExportHtml,
  onRun,
}: TopBarProps) {
  return (
    <header className="h-14 shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6 transition-colors duration-200">
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onSelectStudio}
          className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap shrink-0 cursor-pointer transition-opacity duration-150 hover:opacity-80 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 rounded"
        >
          Treks
        </button>
      </div>

      <nav
        aria-label="Navegação principal"
        className="hidden md:flex items-center gap-6 text-sm font-medium"
      >
        <button
          type="button"
          onClick={onSelectStudio}
          className={`whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150 active:scale-[0.97] py-1 border-b-2 ${
            activeSection === 'studio'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
              : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          Editor
        </button>

        <button
          type="button"
          onClick={onOpenDictionary}
          title={`Dicionário HTML, CSS e JS (${dictionaryShortcutLabel})`}
          className={`whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150 active:scale-[0.97] py-1 border-b-2 ${
            activeSection === 'dictionary'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
              : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          Dicionário
        </button>

        <button
          type="button"
          onClick={onOpenSaved}
          className={`whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150 active:scale-[0.97] py-1 border-b-2 tabular-nums ${
            activeSection === 'saved'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
              : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          Salvos ({savedCount})
        </button>

        <button
          type="button"
          onClick={onExportHtml}
          className="whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150 active:scale-[0.97] py-1 border-b-2 border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Exportar
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className={`whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150 active:scale-[0.97] py-1 border-b-2 ${
            activeSection === 'settings'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
              : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          Configurações
        </button>
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onRun}
          title={`Executar código (${runShortcutLabel})`}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
        >
          <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          <span>Executar</span>
        </button>
      </div>
    </header>
  );
}

