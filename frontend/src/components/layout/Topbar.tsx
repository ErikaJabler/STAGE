import { SearchBar } from './SearchBar';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header style={styles.topbar}>
      <div style={styles.titleArea}>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
      </div>
      <div style={styles.rightArea}>
        <SearchBar />
        {actions && <div style={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    height: 'var(--topbar-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    backgroundColor: 'var(--color-bg-primary)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 'var(--z-topbar)' as unknown as number,
  },
  titleArea: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  title: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
  },
  rightArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};
