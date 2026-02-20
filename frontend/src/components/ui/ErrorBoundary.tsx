import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={styles.container}>
          <div style={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="var(--color-greige)" strokeWidth="2" />
              <path d="M24 14v12M24 30v4" stroke="var(--color-greige)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 style={styles.title}>Något gick fel</h2>
          <p style={styles.message}>
            {this.state.error?.message || 'Ett oväntat fel uppstod.'}
          </p>
          <Button variant="secondary" onClick={this.handleReset}>
            Försök igen
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    gap: '12px',
  },
  icon: {
    marginBottom: '8px',
    opacity: 0.6,
  },
  title: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
  },
  message: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-muted)',
    maxWidth: '400px',
    marginBottom: '8px',
  },
};
