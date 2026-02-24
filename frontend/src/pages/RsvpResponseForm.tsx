import { useState } from 'react';
import type { RsvpInfo } from '../api/client';
import { downloadICS, formatRsvpDate } from '../hooks/useRsvpState';
import { CalendarIcon, ClockIcon, LocationIcon } from './RsvpIcons';

interface ExtraFieldsProps {
  dietaryNotes: string;
  setDietaryNotes: (v: string) => void;
  plusOneName: string;
  setPlusOneName: (v: string) => void;
  plusOneEmail: string;
  setPlusOneEmail: (v: string) => void;
  plusOneDietaryNotes: string;
  setPlusOneDietaryNotes: (v: string) => void;
}

export function ExtraFieldsForm({
  dietaryNotes,
  setDietaryNotes,
  plusOneName,
  setPlusOneName,
  plusOneEmail,
  setPlusOneEmail,
  plusOneDietaryNotes,
  setPlusOneDietaryNotes,
}: ExtraFieldsProps) {
  const [showPlusOne, setShowPlusOne] = useState(!!(plusOneName || plusOneEmail));

  return (
    <div style={s.extraFields}>
      <div style={s.fieldGroup}>
        <label style={s.fieldLabel}>Allergier / kostpreferenser</label>
        <textarea
          value={dietaryNotes}
          onChange={(e) => setDietaryNotes(e.target.value)}
          placeholder="T.ex. glutenfri, vegetarian, nötallergi..."
          style={s.fieldTextarea}
          rows={2}
        />
      </div>

      {!showPlusOne ? (
        <button onClick={() => setShowPlusOne(true)} style={s.addPlusOneBtn}>
          + Ta med en gäst
        </button>
      ) : (
        <div style={s.fieldGroup}>
          <label style={s.fieldLabel}>Plusettgäst</label>
          <input
            type="text"
            value={plusOneName}
            onChange={(e) => setPlusOneName(e.target.value)}
            placeholder="Gästens namn"
            style={s.fieldInput}
          />
          <input
            type="email"
            value={plusOneEmail}
            onChange={(e) => setPlusOneEmail(e.target.value)}
            placeholder="Gästens e-post (valfritt)"
            style={s.fieldInput}
          />
          <textarea
            value={plusOneDietaryNotes}
            onChange={(e) => setPlusOneDietaryNotes(e.target.value)}
            placeholder="Gästens allergier / kostpreferenser"
            style={s.fieldTextarea}
            rows={2}
          />
          <button
            onClick={() => {
              setShowPlusOne(false);
              setPlusOneName('');
              setPlusOneEmail('');
              setPlusOneDietaryNotes('');
            }}
            style={s.removePlusOneBtn}
          >
            Ta bort gäst
          </button>
        </div>
      )}
    </div>
  );
}

interface ResponseFormProps {
  info: RsvpInfo;
  submitting: boolean;
  errorMsg: string;
  dietaryNotes: string;
  setDietaryNotes: (v: string) => void;
  plusOneName: string;
  setPlusOneName: (v: string) => void;
  plusOneEmail: string;
  setPlusOneEmail: (v: string) => void;
  plusOneDietaryNotes: string;
  setPlusOneDietaryNotes: (v: string) => void;
  onRespond: (status: 'attending' | 'declined') => void;
  onStartCancel: () => void;
}

