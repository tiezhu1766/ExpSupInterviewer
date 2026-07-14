import { Component, type ReactNode } from 'react';
import { t } from '../i18n';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-surface border border-border-subtle rounded-2xl p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="w-16 h-16 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-danger/20">
              <AlertTriangle className="text-danger" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3 font-heading">{t('errorBoundary.title')}</h1>
            <p className="text-text-tertiary mb-6 leading-relaxed">
              {t('errorBoundary.description')}
            </p>
            {this.state.error && (
              <div className="bg-elevated/60 border border-subtle rounded-xl p-4 mb-6 text-left overflow-auto">
                <p className="text-danger/90 font-mono text-sm break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-text-on-accent font-semibold rounded-xl transition"
              >
                <Home size={18} />
                {t('errorBoundary.goHome')}
              </a>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-elevated hover:bg-elevated/80 text-text-primary font-semibold rounded-xl border border-border transition"
              >
                <RotateCcw size={18} />
                {t('errorBoundary.retry')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
