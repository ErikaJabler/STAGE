import type { AdminDashboardData } from '@stage/shared';

const categoryLabels: Record<string, string> = {
  internal: 'Intern',
  public_sector: 'Offentlig sektor',
  private_sector: 'Privat sektor',
  partner: 'Partner',
  other: 'Övrig',
};

export function DashboardStats({
  dashboard,
  totalEvents,
}: {
  dashboard: AdminDashboardData;
  totalEvents: number;
}) {
  return (
    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Totalt events</div>
        <div style={styles.statValue}>{dashboard.total_events ?? 0}</div>
        <div style={styles.statMeta}>
          <span style={styles.statActive}>{dashboard.active_events ?? 0} kommande</span>
          {' · '}
          <span>{dashboard.historical_events ?? 0} historiska</span>
        </div>
      </div>

      <div style={styles.statCard}>
        <div style={styles.statLabel}>Totalt deltagare</div>
        <div style={styles.statValue}>{dashboard.total_participants ?? 0}</div>
        <div style={styles.statMeta}>
          {dashboard.participants_by_category &&
            Object.entries(dashboard.participants_by_category).map(([cat, count]) => (
              <span key={cat} style={styles.categoryChip}>
                {categoryLabels[cat] || cat}: {count}
              </span>
            ))}
        </div>
      </div>

      <div style={styles.statCard}>
        <div style={styles.statLabel}>Alla events</div>
        <div style={styles.statValue}>{totalEvents}</div>
        <div style={styles.statMeta}>Totalt i systemet (ej borttagna)</div>
      </div>

      <div style={styles.statCard}>
        <div style={styles.statLabel}>Senaste utskick</div>
        <div style={styles.statValue}>{dashboard.recent_mailings?.length ?? 0}</div>
        <div style={styles.statMeta}>De 20 senaste</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    border: '1px solid var(--color-border)',
  },
  statLabel: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 600,
    color: 'var(--color-burgundy)',
    lineHeight: 1.2,
  },
  statMeta: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    marginTop: '4px',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '4px',
  },
  statActive: {
    color: 'var(--color-raspberry-red)',
    fontWeight: 500,
  },
  categoryChip: {
    backgroundColor: 'var(--color-beige)',
    padding: '1px 8px',
    borderRadius: '10px',
    fontSize: '11px',
  },
};
