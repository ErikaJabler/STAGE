import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Topbar } from '../components/layout';
import { Badge, Button, EventDetailSkeleton } from '../components/ui';
import { useEvent } from '../hooks/useEvents';
import type { EventWithCount } from '@stage/shared';

type TabId = 'summary' | 'participants' | 'mailings' | 'settings';

const tabs: { id: TabId; label: string }[] = [
  { id: 'summary', label: 'Sammanfattning' },
  { id: 'participants', label: 'Deltagare' },
  { id: 'mailings', label: 'Utskick' },
  { id: 'settings', label: 'Inställningar' },
];

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const eventId = Number(id);

  const { data: event, isLoading, error } = useEvent(eventId);

  if (isLoading) {
    return (
      <>
        <Topbar title="Laddar..." />
        <EventDetailSkeleton />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Topbar title="Event" />
        <NotFoundState />
      </>
    );
  }

  return (
    <>
      <Topbar
        title={`${event.emoji || ''} ${event.name}`}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">
                <BackIcon /> Tillbaka
              </Button>
            </Link>
            <Button variant="primary" size="sm">
              Redigera
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div style={styles.tabBar} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
          >
            {tab.label}
            {tab.id === 'participants' && (
              <span style={styles.tabCount}>{event.participant_count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={styles.content} role="tabpanel">
        {activeTab === 'summary' && <SummaryTab event={event} />}
        {activeTab === 'participants' && <ParticipantsTab eventId={eventId} participantCount={event.participant_count} />}
        {activeTab === 'mailings' && <MailingsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </>
  );
}

/* ---- Tab: Sammanfattning ---- */
function SummaryTab({ event }: { event: EventWithCount }) {
  const statusBadge = getStatusBadge(event.status);

  return (
    <div style={styles.summaryGrid}>
      {/* Stats row */}
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

      {/* Details */}
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

/* ---- Tab: Deltagare ---- */
function ParticipantsTab({ eventId: _eventId, participantCount }: { eventId: number; participantCount: number }) {
  // Participants API will be added in a future session
  if (participantCount === 0) {
    return (
      <div style={styles.emptyTab}>
        <PeopleEmptyIcon />
        <h3 style={styles.emptyTitle}>Inga deltagare ännu</h3>
        <p style={styles.emptyText}>Lägg till deltagare eller skicka inbjudningar.</p>
        <Button variant="primary" size="sm">+ Lägg till deltagare</Button>
      </div>
    );
  }

  return (
    <div style={styles.emptyTab}>
      <PeopleEmptyIcon />
      <h3 style={styles.emptyTitle}>{participantCount} deltagare</h3>
      <p style={styles.emptyText}>Deltagarhantering implementeras i kommande session.</p>
    </div>
  );
}

/* ---- Tab: Utskick ---- */
function MailingsTab() {
  return (
    <div style={styles.emptyTab}>
      <MailEmptyIcon />
      <h3 style={styles.emptyTitle}>Inga utskick ännu</h3>
      <p style={styles.emptyText}>Skapa mailutskick för att nå dina deltagare.</p>
      <Button variant="primary" size="sm">+ Nytt utskick</Button>
    </div>
  );
}

/* ---- Tab: Inställningar ---- */
function SettingsTab() {
  return (
    <div style={styles.emptyTab}>
      <SettingsEmptyIcon />
      <h3 style={styles.emptyTitle}>Eventinställningar</h3>
      <p style={styles.emptyText}>Inställningar blir tillgängliga i en kommande session.</p>
    </div>
  );
}

/* ---- Not found ---- */
function NotFoundState() {
  return (
    <div style={styles.emptyTab}>
      <h3 style={styles.emptyTitle}>Event hittades inte</h3>
      <p style={styles.emptyText}>Det event du söker finns inte eller har tagits bort.</p>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Button variant="secondary">Tillbaka till översikt</Button>
      </Link>
    </div>
  );
}

/* ---- Helpers ---- */
function getStatusBadge(status: string) {
  switch (status) {
    case 'planning': return { variant: 'muted' as const, label: 'Planering' };
    case 'upcoming': return { variant: 'default' as const, label: 'Kommande' };
    case 'ongoing': return { variant: 'success' as const, label: 'Pågår' };
    case 'completed': return { variant: 'muted' as const, label: 'Avslutad' };
    case 'cancelled': return { variant: 'danger' as const, label: 'Inställd' };
    default: return { variant: 'muted' as const, label: status };
  }
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    conference: 'Konferens', workshop: 'Workshop', seminar: 'Seminarium',
    networking: 'Networking', internal: 'Internt', other: 'Övrigt',
  };
  return map[type] || type;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ---- Icons ---- */
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.4, marginBottom: '8px' }}>
      <circle cx="20" cy="16" r="6" stroke="var(--color-greige)" strokeWidth="2" />
      <path d="M8 40c0-6.6 5.4-12 12-12s12 5.4 12 40" stroke="var(--color-greige)" strokeWidth="2" />
      <circle cx="34" cy="18" r="4" stroke="var(--color-greige)" strokeWidth="2" />
      <path d="M34 26c4.4 0 8 3.6 8 8" stroke="var(--color-greige)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MailEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.4, marginBottom: '8px' }}>
      <rect x="4" y="10" width="40" height="28" rx="3" stroke="var(--color-greige)" strokeWidth="2" />
      <path d="M4 14l20 14 20-14" stroke="var(--color-greige)" strokeWidth="2" />
    </svg>
  );
}

function SettingsEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.4, marginBottom: '8px' }}>
      <circle cx="24" cy="24" r="8" stroke="var(--color-greige)" strokeWidth="2" />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.5 9.5l4.2 4.2M34.3 34.3l4.2 4.2M38.5 9.5l-4.2 4.2M13.7 34.3l-4.2 4.2" stroke="var(--color-greige)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---- Styles ---- */
const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    gap: '0',
    padding: '0 32px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-primary)',
  },
  tab: {
    padding: '12px 16px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-muted)',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'color var(--transition-fast), border-color var(--transition-fast)',
    fontFamily: 'inherit',
  },
  tabActive: {
    color: 'var(--color-burgundy)',
    borderBottomColor: 'var(--color-burgundy)',
  },
  tabCount: {
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'rgba(112, 17, 49, 0.08)',
    color: 'var(--color-burgundy)',
    padding: '1px 6px',
    borderRadius: 'var(--radius-full)',
  },
  content: {
    padding: '24px 32px',
    flex: 1,
  },
  summaryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
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
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
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
  emptyTab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    textAlign: 'center',
    gap: '8px',
  },
  emptyTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
  },
  emptyText: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-muted)',
    marginBottom: '8px',
  },
};
