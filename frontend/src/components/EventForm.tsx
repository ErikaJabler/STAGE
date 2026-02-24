import { useState } from 'react';
import { Button, Input } from './ui';
import type { CreateEventPayload, UpdateEventPayload } from '../api/client';
import type { EventWithCount } from '@stage/shared';
import { EVENT_STATUS, EVENT_TYPE, VISIBILITY } from '@stage/shared';
import { useEventFormValidation, type EventFormData } from '../hooks/useEventFormValidation';
import { useConflictCheck } from '../hooks/useConflictCheck';

interface EventFormProps {
  initialData?: EventWithCount;
  onSubmit: (data: CreateEventPayload | UpdateEventPayload) => void;
  loading?: boolean;
  submitLabel?: string;
}

const typeLabels: Record<string, string> = {
  conference: 'Konferens',
  workshop: 'Workshop',
  seminar: 'Seminarium',
  networking: 'Networking',
  internal: 'Internt',
  other: 'Övrigt',
};

const statusLabels: Record<string, string> = {
  planning: 'Planering',
  upcoming: 'Kommande',
  ongoing: 'Pågår',
  completed: 'Avslutad',
  cancelled: 'Inställd',
};

export function EventForm({ initialData, onSubmit, loading, submitLabel }: EventFormProps) {
  const isEdit = !!initialData;

  const [form, setForm] = useState<EventFormData>({
    name: initialData?.name ?? '',
    emoji: initialData?.emoji ?? '',
    date: initialData?.date ?? '',
    time: initialData?.time ?? '',
    end_date: initialData?.end_date ?? '',
    end_time: initialData?.end_time ?? '',
    location: initialData?.location ?? '',
    description: initialData?.description ?? '',
    organizer: initialData?.organizer ?? '',
    organizer_email: initialData?.organizer_email ?? '',
    type: initialData?.type ?? 'other',
    status: initialData?.status ?? 'planning',
    visibility: initialData?.visibility ?? 'private',
    max_participants: initialData?.max_participants?.toString() ?? '',
    overbooking_limit: initialData?.overbooking_limit?.toString() ?? '0',
  });

  const { errors, setErrors, clearFieldError, validate, buildPayload } = useEventFormValidation();
  const { conflicts, showConflictWarning, checkingConflicts, checkConflicts, dismissConflicts } = useConflictCheck();

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const hasConflicts = await checkConflicts(form.date, form.location, initialData?.id);
    if (hasConflicts) return;

    onSubmit(buildPayload(form));
  }

  function handleConfirmDespiteConflict() {
    dismissConflicts();
    onSubmit(buildPayload(form));
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Basic info section */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Grundinformation</h3>
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <Input
              label="Eventnamn"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={errors.name}
              placeholder="T.ex. Consid Tech Day 2026"
              required
            />
          </div>
          <div style={{ width: '80px' }}>
            <Input
              label="Emoji"
              value={form.emoji}
              onChange={(e) => updateField('emoji', e.target.value)}
              placeholder="🎉"
              maxLength={4}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.selectLabel}>Typ</label>
            <select
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              style={styles.select}
            >
              {Object.values(EVENT_TYPE).map((t) => (
                <option key={t} value={t}>{typeLabels[t]}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.selectLabel}>Status</label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              style={styles.select}
            >
              {Object.values(EVENT_STATUS).map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.selectLabel}>Synlighet</label>
            <select
              value={form.visibility}
              onChange={(e) => updateField('visibility', e.target.value)}
              style={styles.select}
            >
              <option value={VISIBILITY.PRIVATE}>Privat</option>
              <option value={VISIBILITY.PUBLIC}>Publik</option>
            </select>
          </div>
        </div>
      </section>

      {/* Date & time section */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Datum & tid</h3>
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <Input
              label="Startdatum"
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              error={errors.date}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Starttid"
              type="time"
              value={form.time}
              onChange={(e) => updateField('time', e.target.value)}
              error={errors.time}
              required
            />
          </div>
        </div>
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <Input
              label="Slutdatum"
              type="date"
              value={form.end_date}
              onChange={(e) => updateField('end_date', e.target.value)}
              error={errors.end_date}
              hint="Valfritt — för flerdagars-event"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Sluttid"
              type="time"
              value={form.end_time}
              onChange={(e) => updateField('end_time', e.target.value)}
              error={errors.end_time}
              hint="Valfritt"
            />
          </div>
        </div>
      </section>

      {/* Location & organizer section */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Plats & arrangör</h3>
        <Input
          label="Plats"
          value={form.location}
          onChange={(e) => updateField('location', e.target.value)}
          error={errors.location}
          placeholder="T.ex. Consid Stockholm, Drottninggatan 33"
          required
        />
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <Input
              label="Arrangör"
              value={form.organizer}
              onChange={(e) => updateField('organizer', e.target.value)}
              error={errors.organizer}
              placeholder="Namn"
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Arrangörens e-post"
              type="email"
              value={form.organizer_email}
              onChange={(e) => updateField('organizer_email', e.target.value)}
              error={errors.organizer_email}
              placeholder="namn@consid.se"
              required
            />
          </div>
        </div>
      </section>

      {/* Capacity section */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Kapacitet</h3>
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <Input
              label="Max deltagare"
              type="number"
              value={form.max_participants}
              onChange={(e) => updateField('max_participants', e.target.value)}
              error={errors.max_participants}
              placeholder="Obegränsat"
              min={1}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Överbokningsgräns"
              type="number"
              value={form.overbooking_limit}
              onChange={(e) => updateField('overbooking_limit', e.target.value)}
              hint="Antal extra platser utöver max"
              min={0}
            />
          </div>
        </div>
      </section>

      {/* Description section */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Beskrivning</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={styles.selectLabel}>Beskrivning</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Berätta om eventet..."
            rows={4}
            style={styles.textarea}
          />
        </div>
      </section>

      {/* Conflict warning */}
      {showConflictWarning && conflicts.length > 0 && (
        <div style={styles.conflictWarning}>
          <div style={styles.conflictTitle}>Potentiell krock upptäckt</div>
          <p style={styles.conflictText}>
            Det finns redan {conflicts.length === 1 ? 'ett event' : `${conflicts.length} events`} samma dag och plats:
          </p>
          <ul style={styles.conflictList}>
            {conflicts.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> — {c.date} kl. {c.time}, {c.location}
              </li>
            ))}
          </ul>
          <div style={styles.conflictActions}>
            <Button type="button" variant="secondary" onClick={dismissConflicts}>
              Avbryt
            </Button>
            <Button type="button" variant="primary" onClick={handleConfirmDespiteConflict}>
              Skapa ändå
            </Button>
          </div>
        </div>
      )}

      {/* Submit */}
      <div style={styles.actions}>
        <Button type="submit" variant="primary" size="lg" loading={loading || checkingConflicts}>
          {checkingConflicts ? 'Kontrollerar krockar...' : (submitLabel || (isEdit ? 'Spara ändringar' : 'Skapa event'))}
        </Button>
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' },
  section: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)', padding: '20px 24px',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)', marginBottom: '4px',
  },
  row: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  selectLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-secondary)',
    display: 'block',
    marginBottom: '4px',
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
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
    minHeight: '80px',
  },
  conflictWarning: {
    backgroundColor: '#fff8e1',
    border: '1px solid #ffcc02',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
  },
  conflictTitle: {
    fontWeight: 600,
    fontSize: 'var(--font-size-md)',
    color: '#8d6e00',
    marginBottom: '6px',
  },
  conflictText: {
    fontSize: 'var(--font-size-sm)',
    color: '#6d5600',
    margin: '0 0 8px 0',
  },
  conflictList: {
    margin: '0 0 12px 0',
    paddingLeft: '20px',
    fontSize: 'var(--font-size-sm)',
    color: '#6d5600',
  },
  conflictActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-start',
    paddingTop: '8px',
  },
};
