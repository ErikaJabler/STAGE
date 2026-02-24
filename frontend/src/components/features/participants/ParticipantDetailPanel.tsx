import { useState } from 'react';
import { Badge, Button } from '../../ui';
import { useParticipantEmailHistory } from '../../../hooks/useParticipants';
import type { Participant } from '@stage/shared';
import { getCategoryLabel, formatDateTime } from '../shared-helpers';
import { EditParticipantModal } from './EditParticipantModal';

function getEmailStatusVariant(status: string) {
  switch (status) {
    case 'sent':
      return 'success' as const;
    case 'failed':
      return 'danger' as const;
    default:
      return 'muted' as const;
  }
}

function getEmailStatusLabel(status: string) {
  switch (status) {
    case 'sent':
      return 'Skickat';
    case 'failed':
      return 'Misslyckades';
    case 'pending':
      return 'Väntar';
    default:
      return status;
  }
}

function formatDateShort(isoStr: string): string {
  const d = new Date(isoStr.replace(' ', 'T') + (isoStr.includes('T') ? '' : 'Z'));
  return d.toLocaleDateString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function ParticipantDetailPanel({
  eventId,
  participant,
}: {
  eventId: number;
  participant: Participant;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const { data: emailHistory, isLoading: historyLoading } = useParticipantEmailHistory(
    eventId,
    participant.id,
  );

  return (
    <div style={styles.panel}>
      <div style={styles.detailGrid}>
        <div style={styles.detailColumn}>
          <DetailItem label="Företag" value={participant.company || '—'} />
          <DetailItem label="Kategori" value={getCategoryLabel(participant.category)} />
          <DetailItem label="Allergier / Kost" value={participant.dietary_notes || '—'} />
        </div>
        <div style={styles.detailColumn}>
          <DetailItem label="Plus-one" value={participant.plus_one_name || '—'} />
          {participant.plus_one_name && (
            <DetailItem label="Plus-one e-post" value={participant.plus_one_email || '—'} />
          )}
          <DetailItem label="Tillagd" value={formatDateShort(participant.created_at)} />
          {participant.status !== 'invited' && (
            <DetailItem label="Senast ändrad" value={formatDateShort(participant.updated_at)} />
          )}
          {participant.gdpr_consent_at && (
            <DetailItem
              label="GDPR-samtycke"
              value={formatDateShort(participant.gdpr_consent_at)}
            />
          )}
        </div>
      </div>

      <div style={styles.emailSection}>
        <h4 style={styles.emailTitle}>Mailhistorik</h4>
        {historyLoading ? (
          <p style={styles.emailEmpty}>Laddar...</p>
        ) : !emailHistory || emailHistory.length === 0 ? (
          <p style={styles.emailEmpty}>Inga utskick</p>
        ) : (
          <div style={styles.emailList}>
            {emailHistory.map((e) => (
              <div key={e.id} style={styles.emailRow}>
                <span style={styles.emailSubject}>{e.subject}</span>
                <Badge variant={getEmailStatusVariant(e.status)}>
                  {getEmailStatusLabel(e.status)}
                </Badge>
                <span style={styles.emailDate}>{formatDateTime(e.sent_at ?? e.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.actionRow}>
        <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
          Redigera
        </Button>
      </div>

      {editOpen && (
        <EditParticipantModal
          key={participant.id}
          eventId={eventId}
          participant={participant}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: '16px 24px',
    backgroundColor: 'var(--color-bg-primary)',
    borderTop: '1px solid var(--color-border)',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px 32px',
    marginBottom: '16px',
  },
  detailColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  detailLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
  },
  emailSection: {
    borderTop: '1px solid var(--color-border)',
    paddingTop: '12px',
    marginBottom: '12px',
  },
  emailTitle: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
    marginBottom: '8px',
  },
  emailEmpty: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
  emailList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  emailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: 'var(--font-size-sm)',
  },
  emailSubject: {
    flex: 1,
    color: 'var(--color-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  emailDate: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
};
