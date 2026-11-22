import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ocorreu um erro inesperado.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Erro capturado pelo ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
          <div className="max-w-md w-full p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <h1 className="text-base font-semibold mb-2">Algo deu errado</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
              Não foi possível concluir a operação. Recarregue a página para tentar novamente.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
