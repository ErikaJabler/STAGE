import { useState, useEffect, useRef, type CSSProperties, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { Event, WebsiteData } from '@stage/shared';
import { websiteApi, type RegisterResult } from '../api/client';

interface PublicEventData {
  event: Event & { website_data_parsed: WebsiteData | null };
}

type PageState = 'loading' | 'loaded' | 'registered' | 'error';

export function PublicEvent() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<PageState>('loading');
  const [eventData, setEventData] = useState<PublicEventData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Registration form
  const [form, setForm] = useState({
    name: '', email: '', company: '', category: 'other',
    dietary_notes: '', gdpr_consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [regResult, setRegResult] = useState<RegisterResult | null>(null);
  const [formError, setFormError] = useState('');

  // Custom page: ref for finding form placeholder
  const customPageRef = useRef<HTMLDivElement>(null);
  const [formPortalTarget, setFormPortalTarget] = useState<Element | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/stage/api/public/events/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json() as Promise<PublicEventData>;
      })
      .then((data) => {
        setEventData(data);
        setState('loaded');
      })
      .catch(() => {
        setState('error');
        setErrorMsg('Eventet hittades inte eller är inte publicerat.');
      });
  }, [slug]);

  // Find the form placeholder in custom page HTML
  useEffect(() => {
    if (customPageRef.current) {
      const placeholder = customPageRef.current.querySelector('[data-page-register-form]');
      if (placeholder) {
        setFormPortalTarget(placeholder);
      }
    }
  }, [state, eventData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!slug) return;

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
      setRegResult(result);
      setState('registered');
    } catch (err: unknown) {
      const apiErr = err as { details?: string[] };
      setFormError(apiErr.details?.[0] ?? 'Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const event = eventData?.event;
  const websiteData = event?.website_data_parsed;
  const template = event?.website_template;
  const hasCustomPage = !!websiteData?.page_html;

  // Registration form component (shared between custom page and template page)
  const registrationForm = event && (
    state === 'registered' && regResult ? (
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
            📅 Lägg till i kalender
          </button>
        )}
      </div>
    ) : state === 'loaded' ? (
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
    ) : null
  );

  return (
    <div style={s.page}>
      {state === 'loading' && (
        <div style={s.loadingBox}>
          <p style={s.loadingText}>Laddar...</p>
        </div>
      )}

      {state === 'error' && (
        <div style={s.errorBox}>
          <div style={s.errorIcon}>!</div>
          <h2 style={s.errorTitle}>Sidan hittades inte</h2>
          <p style={s.errorText}>{errorMsg}</p>
        </div>
      )}

      {/* Custom page (GrapeJS-generated HTML) */}
      {(state === 'loaded' || state === 'registered') && event && hasCustomPage && (
        <>
          <div
            ref={customPageRef}
            dangerouslySetInnerHTML={{ __html: websiteData!.page_html! }}
          />
          {/* Portal the React registration form into the placeholder */}
          {formPortalTarget && registrationForm && createPortal(registrationForm, formPortalTarget)}
        </>
      )}

      {/* Template-based page (fallback) */}
      {(state === 'loaded' || state === 'registered') && event && !hasCustomPage && (
        <>
          {/* Hero Section */}
          <header style={{
            ...s.hero,
            backgroundImage: event.image_url
              ? `linear-gradient(rgba(112,17,49,0.65), rgba(112,17,49,0.85)), url(${event.image_url})`
              : undefined,
            backgroundColor: event.image_url ? undefined : '#701131',
          }}>
            <div style={s.heroContent}>
              <div style={s.heroLogo}>Stage</div>
              <h1 style={s.heroTitle}>
                {websiteData?.hero_title || event.name}
              </h1>
              {websiteData?.hero_subtitle && (
                <p style={s.heroSubtitle}>{websiteData.hero_subtitle}</p>
              )}
            </div>
          </header>

          {/* Event Info Section */}
          <section style={s.section}>
            <div style={s.infoGrid}>
              <InfoCard icon="📅" label="Datum" value={formatDate(event.date)} />
              <InfoCard icon="🕐" label="Tid" value={`${event.time}${event.end_time ? ` – ${event.end_time}` : ''}`} />
              <InfoCard icon="📍" label="Plats" value={event.location} />
              <InfoCard icon="👤" label="Arrangör" value={event.organizer} />
            </div>
            {event.description && (
              <p style={s.description}>{event.description}</p>
            )}
          </section>

          {/* Program Section (hero-program-plats template) */}
          {template === 'hero-program-plats' && websiteData?.program_items && websiteData.program_items.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Program</h2>
              <div style={s.timeline}>
                {websiteData.program_items.map((item, i) => (
                  <div key={i} style={s.timelineItem}>
                    <div style={s.timelineDot} />
                    <div style={s.timelineContent}>
                      <div style={s.timelineTime}>{item.time}</div>
                      <div style={s.timelineTitle}>{item.title}</div>
                      {item.description && (
                        <div style={s.timelineDesc}>{item.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Venue Section (hero-program-plats template) */}
          {template === 'hero-program-plats' && (websiteData?.venue_description || websiteData?.venue_address) && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Plats</h2>
              {websiteData.venue_description && (
                <p style={s.venueDesc}>{websiteData.venue_description}</p>
              )}
              {websiteData.venue_address && (
                <div style={s.venueAddress}>
                  <span style={{ fontSize: '16px' }}>📍</span>
                  <span>{websiteData.venue_address}</span>
                </div>
              )}
            </section>
          )}

          {/* Registration Form / Confirmation */}
          <section style={s.section}>
            {registrationForm}
          </section>

          {/* Footer */}
          <footer style={s.footer}>
            <span>Powered by Stage — Consid</span>
          </footer>
        </>
      )}
    </div>
  );
}

/* ---- Sub-components ---- */
function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={s.infoCard}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div>
        <div style={s.infoLabel}>{label}</div>
        <div style={s.infoValue}>{value}</div>
      </div>
    </div>
  );
}

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
  page: {
    minHeight: '100vh',
    backgroundColor: '#EFE6DD',
    fontFamily: "'Consid Sans', system-ui, -apple-system, sans-serif",
    color: '#1C1C1C',
  },
  loadingBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh',
  },
  loadingText: { fontSize: '1rem', color: '#A99B94' },
  errorBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh', padding: '40px',
    textAlign: 'center',
  },
  errorIcon: {
    width: '56px', height: '56px', borderRadius: '50%',
    backgroundColor: '#B5223F', color: '#fff', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '28px',
    fontWeight: 700, marginBottom: '16px',
  },
  errorTitle: { fontSize: '1.5rem', fontWeight: 600, color: '#701131', margin: '0 0 8px' },
  errorText: { fontSize: '1rem', color: '#A99B94' },

  // Hero
  hero: {
    padding: '60px 24px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  heroContent: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  heroLogo: {
    fontSize: '14px', fontWeight: 600, letterSpacing: '2px',
    textTransform: 'uppercase' as const, opacity: 0.8,
    marginBottom: '16px',
  },
  heroTitle: {
    fontSize: 'clamp(1.75rem, 5vw, 3rem)',
    fontWeight: 600, margin: '0 0 12px', lineHeight: 1.15,
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    opacity: 0.9, margin: 0, lineHeight: 1.5,
  },

  // Section
  section: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#701131',
    margin: '0 0 20px',
  },

  // Info grid
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  infoCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', backgroundColor: '#FFFFFF',
    borderRadius: '12px', boxShadow: '0 1px 4px rgba(28,28,28,0.06)',
  },
  infoLabel: { fontSize: '0.75rem', color: '#A99B94', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  infoValue: { fontSize: '0.9375rem', fontWeight: 500, color: '#1C1C1C' },
  description: { fontSize: '1rem', lineHeight: 1.7, color: '#492A34', margin: 0 },

  // Timeline (program)
  timeline: {
    display: 'flex', flexDirection: 'column', gap: '0',
    paddingLeft: '20px', borderLeft: '2px solid #F49E88',
  },
  timelineItem: {
    display: 'flex', gap: '16px', padding: '16px 0',
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute', left: '-26px', top: '22px',
    width: '12px', height: '12px', borderRadius: '50%',
    backgroundColor: '#B5223F', border: '2px solid #EFE6DD',
  },
  timelineContent: { flex: 1 },
  timelineTime: { fontSize: '0.8125rem', fontWeight: 600, color: '#B5223F' },
  timelineTitle: { fontSize: '1rem', fontWeight: 600, color: '#1C1C1C', marginTop: '2px' },
  timelineDesc: { fontSize: '0.875rem', color: '#A99B94', marginTop: '4px', lineHeight: 1.5 },

  // Venue
  venueDesc: { fontSize: '1rem', lineHeight: 1.7, color: '#492A34', margin: '0 0 12px' },
  venueAddress: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px', backgroundColor: '#FFFFFF',
    borderRadius: '12px', fontSize: '0.9375rem',
  },

  // Form
  form: {
    display: 'flex', flexDirection: 'column', gap: '16px',
    padding: '24px', backgroundColor: '#FFFFFF',
    borderRadius: '16px', boxShadow: '0 2px 12px rgba(28,28,28,0.06)',
  },
  formRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
  },
  formField: {
    display: 'flex', flexDirection: 'column', gap: '4px',
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

  // Confirmation
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

  // Footer
  footer: {
    textAlign: 'center', padding: '24px',
    fontSize: '0.75rem', color: '#A99B94',
  },
};
