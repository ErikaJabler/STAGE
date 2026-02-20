import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Topbar } from '../components/layout';
import { Badge, Button, Input, Modal, EventDetailSkeleton, useToast } from '../components/ui';
import { useEvent } from '../hooks/useEvents';
import { useParticipants, useCreateParticipant, useDeleteParticipant } from '../hooks/useParticipants';
import type { EventWithCount, Participant } from '@stage/shared';
import { PARTICIPANT_CATEGORY, PARTICIPANT_STATUS } from '@stage/shared';
import type { CreateParticipantPayload } from '../api/client';

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
function ParticipantsTab({ eventId }: { eventId: number; participantCount: number }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: participants, isLoading } = useParticipants(eventId);
  const { toast } = useToast();
  const deleteParticipant = useDeleteParticipant(eventId);

  function handleDelete(p: Participant) {
    if (!confirm(`Ta bort ${p.name}?`)) return;
    deleteParticipant.mutate(p.id, {
      onSuccess: () => toast(`${p.name} togs bort`, 'success'),
      onError: () => toast('Kunde inte ta bort deltagaren', 'error'),
    });
  }

  if (isLoading) {
    return (
      <div style={styles.emptyTab}>
        <p style={styles.emptyText}>Laddar deltagare...</p>
      </div>
    );
  }

  if (!participants || participants.length === 0) {
    return (
      <>
        <div style={styles.emptyTab}>
          <PeopleEmptyIcon />
          <h3 style={styles.emptyTitle}>Inga deltagare ännu</h3>
          <p style={styles.emptyText}>Lägg till deltagare eller skicka inbjudningar.</p>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            + Lägg till deltagare
          </Button>
        </div>
        <AddParticipantModal
          eventId={eventId}
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      </>
    );
  }

  return (
    <div>
      <div style={styles.participantsHeader}>
        <span style={styles.participantsCount}>{participants.length} deltagare</span>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          + Lägg till
        </Button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Namn</th>
              <th style={styles.th}>E-post</th>
              <th style={styles.th}>Företag</th>
              <th style={styles.th}>Kategori</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} style={styles.tr}>
                <td style={styles.td}>
                  <span style={styles.participantName}>{p.name}</span>
                </td>
                <td style={styles.td}>{p.email}</td>
                <td style={styles.td}>{p.company || '—'}</td>
                <td style={styles.td}>
                  <span style={styles.categoryTag}>{getCategoryLabel(p.category)}</span>
                </td>
                <td style={styles.td}>
                  <Badge variant={getParticipantStatusVariant(p.status)}>
                    {getParticipantStatusLabel(p.status)}
                  </Badge>
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleDelete(p)}
                    style={styles.deleteBtn}
                    title="Ta bort"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddParticipantModal
        eventId={eventId}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}

/* ---- AddParticipantModal ---- */
function AddParticipantModal({ eventId, open, onClose }: {
  eventId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createParticipant = useCreateParticipant(eventId);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    category: 'other',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Namn krävs';
    if (!form.email.trim()) errs.email = 'E-post krävs';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Ogiltig e-postadress';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: CreateParticipantPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim() || null,
      category: form.category,
    };

    createParticipant.mutate(payload, {
      onSuccess: (p) => {
        toast(`${p.name} lades till`, 'success');
        setForm({ name: '', email: '', company: '', category: 'other' });
        setErrors({});
        onClose();
      },
      onError: () => {
        toast('Kunde inte lägga till deltagaren', 'error');
      },
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lägg till deltagare"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit as unknown as () => void}
            loading={createParticipant.isPending}
          >
            Lägg till
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Input
          label="Namn"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          placeholder="Anna Svensson"
          required
        />
        <Input
          label="E-post"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          placeholder="anna@consid.se"
          required
        />
        <Input
          label="Företag"
          value={form.company}
          onChange={(e) => updateField('company', e.target.value)}
          placeholder="Consid AB"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={styles.modalSelectLabel}>Kategori</label>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            style={styles.modalSelect}
          >
            {Object.values(PARTICIPANT_CATEGORY).map((c) => (
              <option key={c} value={c}>{getCategoryLabel(c)}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

/* ---- Participant helpers ---- */
function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    internal: 'Intern', public_sector: 'Offentlig sektor',
    private_sector: 'Privat sektor', partner: 'Partner', other: 'Övrig',
  };
  return map[category] || category;
}

function getParticipantStatusLabel(status: string): string {
  const map: Record<string, string> = {
    invited: 'Inbjuden', attending: 'Deltar', declined: 'Avböjd',
    waitlisted: 'Väntelista', cancelled: 'Avbokad',
  };
  return map[status] || status;
}

function getParticipantStatusVariant(status: string) {
  switch (status) {
    case 'attending': return 'success' as const;
    case 'declined': return 'danger' as const;
    case 'cancelled': return 'danger' as const;
    case 'waitlisted': return 'warning' as const;
    default: return 'muted' as const;
  }
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M11 3.5l-.5 8a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 11.5L3 3.5"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  participantsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  participantsCount: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
  },
  tableWrapper: {
    backgroundColor: 'var(--color-bg-card)',
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
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-primary)',
  },
  tr: {
    borderBottom: '1px solid var(--color-border)',
  },
  td: {
    padding: '10px 16px',
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle' as const,
  },
  participantName: {
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
  },
  categoryTag: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
  },
  modalSelectLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-secondary)',
  },
  modalSelect: {
    height: '36px',
    padding: '0 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
  },
};
