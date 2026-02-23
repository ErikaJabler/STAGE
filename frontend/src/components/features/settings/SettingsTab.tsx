import { useState, useRef, type CSSProperties, type FormEvent } from 'react';
import type { EventWithCount } from '@stage/shared';
import { Button, Input } from '../../ui';
import { useUpdateEvent } from '../../../hooks/useEvents';
import { imagesApi } from '../../../api/client';
import { useToast } from '../../ui/Toast';
import { PermissionsPanel } from './PermissionsPanel';
import { WebsitePanel } from './WebsitePanel';
import { DangerZone } from './DangerZone';

interface Props {
  event: EventWithCount;
}

export function SettingsTab({ event }: Props) {
  return (
    <div style={styles.container}>
      <EventInfoSection event={event} />
      <HeroImageSection event={event} />
      <VisibilitySection event={event} />
      <SenderSection event={event} />
      <GdprSection event={event} />
      <div style={styles.section}>
        <WebsitePanel event={event} />
      </div>
      <div style={styles.section}>
        <PermissionsPanel eventId={event.id} />
      </div>
      <DangerZone eventId={event.id} eventName={event.name} />
    </div>
  );
}

/* ---- Event Info Section ---- */
function EventInfoSection({ event }: Props) {
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: event.name,
    date: event.date,
    time: event.time,
    end_date: event.end_date ?? '',
    end_time: event.end_time ?? '',
    location: event.location,
    description: event.description ?? '',
    organizer: event.organizer,
    organizer_email: event.organizer_email,
    max_participants: event.max_participants?.toString() ?? '',
    overbooking_limit: event.overbooking_limit.toString(),
    status: event.status,
    type: event.type,
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        data: {
          name: form.name,
          date: form.date,
          time: form.time,
          end_date: form.end_date || null,
          end_time: form.end_time || null,
          location: form.location,
          description: form.description || null,
          organizer: form.organizer,
          organizer_email: form.organizer_email,
          max_participants: form.max_participants ? Number(form.max_participants) : null,
          overbooking_limit: Number(form.overbooking_limit) || 0,
          status: form.status,
          type: form.type,
        },
      });
      toast('Eventinformation uppdaterad', 'success');
      setEditing(false);
    } catch {
      toast('Kunde inte uppdatera event', 'error');
    }
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (!editing) {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Eventinformation</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Redigera</Button>
        </div>
        <div style={styles.infoGrid}>
          <InfoRow label="Namn" value={event.name} />
          <InfoRow label="Datum" value={event.date} />
          <InfoRow label="Tid" value={`${event.time}${event.end_time ? ' – ' + event.end_time : ''}`} />
          <InfoRow label="Plats" value={event.location} />
          <InfoRow label="Arrangör" value={`${event.organizer} (${event.organizer_email})`} />
          <InfoRow label="Max deltagare" value={event.max_participants?.toString() ?? 'Obegränsat'} />
          <InfoRow label="Status" value={event.status} />
          <InfoRow label="Typ" value={event.type} />
          {event.description && <InfoRow label="Beskrivning" value={event.description} />}
        </div>
      </div>
    );
  }

  return (
    <form style={styles.section} onSubmit={handleSave}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Eventinformation</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(false)}>Avbryt</Button>
          <Button variant="primary" size="sm" type="submit" disabled={updateEvent.isPending}>
            {updateEvent.isPending ? 'Sparar...' : 'Spara'}
          </Button>
        </div>
      </div>
      <div style={styles.formGrid}>
        <Input label="Eventnamn" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <div style={styles.formRow}>
          <Input label="Datum" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          <Input label="Starttid" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
        </div>
        <div style={styles.formRow}>
          <Input label="Slutdatum" type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
          <Input label="Sluttid" type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)} />
        </div>
        <Input label="Plats" value={form.location} onChange={(e) => set('location', e.target.value)} />
        <div style={styles.formRow}>
          <Input label="Arrangör" value={form.organizer} onChange={(e) => set('organizer', e.target.value)} />
          <Input label="Arrangörs e-post" type="email" value={form.organizer_email} onChange={(e) => set('organizer_email', e.target.value)} />
        </div>
        <div style={styles.formRow}>
          <Input label="Max deltagare" type="number" value={form.max_participants} onChange={(e) => set('max_participants', e.target.value)} hint="Lämna tomt för obegränsat" />
          <Input label="Overbooking-gräns" type="number" value={form.overbooking_limit} onChange={(e) => set('overbooking_limit', e.target.value)} />
        </div>
        <div style={styles.formRow}>
          <div style={styles.selectWrapper}>
            <label style={styles.selectLabel}>Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} style={styles.select}>
              <option value="planning">Planering</option>
              <option value="upcoming">Kommande</option>
              <option value="ongoing">Pågående</option>
              <option value="completed">Avslutat</option>
              <option value="cancelled">Inställt</option>
            </select>
          </div>
          <div style={styles.selectWrapper}>
            <label style={styles.selectLabel}>Typ</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)} style={styles.select}>
              <option value="conference">Konferens</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminarium</option>
              <option value="networking">Nätverksträff</option>
              <option value="internal">Internt</option>
              <option value="other">Övrigt</option>
            </select>
          </div>
        </div>
        <div style={styles.textareaWrapper}>
          <label style={styles.selectLabel}>Beskrivning</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            style={styles.textarea}
            rows={3}
          />
        </div>
      </div>
    </form>
  );
}

/* ---- Hero Image Section ---- */
function HeroImageSection({ event }: Props) {
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await imagesApi.upload(file);
      await updateEvent.mutateAsync({ id: event.id, data: { image_url: result.url } });
      toast('Hero-bild uppladdad', 'success');
    } catch {
      toast('Kunde inte ladda upp bild', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await updateEvent.mutateAsync({ id: event.id, data: { image_url: null } });
      toast('Hero-bild borttagen', 'success');
    } catch {
      toast('Kunde inte ta bort bild', 'error');
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Hero-bild</h3>
      </div>
      {event.image_url ? (
        <div>
          <img src={event.image_url} alt="Hero" style={styles.heroPreview} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
              Byt bild
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              Ta bort
            </Button>
          </div>
        </div>
      ) : (
        <div style={styles.uploadArea} onClick={() => fileRef.current?.click()}>
          <div style={styles.uploadIcon}>+</div>
          <div style={styles.uploadText}>Klicka för att ladda upp en hero-bild</div>
          <div style={styles.uploadHint}>JPEG, PNG eller WebP. Max 5 MB.</div>
        </div>
      )}
      {uploading && <div style={styles.uploadingText}>Laddar upp...</div>}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/* ---- Visibility Section ---- */
function VisibilitySection({ event }: Props) {
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

/* ---- Sender Mailbox Section ---- */
function SenderSection({ event }: Props) {
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

/* ---- GDPR Section ---- */
function GdprSection({ event }: Props) {
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

/* ---- Helpers ---- */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

/* ---- Styles ---- */
const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    maxWidth: '720px',
  },
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
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'baseline',
  },
  infoLabel: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    minWidth: '120px',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  selectWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  selectLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-secondary)',
  },
  select: {
    height: '36px',
    padding: '0 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
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
  heroPreview: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: 'var(--radius-lg)',
    objectFit: 'cover' as const,
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    border: '2px dashed var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast)',
  },
  uploadIcon: {
    fontSize: '24px',
    color: 'var(--color-text-muted)',
    marginBottom: '8px',
  },
  uploadText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
  },
  uploadHint: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  uploadingText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    marginTop: '8px',
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
};
