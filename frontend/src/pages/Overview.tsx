import { Link } from 'react-router-dom';
import { Topbar } from '../components/layout';
import { Badge, Button, EventGridSkeleton } from '../components/ui';
import { useEvents } from '../hooks/useEvents';
import type { EventWithCount } from '@stage/shared';

export function Overview() {
  const { data: events, isLoading, error } = useEvents();

  return (
    <>
      <Topbar
        title="Översikt"
        subtitle={events ? `${events.length} event` : undefined}
        actions={
          <Link to="/events/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md">
              + Nytt event
            </Button>
          </Link>
        }
      />
      <div style={styles.content}>
        {isLoading ? (
          <EventGridSkeleton count={4} />
        ) : error ? (
          <ErrorState message="Kunde inte hämta events." />
        ) : events && events.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={styles.grid}>
            {events?.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EventCard({ event }: { event: EventWithCount }) {
  const dateStr = formatDate(event.date);
  const statusBadge = getStatusBadge(event.status);

  return (
    <Link to={`/events/${event.id}`} style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.emoji}>{event.emoji}</span>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>
      <h3 style={styles.cardTitle}>{event.name}</h3>
      <div style={styles.cardMeta}>
        <MetaItem icon={<CalendarIcon />} text={dateStr} />
        <MetaItem icon={<LocationIcon />} text={event.location} />
        <MetaItem
          icon={<PeopleIcon />}
          text={
            event.max_participants
              ? `${event.participant_count}/${event.max_participants}`
              : `${event.participant_count} deltagare`
          }
        />
      </div>
      <div style={styles.cardFooter}>
        <span style={styles.organizer}>{event.organizer}</span>
        <TypeBadge type={event.type} />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="12" width="48" height="40" rx="4" stroke="var(--color-greige)" strokeWidth="2" />
          <path d="M8 22h48" stroke="var(--color-greige)" strokeWidth="2" />
          <circle cx="16" cy="17" r="2" fill="var(--color-greige)" />
          <circle cx="24" cy="17" r="2" fill="var(--color-greige)" />
          <circle cx="32" cy="17" r="2" fill="var(--color-greige)" />
        </svg>
      </div>
      <h3 style={styles.emptyTitle}>Inga event ännu</h3>
      <p style={styles.emptyText}>Skapa ditt första event för att komma igång.</p>
      <Link to="/events/new" style={{ textDecoration: 'none' }}>
        <Button variant="primary">+ Nytt event</Button>
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="24" stroke="var(--color-danger)" strokeWidth="2" />
          <path d="M32 20v16" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="44" r="1.5" fill="var(--color-danger)" />
        </svg>
      </div>
      <h3 style={styles.emptyTitle}>Något gick fel</h3>
      <p style={styles.emptyText}>{message}</p>
    </div>
  );
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={styles.metaItem}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    conference: 'Konferens',
    workshop: 'Workshop',
    seminar: 'Seminarium',
    networking: 'Networking',
    internal: 'Internt',
    other: 'Övrigt',
  };
  return <span style={styles.typeBadge}>{labels[type] || type}</span>;
}

function getStatusBadge(status: string): { variant: 'default' | 'success' | 'warning' | 'danger' | 'muted'; label: string } {
  switch (status) {
    case 'planning': return { variant: 'muted', label: 'Planering' };
    case 'upcoming': return { variant: 'default', label: 'Kommande' };
    case 'ongoing': return { variant: 'success', label: 'Pågår' };
    case 'completed': return { variant: 'muted', label: 'Avslutad' };
    case 'cancelled': return { variant: 'danger', label: 'Inställd' };
    default: return { variant: 'muted', label: status };
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 1v3M10 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 13S2 8.5 2 5.5a5 5 0 1 1 10 0C12 8.5 7 13 7 13z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="10" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 8c1.4.4 2.5 1.7 2.5 3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    padding: '24px 32px',
    flex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'box-shadow var(--transition-fast), transform var(--transition-fast)',
    border: '1px solid var(--color-border)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: '24px',
  },
  cardTitle: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
    lineHeight: 'var(--line-height-tight)',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '1px solid var(--color-border)',
  },
  organizer: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
  typeBadge: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center',
    gap: '12px',
  },
  emptyIcon: {
    marginBottom: '8px',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
  },
  emptyText: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-muted)',
    marginBottom: '8px',
  },
};
