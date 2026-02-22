import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { rsvpApi, type RsvpInfo } from '../api/client';

type RsvpState = 'loading' | 'loaded' | 'responded' | 'cancelled' | 'error';

export function RsvpPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<RsvpState>('loading');
  const [info, setInfo] = useState<RsvpInfo | null>(null);
  const [responseName, setResponseName] = useState('');
  const [responseStatus, setResponseStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    rsvpApi.get(token).then((data: RsvpInfo) => {
      setInfo(data);
      setState('loaded');
    }).catch((_err: unknown) => {
      setState('error');
      setErrorMsg('Länken är ogiltig eller har utgått.');
    });
  }, [token]);

  async function handleRespond(status: 'attending' | 'declined') {
    if (!token) return;
    setSubmitting(true);
    try {
      const result = await rsvpApi.respond(token, status);
      setResponseName(result.name);
      setResponseStatus(result.status);
      setState('responded');
    } catch (_err: unknown) {
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
    } catch (_err: unknown) {
      setErrorMsg('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={rsvpStyles.page}>
      <div style={rsvpStyles.card}>
        {/* Consid branding header */}
        <div style={rsvpStyles.header}>
          <svg width="120" height="28" viewBox="0 0 120 28" fill="none">
            <text x="0" y="22" fontFamily="'Consid Sans', system-ui, sans-serif" fontSize="22" fontWeight="600" fill="#FFFFFF">
              Stage
            </text>
          </svg>
        </div>

        {state === 'loading' && (
          <div style={rsvpStyles.body}>
            <p style={rsvpStyles.loadingText}>Laddar...</p>
          </div>
        )}

        {state === 'error' && (
          <div style={rsvpStyles.body}>
            <div style={rsvpStyles.errorIcon}>!</div>
            <h2 style={rsvpStyles.title}>Ogiltig länk</h2>
            <p style={rsvpStyles.text}>{errorMsg}</p>
          </div>
        )}

        {state === 'loaded' && info && (
          <div style={rsvpStyles.body}>
            <h2 style={rsvpStyles.title}>
              {info.event.emoji ? `${info.event.emoji} ` : ''}{info.event.name}
            </h2>

            <div style={rsvpStyles.infoGrid}>
              <div style={rsvpStyles.infoItem}>
                <CalendarIcon />
                <span>{formatRsvpDate(info.event.date)}</span>
              </div>
              <div style={rsvpStyles.infoItem}>
                <ClockIcon />
                <span>{info.event.time}{info.event.end_time ? ` – ${info.event.end_time}` : ''}</span>
              </div>
              <div style={rsvpStyles.infoItem}>
                <LocationIcon />
                <span>{info.event.location}</span>
              </div>
            </div>

            {info.event.description && (
              <p style={rsvpStyles.description}>{info.event.description}</p>
            )}

            <div style={rsvpStyles.greeting}>
              <p style={rsvpStyles.text}>
                Hej <strong>{info.participant.name}</strong>! Du är inbjuden till detta event.
              </p>
            </div>

            {info.participant.status === 'attending' && (
              <div style={rsvpStyles.alreadyResponded}>
                <div style={rsvpStyles.checkIcon}>✓</div>
                <p style={rsvpStyles.text}>Du har redan tackat ja till detta event.</p>
                <button
                  onClick={() => downloadICS(info.event)}
                  style={rsvpStyles.calendarBtn}
                >
                  <CalendarIcon />
                  Lägg till i kalender
                </button>
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  style={rsvpStyles.cancelLink}
                >
                  {submitting ? 'Avbokar...' : 'Avboka min plats'}
                </button>
              </div>
            )}

            {info.participant.status === 'declined' && (
              <div style={rsvpStyles.alreadyResponded}>
                <p style={rsvpStyles.text}>Du har avböjt inbjudan.</p>
                <p style={rsvpStyles.smallText}>
                  Ändrat dig? Svara nedan.
                </p>
                <div style={rsvpStyles.buttonGroup}>
                  <button
                    onClick={() => handleRespond('attending')}
                    disabled={submitting}
                    style={rsvpStyles.primaryBtn}
                  >
                    {submitting ? 'Sparar...' : 'Jag kommer'}
                  </button>
                </div>
              </div>
            )}

            {info.participant.status === 'cancelled' && (
              <div style={rsvpStyles.alreadyResponded}>
                <p style={rsvpStyles.text}>Du har avbokat din plats.</p>
                <p style={rsvpStyles.smallText}>
                  Ändrat dig? Svara nedan.
                </p>
                <div style={rsvpStyles.buttonGroup}>
                  <button
                    onClick={() => handleRespond('attending')}
                    disabled={submitting}
                    style={rsvpStyles.primaryBtn}
                  >
                    {submitting ? 'Sparar...' : 'Jag kommer ändå'}
                  </button>
                </div>
              </div>
            )}

            {(info.participant.status === 'invited' || info.participant.status === 'waitlisted') && (
              <div style={rsvpStyles.buttonGroup}>
                <button
                  onClick={() => handleRespond('attending')}
                  disabled={submitting}
                  style={rsvpStyles.primaryBtn}
                >
                  {submitting ? 'Sparar...' : 'Jag kommer'}
                </button>
                <button
                  onClick={() => handleRespond('declined')}
                  disabled={submitting}
                  style={rsvpStyles.secondaryBtn}
                >
                  {submitting ? 'Sparar...' : 'Jag kan inte'}
                </button>
              </div>
            )}

            {errorMsg && (
              <p style={rsvpStyles.errorText}>{errorMsg}</p>
            )}
          </div>
        )}

        {(state === 'responded' || state === 'cancelled') && (
          <div style={rsvpStyles.body}>
            <div style={rsvpStyles.confirmIcon}>
              {responseStatus === 'attending' ? '🎉' : responseStatus === 'cancelled' ? '👋' : '✓'}
            </div>
            <h2 style={rsvpStyles.title}>
              {responseStatus === 'attending'
                ? 'Tack, vi ses!'
                : responseStatus === 'cancelled'
                  ? 'Din plats är avbokad'
                  : 'Tack för ditt svar'}
            </h2>
            <p style={rsvpStyles.text}>
              {responseStatus === 'attending'
                ? `Vad kul att du kommer, ${responseName}! Vi ser fram emot att se dig.`
                : responseStatus === 'cancelled'
                  ? `Din plats har avbokats, ${responseName}.`
                  : `Ditt svar har registrerats, ${responseName}.`}
            </p>
            {responseStatus === 'attending' && info && (
              <button
                onClick={() => downloadICS(info.event)}
                style={rsvpStyles.calendarBtn}
              >
                <CalendarIcon />
                Lägg till i kalender
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={rsvpStyles.footer}>
          <span>Powered by Stage — Consid</span>
        </div>
      </div>
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
    // Default +2h
    const [h, m] = event.time.split(':').map(Number);
    const endH = String(h + 2).padStart(2, '0');
    dtend = `${startDate}T${endH}${String(m).padStart(2, '0')}00`;
  }

  const escICS = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stage//Consid Eventplattform//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Stockholm',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${event.date}-${encodeURIComponent(event.name)}@stage.mikwik.se`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;TZID=Europe/Stockholm:${dtstart}`,
    `DTEND;TZID=Europe/Stockholm:${dtend}`,
    `SUMMARY:${escICS(event.name)}`,
    `LOCATION:${escICS(event.location)}`,
    ...(event.description ? [`DESCRIPTION:${escICS(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
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

/* ---- RSVP Helpers ---- */
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

/* ---- RSVP Styles ---- */
const rsvpStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
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
  body: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  text: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.6,
    margin: 0,
  },
  smallText: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  loadingText: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
    padding: '40px 0',
  },
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
  greeting: {
    paddingTop: '8px',
  },
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
  confirmIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-danger)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
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
    padding: '12px 32px',
    backgroundColor: 'var(--color-accent)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 150ms ease',
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
  errorText: {
    fontSize: '0.8125rem',
    color: 'var(--color-danger)',
    margin: 0,
  },
  footer: {
    padding: '16px 32px',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    borderTop: '1px solid var(--color-border)',
  },
};
