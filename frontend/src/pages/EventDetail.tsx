import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Topbar } from '../components/layout';
import { Button, EventDetailSkeleton } from '../components/ui';
import { useEvent } from '../hooks/useEvents';
import { SummaryTab } from '../components/features/events/SummaryTab';
import { ParticipantsTab } from '../components/features/participants/ParticipantsTab';
import { MailingsTab } from '../components/features/email/MailingsTab';
import { PermissionsPanel } from '../components/features/settings/PermissionsPanel';
import { BackIcon } from '../components/features/shared-icons';

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
            <Link to={`/events/${eventId}/edit`} style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                Redigera
              </Button>
            </Link>
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
        {activeTab === 'mailings' && <MailingsTab eventId={eventId} />}
        {activeTab === 'settings' && <PermissionsPanel eventId={eventId} />}
      </div>
    </>
  );
}

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
