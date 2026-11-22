import {AlertCircle, Maximize2, RotateCcw, Terminal, Trash2} from 'lucide-react';
import {ConsoleEntry, ViewportMode} from '../types/snippet';

interface LivePreviewPaneProps {
  title: string;
  srcDoc: string;
  runCounter: number;
  viewport: ViewportMode;
  liveEnabled: boolean;
  consoleEntries: ConsoleEntry[];
  showConsole: boolean;
  onToggleLive: () => void;
  onRerun: () => void;
  onExpandFullPage: () => void;
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

export function LivePreviewPane({
  title,
  srcDoc,
  runCounter,
  viewport,
  liveEnabled,
  consoleEntries,
  showConsole,
  onToggleLive,
  onRerun,
  onExpandFullPage,
  onChangeViewport,
  onToggleConsole,
  onClearConsole,
}: LivePreviewPaneProps) {
  const runtimeErrors = consoleEntries.filter((entry) => entry.level === 'error');
  const errorCount = runtimeErrors.length;
  const lastRuntimeError = runtimeErrors[runtimeErrors.length - 1];

  return (
    <section
      aria-label="Visualização em tempo real"
      className="flex flex-col h-full min-h-0 bg-neutral-100 dark:bg-neutral-900"
    >
      <div className="h-11 shrink-0 px-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap shrink-0">
            Visualização
          </span>

          <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none whitespace-nowrap shrink-0">
            <input
              type="checkbox"
              checked={liveEnabled}
              onChange={onToggleLive}
              className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-neutral-700 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
            />
            <span>Tempo real</span>
          </label>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center p-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800/80">
            {VIEWPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChangeViewport(option.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-all duration-150 active:scale-[0.96] whitespace-nowrap shrink-0 cursor-pointer ${
                  viewport === option.id
                    ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 shadow-xs'
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
              showConsole
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Console</span>
            {consoleEntries.length > 0 && (
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  errorCount > 0 && !showConsole ? 'text-red-600 dark:text-red-400 font-semibold' : ''
                }`}
              >
                {consoleEntries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onRerun}
            title="Reiniciar execução"
            aria-label="Reiniciar execução"
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-all duration-150 active:scale-[0.93] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onExpandFullPage}
            title="Abrir em página inteira"
            aria-label="Abrir em página inteira"
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-all duration-150 active:scale-[0.93] cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {lastRuntimeError && !showConsole && (
        <div
          role="alert"
          className="anim-slide-down px-4 py-2 border-b border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-3 shrink-0"
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

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto">
          <div
            style={{width: VIEWPORT_WIDTHS[viewport]}}
            className={`h-full max-w-full bg-white transition-[width,border-radius,margin] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              viewport !== 'full'
                ? 'my-4 h-[calc(100%-2rem)] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs'
                : ''
            }`}
          >
            <iframe
              key={runCounter}
              title={`Pré-visualização de ${title || 'projeto'}`}
              sandbox="allow-scripts allow-modals"
              srcDoc={srcDoc}
              className="anim-iframe-in w-full h-full border-0 bg-white"
            />
          </div>
        </div>

        {showConsole && (
          <div className="anim-slide-up h-44 shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col">
            <div className="h-9 shrink-0 px-4 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
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

            <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs space-y-1">
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
          </div>
        )}
      </div>
    </section>
  );
}
