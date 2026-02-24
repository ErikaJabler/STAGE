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
          {participant.company && <DetailItem label="Företag:" value={participant.company} />}
          <DetailItem label="Kategori:" value={getCategoryLabel(participant.category)} />
          {participant.dietary_notes && (
            <DetailItem label="Allergier/Kost:" value={participant.dietary_notes} />
          )}
        </div>
        <div style={styles.detailColumn}>
          {participant.plus_one_name && (
            <DetailItem label="Plus-one:" value={participant.plus_one_name} />
          )}
          {participant.plus_one_name && participant.plus_one_email && (
            <DetailItem label="Plus-one e-post:" value={participant.plus_one_email} />
          )}
          {participant.plus_one_dietary_notes && (
            <DetailItem label="Plus-one kost:" value={participant.plus_one_dietary_notes} />
          )}
          <DetailItem label="Tillagd:" value={formatDateTime(participant.created_at)} />
          {participant.status !== 'invited' && (
            <DetailItem label="Senast ändrad:" value={formatDateTime(participant.updated_at)} />
          )}
          {participant.gdpr_consent_at && (
            <DetailItem
              label="GDPR-samtycke:"
              value={formatDateTime(participant.gdpr_consent_at)}
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
      <span style={styles.detailValue}> {value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: '10px 16px',
    backgroundColor: 'var(--color-bg-primary)',
    borderTop: '1px solid var(--color-border)',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px 24px',
    marginBottom: '12px',
  },
  detailColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'baseline',
  },
  detailLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
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
