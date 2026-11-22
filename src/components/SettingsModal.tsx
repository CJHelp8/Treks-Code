import React, {useEffect, useRef, useState} from 'react';
import {User} from 'firebase/auth';
import {
  AlertCircle,
  Camera,
  Check,
  ChevronDown,
  Keyboard,
  LogIn,
  Palette,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {MAX_DISPLAY_NAME_LENGTH} from '../services/firestoreSnippets';
import {
  KeyBinding,
  ShortcutActionId,
  ShortcutMap,
  SoundSettings,
  SyntaxThemeId,
} from '../types/snippet';
import {playKeystrokeSound} from '../utils/sound';
import {
  SHORTCUT_ACTIONS,
  areBindingsEqual,
  captureKeyBindingFromEvent,
  findDuplicateShortcutGroups,
  findShortcutConflict,
  formatShortcutKeys,
  formatShortcutText,
  getDefaultShortcuts,
} from '../utils/shortcuts';
import {compressImageToDataUrl} from '../utils/storage';
import {SYNTAX_THEMES, getSyntaxTheme} from '../utils/syntaxThemes';
import {useAnimatedPresence} from '../utils/useAnimatedPresence';

interface SettingsModalProps {
  isOpen: boolean;
  user: User | null;
  profileName: string;
  profilePhoto: string;
  isSavingProfile: boolean;
  soundSettings: SoundSettings;
  theme: 'light' | 'dark';
  syntaxTheme: SyntaxThemeId;
  shortcuts: ShortcutMap;
  onClose: () => void;
  onSaveProfile: (name: string, photoURL: string) => Promise<void>;
  onSignIn: () => void;
  onChangeSoundSettings: (next: SoundSettings) => void;
  onChangeTheme: (theme: 'light' | 'dark') => void;
  onChangeSyntaxTheme: (syntaxTheme: SyntaxThemeId) => void;
  onChangeShortcuts: (shortcuts: ShortcutMap) => void;
  onOpenShortcuts: () => void;
}

function getInitials(name: string, email?: string | null): string {
  const source = (name || email || 'U').trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function SettingsModal({
  isOpen,
  user,
  profileName,
  profilePhoto,
  isSavingProfile,
  soundSettings,
  theme,
  syntaxTheme,
  shortcuts,
  onClose,
  onSaveProfile,
  onSignIn,
  onChangeSoundSettings,
  onChangeTheme,
  onChangeSyntaxTheme,
  onChangeShortcuts,
  onOpenShortcuts,
}: SettingsModalProps) {
  const [draftName, setDraftName] = useState(profileName);
  const [draftPhoto, setDraftPhoto] = useState(profilePhoto);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [isSyntaxThemesOpen, setIsSyntaxThemesOpen] = useState(false);
  const [recordingId, setRecordingId] = useState<ShortcutActionId | null>(null);
  const [shortcutNotice, setShortcutNotice] = useState<{
    message: string;
    swapActionId?: ShortcutActionId;
    pendingBinding?: KeyBinding;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {shouldRender, state} = useAnimatedPresence(isOpen, 150);

  const defaultShortcuts = React.useMemo(() => getDefaultShortcuts(), []);
  const hasCustomShortcuts = SHORTCUT_ACTIONS.some(
    (action) => !areBindingsEqual(shortcuts[action.id], defaultShortcuts[action.id])
  );
  const duplicateGroups = React.useMemo(
    () => findDuplicateShortcutGroups(shortcuts),
    [shortcuts]
  );
  const duplicateActionIds = React.useMemo(() => {
    const ids = new Set<ShortcutActionId>();
    for (const group of duplicateGroups) {
      for (const action of group.actions) {
        ids.add(action.id);
      }
    }
    return ids;
  }, [duplicateGroups]);
  const activeSyntaxOption = React.useMemo(
    () => SYNTAX_THEMES.find((item) => item.id === syntaxTheme) ?? SYNTAX_THEMES[0],
    [syntaxTheme]
  );
  const activeSyntaxResolved = React.useMemo(
    () => getSyntaxTheme(syntaxTheme, theme),
    [syntaxTheme, theme]
  );

  useEffect(() => {
    if (isOpen) {
      setDraftName(profileName);
      setDraftPhoto(profilePhoto);
      setPhotoError(null);
      setPreviewBroken(false);
    } else {
      setIsSyntaxThemesOpen(false);
      setRecordingId(null);
      setShortcutNotice(null);
    }
  }, [isOpen, profileName, profilePhoto]);

  useEffect(() => {
    if (!isOpen || !recordingId) return;

    const handleCaptureKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const captured = captureKeyBindingFromEvent(event);
      if (!captured.ok) {
        if (captured.reason === 'cancel') {
          setRecordingId(null);
          setShortcutNotice(null);
        } else if (captured.reason === 'needs-modifier') {
          setShortcutNotice({
            message: 'Combine com Ctrl, Alt ou ⌘ (ou escolha uma tecla de função F1–F12).',
          });
        }
        return;
      }

      const conflict = findShortcutConflict(shortcuts, recordingId, captured.binding);
      if (conflict) {
        setShortcutNotice({
          message: `Atalho repetido: "${formatShortcutText(captured.binding)}" já está em "${conflict.label}".`,
          swapActionId: conflict.id,
          pendingBinding: captured.binding,
        });
        return;
      }

      onChangeShortcuts({
        ...shortcuts,
        [recordingId]: captured.binding,
      });
      setRecordingId(null);
      setShortcutNotice(null);
    };

    window.addEventListener('keydown', handleCaptureKeyDown, true);
    return () => window.removeEventListener('keydown', handleCaptureKeyDown, true);
  }, [isOpen, recordingId, shortcuts, onChangeShortcuts]);

  if (!shouldRender) return null;

  const isClosing = state === 'closing';

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPhotoError(null);
    setPreviewBroken(false);
    try {
      const compressed = await compressImageToDataUrl(file);
      setDraftPhoto(compressed);
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : 'Não foi possível carregar a imagem.'
      );
    }
  };

  const handleSubmitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSaveProfile(draftName, draftPhoto);
  };

  const hasProfileChanges =
    draftName.trim() !== profileName.trim() || draftPhoto.trim() !== profilePhoto.trim();

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${
        isClosing ? 'pointer-events-none' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Configurações"
    >
      <div
        className={`fixed inset-0 bg-neutral-950/30 dark:bg-black/60 backdrop-blur-[1px] ${
          isClosing ? 'anim-backdrop-out' : 'anim-backdrop-in'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-full max-w-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-lg max-h-[90dvh] flex flex-col ${
          isClosing ? 'anim-modal-out' : 'anim-modal-in'
        }`}
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Configurações
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Personalize seu perfil, som do teclado e aparência.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Profile Section */}
          <form onSubmit={(e) => void handleSubmitProfile(e)} className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Perfil
              </h3>
              {!user && (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sincronizar com Google</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {draftPhoto && !previewBroken ? (
                <img
                  src={draftPhoto}
                  alt={draftName || 'Foto de perfil'}
                  referrerPolicy="no-referrer"
                  onError={() => setPreviewBroken(true)}
                  className="w-16 h-16 rounded-full object-cover border border-neutral-200 dark:border-neutral-800 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-lg font-semibold flex items-center justify-center shrink-0">
                  {getInitials(draftName, user?.email)}
                </div>
              )}

              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handlePhotoSelect(e)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Escolher foto</span>
                  </button>

                  {draftPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftPhoto('');
                        setPhotoError(null);
                        setPreviewBroken(false);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  PNG, JPG ou WebP ajustados automaticamente para avatar.
                </p>
                {photoError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-name-input"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Nome de exibição
              </label>
              <input
                id="profile-name-input"
                type="text"
                value={draftName}
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Como você quer ser chamado..."
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {user ? `Conta: ${user.email}` : 'Modo local (sem login)'}
              </span>
              <button
                type="submit"
                disabled={isSavingProfile || !hasProfileChanges}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isSavingProfile ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </form>

          <hr className="border-neutral-200 dark:border-neutral-800" />

          {/* Typing Sound Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-neutral-700 dark:text-neutral-300">
                  {soundSettings.enabled ? (
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <VolumeX className="w-4 h-4" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Som ao digitar
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Efeito tátil de teclado mecânico enquanto você escreve código.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={soundSettings.enabled}
                aria-label="Ativar ou desativar som ao digitar"
                onClick={() => {
                  const nextEnabled = !soundSettings.enabled;
                  onChangeSoundSettings({...soundSettings, enabled: nextEnabled});
                  if (nextEnabled) {
                    playKeystrokeSound(soundSettings.volume);
                  }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 ${
                  soundSettings.enabled
                    ? 'bg-neutral-900 dark:bg-neutral-100'
                    : 'bg-neutral-200 dark:bg-neutral-800'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-950 shadow-xs transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    soundSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {soundSettings.enabled && (
              <div className="anim-slide-down flex items-center gap-3 pl-7">
                <label
                  htmlFor="sound-volume-slider"
                  className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
                >
                  Volume
                </label>
                <input
                  id="sound-volume-slider"
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.05}
                  value={soundSettings.volume}
                  onChange={(e) =>
                    onChangeSoundSettings({
                      ...soundSettings,
                      volume: parseFloat(e.target.value),
                    })
                  }
                  className="flex-1 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                />
                <span className="font-mono text-xs tabular-nums text-neutral-500 dark:text-neutral-400 w-9 text-right">
                  {Math.round(soundSettings.volume * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => playKeystrokeSound(soundSettings.volume)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.96] cursor-pointer"
                >
                  Testar
                </button>
              </div>
            )}
          </div>

          <hr className="border-neutral-200 dark:border-neutral-800" />

          {/* Appearance Section */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Tema
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Escolha entre interface clara ou escura.
              </p>
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                Claro
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                Escuro
              </button>
            </div>
          </div>

          <hr className="border-neutral-200 dark:border-neutral-800" />

          {/* Collapsible Syntax Color Scheme Box */}
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50/40 dark:bg-neutral-900/20">
            <button
              type="button"
              aria-expanded={isSyntaxThemesOpen}
              onClick={() => setIsSyntaxThemesOpen((prev) => !prev)}
              className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 text-neutral-700 dark:text-neutral-300 shrink-0">
                  <Palette className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Esquema de cores de sintaxe
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                    Atual: {activeSyntaxOption.name} · {activeSyntaxOption.toneLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="flex items-center gap-1" aria-hidden="true">
                  <span
                    className="w-2.5 h-2.5 rounded-xs border border-black/10 dark:border-white/15"
                    style={{backgroundColor: activeSyntaxResolved.tokens.keyword}}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-xs border border-black/10 dark:border-white/15"
                    style={{backgroundColor: activeSyntaxResolved.tokens.fn}}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-xs border border-black/10 dark:border-white/15"
                    style={{backgroundColor: activeSyntaxResolved.tokens.string}}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-xs border border-black/10 dark:border-white/15"
                    style={{backgroundColor: activeSyntaxResolved.tokens.tag}}
                  />
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSyntaxThemesOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  aria-hidden="true"
                />
              </div>
            </button>

            {isSyntaxThemesOpen && (
              <div className="anim-collapse-in px-3.5 pb-3.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SYNTAX_THEMES.map((schemeOption) => {
                    const resolved = getSyntaxTheme(schemeOption.id, theme);
                    const isSelected = syntaxTheme === schemeOption.id;
                    return (
                      <button
                        key={schemeOption.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onChangeSyntaxTheme(schemeOption.id)}
                        className={`group text-left rounded-lg border p-2.5 transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 ${
                          isSelected
                            ? 'border-neutral-900 dark:border-neutral-100 ring-1 ring-neutral-900 dark:ring-neutral-100 bg-neutral-50/70 dark:bg-neutral-900/60'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {schemeOption.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {schemeOption.toneLabel}
                            </span>
                            {isSelected && (
                              <Check
                                className="anim-pop-in w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        </div>

                        <div
                          aria-hidden="true"
                          style={{
                            backgroundColor: resolved.bg,
                            borderColor: resolved.border,
                            color: resolved.text,
                          }}
                          className="rounded-md border px-2.5 py-2 font-mono text-[11px] leading-[16px] overflow-hidden select-none"
                        >
                          <div className="truncate">
                            <span style={{color: resolved.tokens.keyword}}>const</span>{' '}
                            <span>app</span>{' '}
                            <span style={{color: resolved.tokens.operator}}>=</span>{' '}
                            <span style={{color: resolved.tokens.string}}>&quot;Treks&quot;</span>
                            <span style={{color: resolved.tokens.punctuation}}>;</span>
                          </div>
                          <div className="truncate">
                            <span style={{color: resolved.tokens.fn}}>render</span>
                            <span style={{color: resolved.tokens.punctuation}}>(</span>
                            <span style={{color: resolved.tokens.number}}>42</span>
                            <span style={{color: resolved.tokens.punctuation}}>)</span>{' '}
                            <span style={{color: resolved.tokens.comment}}>// ok</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <hr className="border-neutral-200 dark:border-neutral-800" />

          {/* Keyboard Shortcuts Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-neutral-700 dark:text-neutral-300">
                  <Keyboard className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Atalhos de teclado
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Clique em um atalho e pressione as teclas que quiser usar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {hasCustomShortcuts && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecordingId(null);
                      setShortcutNotice(null);
                      onChangeShortcuts(defaultShortcuts);
                    }}
                    title="Restaurar todos os atalhos padrão"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Restaurar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setRecordingId(null);
                    setShortcutNotice(null);
                    onOpenShortcuts();
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Ver todos
                </button>
              </div>
            </div>

            {duplicateGroups.length > 0 && (
              <div
                role="alert"
                className="anim-slide-down px-3 py-2.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30 text-xs text-red-800 dark:text-red-200 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Atalhos repetidos detectados</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRecordingId(null);
                      setShortcutNotice(null);
                      onChangeShortcuts(defaultShortcuts);
                    }}
                    className="text-[11px] font-semibold underline hover:opacity-80 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Corrigir com padrão
                  </button>
                </div>
                <ul className="space-y-0.5 text-[11px] pl-5 list-disc">
                  {duplicateGroups.map((group) => (
                    <li key={group.bindingText}>
                      <span className="font-mono font-semibold">{group.bindingText}</span>{' '}
                      está repetido em:{' '}
                      {group.actions.map((a) => a.label).join(', ')}.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {shortcutNotice && (
              <div
                role="alert"
                className="anim-slide-down flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{shortcutNotice.message}</span>
                </div>
                {recordingId &&
                  shortcutNotice.swapActionId &&
                  shortcutNotice.pendingBinding && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const swapId = shortcutNotice.swapActionId!;
                          const nextBinding = shortcutNotice.pendingBinding!;
                          const previousBinding = shortcuts[recordingId];
                          onChangeShortcuts({
                            ...shortcuts,
                            [recordingId]: nextBinding,
                            [swapId]: previousBinding,
                          });
                          setRecordingId(null);
                          setShortcutNotice(null);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Trocar atalhos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onChangeShortcuts({
                            ...shortcuts,
                            [recordingId]: shortcutNotice.pendingBinding!,
                          });
                          setRecordingId(null);
                          setShortcutNotice(null);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-amber-300 dark:border-amber-700 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Usar mesmo assim
                      </button>
                    </div>
                  )}
              </div>
            )}

            <ul className="rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-900 overflow-hidden">
              {SHORTCUT_ACTIONS.map((action) => {
                const binding = shortcuts[action.id];
                const isRecording = recordingId === action.id;
                const isDuplicate = duplicateActionIds.has(action.id);
                const isModified = !areBindingsEqual(
                  binding,
                  defaultShortcuts[action.id]
                );
                const keyLabels = formatShortcutKeys(binding);

                return (
                  <li
                    key={action.id}
                    className={`px-3 py-2.5 flex items-center justify-between gap-3 ${
                      isDuplicate
                        ? 'bg-red-50/40 dark:bg-red-950/15'
                        : 'bg-white dark:bg-neutral-950'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {action.label}
                        </p>
                        {isDuplicate && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400 shrink-0">
                            · Repetido
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {action.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isModified && !isRecording && (
                        <button
                          type="button"
                          onClick={() => {
                            const conflict = findShortcutConflict(
                              shortcuts,
                              action.id,
                              defaultShortcuts[action.id]
                            );
                            if (conflict) {
                              onChangeShortcuts({
                                ...shortcuts,
                                [action.id]: defaultShortcuts[action.id],
                                [conflict.id]: shortcuts[action.id],
                              });
                            } else {
                              onChangeShortcuts({
                                ...shortcuts,
                                [action.id]: defaultShortcuts[action.id],
                              });
                            }
                            setShortcutNotice(null);
                          }}
                          aria-label={`Restaurar atalho padrão de ${action.label}`}
                          title="Restaurar padrão"
                          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShortcutNotice(null);
                          setRecordingId((prev) =>
                            prev === action.id ? null : action.id
                          );
                        }}
                        aria-pressed={isRecording}
                        aria-label={
                          isRecording
                            ? `Gravando novo atalho para ${action.label}. Pressione Esc para cancelar.`
                            : `Editar atalho para ${action.label}: ${formatShortcutText(binding)}`
                        }
                        title={
                          isRecording
                            ? 'Pressione a combinação desejada ou Esc para cancelar'
                            : 'Clique para alterar teclas'
                        }
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border transition-all duration-150 active:scale-[0.97] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 ${
                          isRecording
                            ? 'border-neutral-900 dark:border-neutral-100 ring-1 ring-neutral-900 dark:ring-neutral-100 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'
                            : isDuplicate
                            ? 'border-red-300 dark:border-red-800 bg-red-50/70 dark:bg-red-950/30 hover:border-red-400 dark:hover:border-red-700'
                            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 hover:border-neutral-400 dark:hover:border-neutral-600'
                        }`}
                      >
                        {isRecording ? (
                          <span className="text-[11px] font-medium px-1">
                            Pressione as teclas...
                          </span>
                        ) : (
                          keyLabels.map((keyLabel, idx) => (
                            <React.Fragment key={`${action.id}-${idx}-${keyLabel}`}>
                              {idx > 0 && (
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                  +
                                </span>
                              )}
                              <kbd className="inline-flex items-center justify-center min-w-[1.35rem] px-1 py-0.5 text-[11px] font-mono font-medium rounded border border-neutral-200/90 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">
                                {keyLabel}
                              </kbd>
                            </React.Fragment>
                          ))
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
