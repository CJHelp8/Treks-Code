import {useEffect, useMemo, useRef} from 'react';
import {AutocompleteItem, CompletionKind} from '../utils/autocomplete';

interface AutocompletePopupProps {
  items: AutocompleteItem[];
  activeIndex: number;
  query: string;
  anchorRect: {top: number; left: number; lineHeight: number};
  onSelect: (item: AutocompleteItem) => void;
  onHoverIndex: (index: number) => void;
}

const KIND_BADGE: Record<
  CompletionKind,
  {symbol: string; className: string}
> = {
  tag: {
    symbol: '<>',
    className: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  },
  attr: {
    symbol: '@',
    className: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  },
  prop: {
    symbol: 'p',
    className: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  },
  value: {
    symbol: 'v',
    className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  },
  fn: {
    symbol: 'ƒ',
    className: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
  },
  method: {
    symbol: 'm',
    className: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
  },
  keyword: {
    symbol: 'k',
    className: 'bg-neutral-500/15 text-neutral-700 dark:text-neutral-300',
  },
  snippet: {
    symbol: '{}',
    className: 'bg-teal-500/12 text-teal-700 dark:text-teal-300',
  },
  var: {
    symbol: 'x',
    className: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
  },
};

function renderHighlightedLabel(label: string, query: string) {
  const cleanQuery = query.replace(/^<\/?/, '').toLowerCase();
  if (!cleanQuery) return <span>{label}</span>;

  const idx = label.toLowerCase().indexOf(cleanQuery);
  if (idx === -1) return <span>{label}</span>;

  return (
    <span>
      {label.slice(0, idx)}
      <strong className="font-semibold text-neutral-950 dark:text-white underline decoration-neutral-400/70 underline-offset-2">
        {label.slice(idx, idx + cleanQuery.length)}
      </strong>
      {label.slice(idx + cleanQuery.length)}
    </span>
  );
}

export function AutocompletePopup({
  items,
  activeIndex,
  query,
  anchorRect,
  onSelect,
  onHoverIndex,
}: AutocompletePopupProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const activeEl = container.children[activeIndex] as HTMLElement | undefined;
    if (activeEl) {
      activeEl.scrollIntoView({block: 'nearest'});
    }
  }, [activeIndex, items.length]);

  const position = useMemo(() => {
    const width = 340;
    const estHeight = Math.min(items.length * 32 + 34, 260);
    const pad = 10;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

    const clampedWidth = Math.min(width, vw - pad * 2);
    let left = anchorRect.left;
    if (left + clampedWidth > vw - pad) {
      left = Math.max(pad, vw - clampedWidth - pad);
    }
    if (left < pad) left = pad;

    let top = anchorRect.top + anchorRect.lineHeight + 4;
    const flipAbove = top + estHeight > vh - pad;
    if (flipAbove) {
      const aboveTop = anchorRect.top - estHeight - 4;
      top = aboveTop >= pad ? aboveTop : Math.max(pad, vh - estHeight - pad);
    }

    return {top, left, width: clampedWidth, flipAbove};
  }, [anchorRect, items.length]);

  if (items.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Sugestões de código"
      style={{top: position.top, left: position.left, width: position.width}}
      onMouseDown={(e) => e.preventDefault()}
      className={`anim-dropdown-in ${
        position.flipAbove ? 'origin-bottom-left' : 'origin-top-left'
      } fixed z-50 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xl overflow-hidden select-none`}
    >
      <div
        ref={listRef}
        className="max-h-56 overflow-y-auto py-1 divide-y divide-neutral-100/70 dark:divide-neutral-900/80"
      >
        {items.map((item, idx) => {
          const isSelected = idx === activeIndex;
          const badge = KIND_BADGE[item.kind];
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => onHoverIndex(idx)}
              onClick={() => onSelect(item)}
              className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between gap-2.5 transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-neutral-100 dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  aria-hidden="true"
                  className={`w-5 h-5 rounded text-[10px] font-mono font-semibold flex items-center justify-center shrink-0 ${badge.className}`}
                >
                  {badge.symbol}
                </span>
                <span className="font-mono text-xs truncate">
                  {renderHighlightedLabel(item.label, query)}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate max-w-[140px] shrink-0">
                {item.detail}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-2.5 py-1 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/80 dark:bg-neutral-900/50 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
        <span>↑↓ navegar · Tab ou Enter inserir</span>
        <span>Esc fechar</span>
      </div>
    </div>
  );
}
