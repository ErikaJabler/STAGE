import { useState, type CSSProperties, type FormEvent } from 'react';
import type { Event } from '@stage/shared';
import { websiteApi, type RegisterResult } from '../api/client';

interface PublicRegistrationFormProps {
  event: Event;
  slug: string;
  onRegistered: (result: RegisterResult) => void;
}

export function PublicRegistrationForm({ event, slug, onRegistered }: PublicRegistrationFormProps) {
  const [form, setForm] = useState({
    name: '', email: '', company: '', category: 'other',
    dietary_notes: '', gdpr_consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Namn och e-post krävs.');
      return;
    }
    if (!form.gdpr_consent) {
      setFormError('Du måste godkänna behandlingen av personuppgifter.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await websiteApi.register(slug, {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || null,
        category: form.category,
        dietary_notes: form.dietary_notes.trim() || null,
        gdpr_consent: true,
      });
      onRegistered(result);
    } catch (err: unknown) {
      const apiErr = err as { details?: string[] };
      setFormError(apiErr.details?.[0] ?? 'Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <div style={s.formRow}>
        <FormField label="Namn *" value={form.name} onChange={(v) => set('name', v)} placeholder="Ditt namn" />
        <FormField label="E-post *" value={form.email} onChange={(v) => set('email', v)} placeholder="din@email.se" type="email" />
      </div>
      <div style={s.formRow}>
        <FormField label="Företag" value={form.company} onChange={(v) => set('company', v)} placeholder="Ditt företag (valfritt)" />
        <div style={s.formField}>
          <label style={s.formLabel}>Kategori</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)} style={s.formSelect}>
            <option value="other">Annan</option>
            <option value="internal">Intern (Consid)</option>
            <option value="public_sector">Offentlig sektor</option>
            <option value="private_sector">Privat sektor</option>
            <option value="partner">Partner</option>
          </select>
        </div>
      </div>
      <FormField label="Allergier / kostpreferenser" value={form.dietary_notes} onChange={(v) => set('dietary_notes', v)} placeholder="T.ex. vegetarian, nötallergi..." />

      <div style={s.gdprBox}>
        <label style={s.gdprLabel}>
          <input
            type="checkbox"
            checked={form.gdpr_consent}
            onChange={(e) => set('gdpr_consent', e.target.checked)}
            style={s.gdprCheckbox}
          />
          <span>
            {event.gdpr_consent_text
              ?? 'Jag samtycker till att mina personuppgifter behandlas i enlighet med GDPR för hantering av min anmälan till detta event.'}
          </span>
        </label>
      </div>

      {formError && <p style={s.formError}>{formError}</p>}

      <button type="submit" disabled={submitting} style={s.submitBtn}>
        {submitting ? 'Skickar...' : 'Anmäl mig'}
      </button>
    </form>
  );
}

export function RegistrationConfirmation({ event, regResult }: {
  event: Event;
  regResult: RegisterResult;
}) {
  return (
    <div style={s.confirmationBox}>
      <div style={s.confirmIcon}>
        {regResult.waitlisted ? '⏳' : '🎉'}
      </div>
      <h2 style={s.confirmTitle}>
        {regResult.waitlisted ? 'Du står på väntelistan' : 'Tack för din anmälan!'}
      </h2>
      <p style={s.confirmText}>
        {regResult.waitlisted
          ? 'Eventet är fullt just nu. Vi meddelar dig om en plats blir ledig.'
          : `Vi ser fram emot att se dig den ${formatDate(event.date)}!`
        }
      </p>
      {!regResult.waitlisted && (
        <button onClick={() => downloadICS(event)} style={s.calendarBtn}>
          Lägg till i kalender
        </button>
      )}
    </div>
  );
}

/* ---- Sub-component ---- */
function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div style={s.formField}>
      <label style={s.formLabel}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={s.formInput}
      />
    </div>
  );
}

/* ---- ICS generation ---- */
function downloadICS(event: Event) {
  const startDate = event.date.replace(/-/g, '');
  const startTime = event.time.replace(':', '') + '00';
  const dtstart = `${startDate}T${startTime}`;
  let dtend: string;
  if (event.end_time) {
    dtend = `${startDate}T${event.end_time.replace(':', '')}00`;
  } else {
    const [h, m] = event.time.split(':').map(Number);
    dtend = `${startDate}T${String(h + 2).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  }
  const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stage//Consid//SV',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE', 'TZID:Europe/Stockholm',
    'BEGIN:STANDARD', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
    'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'END:STANDARD',
    'BEGIN:DAYLIGHT', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
    'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'END:DAYLIGHT', 'END:VTIMEZONE',
    'BEGIN:VEVENT', `UID:${event.date}-${event.slug}@stage`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;TZID=Europe/Stockholm:${dtstart}`, `DTEND;TZID=Europe/Stockholm:${dtend}`,
    `SUMMARY:${esc(event.name)}`, `LOCATION:${esc(event.location)}`,
    ...(event.description ? [`DESCRIPTION:${esc(event.description)}`] : []),
    'END:VEVENT', 'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'event.ics';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ---- Helpers ---- */
function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ---- Styles ---- */
const s: Record<string, CSSProperties> = {
  form: {
    display: 'flex', flexDirection: 'column', gap: '16px',
    padding: '24px', backgroundColor: '#FFFFFF',
    borderRadius: '16px', boxShadow: '0 2px 12px rgba(28,28,28,0.06)',
  },
  formRow: {
    display: 'flex', flexWrap: 'wrap', gap: '12px',
  },
  formField: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    flex: '1 1 250px', minWidth: 0,
  },
  formLabel: {
    fontSize: '0.8125rem', fontWeight: 500, color: '#492A34',
  },
  formInput: {
    height: '40px', padding: '0 12px',
    borderRadius: '8px', border: '1px solid #A99B94',
    fontSize: '0.9375rem', fontFamily: 'inherit',
    color: '#1C1C1C', outline: 'none',
    transition: 'border-color 150ms ease',
  },
  formSelect: {
    height: '40px', padding: '0 12px',
    borderRadius: '8px', border: '1px solid #A99B94',
    fontSize: '0.9375rem', fontFamily: 'inherit',
    color: '#1C1C1C', cursor: 'pointer', outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  gdprBox: {
    padding: '12px', backgroundColor: '#EFE6DD',
    borderRadius: '8px',
  },
  gdprLabel: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    fontSize: '0.8125rem', lineHeight: 1.5, color: '#492A34',
    cursor: 'pointer',
  },
  gdprCheckbox: {
    marginTop: '2px', flexShrink: 0, accentColor: '#B5223F',
    width: '16px', height: '16px',
  },
  formError: {
    fontSize: '0.8125rem', color: '#B5223F', margin: 0,
  },
  submitBtn: {
    padding: '14px 32px',
    backgroundColor: '#B5223F', color: '#FFFFFF',
    border: 'none', borderRadius: '10px',
    fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background-color 150ms ease',
    boxShadow: '0 2px 8px rgba(181, 34, 63, 0.3)',
  },
  confirmationBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '40px 24px',
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(28,28,28,0.06)',
  },
  confirmIcon: { fontSize: '48px', marginBottom: '12px' },
  confirmTitle: { fontSize: '1.5rem', fontWeight: 600, color: '#701131', margin: '0 0 8px' },
  confirmText: { fontSize: '1rem', color: '#492A34', lineHeight: 1.6, margin: '0 0 20px' },
  calendarBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 24px', backgroundColor: '#EFE6DD',
    color: '#701131', border: 'none', borderRadius: '10px',
    fontSize: '0.9375rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
};
