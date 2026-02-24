import { useAdminDashboard, useAdminEvents } from '../hooks/useAdmin';
import { DashboardStats } from './DashboardStats';
import { DashboardEventList } from './DashboardEventList';

export function AdminDashboard() {
  const { data: dashboard, isLoading: dashLoading, error: dashError, refetch } = useAdminDashboard();
  const { data: allEvents, isLoading: eventsLoading } = useAdminEvents();

  if (dashLoading || eventsLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>Administratörsöversikt</h1>
        </div>
        <div style={styles.loading}>Laddar...</div>
      </div>
    );
  }

  if (dashError) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>Administratörsöversikt</h1>
        </div>
        <div style={styles.error}>Kunde inte ladda admin-data. Kontrollera att du har admin-behörighet.</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Administratörsöversikt</h1>
        <button onClick={() => refetch()} style={styles.refreshBtn}>
          Uppdatera
        </button>
      </div>

      {dashboard && (
        <>
          <DashboardStats dashboard={dashboard} totalEvents={allEvents?.length ?? 0} />
          <DashboardEventList dashboard={dashboard} allEvents={allEvents ?? []} />
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '32px',
    maxWidth: '1200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--color-burgundy)',
    margin: 0,
  },
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--color-burgundy)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: 'var(--color-text-secondary)',
  },
  error: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#c33',
  },
};
