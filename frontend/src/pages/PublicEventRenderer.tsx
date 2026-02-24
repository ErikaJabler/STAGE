import { type CSSProperties, type ReactNode } from 'react';
import type { Event, WebsiteData } from '@stage/shared';

interface PublicEventRendererProps {
  event: Event;
  websiteData: WebsiteData | null;
  registrationForm: ReactNode;
}

export function PublicEventRenderer({
  event,
  websiteData,
  registrationForm,
}: PublicEventRendererProps) {
  const template = event.website_template;

  return (
    <>
      {/* Hero Section */}
      <header
        style={{
          ...s.hero,
          backgroundImage: event.image_url
            ? `linear-gradient(rgba(112,17,49,0.65), rgba(112,17,49,0.85)), url(${event.image_url})`
            : undefined,
          backgroundColor: event.image_url ? undefined : '#701131',
        }}
      >
        <div style={s.heroContent}>
          <div style={s.heroLogo}>Stage</div>
          <h1 style={s.heroTitle}>{websiteData?.hero_title || event.name}</h1>
          {websiteData?.hero_subtitle && <p style={s.heroSubtitle}>{websiteData.hero_subtitle}</p>}
        </div>
      </header>

      {/* Event Info Section */}
      <section style={s.section}>
        <div style={s.infoGrid}>
          <InfoCard icon="📅" label="Datum" value={formatDate(event.date)} />
          <InfoCard
            icon="🕐"
            label="Tid"
            value={`${event.time}${event.end_time ? ` – ${event.end_time}` : ''}`}
          />
          <InfoCard icon="📍" label="Plats" value={event.location} />
          <InfoCard icon="👤" label="Arrangör" value={event.organizer} />
        </div>
        {event.description && <p style={s.description}>{event.description}</p>}
      </section>

      {/* Program Section (hero-program-plats template) */}
      {template === 'hero-program-plats' &&
        websiteData?.program_items &&
        websiteData.program_items.length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Program</h2>
            <div style={s.timeline}>
              {websiteData.program_items.map((item, i) => (
                <div key={i} style={s.timelineItem}>
                  <div style={s.timelineDot} />
                  <div style={s.timelineContent}>
                    <div style={s.timelineTime}>{item.time}</div>
                    <div style={s.timelineTitle}>{item.title}</div>
                    {item.description && <div style={s.timelineDesc}>{item.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Venue Section (hero-program-plats template) */}
      {template === 'hero-program-plats' &&
        (websiteData?.venue_description || websiteData?.venue_address) && (
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
      <section style={s.section}>{registrationForm}</section>

      {/* Footer */}
      <footer style={s.footer}>
        <span>Powered by Stage — Consid</span>
      </footer>
    </>
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

/* ---- Helpers ---- */
function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ---- Styles ---- */
const s: Record<string, CSSProperties> = {
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
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    opacity: 0.8,
    marginBottom: '16px',
  },
  heroTitle: {
    fontSize: 'clamp(1.75rem, 5vw, 3rem)',
    fontWeight: 600,
    margin: '0 0 12px',
    lineHeight: 1.15,
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    opacity: 0.9,
    margin: 0,
    lineHeight: 1.5,
  },
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
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  infoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(28,28,28,0.06)',
  },
  infoLabel: {
    fontSize: '0.75rem',
    color: '#A99B94',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  infoValue: { fontSize: '0.9375rem', fontWeight: 500, color: '#1C1C1C' },
  description: { fontSize: '1rem', lineHeight: 1.7, color: '#492A34', margin: 0 },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    paddingLeft: '20px',
    borderLeft: '2px solid #F49E88',
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px 0',
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: '-26px',
    top: '22px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#B5223F',
    border: '2px solid #EFE6DD',
  },
  timelineContent: { flex: 1 },
  timelineTime: { fontSize: '0.8125rem', fontWeight: 600, color: '#B5223F' },
  timelineTitle: { fontSize: '1rem', fontWeight: 600, color: '#1C1C1C', marginTop: '2px' },
  timelineDesc: { fontSize: '0.875rem', color: '#A99B94', marginTop: '4px', lineHeight: 1.5 },
  venueDesc: { fontSize: '1rem', lineHeight: 1.7, color: '#492A34', margin: '0 0 12px' },
  venueAddress: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    fontSize: '0.9375rem',
  },
  footer: {
    textAlign: 'center',
    padding: '24px',
    fontSize: '0.75rem',
    color: '#A99B94',
  },
};
