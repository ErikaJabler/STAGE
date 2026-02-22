import type { EventWithCount } from '@stage/shared';
import { getStatusBadge, getTypeLabel, formatDate } from '../shared-helpers';
import { ActivityTimeline } from './ActivityTimeline';

export function SummaryTab({ event }: { event: EventWithCount }) {
  const statusBadge = getStatusBadge(event.status);

  return (
    <div style={styles.summaryGrid}>
      <div style={styles.statsRow}>
        <StatCard
          label="Deltagare"
          value={event.participant_count}
          total={event.max_participants ?? undefined}
          color="var(--color-burgundy)"
        />
        <StatCard
          label="Status"
          value={statusBadge.label}
          color="var(--color-accent)"
        />
        <StatCard
          label="Typ"
          value={getTypeLabel(event.type)}
          color="var(--color-dark-purple)"
        />
      </div>

      <div style={styles.detailsCard}>
        <h3 style={styles.sectionTitle}>Eventinformation</h3>
        <div style={styles.detailsGrid}>
          <DetailItem label="Datum" value={formatDate(event.date)} />
          <DetailItem label="Tid" value={`${event.time}${event.end_time ? ` – ${event.end_time}` : ''}`} />
          <DetailItem label="Plats" value={event.location} />
          <DetailItem label="Arrangör" value={`${event.organizer} (${event.organizer_email})`} />
          <DetailItem label="Synlighet" value={event.visibility === 'public' ? 'Publik' : 'Privat'} />
          {event.max_participants && (
            <DetailItem label="Max deltagare" value={`${event.max_participants} (+${event.overbooking_limit} överbokning)`} />
          )}
        </div>
        {event.description && (
          <div style={{ marginTop: '16px' }}>
            <span style={styles.detailLabel}>Beskrivning</span>
            <p style={styles.detailValue}>{event.description}</p>
          </div>
        )}
      </div>

      <ActivityTimeline eventId={event.id} />
    </div>
  );
}

function StatCard({ label, value, total, color }: {
  label: string;
  value: string | number;
  total?: number;
  color: string;
}) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <div style={styles.statValue}>
        <span style={{ color }}>{value}</span>
        {total !== undefined && (
          <span style={styles.statTotal}>/ {total}</span>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  summaryGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  statCard: {
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    border: '1px solid var(--color-border)',
  },
  statLabel: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    display: 'block',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  statTotal: {
    fontSize: 'var(--font-size-md)',
    color: 'var(--color-text-muted)',
    fontWeight: 'var(--font-weight-regular)' as unknown as number,
  },
  detailsCard: {
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    border: '1px solid var(--color-border)',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    marginBottom: '16px',
    color: 'var(--color-text-primary)',
  },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  detailLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    display: 'block',
    marginBottom: '2px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
  },
};
