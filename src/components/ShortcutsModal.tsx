import React from 'react';
import {Keyboard, X} from 'lucide-react';
import {ShortcutMap} from '../types/snippet';
import {SHORTCUT_ACTIONS, formatShortcutKeys} from '../utils/shortcuts';
import {useAnimatedPresence} from '../utils/useAnimatedPresence';

interface ShortcutsModalProps {
  isOpen: boolean;
  shortcuts: ShortcutMap;
  onClose: () => void;
}

interface ShortcutItem {
  description: string;
  keys: string[];
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export function ShortcutsModal({isOpen, shortcuts, onClose}: ShortcutsModalProps) {
  const {shouldRender, state} = useAnimatedPresence(isOpen, 150);

  const groups: ShortcutGroup[] = React.useMemo(() => {
    const projectItems: ShortcutItem[] = SHORTCUT_ACTIONS.filter(
      (a) => a.group === 'project'
    ).map((a) => ({
      description: a.label,
      keys: formatShortcutKeys(shortcuts[a.id]),
    }));
    projectItems.push({
      description: 'Fechar painéis ou voltar da execução',
      keys: ['Esc'],
    });

    const editorItems: ShortcutItem[] = [
      ...SHORTCUT_ACTIONS.filter((a) => a.group === 'editor').map((a) => ({
        description: a.label,
        keys: formatShortcutKeys(shortcuts[a.id]),
      })),
      {description: 'Inserir indentação (2 ou 4 espaços)', keys: ['Tab']},
      {description: 'Recuar indentação da linha', keys: ['Shift', 'Tab']},
      {description: 'Nova linha mantendo a indentação', keys: ['Enter']},
    ];

    return [
      {title: 'Ações do projeto', items: projectItems},
      {title: 'Editor de código', items: editorItems},
      {
        title: 'Seleção e texto',
        items: [
          {description: 'Selecionar todo o código da aba', keys: ['Ctrl', 'A']},
          {description: 'Desfazer última alteração', keys: ['Ctrl', 'Z']},
          {description: 'Refazer alteração', keys: ['Ctrl', 'Shift', 'Z']},
        ],
      },
    ];
  }, [shortcuts]);

  if (!shouldRender) return null;

  const isClosing = state === 'closing';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? 'pointer-events-none' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Atalhos de teclado"
    >
      <div
        className={`fixed inset-0 bg-neutral-950/35 dark:bg-black/65 backdrop-blur-[1px] ${
          isClosing ? 'anim-backdrop-out' : 'anim-backdrop-in'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-full max-w-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-lg max-h-[90dvh] flex flex-col ${
          isClosing ? 'anim-modal-out' : 'anim-modal-in'
        }`}
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Keyboard className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Atalhos de teclado
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Comandos rápidos disponíveis no editor e na execução.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar atalhos de teclado"
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {groups.map((group, groupIndex) => (
            <div key={group.title} className="space-y-2.5">
              {groupIndex > 0 && (
                <hr className="border-neutral-200 dark:border-neutral-800 mb-4" />
              )}
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {group.title}
              </h3>

              <ul className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {group.items.map((item) => (
                  <li
                    key={item.description}
                    className="py-2.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm">
                      {item.description}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((keyLabel, idx) => (
                        <React.Fragment key={`${idx}-${keyLabel}`}>
                          {idx > 0 && (
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                              +
                            </span>
                          )}
                          <kbd className="inline-flex items-center justify-center min-w-[1.6rem] px-1.5 py-0.5 text-[11px] font-mono font-medium rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                            {keyLabel}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between gap-4">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Personalize seus atalhos a qualquer momento em Configurações.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