export function RsvpResponseForm({
  info,
  submitting,
  errorMsg,
  dietaryNotes,
  setDietaryNotes,
  plusOneName,
  setPlusOneName,
  plusOneEmail,
  setPlusOneEmail,
  plusOneDietaryNotes,
  setPlusOneDietaryNotes,
  onRespond,
  onStartCancel,
}: ResponseFormProps) {
  return (
    <div style={s.body}>
      <h2 style={s.title}>
        {info.event.emoji ? `${info.event.emoji} ` : ''}
        {info.event.name}
      </h2>

      <div style={s.infoGrid}>
        <div style={s.infoItem}>
          <CalendarIcon />
          <span>{formatRsvpDate(info.event.date)}</span>
        </div>
        <div style={s.infoItem}>
          <ClockIcon />
          <span>
            {info.event.time}
            {info.event.end_time ? ` – ${info.event.end_time}` : ''}
          </span>
        </div>
        <div style={s.infoItem}>
          <LocationIcon />
          <span>{info.event.location}</span>
        </div>
      </div>

      {info.event.description && <p style={s.description}>{info.event.description}</p>}

      <div style={s.greeting}>
        <p style={s.text}>
          Hej <strong>{info.participant.name}</strong>! Du är inbjuden till detta event.
        </p>
      </div>

      {info.participant.status === 'attending' && (
        <div style={s.alreadyResponded}>
          <div style={s.checkIcon}>✓</div>
          <p style={s.text}>Du har redan tackat ja till detta event.</p>
          <button onClick={() => downloadICS(info.event)} style={s.calendarBtn}>
            <CalendarIcon /> Lägg till i kalender
          </button>
          <button onClick={onStartCancel} style={s.cancelLink}>
            Avboka min plats
          </button>
        </div>
      )}

      {info.participant.status === 'declined' && (
        <div style={s.alreadyResponded}>
          <p style={s.text}>Du har avböjt inbjudan.</p>
          <p style={s.smallText}>Ändrat dig? Svara nedan.</p>
          <ExtraFieldsForm
            dietaryNotes={dietaryNotes}
            setDietaryNotes={setDietaryNotes}
            plusOneName={plusOneName}
            setPlusOneName={setPlusOneName}
            plusOneEmail={plusOneEmail}
            setPlusOneEmail={setPlusOneEmail}
            plusOneDietaryNotes={plusOneDietaryNotes}
            setPlusOneDietaryNotes={setPlusOneDietaryNotes}
          />
          <div style={s.buttonGroup}>
            <button
              onClick={() => onRespond('attending')}
              disabled={submitting}
              style={s.primaryBtn}
            >
              {submitting ? 'Sparar...' : 'Jag kommer'}
            </button>
          </div>
        </div>
      )}

      {info.participant.status === 'cancelled' && (
        <div style={s.alreadyResponded}>
          <p style={s.text}>Du har avbokat din plats.</p>
          <p style={s.smallText}>Ändrat dig? Svara nedan.</p>
          <ExtraFieldsForm
            dietaryNotes={dietaryNotes}
            setDietaryNotes={setDietaryNotes}
            plusOneName={plusOneName}
            setPlusOneName={setPlusOneName}
            plusOneEmail={plusOneEmail}
            setPlusOneEmail={setPlusOneEmail}
            plusOneDietaryNotes={plusOneDietaryNotes}
            setPlusOneDietaryNotes={setPlusOneDietaryNotes}
          />
          <div style={s.buttonGroup}>
            <button
              onClick={() => onRespond('attending')}
              disabled={submitting}
              style={s.primaryBtn}
            >
              {submitting ? 'Sparar...' : 'Jag kommer ändå'}
            </button>
          </div>
        </div>
      )}

      {(info.participant.status === 'invited' || info.participant.status === 'waitlisted') && (
        <>
          <ExtraFieldsForm
            dietaryNotes={dietaryNotes}
            setDietaryNotes={setDietaryNotes}
            plusOneName={plusOneName}
            setPlusOneName={setPlusOneName}
            plusOneEmail={plusOneEmail}
            setPlusOneEmail={setPlusOneEmail}
            plusOneDietaryNotes={plusOneDietaryNotes}
            setPlusOneDietaryNotes={setPlusOneDietaryNotes}
          />
          <div style={s.buttonGroup}>
            <button
              onClick={() => onRespond('attending')}
              disabled={submitting}
              style={s.primaryBtn}
            >
              {submitting ? 'Sparar...' : 'Jag kommer'}
            </button>
            <button
              onClick={() => onRespond('declined')}
              disabled={submitting}
              style={s.secondaryBtn}
            >
              {submitting ? 'Sparar...' : 'Jag kan inte'}
            </button>
          </div>
        </>
      )}

      {errorMsg && <p style={s.errorText}>{errorMsg}</p>}
    </div>
  );
}

interface CancelConfirmProps {
  info: RsvpInfo;
  submitting: boolean;
  errorMsg: string;
  onCancel: () => void;
  onKeep: () => void;
}

export function RsvpCancelConfirm({
  info,
  submitting,
  errorMsg,
  onCancel,
  onKeep,
}: CancelConfirmProps) {
  return (
    <div style={s.body}>
      <h2 style={s.title}>Bekräfta avbokning</h2>
      <p style={s.text}>
        Är du säker på att du vill avboka din plats på <strong>{info.event.name}</strong>?
      </p>
      <div style={s.infoGrid}>
        <div style={s.infoItem}>
          <CalendarIcon />
          <span>{formatRsvpDate(info.event.date)}</span>
        </div>
        <div style={s.infoItem}>
          <LocationIcon />
          <span>{info.event.location}</span>
        </div>
      </div>
      <div style={s.buttonGroup}>
        <button onClick={onCancel} disabled={submitting} style={s.dangerBtn}>
          {submitting ? 'Avbokar...' : 'Ja, avboka'}
        </button>
        <button onClick={onKeep} disabled={submitting} style={s.secondaryBtn}>
          Nej, behåll min plats
        </button>
      </div>
      {errorMsg && <p style={s.errorText}>{errorMsg}</p>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  body: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
  },
  title: { fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 },
  text: { fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 },
  smallText: { fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-lg)',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)',
  },
  description: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
    margin: 0,
    textAlign: 'left',
    width: '100%',
  },
  greeting: { paddingTop: '8px' },
  alreadyResponded: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '8px',
  },
  checkIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2D7A4F',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 700,
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    paddingTop: '8px',
    width: '100%',
    justifyContent: 'center',
  },
  primaryBtn: {
    padding: '14px 36px',
    backgroundColor: '#B5223F',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 150ms ease',
    boxShadow: '0 2px 8px rgba(181, 34, 63, 0.3)',
  },
  secondaryBtn: {
    padding: '12px 32px',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-lg)',
    fontSize: '0.9375rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 150ms ease',
  },
  dangerBtn: {
    padding: '12px 32px',
    backgroundColor: 'var(--color-raspberry-red)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 150ms ease',
  },
  calendarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-burgundy)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-lg)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 150ms ease',
  },
  cancelLink: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    fontSize: '0.8125rem',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '4px',
  },
  errorText: { fontSize: '0.8125rem', color: 'var(--color-danger)', margin: 0 },
  // Extra fields
  extraFields: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-lg)',
    textAlign: 'left',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' },
  fieldTextarea: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
    width: '100%',
  },
  fieldInput: {
    padding: '8px 12px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
  },
  addPlusOneBtn: {
    background: 'none',
    border: '1px dashed var(--color-border-strong)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.8125rem',
    color: 'var(--color-burgundy)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
  },
  removePlusOneBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'underline',
  },
};
