import { useState } from 'react';
import { Badge, Button, useToast } from '../../ui';
import { useParticipants, useDeleteParticipant, useReorderParticipant } from '../../../hooks/useParticipants';
import type { Participant } from '@stage/shared';
import { getCategoryLabel, getParticipantStatusLabel, getParticipantStatusVariant } from '../shared-helpers';
import { sharedStyles } from '../shared-styles';
import { UploadIcon, SearchIcon, TrashIcon, DownloadIcon, PeopleEmptyIcon } from '../shared-icons';
import { AddParticipantModal } from './AddParticipantModal';
import { ImportCSVModal } from './ImportCSVModal';
import { WaitlistPanel } from './WaitlistPanel';

type StatusFilter = 'all' | 'attending' | 'invited' | 'waitlisted' | 'declined' | 'cancelled';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Alla' },
  { id: 'attending', label: 'Deltar' },
  { id: 'invited', label: 'Inbjudna' },
  { id: 'waitlisted', label: 'Väntelista' },
  { id: 'declined', label: 'Avböjda' },
  { id: 'cancelled', label: 'Avbokade' },
];

export function ParticipantsTab({ eventId }: { eventId: number; participantCount: number }) {
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
      { onError: () => toast('Kunde inte ändra köplats', 'error') }
    );
  }

  function handleExportCSV() {
    window.open(`/stage/api/events/${eventId}/participants/export`, '_blank');
  }

  // Client-side filtering
  const filteredParticipants = (participants ?? []).filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
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
      <div style={sharedStyles.emptyTab}>
        <p style={sharedStyles.emptyText}>Laddar deltagare...</p>
      </div>
    );
  }

  if (!participants || participants.length === 0) {
    return (
      <>
        <div style={sharedStyles.emptyTab}>
          <PeopleEmptyIcon />
          <h3 style={sharedStyles.emptyTitle}>Inga deltagare ännu</h3>
          <p style={sharedStyles.emptyText}>Lägg till deltagare eller importera från CSV.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              + Lägg till deltagare
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
              <UploadIcon /> Importera CSV
            </Button>
          </div>
        </div>
        <AddParticipantModal eventId={eventId} open={showAddModal} onClose={() => setShowAddModal(false)} />
        <ImportCSVModal eventId={eventId} open={showImportModal} onClose={() => setShowImportModal(false)} />
      </>
    );
  }

  return (
    <div>
      <div style={sharedStyles.header}>
        <span style={sharedStyles.headerCount}>{participants.length} deltagare</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={handleExportCSV}>
            <DownloadIcon /> Exportera CSV
          </Button>
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
            <button onClick={() => setSearchQuery('')} style={styles.searchClear} title="Rensa sökning">
              ×
            </button>
          )}
        </div>
        <div style={styles.statusFilterRow}>
          {STATUS_FILTERS.map((f) => {
            const count = f.id === 'all' ? participants.length : statusCounts[f.id] ?? 0;
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{ ...styles.filterChip, ...(isActive ? styles.filterChipActive : {}) }}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div style={sharedStyles.tableWrapper}>
        <table style={sharedStyles.table}>
          <thead>
            <tr>
              <th style={sharedStyles.th}>Namn</th>
              <th style={sharedStyles.th}>E-post</th>
              <th style={sharedStyles.th}>Företag</th>
              <th style={sharedStyles.th}>Kategori</th>
              <th style={sharedStyles.th}>Status</th>
              {hasWaitlisted && <th style={{ ...sharedStyles.th, width: '80px' }}>Kö</th>}
              <th style={{ ...sharedStyles.th, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={hasWaitlisted ? 7 : 6} style={{ ...sharedStyles.td, textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px 16px' }}>
                  Inga deltagare matchar filtret
                </td>
              </tr>
            ) : (
              filteredParticipants.map((p) => (
                <tr key={p.id} style={sharedStyles.tr}>
                  <td style={sharedStyles.td}>
                    <span style={sharedStyles.participantName}>{p.name}</span>
                  </td>
                  <td style={sharedStyles.td}>{p.email}</td>
                  <td style={sharedStyles.td}>{p.company || '—'}</td>
                  <td style={sharedStyles.td}>
                    <span style={sharedStyles.categoryTag}>{getCategoryLabel(p.category)}</span>
                  </td>
                  <td style={sharedStyles.td}>
                    <Badge variant={getParticipantStatusVariant(p.status)}>
                      {getParticipantStatusLabel(p.status)}
                    </Badge>
                  </td>
                  {hasWaitlisted && (
                    <td style={sharedStyles.td}>
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
                  <td style={sharedStyles.td}>
                    <button onClick={() => handleDelete(p)} style={sharedStyles.deleteBtn} title="Ta bort">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasWaitlisted && participants && (
        <WaitlistPanel eventId={eventId} participants={participants} />
      )}

      <AddParticipantModal eventId={eventId} open={showAddModal} onClose={() => setShowAddModal(false)} />
      <ImportCSVModal eventId={eventId} open={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
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

const styles: Record<string, React.CSSProperties> = {
  filterBar: { display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '16px' },
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
  statusFilterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
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
  queueCell: { display: 'flex', alignItems: 'center', gap: '4px' },
  queuePosition: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    minWidth: '24px',
  },
  reorderBtns: { display: 'flex', flexDirection: 'column' as const, gap: '1px' },
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
