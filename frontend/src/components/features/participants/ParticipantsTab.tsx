import { useState, useEffect, useRef } from 'react';
import { Button, useToast } from '../../ui';
import {
  useParticipants,
  useDeleteParticipant,
  useReorderParticipant,
  useUpdateParticipant,
} from '../../../hooks/useParticipants';
import type { Participant } from '@stage/shared';
import { sharedStyles } from '../shared-styles';
import { UploadIcon, SearchIcon, DownloadIcon, PeopleEmptyIcon } from '../shared-icons';
import { AddParticipantModal } from './AddParticipantModal';
import { ImportCSVModal } from './ImportCSVModal';
import { WaitlistPanel } from './WaitlistPanel';
import { ParticipantRow } from './ParticipantRow';
import { EditParticipantModal } from './EditParticipantModal';

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
  const [activeModal, setActiveModal] = useState<'add' | 'import' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const { data: participants, isLoading } = useParticipants(eventId);
  const { toast } = useToast();
  const deleteParticipant = useDeleteParticipant(eventId);
  const reorderParticipant = useReorderParticipant(eventId);
  const updateParticipant = useUpdateParticipant(eventId);

  // Close export menu on click outside
  useEffect(() => {
    if (!showExportMenu) return;
    function handleClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

  function handleDelete(e: React.MouseEvent, p: Participant) {
    e.stopPropagation();
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
      { onError: () => toast('Kunde inte ändra köplats', 'error') },
    );
  }

  function handleDeadlineChange(p: Participant, deadline: string) {
    updateParticipant.mutate(
      { id: p.id, data: { response_deadline: deadline || null } },
      {
        onSuccess: () => toast('Svarsfrist uppdaterad', 'success'),
        onError: () => toast('Kunde inte uppdatera svarsfrist', 'error'),
      },
    );
  }

  function handleRowClick(p: Participant) {
    setExpandedId((prev) => (prev === p.id ? null : p.id));
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
  const colCount = 6 + (hasWaitlisted ? 2 : 0) + 2; // base 6 + waitlist cols + Info + Ändrad

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
            <Button variant="primary" size="sm" onClick={() => setActiveModal('add')}>
              + Lägg till deltagare
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setActiveModal('import')}>
              <UploadIcon /> Importera CSV
            </Button>
          </div>
        </div>
        <AddParticipantModal
          eventId={eventId}
          open={activeModal === 'add'}
          onClose={() => setActiveModal(null)}
        />
        <ImportCSVModal
          eventId={eventId}
          open={activeModal === 'import'}
          onClose={() => setActiveModal(null)}
        />
      </>
    );
  }

  return (
    <div>
      <div style={sharedStyles.header}>
        <span style={sharedStyles.headerCount}>{participants.length} deltagare</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div ref={exportMenuRef} style={styles.exportMenuWrapper}>
            <Button variant="ghost" size="sm" onClick={() => setShowExportMenu((v) => !v)}>
              <DownloadIcon /> Exportera <ChevronDownIcon />
            </Button>
            {showExportMenu && (
              <div style={styles.exportDropdown}>
                <button
                  style={styles.exportOption}
                  onClick={() => {
                    window.open(`/stage/api/events/${eventId}/participants/export`, '_blank');
                    setShowExportMenu(false);
                  }}
                >
                  Deltagarlista (CSV)
                </button>
                <button
                  style={styles.exportOption}
                  onClick={() => {
                    window.open(
                      `/stage/api/events/${eventId}/participants/export-catering`,
                      '_blank',
                    );
                    setShowExportMenu(false);
                  }}
                >
                  Cateringlista (CSV)
                </button>
              </div>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setActiveModal('import')}>
            <UploadIcon /> Importera CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setActiveModal('add')}>
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
            const count = f.id === 'all' ? participants.length : (statusCounts[f.id] ?? 0);
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
              <th style={{ ...sharedStyles.th, width: '60px', textAlign: 'center' }}>Info</th>
              <th style={{ ...sharedStyles.th, width: '85px' }}>Ändrad</th>
              {hasWaitlisted && <th style={{ ...sharedStyles.th, width: '80px' }}>Kö</th>}
              {hasWaitlisted && <th style={{ ...sharedStyles.th, width: '140px' }}>Svarsfrist</th>}
              <th style={{ ...sharedStyles.th, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  style={{
                    ...sharedStyles.td,
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    padding: '24px 16px',
                  }}
                >
                  Inga deltagare matchar filtret
                </td>
              </tr>
            ) : (
              filteredParticipants.map((p) => (
                <ParticipantRow
                  key={p.id}
                  participant={p}
                  eventId={eventId}
                  expanded={expandedId === p.id}
                  hasWaitlisted={hasWaitlisted}
                  colCount={colCount}
                  onRowClick={() => handleRowClick(p)}
                  onDelete={(e) => handleDelete(e, p)}
                  onReorder={(dir) => handleReorder(p, dir)}
                  onDeadlineChange={(val) => handleDeadlineChange(p, val)}
                  reorderPending={reorderParticipant.isPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasWaitlisted && participants && (
        <WaitlistPanel eventId={eventId} participants={participants} />
      )}

      <AddParticipantModal
        eventId={eventId}
        open={activeModal === 'add'}
        onClose={() => setActiveModal(null)}
      />
      <ImportCSVModal
        eventId={eventId}
        open={activeModal === 'import'}
        onClose={() => setActiveModal(null)}
      />
      {editingParticipant && (
        <EditParticipantModal
          key={editingParticipant.id}
          eventId={eventId}
          participant={editingParticipant}
          open={true}
          onClose={() => setEditingParticipant(null)}
        />
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  exportMenuWrapper: {
    position: 'relative' as const,
  },
  exportDropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: '4px',
    minWidth: '180px',
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    zIndex: 10,
    overflow: 'hidden',
  },
  exportOption: {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    textAlign: 'left' as const,
    cursor: 'pointer',
  },
};
