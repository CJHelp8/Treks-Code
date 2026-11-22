import {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowLeft, BookOpen, Check, Copy, Search, X} from 'lucide-react';
import {
  DictionaryEntry,
  DictionaryLanguage,
  WEB_DICTIONARY,
} from '../data/webDictionary';

interface DictionaryViewProps {
  onBackToEditor: () => void;
}

type LanguageFilter = 'all' | DictionaryLanguage;

const LANGUAGE_LABELS: Record<DictionaryLanguage, string> = {
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
};

const LANGUAGE_TEXT_COLORS: Record<DictionaryLanguage, string> = {
  html: 'text-orange-600 dark:text-orange-400',
  css: 'text-sky-600 dark:text-sky-400',
  js: 'text-amber-600 dark:text-amber-400',
};

function getEntryInitial(entry: DictionaryEntry): string {
  const first = entry.sortKey.charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

export function DictionaryView({onBackToEditor}: DictionaryViewProps) {
  const [query, setQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [selectedId, setSelectedId] = useState<string>(
    () => WEB_DICTIONARY[0]?.id ?? ''
  );
  const [activeLetter, setActiveLetter] = useState<string>(() =>
    WEB_DICTIONARY[0] ? getEntryInitial(WEB_DICTIONARY[0]) : 'A'
  );
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<'syntax' | 'example' | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const detailContainerRef = useRef<HTMLElement>(null);
  const suppressScrollLetterUntilRef = useRef<number>(0);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return WEB_DICTIONARY.filter((entry) => {
      if (languageFilter !== 'all' && entry.language !== languageFilter) {
        return false;
      }
      if (!normalized) return true;
      if (
        entry.term.toLowerCase().includes(normalized) ||
        entry.sortKey.includes(normalized) ||
        entry.summary.toLowerCase().includes(normalized) ||
        entry.category.toLowerCase().includes(normalized) ||
        entry.description.toLowerCase().includes(normalized)
      ) {
        return true;
      }
      return entry.specs.some(
        (spec) =>
          spec.name.toLowerCase().includes(normalized) ||
          spec.detail.toLowerCase().includes(normalized)
      );
    });
  }, [query, languageFilter]);

  const groupedByLetter = useMemo(() => {
    const groups: {letter: string; items: DictionaryEntry[]}[] = [];
    for (const entry of filteredEntries) {
      const letter = getEntryInitial(entry);
      const last = groups[groups.length - 1];
      if (!last || last.letter !== letter) {
        groups.push({letter, items: [entry]});
      } else {
        last.items.push(entry);
      }
    }
    return groups;
  }, [filteredEntries]);

  const activeEntry = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    return (
      filteredEntries.find((item) => item.id === selectedId) ?? filteredEntries[0]
    );
  }, [filteredEntries, selectedId]);

  const currentActiveLetter = useMemo(() => {
    if (groupedByLetter.length === 0) return '';
    if (groupedByLetter.some((group) => group.letter === activeLetter)) {
      return activeLetter;
    }
    return activeEntry ? getEntryInitial(activeEntry) : groupedByLetter[0].letter;
  }, [groupedByLetter, activeLetter, activeEntry]);

  useEffect(() => {
    if (activeEntry) {
      setActiveLetter(getEntryInitial(activeEntry));
    }
  }, [activeEntry]);

  const counts = useMemo(() => {
    let html = 0;
    let css = 0;
    let js = 0;
    for (const item of WEB_DICTIONARY) {
      if (item.language === 'html') html += 1;
      else if (item.language === 'css') css += 1;
      else js += 1;
    }
    return {all: WEB_DICTIONARY.length, html, css, js};
  }, []);

  const handleCopy = async (text: string, target: 'syntax' | 'example') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      window.setTimeout(() => setCopiedTarget(null), 1600);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleSelectEntry = (entry: DictionaryEntry) => {
    setSelectedId(entry.id);
    setActiveLetter(getEntryInitial(entry));
    setShowMobileDetail(true);
    setCopiedTarget(null);
    detailContainerRef.current?.scrollTo({top: 0});
  };

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    suppressScrollLetterUntilRef.current = Date.now() + 450;
    const el = listContainerRef.current?.querySelector<HTMLElement>(
      `[data-letter-group="${letter}"]`
    );
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  const handleListScroll = () => {
    if (Date.now() < suppressScrollLetterUntilRef.current) return;
    const container = listContainerRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;
    const groups = container.querySelectorAll<HTMLElement>('[data-letter-group]');
    let detected = groupedByLetter[0]?.letter ?? '';
    for (const groupEl of groups) {
      const rectTop = groupEl.getBoundingClientRect().top - containerTop;
      if (rectTop <= 32) {
        const letterAttr = groupEl.getAttribute('data-letter-group');
        if (letterAttr) detected = letterAttr;
      } else {
        break;
      }
    }
    if (detected && detected !== activeLetter) {
      setActiveLetter(detected);
    }
  };

  return (
    <div className="anim-page-in flex-1 min-h-0 flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden">
      {/* Dictionary header + search + language filter */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 sm:px-6 py-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen
              className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                Dicionário HTML, CSS e JS
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                {filteredEntries.length}{' '}
                {filteredEntries.length === 1 ? 'termo encontrado' : 'termos em ordem alfabética'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToEditor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Voltar ao editor</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search
              className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar palavra, tag, propriedade ou função (ex: flex, <div>, fetch)..."
              aria-label="Pesquisar palavra no dicionário"
              className="w-full pl-8 pr-8 py-2 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors duration-150"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpar pesquisa"
                className="anim-pop-in absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors duration-150 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filtrar por linguagem"
            className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shrink-0 self-start sm:self-auto"
          >
            {(
              [
                {id: 'all', label: `Todos (${counts.all})`},
                {id: 'html', label: `HTML (${counts.html})`},
                {id: 'css', label: `CSS (${counts.css})`},
                {id: 'js', label: `JS (${counts.js})`},
              ] as {id: LanguageFilter; label: string}[]
            ).map((option) => {
              const isSelectedFilter = languageFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelectedFilter}
                  onClick={() => setLanguageFilter(option.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                    isSelectedFilter
                      ? 'bg-white text-neutral-950 border border-neutral-300 shadow-xs font-semibold'
                      : 'border border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium'
                  }`}
                >
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {groupedByLetter.length > 1 && (
          <div
            aria-label="Índice alfabético rápido"
            className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] font-mono"
          >
            <span className="text-neutral-400 dark:text-neutral-500 mr-1 font-sans shrink-0">
              A–Z:
            </span>
            {groupedByLetter.map((group) => {
              const isCurrentLetter = currentActiveLetter === group.letter;
              return (
                <button
                  key={group.letter}
                  type="button"
                  aria-current={isCurrentLetter ? 'true' : undefined}
                  onClick={() => {
                    setShowMobileDetail(false);
                    scrollToLetter(group.letter);
                  }}
                  className={`min-w-[1.625rem] h-6 px-1.5 rounded-md flex items-center justify-center transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.94] cursor-pointer shrink-0 ${
                    isCurrentLetter
                      ? 'bg-white text-neutral-950 border border-neutral-300 shadow-xs font-bold scale-[1.03]'
                      : 'border border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  {group.letter}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main split: Alphabetical word list + Full word specification */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Alphabetical list with brief caption of what each word does */}
        <aside
          ref={listContainerRef}
          onScroll={handleListScroll}
          aria-label="Lista alfabética de palavras"
          className={`${
            showMobileDetail ? 'hidden lg:block' : 'block'
          } w-full lg:w-80 xl:w-96 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950 overflow-y-auto`}
        >
          {groupedByLetter.length === 0 ? (
            <div className="anim-content-in px-6 py-12 text-center space-y-2">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Nenhuma palavra encontrada
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Tente buscar outro termo ou limpe os filtros acima.
              </p>
            </div>
          ) : (
            groupedByLetter.map((group) => {
              const isCurrentLetter = currentActiveLetter === group.letter;
              return (
                <div key={group.letter} data-letter-group={group.letter}>
                  <div className="sticky top-0 z-10 px-4 py-1.5 bg-neutral-100/95 dark:bg-neutral-900/95 backdrop-blur-xs border-y border-neutral-200/70 dark:border-neutral-800/80 text-[11px] font-mono flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isCurrentLetter
                          ? 'bg-white text-neutral-950 border border-neutral-300 shadow-2xs scale-[1.03]'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {group.letter}
                    </span>
                    <span className="font-sans font-normal text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {group.items.length}
                    </span>
                  </div>

                  <ul className="divide-y divide-neutral-100 dark:divide-neutral-900">
                    {group.items.map((entry) => {
                      const isSelected = activeEntry?.id === entry.id;
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectEntry(entry)}
                            className={`w-full text-left px-4 py-3 transition-all duration-150 active:scale-[0.99] cursor-pointer ${
                              isSelected
                                ? 'bg-white dark:bg-neutral-900 shadow-2xs'
                                : 'hover:bg-white/70 dark:hover:bg-neutral-900/50'
                            }`}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-mono text-xs sm:text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {entry.term}
                              </span>
                              <span
                                className={`text-[11px] font-mono font-semibold uppercase shrink-0 ${
                                  LANGUAGE_TEXT_COLORS[entry.language]
                                }`}
                              >
                                {entry.language}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                              {entry.summary}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </aside>

        {/* Detailed word documentation */}
        <section
          ref={detailContainerRef}
          aria-label="Detalhes da palavra selecionada"
          className={`${
            showMobileDetail ? 'block' : 'hidden lg:block'
          } flex-1 min-w-0 overflow-y-auto bg-neutral-50/70 dark:bg-neutral-950 px-4 sm:px-8 py-6`}
        >
          {!activeEntry ? (
            <div className="anim-content-in h-full flex items-center justify-center text-center px-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Selecione uma palavra na lista ao lado para ver todos os detalhes.
              </p>
            </div>
          ) : (
            <div
              key={activeEntry.id}
              className="anim-content-in max-w-3xl mx-auto space-y-6 pb-8"
            >
              <button
                type="button"
                onClick={() => setShowMobileDetail(false)}
                className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Todas as palavras</span>
              </button>

              <header className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span
                    className={`font-mono font-semibold uppercase ${
                      LANGUAGE_TEXT_COLORS[activeEntry.language]
                    }`}
                  >
                    {LANGUAGE_LABELS[activeEntry.language]}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {activeEntry.category}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-neutral-900 dark:text-neutral-100 break-words">
                  {activeEntry.term}
                </h2>

                <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {activeEntry.summary}
                </p>
              </header>

              {/* What it does */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  O que faz
                </h3>
                <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {activeEntry.description}
                </p>
              </section>

              {/* Syntax */}
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Sintaxe
                  </h3>
                  <button
                    type="button"
                    onClick={() => void handleCopy(activeEntry.syntax, 'syntax')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-150 active:scale-[0.96] cursor-pointer"
                  >
                    {copiedTarget === 'syntax' ? (
                      <>
                        <Check
                          className="anim-pop-in w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copiar sintaxe</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono text-xs sm:text-[13px] leading-relaxed text-neutral-900 dark:text-neutral-100 overflow-x-auto m-0">
                  <code>{activeEntry.syntax}</code>
                </pre>
              </section>

              {/* Detailed Specs */}
              {activeEntry.specs.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {activeEntry.specsLabel}
                  </h3>
                  <dl className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {activeEntry.specs.map((spec) => (
                      <div
                        key={spec.name}
                        className="px-4 py-3 grid grid-cols-1 sm:grid-cols-[minmax(140px,auto)_1fr] gap-1.5 sm:gap-4"
                      >
                        <dt className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {spec.name}
                        </dt>
                        <dd className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                          {spec.detail}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* Notes */}
              {activeEntry.notes.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Observações e boas práticas
                  </h3>
                  <ul className="space-y-1.5 text-xs sm:text-[13px] text-neutral-700 dark:text-neutral-300 list-disc pl-5 leading-relaxed">
                    {activeEntry.notes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Practical Example */}
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Exemplo prático
                  </h3>
                  <button
                    type="button"
                    onClick={() => void handleCopy(activeEntry.example, 'example')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-150 active:scale-[0.96] cursor-pointer"
                  >
                    {copiedTarget === 'example' ? (
                      <>
                        <Check
                          className="anim-pop-in w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copiar exemplo</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono text-xs sm:text-[13px] leading-relaxed text-neutral-900 dark:text-neutral-100 overflow-x-auto m-0">
                  <code>{activeEntry.example}</code>
                </pre>
              </section>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
