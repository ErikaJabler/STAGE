import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from '../../ui';
import { useDeleteEvent } from '../../../hooks/useEvents';
import { useToast } from '../../ui/Toast';

interface Props {
  eventId: number;
  eventName: string;
}

export function DangerZone({ eventId, eventName }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteEvent = useDeleteEvent();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(eventId);
      toast('Eventet har tagits bort', 'success');
      navigate('/');
    } catch {
      toast('Kunde inte ta bort eventet', 'error');
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Farozon</h3>
      <p style={styles.description}>
        Dessa åtgärder kan inte ångras. Var försiktig.
      </p>
      <div style={styles.action}>
        <div>
          <div style={styles.actionTitle}>Ta bort event</div>
          <div style={styles.actionDescription}>
            Eventet arkiveras och blir inte längre synligt. Deltagare och utskick bevaras i databasen.
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
          Ta bort event
        </Button>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Bekräfta borttagning">
        <div style={styles.confirmContent}>
          <p style={styles.confirmText}>
            Är du säker på att du vill ta bort <strong>{eventName}</strong>?
          </p>
          <p style={styles.confirmSubtext}>
            Eventet arkiveras (soft-delete) och försvinner från översikten. Denna åtgärd kan inte ångras via gränssnittet.
          </p>
          <div style={styles.confirmActions}>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Avbryt
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? 'Tar bort...' : 'Ja, ta bort'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    marginTop: '32px',
    padding: '20px',
    border: '1px solid var(--color-raspberry-red)',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'rgba(181, 34, 63, 0.03)',
  },
  title: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-raspberry-red)',
    marginBottom: '4px',
  },
  description: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    marginBottom: '16px',
  },
  action: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  actionTitle: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-primary)',
    marginBottom: '2px',
  },
  actionDescription: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
  confirmContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  confirmText: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
  },
  confirmSubtext: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '8px',
  },
};
