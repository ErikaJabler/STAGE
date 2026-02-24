import { Badge } from '../../ui';
import type { Participant } from '@stage/shared';
import {
  getCategoryLabel,
  getParticipantStatusLabel,
  getParticipantStatusVariant,
  formatDateTime,
} from '../shared-helpers';
import { sharedStyles } from '../shared-styles';
import { TrashIcon } from '../shared-icons';
import { ParticipantDetailPanel } from './ParticipantDetailPanel';

export function ParticipantRow({
  participant: p,
  eventId,
  expanded,
  hasWaitlisted,
  colCount,
  onRowClick,
  onDelete,
  onReorder,
  onDeadlineChange,
  reorderPending,
}: {
  participant: Participant;
  eventId: number;
  expanded: boolean;
  hasWaitlisted: boolean;
  colCount: number;
  onRowClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onReorder: (dir: 'up' | 'down') => void;
  onDeadlineChange: (val: string) => void;
  reorderPending: boolean;
}) {
  const hasDietary = !!(p.dietary_notes || p.plus_one_dietary_notes);
  const hasPlusOne = !!p.plus_one_name;

  return (
    <>
      <tr style={{ ...sharedStyles.tr, cursor: 'pointer' }} onClick={onRowClick}>
        <td style={sharedStyles.td}>
          <span style={sharedStyles.participantName}>{p.name}</span>
        </td>
        <td style={sharedStyles.td}>{p.email}</td>
        <td style={sharedStyles.td}>{p.company || '\u2014'}</td>
        <td style={sharedStyles.td}>
          <span style={sharedStyles.categoryTag}>{getCategoryLabel(p.category)}</span>
        </td>
        <td style={sharedStyles.td}>
          <Badge variant={getParticipantStatusVariant(p.status)}>
            {getParticipantStatusLabel(p.status)}
          </Badge>
        </td>
        <td style={{ ...sharedStyles.td, textAlign: 'center' }}>
          <span style={styles.infoIcons}>
            {hasDietary && (
              <span
                title={[
                  p.dietary_notes ? `Kost: ${p.dietary_notes}` : '',
                  p.plus_one_dietary_notes ? `+1 kost: ${p.plus_one_dietary_notes}` : '',
                ]
                  .filter(Boolean)
                  .join('\n')}
                style={styles.infoIcon}
              >
                <DietaryIcon />
              </span>
            )}
            {hasPlusOne && (
              <span title={`+1: ${p.plus_one_name}`} style={styles.infoIcon}>
                <PlusOneIcon />
              </span>
            )}
            {!hasDietary && !hasPlusOne && (
              <span style={{ color: 'var(--color-text-muted)' }}>{'\u2014'}</span>
            )}
          </span>
        </td>
        <td style={sharedStyles.td}>
          {p.status !== 'invited' ? (
            <span style={styles.dateText}>{formatDateTime(p.updated_at)}</span>
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>{'\u2014'}</span>
          )}
        </td>
        {hasWaitlisted && (
          <td style={sharedStyles.td} onClick={(e) => e.stopPropagation()}>
            {p.status === 'waitlisted' && p.queue_position ? (
              <div style={styles.queueCell}>
                <span style={styles.queuePosition}>#{p.queue_position}</span>
                <div style={styles.reorderBtns}>
                  <button
                    onClick={() => onReorder('up')}
                    style={styles.reorderBtn}
                    title="Flytta upp"
                    disabled={p.queue_position <= 1 || reorderPending}
                  >
                    <ChevronUpIcon />
                  </button>
                  <button
                    onClick={() => onReorder('down')}
                    style={styles.reorderBtn}
                    title="Flytta ner"
                    disabled={reorderPending}
                  >
                    <ChevronDownIcon />
                  </button>
                </div>
              </div>
            ) : (
              <span style={{ color: 'var(--color-text-muted)' }}>{'\u2014'}</span>
            )}
          </td>
        )}
        {hasWaitlisted && (
          <td style={sharedStyles.td} onClick={(e) => e.stopPropagation()}>
            {p.status === 'waitlisted' ? (
              <input
                type="date"
                value={p.response_deadline ?? ''}
                onChange={(e) => onDeadlineChange(e.target.value)}
                style={styles.deadlineInput}
                title="Svarsfrist"
              />
            ) : (
              <span style={{ color: 'var(--color-text-muted)' }}>{'\u2014'}</span>
            )}
          </td>
        )}
        <td style={sharedStyles.td}>
          <button onClick={onDelete} style={sharedStyles.deleteBtn} title="Ta bort">
            <TrashIcon />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={colCount} style={{ padding: 0 }}>
            <ParticipantDetailPanel eventId={eventId} participant={p} />
          </td>
        </tr>
      )}
    </>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M3 7.5L6 4.5L9 7.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

function DietaryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 2v5c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V2M8 9v5M5 2h6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusOneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M12 5v4M10 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  infoIcons: {
    display: 'inline-flex',
    gap: '4px',
    alignItems: 'center',
  },
  infoIcon: {
    display: 'inline-flex',
    color: 'var(--color-light-orange)',
    cursor: 'default',
  },
  dateText: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
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
  deadlineInput: {
    padding: '4px 6px',
    fontSize: 'var(--font-size-xs)',
    fontFamily: 'inherit',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-text-primary)',
    width: '120px',
  },
};
