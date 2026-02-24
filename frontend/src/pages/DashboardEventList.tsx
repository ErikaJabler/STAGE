import { useNavigate } from 'react-router-dom';
import type { AdminDashboardData } from '@stage/shared';
import type { EventWithCount } from '@stage/shared';

const statusLabels: Record<string, string> = {
  planning: 'Planering',
  upcoming: 'Kommande',
  ongoing: 'Pågående',
  completed: 'Avslutat',
  cancelled: 'Inställt',
};

export function DashboardEventList({ dashboard, allEvents }: {
  dashboard: AdminDashboardData;
  allEvents: EventWithCount[];
}) {
  const navigate = useNavigate();

  return (
    <>
      {/* Upcoming events table */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Kommande events</h2>
        {dashboard.upcoming_events && dashboard.upcoming_events.length > 0 ? (
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
        {dashboard.recent_mailings && dashboard.recent_mailings.length > 0 ? (
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
        {allEvents.length > 0 ? (
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
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
