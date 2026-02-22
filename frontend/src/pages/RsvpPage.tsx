import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { rsvpApi, type RsvpInfo } from '../api/client';

type RsvpState = 'loading' | 'loaded' | 'responded' | 'confirm-cancel' | 'cancelled' | 'error';

export function RsvpPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<RsvpState>('loading');
  const [info, setInfo] = useState<RsvpInfo | null>(null);
  const [responseName, setResponseName] = useState('');
  const [responseStatus, setResponseStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extra fields for RSVP
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [plusOneName, setPlusOneName] = useState('');
  const [plusOneEmail, setPlusOneEmail] = useState('');

  useEffect(() => {
    if (!token) return;
    rsvpApi.get(token).then((data: RsvpInfo) => {
      setInfo(data);
      setDietaryNotes(data.participant.dietary_notes ?? '');
      setPlusOneName(data.participant.plus_one_name ?? '');
      setPlusOneEmail(data.participant.plus_one_email ?? '');
      setState('loaded');
    }).catch(() => {
      setState('error');
      setErrorMsg('Länken är ogiltig eller har utgått.');
    });
  }, [token]);

  async function handleRespond(status: 'attending' | 'declined') {
    if (!token) return;
    setSubmitting(true);
    try {
      const result = await rsvpApi.respond(token, {
        status,
        dietary_notes: dietaryNotes || null,
        plus_one_name: plusOneName || null,
        plus_one_email: plusOneEmail || null,
      });
      setResponseName(result.name);
      setResponseStatus(result.status);
      setState('responded');
    } catch {
      setErrorMsg('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!token) return;
    setSubmitting(true);
    try {
      const result = await rsvpApi.cancel(token);
      setResponseName(result.name);
      setResponseStatus(result.status);
      setState('cancelled');
    } catch {
      setErrorMsg('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Hero image or Consid header */}
        {info?.event.image_url ? (
          <div style={s.heroWrapper}>
            <img src={info.event.image_url} alt="" style={s.heroImg} />
            <div style={s.heroOverlay}>
              <span style={s.heroLogo}>Stage</span>
            </div>
          </div>
        ) : (
          <div style={s.header}>
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none">
              <text x="0" y="22" fontFamily="'Consid Sans', system-ui, sans-serif" fontSize="22" fontWeight="600" fill="#FFFFFF">
                Stage
              </text>
            </svg>
          </div>
        )}

        {state === 'loading' && (
          <div style={s.body}><p style={s.loadingText}>Laddar...</p></div>
        )}

        {state === 'error' && (
          <div style={s.body}>
            <div style={s.errorIcon}>!</div>
            <h2 style={s.title}>Ogiltig länk</h2>
            <p style={s.text}>{errorMsg}</p>
          </div>
        )}

        {state === 'loaded' && info && (
          <div style={s.body}>
            <h2 style={s.title}>
              {info.event.emoji ? `${info.event.emoji} ` : ''}{info.event.name}
            </h2>

            <div style={s.infoGrid}>
              <div style={s.infoItem}>
                <CalendarIcon />
                <span>{formatRsvpDate(info.event.date)}</span>
              </div>
              <div style={s.infoItem}>
                <ClockIcon />
                <span>{info.event.time}{info.event.end_time ? ` – ${info.event.end_time}` : ''}</span>
              </div>
              <div style={s.infoItem}>
                <LocationIcon />
                <span>{info.event.location}</span>
              </div>
            </div>

            {info.event.description && (
              <p style={s.description}>{info.event.description}</p>
            )}

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
                <button onClick={() => setState('confirm-cancel')} style={s.cancelLink}>
                  Avboka min plats
                </button>
              </div>
            )}

            {info.participant.status === 'declined' && (
              <div style={s.alreadyResponded}>
                <p style={s.text}>Du har avböjt inbjudan.</p>
                <p style={s.smallText}>Ändrat dig? Svara nedan.</p>
                <ExtraFieldsForm
                  dietaryNotes={dietaryNotes} setDietaryNotes={setDietaryNotes}
                  plusOneName={plusOneName} setPlusOneName={setPlusOneName}
                  plusOneEmail={plusOneEmail} setPlusOneEmail={setPlusOneEmail}
                />
                <div style={s.buttonGroup}>
                  <button onClick={() => handleRespond('attending')} disabled={submitting} style={s.primaryBtn}>
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
                  dietaryNotes={dietaryNotes} setDietaryNotes={setDietaryNotes}
                  plusOneName={plusOneName} setPlusOneName={setPlusOneName}
                  plusOneEmail={plusOneEmail} setPlusOneEmail={setPlusOneEmail}
                />
                <div style={s.buttonGroup}>
                  <button onClick={() => handleRespond('attending')} disabled={submitting} style={s.primaryBtn}>
                    {submitting ? 'Sparar...' : 'Jag kommer ändå'}
                  </button>
                </div>
              </div>
            )}

            {(info.participant.status === 'invited' || info.participant.status === 'waitlisted') && (
              <>
                <ExtraFieldsForm
                  dietaryNotes={dietaryNotes} setDietaryNotes={setDietaryNotes}
                  plusOneName={plusOneName} setPlusOneName={setPlusOneName}
                  plusOneEmail={plusOneEmail} setPlusOneEmail={setPlusOneEmail}
                />
                <div style={s.buttonGroup}>
                  <button onClick={() => handleRespond('attending')} disabled={submitting} style={s.primaryBtn}>
                    {submitting ? 'Sparar...' : 'Jag kommer'}
                  </button>
                  <button onClick={() => handleRespond('declined')} disabled={submitting} style={s.secondaryBtn}>
                    {submitting ? 'Sparar...' : 'Jag kan inte'}
                  </button>
                </div>
              </>
            )}

            {errorMsg && <p style={s.errorText}>{errorMsg}</p>}
          </div>
        )}

        {/* Cancellation confirmation step */}
        {state === 'confirm-cancel' && info && (
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
              <button onClick={handleCancel} disabled={submitting} style={s.dangerBtn}>
                {submitting ? 'Avbokar...' : 'Ja, avboka'}
              </button>
              <button onClick={() => setState('loaded')} disabled={submitting} style={s.secondaryBtn}>
                Nej, behåll min plats
              </button>
            </div>
            {errorMsg && <p style={s.errorText}>{errorMsg}</p>}
          </div>
        )}

        {/* Confirmation / Response summary */}
        {(state === 'responded' || state === 'cancelled') && info && (
          <div style={s.body}>
            <div style={s.confirmIcon}>
              {responseStatus === 'attending' ? '🎉' : responseStatus === 'cancelled' ? '👋' : responseStatus === 'waitlisted' ? '⏳' : '✓'}
            </div>
            <h2 style={s.title}>
              {responseStatus === 'attending' ? 'Tack, vi ses!'
                : responseStatus === 'waitlisted' ? 'Du står på väntelistan'
                : responseStatus === 'cancelled' ? 'Din plats är avbokad'
                : 'Tack för ditt svar'}
            </h2>
            <p style={s.text}>
              {responseStatus === 'attending'
                ? `Vad kul att du kommer, ${responseName}! Vi ser fram emot att se dig.`
                : responseStatus === 'waitlisted'
                  ? `Du har placerats på väntelistan, ${responseName}. Vi meddelar dig om en plats blir ledig.`
                  : responseStatus === 'cancelled'
                    ? `Din plats har avbokats, ${responseName}.`
                    : `Ditt svar har registrerats, ${responseName}.`}
            </p>

            {/* Event summary on confirmation */}
            <div style={s.summaryCard}>
              <div style={s.summaryRow}>
                <CalendarIcon />
                <span>{formatRsvpDate(info.event.date)}</span>
              </div>
              <div style={s.summaryRow}>
                <ClockIcon />
                <span>{info.event.time}{info.event.end_time ? ` – ${info.event.end_time}` : ''}</span>
              </div>
              <div style={s.summaryRow}>
                <LocationIcon />
                <span>{info.event.location}</span>
              </div>
            </div>

            {responseStatus === 'attending' && (
              <button onClick={() => downloadICS(info.event)} style={s.calendarBtn}>
                <CalendarIcon /> Lägg till i kalender
              </button>
            )}
          </div>
        )}

        <div style={s.footer}>
          <span>Powered by Stage — Consid</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Extra fields form (dietary + plus-one) ---- */
function ExtraFieldsForm({
  dietaryNotes, setDietaryNotes,
  plusOneName, setPlusOneName,
  plusOneEmail, setPlusOneEmail,
}: {
  dietaryNotes: string; setDietaryNotes: (v: string) => void;
  plusOneName: string; setPlusOneName: (v: string) => void;
  plusOneEmail: string; setPlusOneEmail: (v: string) => void;
}) {
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
          <button onClick={() => { setShowPlusOne(false); setPlusOneName(''); setPlusOneEmail(''); }} style={s.removePlusOneBtn}>
            Ta bort gäst
          </button>
        </div>
      )}
    </div>
  );
}

/* ---- ICS generation (client-side) ---- */
function downloadICS(event: RsvpInfo['event']) {
  const startDate = event.date.replace(/-/g, '');
  const startTime = event.time.replace(':', '') + '00';
  const dtstart = `${startDate}T${startTime}`;

  let dtend: string;
  if (event.end_time) {
    dtend = `${startDate}T${event.end_time.replace(':', '')}00`;
  } else {
    const [h, m] = event.time.split(':').map(Number);
    const endH = String(h + 2).padStart(2, '0');
    dtend = `${startDate}T${endH}${String(m).padStart(2, '0')}00`;
  }

  const escICS = (t: string) =>
    t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Stage//Consid Eventplattform//SV',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE', 'TZID:Europe/Stockholm',
    'BEGIN:STANDARD', 'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
    'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET',
    'END:STANDARD', 'BEGIN:DAYLIGHT', 'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
    'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST',
    'END:DAYLIGHT', 'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${event.date}-${encodeURIComponent(event.name)}@stage.mikwik.se`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;TZID=Europe/Stockholm:${dtstart}`,
    `DTEND;TZID=Europe/Stockholm:${dtend}`,
    `SUMMARY:${escICS(event.name)}`,
    `LOCATION:${escICS(event.location)}`,
    ...(event.description ? [`DESCRIPTION:${escICS(event.description)}`] : []),
    'END:VEVENT', 'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'event.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---- Helpers ---- */
function formatRsvpDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 6h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M8 14s-5-4.5-5-8a5 5 0 1110 0c0 3.5-5 8-5 8z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/* ---- Styles ---- */
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-primary)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 24px',
    fontFamily: "'Consid Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(28, 28, 28, 0.1)',
  },
  header: {
    backgroundColor: 'var(--color-burgundy)',
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
  },
  heroWrapper: {
    position: 'relative',
    width: '100%',
    height: '180px',
    overflow: 'hidden',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 24px',
    background: 'linear-gradient(transparent, rgba(112, 17, 49, 0.85))',
  },
  heroLogo: {
    fontFamily: "'Consid Sans', system-ui, sans-serif",
    fontSize: '18px',
    fontWeight: 600,
    color: '#FFFFFF',
  },
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
  loadingText: { fontSize: '0.9375rem', color: 'var(--color-text-muted)', padding: '40px 0' },
  infoGrid: {
    display: 'flex', flexDirection: 'column', gap: '10px', width: '100%',
    padding: '16px', backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)',
  },
  infoItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' },
  description: { fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0, textAlign: 'left', width: '100%' },
  greeting: { paddingTop: '8px' },
  alreadyResponded: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingTop: '8px' },
  checkIcon: {
    width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2D7A4F',
    color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700,
  },
  confirmIcon: { fontSize: '48px', marginBottom: '8px' },
  errorIcon: {
    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-danger)',
    color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700,
  },
  buttonGroup: { display: 'flex', gap: '12px', paddingTop: '8px', width: '100%', justifyContent: 'center' },
  primaryBtn: {
    padding: '14px 36px', backgroundColor: '#B5223F', color: '#FFFFFF',
    border: 'none', borderRadius: '8px', fontSize: '1rem',
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 150ms ease',
    boxShadow: '0 2px 8px rgba(181, 34, 63, 0.3)',
  },
  secondaryBtn: {
    padding: '12px 32px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-lg)',
    fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 150ms ease',
  },
  dangerBtn: {
    padding: '12px 32px', backgroundColor: 'var(--color-raspberry-red)', color: '#FFFFFF',
    border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '0.9375rem',
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 150ms ease',
  },
  calendarBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-burgundy)',
    border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-lg)',
    fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 150ms ease',
  },
  cancelLink: {
    background: 'none', border: 'none', color: 'var(--color-text-muted)',
    fontSize: '0.8125rem', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px',
  },
  errorText: { fontSize: '0.8125rem', color: 'var(--color-danger)', margin: 0 },
  footer: { padding: '16px 32px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' },
  // Summary card on confirmation
  summaryCard: {
    display: 'flex', flexDirection: 'column', gap: '8px', width: '100%',
    padding: '14px', backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)',
  },
  summaryRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' },
  // Extra fields
  extraFields: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: '12px',
    padding: '16px', backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', textAlign: 'left',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' },
  fieldTextarea: {
    padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)', fontSize: '0.875rem', color: 'var(--color-text-primary)',
    fontFamily: 'inherit', resize: 'vertical' as const, outline: 'none', width: '100%',
  },
  fieldInput: {
    padding: '8px 12px', height: '36px', borderRadius: '8px', border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)', fontSize: '0.875rem', color: 'var(--color-text-primary)',
    fontFamily: 'inherit', outline: 'none', width: '100%',
  },
  addPlusOneBtn: {
    background: 'none', border: '1px dashed var(--color-border-strong)', borderRadius: '8px',
    padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--color-burgundy)',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  },
  removePlusOneBtn: {
    background: 'none', border: 'none', padding: 0, fontSize: '0.75rem',
    color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
  },
};
