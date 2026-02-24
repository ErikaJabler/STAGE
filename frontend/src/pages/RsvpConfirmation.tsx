import type { RsvpInfo } from '../api/client';
import { downloadICS, formatRsvpDate } from '../hooks/useRsvpState';
import { CalendarIcon, ClockIcon, LocationIcon } from './RsvpIcons';

interface Props {
  info: RsvpInfo;
  responseName: string;
  responseStatus: string;
}

export function RsvpConfirmation({ info, responseName, responseStatus }: Props) {
  return (
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
  confirmIcon: { fontSize: '48px', marginBottom: '8px' },
  summaryCard: {
    display: 'flex', flexDirection: 'column', gap: '8px', width: '100%',
    padding: '14px', backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)',
  },
  summaryRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' },
  calendarBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-burgundy)',
    border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-lg)',
    fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 150ms ease',
  },
};
