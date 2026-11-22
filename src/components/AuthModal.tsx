import {LogIn, X} from 'lucide-react';
import {useAnimatedPresence} from '../utils/useAnimatedPresence';

interface AuthModalProps {
  isOpen: boolean;
  isSigningIn: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSignIn: () => void;
}

export function AuthModal({
  isOpen,
  isSigningIn,
  errorMessage,
  onClose,
  onSignIn,
}: AuthModalProps) {
  const {shouldRender, state} = useAnimatedPresence(isOpen, 150);

  if (!shouldRender) return null;

  const isClosing = state === 'closing';

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${
        isClosing ? 'pointer-events-none' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Entrar na sua conta"
    >
      <div
        className={`fixed inset-0 bg-neutral-950/30 dark:bg-black/60 backdrop-blur-[1px] ${
          isClosing ? 'anim-backdrop-out' : 'anim-backdrop-in'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-full max-w-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-lg ${
          isClosing ? 'anim-modal-out' : 'anim-modal-in'
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Entrar para salvar códigos
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 -mr-1.5 -mt-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">
          Entre com sua conta Google para armazenar seus projetos apenas na sua conta e acessá-los de qualquer dispositivo.
        </p>

        {errorMessage && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
            {errorMessage}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSignIn}
            disabled={isSigningIn}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50 transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isSigningIn ? 'Entrando...' : 'Entrar com Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
