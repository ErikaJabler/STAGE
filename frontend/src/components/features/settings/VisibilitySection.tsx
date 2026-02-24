import { useState, type CSSProperties } from 'react';
import type { EventWithCount } from '@stage/shared';
import { Button, Input } from '../../ui';
import { useUpdateEvent } from '../../../hooks/useEvents';
import { useToast } from '../../ui/Toast';

interface Props {
  event: EventWithCount;
}

export function VisibilitySection({ event }: Props) {
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();

  const toggle = async () => {
    const newVis = event.visibility === 'public' ? 'private' : 'public';
    try {
      await updateEvent.mutateAsync({ id: event.id, data: { visibility: newVis } });
      toast(`Synlighet ändrad till ${newVis === 'public' ? 'publik' : 'privat'}`, 'success');
    } catch {
      toast('Kunde inte ändra synlighet', 'error');
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Synlighet</h3>
      </div>
      <div style={styles.toggleRow}>
        <div>
          <div style={styles.toggleLabel}>
            {event.visibility === 'public' ? 'Publikt event' : 'Privat event'}
          </div>
          <div style={styles.toggleHint}>
            {event.visibility === 'public'
              ? 'Eventet är synligt för alla med länken.'
              : 'Eventet är bara synligt för inbjudna.'
            }
          </div>
        </div>
        <button
          onClick={toggle}
          style={{
            ...styles.toggleBtn,
            backgroundColor: event.visibility === 'public' ? 'var(--color-burgundy)' : 'var(--color-border)',
          }}
          disabled={updateEvent.isPending}
          aria-label={event.visibility === 'public' ? 'Ändra till privat' : 'Ändra till publik'}
        >
          <span style={{
            ...styles.toggleKnob,
            transform: event.visibility === 'public' ? 'translateX(20px)' : 'translateX(0)',
          }} />
        </button>
      </div>
    </div>
  );
}

export function SenderSection({ event }: Props) {
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const [value, setValue] = useState(event.sender_mailbox ?? '');
  const [dirty, setDirty] = useState(false);

  const handleSave = async () => {
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        data: { sender_mailbox: value || null },
      });
      toast('Avsändare uppdaterad', 'success');
      setDirty(false);
    } catch {
      toast('Kunde inte uppdatera avsändare', 'error');
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Avsändare (mailbox)</h3>
        {dirty && (
          <Button variant="primary" size="sm" onClick={handleSave} disabled={updateEvent.isPending}>
            {updateEvent.isPending ? 'Sparar...' : 'Spara'}
          </Button>
        )}
      </div>
      <Input
        label="Avsändaradress"
        type="email"
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(true); }}
        placeholder="noreply@consid.se"
        hint="Lämna tomt för standardavsändare"
      />
    </div>
  );
}

export function GdprSection({ event }: Props) {
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const [value, setValue] = useState(event.gdpr_consent_text ?? '');
  const [dirty, setDirty] = useState(false);

  const handleSave = async () => {
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        data: { gdpr_consent_text: value || null },
      });
      toast('GDPR-text uppdaterad', 'success');
      setDirty(false);
    } catch {
      toast('Kunde inte uppdatera GDPR-text', 'error');
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>GDPR-samtyckestext</h3>
        {dirty && (
          <Button variant="primary" size="sm" onClick={handleSave} disabled={updateEvent.isPending}>
            {updateEvent.isPending ? 'Sparar...' : 'Spara'}
          </Button>
        )}
      </div>
      <div style={styles.textareaWrapper}>
        <textarea
          value={value}
          onChange={(e) => { setValue(e.target.value); setDirty(true); }}
          style={styles.textarea}
          rows={4}
          placeholder="Genom att anmäla dig samtycker du till att vi behandlar dina personuppgifter i enlighet med GDPR..."
        />
        <div style={styles.textareaHint}>
          Visas på RSVP-sidan när deltagare svarar.
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  section: {
    padding: '20px 0',
    borderBottom: '1px solid var(--color-border)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  toggleLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-primary)',
  },
  toggleHint: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  toggleBtn: {
    position: 'relative',
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
    flexShrink: 0,
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'white',
    transition: 'transform var(--transition-fast)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  textareaWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  textarea: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
    width: '100%',
  },
  textareaHint: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
};
