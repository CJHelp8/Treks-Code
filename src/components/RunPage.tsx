import {
  AlertCircle,
  ArrowLeft,
  Download,
  RotateCcw,
  Terminal,
  Trash2,
} from 'lucide-react';
import {ConsoleEntry, ViewportMode} from '../types/snippet';

interface RunPageProps {
  title: string;
  srcDoc: string;
  runCounter: number;
  viewport: ViewportMode;
  consoleEntries: ConsoleEntry[];
  showConsole: boolean;
  onBackToEditor: () => void;
  onRerun: () => void;
  onExportHtml: () => void;
  onChangeViewport: (viewport: ViewportMode) => void;
  onToggleConsole: () => void;
  onClearConsole: () => void;
}

const VIEWPORT_OPTIONS: {id: ViewportMode; label: string}[] = [
  {id: 'full', label: 'Livre'},
  {id: 'tablet', label: 'Tablet'},
  {id: 'mobile', label: 'Celular'},
];

const VIEWPORT_WIDTHS: Record<ViewportMode, string> = {
  full: '100%',
  tablet: '768px',
  mobile: '375px',
};

export function RunPage({
  title,
  srcDoc,
  runCounter,
  viewport,
  consoleEntries,
  showConsole,
  onBackToEditor,
  onRerun,
  onExportHtml,
  onChangeViewport,
  onToggleConsole,
  onClearConsole,
}: RunPageProps) {
  const runtimeErrors = consoleEntries.filter((entry) => entry.level === 'error');
  const errorCount = runtimeErrors.length;
  const lastRuntimeError = runtimeErrors[runtimeErrors.length - 1];

  return (
    <div className="anim-page-in h-dvh w-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <header className="h-14 shrink-0 px-3 sm:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={onBackToEditor}
            aria-label="Voltar ao editor"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sm:hidden">Voltar</span>
            <span className="hidden sm:inline">Voltar ao editor</span>
          </button>

          <h1 className="hidden md:block text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {title || 'Sem título'}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            {VIEWPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChangeViewport(option.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 active:scale-[0.96] whitespace-nowrap shrink-0 cursor-pointer ${
                  viewport === option.id
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleConsole}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
              showConsole
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Console</span>
            {consoleEntries.length > 0 && (
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  errorCount > 0 && !showConsole
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : ''
                }`}
              >
                {consoleEntries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onExportHtml}
            title="Exportar arquivo .html"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Exportar</span>
          </button>

          <button
            type="button"
            onClick={onRerun}
            title="Reexecutar código"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reexecutar</span>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {lastRuntimeError && !showConsole && (
          <div
            role="alert"
            className="anim-slide-down px-4 sm:px-6 py-2 border-b border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-3 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate font-mono">{lastRuntimeError.message}</span>
            </div>
            <button
              type="button"
              onClick={onToggleConsole}
              className="font-semibold underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ver console
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto">
          <div
            style={{width: VIEWPORT_WIDTHS[viewport]}}
            className={`h-full max-w-full bg-white transition-[width,border-radius,margin] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              viewport !== 'full'
                ? 'my-6 h-[calc(100%-3rem)] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm'
                : ''
            }`}
          >
            <iframe
              key={runCounter}
              title={`Execução de ${title || 'projeto'}`}
              sandbox="allow-scripts allow-modals"
              srcDoc={srcDoc}
              className="anim-iframe-in w-full h-full border-0 bg-white"
            />
          </div>
        </div>

        {showConsole && (
          <section
            aria-label="Console de saída"
            className="anim-slide-up h-52 shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col"
          >
            <div className="h-9 shrink-0 px-4 sm:px-6 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Saída do console
              </span>
              <button
                type="button"
                onClick={onClearConsole}
                disabled={consoleEntries.length === 0}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.96] cursor-pointer"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" />
                <span>Limpar</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 font-mono text-xs space-y-1">
              {consoleEntries.length === 0 ? (
                <p className="text-neutral-400 dark:text-neutral-600 py-3">
                  Nenhuma mensagem registrada. Use console.log() no JavaScript para inspecionar valores.
                </p>
              ) : (
                consoleEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-3 py-1 border-b border-neutral-100 dark:border-neutral-900 last:border-0 ${
                      entry.level === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : entry.level === 'warn'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums shrink-0">
                      {entry.timestamp}
                    </span>
                    <span className="uppercase text-[10px] font-semibold tracking-wider shrink-0 mt-0.5 text-neutral-400">
                      {entry.level}
                    </span>
                    <pre className="whitespace-pre-wrap break-words flex-1 m-0">
                      {entry.message}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

