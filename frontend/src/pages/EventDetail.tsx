import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Topbar } from '../components/layout';
import { Badge, Button, Input, Modal, EventDetailSkeleton, useToast } from '../components/ui';
import { useEvent } from '../hooks/useEvents';
import { useParticipants, useCreateParticipant, useDeleteParticipant, useImportParticipants, useReorderParticipant } from '../hooks/useParticipants';
import { useMailings, useCreateMailing, useSendMailing } from '../hooks/useMailings';
import type { EventWithCount, Participant, Mailing } from '@stage/shared';
import { PARTICIPANT_CATEGORY, PARTICIPANT_STATUS } from '@stage/shared';
import type { CreateParticipantPayload, CreateMailingPayload } from '../api/client';

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
type StatusFilter = 'all' | 'attending' | 'invited' | 'waitlisted' | 'declined' | 'cancelled';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Alla' },
  { id: 'attending', label: 'Deltar' },
  { id: 'invited', label: 'Inbjudna' },
  { id: 'waitlisted', label: 'Väntelista' },
  { id: 'declined', label: 'Avböjda' },
  { id: 'cancelled', label: 'Avbokade' },
];

function ParticipantsTab({ eventId }: { eventId: number; participantCount: number }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { data: participants, isLoading } = useParticipants(eventId);
  const { toast } = useToast();
  const deleteParticipant = useDeleteParticipant(eventId);
  const reorderParticipant = useReorderParticipant(eventId);

  function handleDelete(p: Participant) {
    if (!confirm(`Ta bort ${p.name}?`)) return;
    deleteParticipant.mutate(p.id, {
      onSuccess: () => toast(`${p.name} togs bort`, 'success'),
      onError: () => toast('Kunde inte ta bort deltagaren', 'error'),
    });
  }

  function handleReorder(p: Participant, direction: 'up' | 'down') {
    if (!p.queue_position) return;
    const newPos = direction === 'up' ? p.queue_position - 1 : p.queue_position + 1;
    if (newPos < 1) return;
    reorderParticipant.mutate(
      { id: p.id, queuePosition: newPos },
      {
        onError: () => toast('Kunde inte ändra köplats', 'error'),
      }
    );
  }

  // Client-side filtering
  const filteredParticipants = (participants ?? []).filter((p) => {
    // Status filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.company?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Count per status
  const statusCounts = (participants ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const hasWaitlisted = (statusCounts['waitlisted'] ?? 0) > 0;

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
          <p style={styles.emptyText}>Lägg till deltagare eller importera från CSV.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              + Lägg till deltagare
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
              <UploadIcon /> Importera CSV
            </Button>
          </div>
        </div>
        <AddParticipantModal
          eventId={eventId}
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
        <ImportCSVModal
          eventId={eventId}
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      </>
    );
  }

  return (
    <div>
      <div style={styles.participantsHeader}>
        <span style={styles.participantsCount}>{participants.length} deltagare</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
            <UploadIcon /> Importera CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            + Lägg till
          </Button>
        </div>
      </div>

      {/* Search + Status filter */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Sök namn, e-post, företag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={styles.searchClear}
              title="Rensa sökning"
            >
              ×
            </button>
          )}
        </div>
        <div style={styles.statusFilterRow}>
          {STATUS_FILTERS.map((f) => {
            const count = f.id === 'all'
              ? participants.length
              : statusCounts[f.id] ?? 0;
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  ...styles.filterChip,
                  ...(isActive ? styles.filterChipActive : {}),
                }}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
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
              {hasWaitlisted && <th style={{ ...styles.th, width: '80px' }}>Kö</th>}
              <th style={{ ...styles.th, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={hasWaitlisted ? 7 : 6} style={{ ...styles.td, textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px 16px' }}>
                  Inga deltagare matchar filtret
                </td>
              </tr>
            ) : (
              filteredParticipants.map((p) => (
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
                  {hasWaitlisted && (
                    <td style={styles.td}>
                      {p.status === 'waitlisted' && p.queue_position ? (
                        <div style={styles.queueCell}>
                          <span style={styles.queuePosition}>#{p.queue_position}</span>
                          <div style={styles.reorderBtns}>
                            <button
                              onClick={() => handleReorder(p, 'up')}
                              style={styles.reorderBtn}
                              title="Flytta upp"
                              disabled={p.queue_position <= 1 || reorderParticipant.isPending}
                            >
                              <ChevronUpIcon />
                            </button>
                            <button
                              onClick={() => handleReorder(p, 'down')}
                              style={styles.reorderBtn}
                              title="Flytta ner"
                              disabled={reorderParticipant.isPending}
                            >
                              <ChevronDownIcon />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                  )}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddParticipantModal
        eventId={eventId}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      <ImportCSVModal
        eventId={eventId}
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
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

/* ---- ImportCSVModal ---- */
function ImportCSVModal({ eventId, open, onClose }: {
  eventId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const importParticipants = useImportParticipants(eventId);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [result, setResult] = useState<import('../api/client').ImportParticipantsResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const rows = lines.slice(0, 6).map((line) => {
          // Simple CSV split for preview (handle both , and ;)
          const sep = line.includes(';') && !line.includes(',') ? ';' : ',';
          return line.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
        });
        setPreview(rows);
      };
      reader.readAsText(f);
    } else {
      setPreview(null);
    }
  }

  function handleImport() {
    if (!file) return;
    importParticipants.mutate(file, {
      onSuccess: (r) => {
        setResult(r);
        if (r.imported > 0) {
          toast(`${r.imported} deltagare importerade`, 'success');
        }
        if (r.skipped > 0) {
          toast(`${r.skipped} rader hoppades över`, 'info');
        }
      },
      onError: () => {
        toast('Import misslyckades', 'error');
      },
    });
  }

  function handleClose() {
    setFile(null);
    setPreview(null);
    setResult(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importera deltagare från CSV"
      footer={
        result ? (
          <Button variant="primary" size="md" onClick={handleClose}>
            Stäng
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="md" onClick={handleClose}>
              Avbryt
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleImport}
              loading={importParticipants.isPending}
              disabled={!file}
            >
              Importera
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={styles.importResultCard}>
            <div style={styles.importResultRow}>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{result.imported}</span>
              <span> importerade</span>
            </div>
            {result.skipped > 0 && (
              <div style={styles.importResultRow}>
                <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{result.skipped}</span>
                <span> hoppades &ouml;ver</span>
              </div>
            )}
            <div style={styles.importResultRow}>
              <span style={{ color: 'var(--color-text-muted)' }}>{result.total}</span>
              <span style={{ color: 'var(--color-text-muted)' }}> rader totalt</span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div>
              <span style={styles.detailLabel}>Detaljer</span>
              <div style={styles.importErrorList}>
                {result.errors.slice(0, 20).map((err, i) => (
                  <div key={i} style={styles.importErrorItem}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>Rad {err.row}:</span>{' '}
                    {err.reason}
                  </div>
                ))}
                {result.errors.length > 20 && (
                  <div style={{ ...styles.importErrorItem, color: 'var(--color-text-muted)' }}>
                    ...och {result.errors.length - 20} till
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={styles.fileUploadLabel}
            >
              <UploadIcon />
              <span>{file ? file.name : 'Välj CSV-fil...'}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            <strong>Format:</strong> CSV med kolumner namn, email, företag, kategori.{' '}
            Header-rad identifieras automatiskt. Stöder <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>,</code> och <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>;</code> som separator.
            Duplicerade e-postadresser hoppas över.
          </div>

          {preview && preview.length > 0 && (
            <div>
              <span style={styles.detailLabel}>Förhandsgranskning</span>
              <div style={{ ...styles.tableWrapper, maxHeight: '200px', overflow: 'auto' }}>
                <table style={styles.table}>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{
                        ...styles.tr,
                        ...(i === 0 ? { backgroundColor: 'var(--color-bg-primary)', fontWeight: 600 } : {}),
                      }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ ...styles.td, fontSize: 'var(--font-size-xs)' }}>{cell || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length >= 6 && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Visar de 5 första raderna...
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '4px' }}>
      <path d="M7 10V2M7 2L4 5M7 2l3 3M2 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---- Tab: Utskick ---- */
function MailingsTab({ eventId }: { eventId: number }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewMailing, setPreviewMailing] = useState<Mailing | null>(null);
  const { data: mailings, isLoading } = useMailings(eventId);
  const sendMailing = useSendMailing(eventId);
  const { toast } = useToast();

  function handleSend(mailing: Mailing) {
    sendMailing.mutate(mailing.id, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          toast(`Skickat till ${result.sent}/${result.total} (${result.failed} misslyckades)`, 'error');
        } else {
          toast(`Utskickat till ${result.sent} mottagare`, 'success');
        }
        setPreviewMailing(null);
      },
      onError: () => {
        toast('Kunde inte skicka utskicket', 'error');
      },
    });
  }

  if (isLoading) {
    return (
      <div style={styles.emptyTab}>
        <p style={styles.emptyText}>Laddar utskick...</p>
      </div>
    );
  }

  if (!mailings || mailings.length === 0) {
    return (
      <>
        <div style={styles.emptyTab}>
          <MailEmptyIcon />
          <h3 style={styles.emptyTitle}>Inga utskick ännu</h3>
          <p style={styles.emptyText}>Skapa mailutskick för att nå dina deltagare.</p>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            + Nytt utskick
          </Button>
        </div>
        <CreateMailingModal
          eventId={eventId}
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </>
    );
  }

  return (
    <div>
      <div style={styles.participantsHeader}>
        <span style={styles.participantsCount}>{mailings.length} utskick</span>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          + Nytt utskick
        </Button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ämne</th>
              <th style={styles.th}>Mottagare</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Skapad</th>
              <th style={{ ...styles.th, width: '120px' }}></th>
            </tr>
          </thead>
          <tbody>
            {mailings.map((m) => (
              <tr key={m.id} style={styles.tr}>
                <td style={styles.td}>
                  <span style={styles.participantName}>{m.subject}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.categoryTag}>{getFilterLabel(m.recipient_filter)}</span>
                </td>
                <td style={styles.td}>
                  <Badge variant={m.status === 'sent' ? 'success' : 'muted'}>
                    {m.status === 'sent' ? 'Skickat' : 'Utkast'}
                  </Badge>
                </td>
                <td style={styles.td}>
                  <span style={styles.categoryTag}>{formatDateTime(m.created_at)}</span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setPreviewMailing(m)}
                      style={styles.actionBtn}
                      title="Förhandsgranska"
                    >
                      <EyeIcon />
                    </button>
                    {m.status === 'draft' && (
                      <button
                        onClick={() => handleSend(m)}
                        style={{ ...styles.actionBtn, color: 'var(--color-accent)' }}
                        title="Skicka"
                        disabled={sendMailing.isPending}
                      >
                        <SendIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateMailingModal
        eventId={eventId}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Preview modal */}
      <Modal
        open={!!previewMailing}
        onClose={() => setPreviewMailing(null)}
        title={previewMailing?.subject ?? 'Förhandsgranskning'}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setPreviewMailing(null)}>
              Stäng
            </Button>
            {previewMailing?.status === 'draft' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => previewMailing && handleSend(previewMailing)}
                loading={sendMailing.isPending}
              >
                Skicka utskick
              </Button>
            )}
          </>
        }
      >
        {previewMailing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={styles.detailLabel}>Mottagare</span>
              <span style={styles.detailValue}>{getFilterLabel(previewMailing.recipient_filter)}</span>
            </div>
            <div>
              <span style={styles.detailLabel}>Status</span>
              <Badge variant={previewMailing.status === 'sent' ? 'success' : 'muted'}>
                {previewMailing.status === 'sent' ? 'Skickat' : 'Utkast'}
              </Badge>
              {previewMailing.sent_at && (
                <span style={{ ...styles.categoryTag, marginLeft: '8px' }}>
                  {formatDateTime(previewMailing.sent_at)}
                </span>
              )}
            </div>
            <div>
              <span style={styles.detailLabel}>Meddelande</span>
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
                lineHeight: 'var(--line-height-relaxed)',
                color: 'var(--color-text-primary)',
                whiteSpace: 'pre-wrap',
              }}>
                {previewMailing.body}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---- Mail templates ---- */
const MAIL_TEMPLATES = [
  {
    id: 'save-the-date',
    name: 'Save the date',
    description: 'Tidigt meddelande för att boka datum',
    subject: 'Save the date!',
    body: `Hej {{name}},

Vi vill ge dig en tidig heads-up! Vi planerar ett event som vi gärna vill att du deltar i.

Mer information och en formell inbjudan kommer inom kort. Under tiden, boka gärna datumet i din kalender.

Vi återkommer snart med fler detaljer!

Med vänlig hälsning,
Consid`,
  },
  {
    id: 'official-invitation',
    name: 'Officiell inbjudan',
    description: 'Formell inbjudan med RSVP-länk',
    subject: 'Inbjudan: Du är välkommen!',
    body: `Hej {{name}},

Du är varmt välkommen att delta i vårt kommande event!

Vi har ett spännande program planerat och hoppas att du kan vara med. Svara gärna på inbjudan via länken nedan så snart du kan.

{{rsvp_link}}

Har du frågor? Tveka inte att höra av dig.

Varmt välkommen!
Consid`,
  },
  {
    id: 'reminder',
    name: 'Påminnelse',
    description: 'Påminnelse till de som inte svarat',
    subject: 'Påminnelse: Har du svarat på inbjudan?',
    body: `Hej {{name}},

Vi vill påminna dig om vårt kommande event! Vi har ännu inte fått ditt svar och hoppas att du fortfarande kan delta.

Svara gärna via länken nedan:

{{rsvp_link}}

Glöm inte att platsen kan vara begränsad, så svara gärna så snart du kan.

Vi hoppas vi ses!
Consid`,
  },
] as const;

/* ---- CreateMailingModal ---- */
function CreateMailingModal({ eventId, open, onClose }: {
  eventId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createMailing = useCreateMailing(eventId);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: '',
    body: '',
    recipient_filter: 'all',
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

  function handleTemplateSelect(templateId: string) {
    if (selectedTemplate === templateId) {
      // Deselect
      setSelectedTemplate(null);
      return;
    }
    const template = MAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setForm((prev) => ({
        ...prev,
        subject: template.subject,
        body: template.body,
      }));
      setErrors({});
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.subject.trim()) errs.subject = 'Ämne krävs';
    if (!form.body.trim()) errs.body = 'Meddelande krävs';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: CreateMailingPayload = {
      subject: form.subject.trim(),
      body: form.body.trim(),
      recipient_filter: form.recipient_filter,
    };

    createMailing.mutate(payload, {
      onSuccess: () => {
        toast('Utskick skapat', 'success');
        setSelectedTemplate(null);
        setForm({ subject: '', body: '', recipient_filter: 'all' });
        setErrors({});
        onClose();
      },
      onError: () => {
        toast('Kunde inte skapa utskicket', 'error');
      },
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nytt utskick"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit as unknown as () => void}
            loading={createMailing.isPending}
          >
            Skapa utkast
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Template selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={styles.modalSelectLabel}>Välj mall</label>
          <div style={styles.templateGrid}>
            {MAIL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateSelect(t.id)}
                style={{
                  ...styles.templateCard,
                  ...(selectedTemplate === t.id ? styles.templateCardActive : {}),
                }}
              >
                <span style={styles.templateName}>{t.name}</span>
                <span style={styles.templateDesc}>{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={styles.modalSelectLabel}>Mottagare</label>
          <select
            value={form.recipient_filter}
            onChange={(e) => updateField('recipient_filter', e.target.value)}
            style={styles.modalSelect}
          >
            <option value="all">Alla deltagare</option>
            <optgroup label="Per status">
              <option value="invited">Inbjudna</option>
              <option value="attending">Deltar</option>
              <option value="declined">Avböjda</option>
              <option value="waitlisted">Väntelista</option>
            </optgroup>
            <optgroup label="Per kategori">
              <option value="internal">Interna</option>
              <option value="public_sector">Offentlig sektor</option>
              <option value="private_sector">Privat sektor</option>
              <option value="partner">Partners</option>
              <option value="other">Övriga</option>
            </optgroup>
          </select>
        </div>
        <Input
          label="Ämne"
          value={form.subject}
          onChange={(e) => updateField('subject', e.target.value)}
          error={errors.subject}
          placeholder="Välkommen till eventet!"
          required
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={styles.modalSelectLabel}>Meddelande</label>
          <textarea
            value={form.body}
            onChange={(e) => updateField('body', e.target.value)}
            placeholder="Hej {{name}},&#10;&#10;Välkommen till eventet! Svara gärna via länken nedan.&#10;&#10;{{rsvp_link}}"
            rows={8}
            style={{
              ...styles.modalSelect,
              height: 'auto',
              padding: '10px 12px',
              resize: 'vertical' as const,
              lineHeight: 'var(--line-height-normal)',
            }}
          />
          {errors.body && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
              {errors.body}
            </span>
          )}
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            Variabler: <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{name}}'}</code> = mottagarens namn, <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{rsvp_link}}'}</code> = personlig svarslänk. RSVP-länk läggs till automatiskt om den inte finns i meddelandet.
          </span>
        </div>
      </form>
    </Modal>
  );
}

/* ---- Mailing helpers ---- */
function getFilterLabel(filter: string): string {
  const map: Record<string, string> = {
    all: 'Alla', invited: 'Inbjudna', attending: 'Deltar',
    declined: 'Avböjda', waitlisted: 'Väntelista', cancelled: 'Avbokade',
    internal: 'Interna', public_sector: 'Offentlig sektor',
    private_sector: 'Privat sektor', partner: 'Partners', other: 'Övriga',
  };
  return map[filter] || filter;
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M12.5 1.5L6 8M12.5 1.5l-4 11-2.5-5.5L1.5 5.5l11-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  importResultCard: {
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    fontSize: 'var(--font-size-base)',
  },
  importResultRow: {
    display: 'flex',
    gap: '4px',
    alignItems: 'baseline',
  },
  importErrorList: {
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    maxHeight: '160px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  importErrorItem: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.4',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  templateCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-card)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
    fontFamily: 'inherit',
  },
  templateCardActive: {
    borderColor: 'var(--color-burgundy)',
    backgroundColor: 'rgba(112, 17, 49, 0.04)',
  },
  templateName: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  templateDesc: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: '1.3',
  },
  fileUploadLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '2px dashed var(--color-border-strong)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    transition: 'border-color var(--transition-fast)',
    justifyContent: 'center',
  },
  actionBtn: {
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
  filterBar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '16px',
  },
  searchWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 12px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-text-muted)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    backgroundColor: 'transparent',
  },
  searchClear: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: 'inherit',
    lineHeight: 1,
    padding: 0,
  },
  statusFilterRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  filterChip: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-card)',
    fontSize: 'var(--font-size-xs)',
    fontFamily: 'inherit',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
  },
  filterChipActive: {
    backgroundColor: 'var(--color-burgundy)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-burgundy)',
  },
  queueCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  queuePosition: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    minWidth: '24px',
  },
  reorderBtns: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
  },
  reorderBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '14px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: 0,
    borderRadius: '2px',
  },
};
