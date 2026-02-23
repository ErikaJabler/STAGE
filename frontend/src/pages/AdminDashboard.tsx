import { useNavigate } from 'react-router-dom';
import { useAdminDashboard, useAdminEvents } from '../hooks/useAdmin';

export function AdminDashboard() {
  const navigate = useNavigate();
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

  const categoryLabels: Record<string, string> = {
    internal: 'Intern',
    public_sector: 'Offentlig sektor',
    private_sector: 'Privat sektor',
    partner: 'Partner',
    other: 'Övrig',
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Administratörsöversikt</h1>
        <button onClick={() => refetch()} style={styles.refreshBtn}>
          Uppdatera
        </button>
      </div>

      {/* Stats cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Totalt events</div>
          <div style={styles.statValue}>{dashboard?.total_events ?? 0}</div>
          <div style={styles.statMeta}>
            <span style={styles.statActive}>{dashboard?.active_events ?? 0} kommande</span>
            {' · '}
            <span>{dashboard?.historical_events ?? 0} historiska</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Totalt deltagare</div>
          <div style={styles.statValue}>{dashboard?.total_participants ?? 0}</div>
          <div style={styles.statMeta}>
            {dashboard?.participants_by_category && Object.entries(dashboard.participants_by_category).map(([cat, count]) => (
              <span key={cat} style={styles.categoryChip}>
                {categoryLabels[cat] || cat}: {count}
              </span>
            ))}
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Alla events</div>
          <div style={styles.statValue}>{allEvents?.length ?? 0}</div>
          <div style={styles.statMeta}>Totalt i systemet (ej borttagna)</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Senaste utskick</div>
          <div style={styles.statValue}>{dashboard?.recent_mailings?.length ?? 0}</div>
          <div style={styles.statMeta}>De 20 senaste</div>
        </div>
      </div>

      {/* Upcoming events table */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Kommande events</h2>
        {dashboard?.upcoming_events && dashboard.upcoming_events.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Event</th>
                  <th style={styles.th}>Datum</th>
                  <th style={styles.th}>Plats</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Deltagare</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Dagar kvar</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.upcoming_events.map((event) => (
                  <tr
                    key={event.id}
                    style={styles.tr}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <td style={styles.td}>
                      <span style={styles.eventName}>
                        {event.emoji && <span>{event.emoji} </span>}
                        {event.name}
                      </span>
                    </td>
                    <td style={styles.td}>{event.date}</td>
                    <td style={styles.td}>{event.location}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {event.participant_count}
                      {event.max_participants && (
                        <span style={styles.capacity}> / {event.max_participants}</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <span style={{
                        ...styles.daysBadge,
                        ...(event.days_until <= 7 ? styles.daysBadgeUrgent : {}),
                      }}>
                        {event.days_until === 0 ? 'Idag' : `${event.days_until} d`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.emptyText}>Inga kommande events.</p>
        )}
      </section>

      {/* Recent mailings table */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Senaste utskick</h2>
        {dashboard?.recent_mailings && dashboard.recent_mailings.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Event</th>
                  <th style={styles.th}>Ämne</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Datum</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent_mailings.map((m) => (
                  <tr
                    key={m.id}
                    style={styles.tr}
                    onClick={() => navigate(`/events/${m.event_id}`)}
                  >
                    <td style={styles.td}>{m.event_name}</td>
                    <td style={styles.td}>{m.subject}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(m.status === 'sent' ? styles.statusSent : styles.statusDraft),
                      }}>
                        {m.status === 'sent' ? 'Skickat' : 'Utkast'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {m.sent_at
                        ? new Date(m.sent_at).toLocaleDateString('sv-SE')
                        : new Date(m.created_at).toLocaleDateString('sv-SE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.emptyText}>Inga utskick ännu.</p>
        )}
      </section>

      {/* All events list */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Alla events</h2>
        {allEvents && allEvents.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Event</th>
                  <th style={styles.th}>Datum</th>
                  <th style={styles.th}>Plats</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Deltagare</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((event) => (
                  <tr
                    key={event.id}
                    style={styles.tr}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <td style={styles.td}>
                      {event.emoji && <span>{event.emoji} </span>}
                      {event.name}
                    </td>
                    <td style={styles.td}>{event.date}</td>
                    <td style={styles.td}>{event.location}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(event.status === 'upcoming' ? styles.statusUpcoming :
                          event.status === 'completed' ? styles.statusCompleted :
                          event.status === 'cancelled' ? styles.statusCancelled :
                          styles.statusDraft),
                      }}>
                        {statusLabels[event.status] || event.status}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {event.participant_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.emptyText}>Inga events.</p>
        )}
      </section>
    </div>
  );
}

const statusLabels: Record<string, string> = {
  planning: 'Planering',
  upcoming: 'Kommande',
  ongoing: 'Pågående',
  completed: 'Avslutat',
  cancelled: 'Inställt',
};

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
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--color-black)',
    marginBottom: '12px',
  },
  tableWrapper: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 'var(--font-size-sm)',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 16px',
    borderBottom: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '10px 16px',
    borderBottom: '1px solid var(--color-border)',
    verticalAlign: 'middle' as const,
  },
  eventName: {
    fontWeight: 500,
    color: 'var(--color-burgundy)',
  },
  capacity: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-xs)',
  },
  daysBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: 'var(--color-beige)',
    color: 'var(--color-black)',
  },
  daysBadgeUrgent: {
    backgroundColor: 'var(--color-raspberry-red)',
    color: 'white',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 500,
  },
  statusSent: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  statusDraft: {
    backgroundColor: 'var(--color-beige)',
    color: 'var(--color-text-secondary)',
  },
  statusUpcoming: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
  },
  statusCompleted: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  statusCancelled: {
    backgroundColor: '#fce4ec',
    color: '#c62828',
  },
  emptyText: {
    color: 'var(--color-text-secondary)',
    fontStyle: 'italic',
    padding: '16px 0',
  },
};
