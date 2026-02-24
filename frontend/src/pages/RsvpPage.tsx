import { useParams } from 'react-router-dom';
import { useRsvpState } from '../hooks/useRsvpState';
import { RsvpResponseForm, RsvpCancelConfirm } from './RsvpResponseForm';
import { RsvpConfirmation } from './RsvpConfirmation';

export function RsvpPage() {
  const { token } = useParams<{ token: string }>();
  const rsvp = useRsvpState(token);

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Hero image or Consid header */}
        {rsvp.info?.event.image_url ? (
          <div style={s.heroWrapper}>
            <img
              src={rsvp.info.event.image_url}
              alt={`Hero-bild för ${rsvp.info.event.name}`}
              style={s.heroImg}
            />
            <div style={s.heroOverlay}>
              <span style={s.heroLogo}>Stage</span>
            </div>
          </div>
        ) : (
          <div style={s.header}>
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none" aria-label="Stage">
              <text
                x="0"
                y="22"
                fontFamily="'Consid Sans', system-ui, sans-serif"
                fontSize="22"
                fontWeight="600"
                fill="#FFFFFF"
              >
                Stage
              </text>
            </svg>
          </div>
        )}

        {rsvp.state === 'loading' && (
          <div style={s.body}>
            <p style={s.loadingText}>Laddar...</p>
          </div>
        )}

        {rsvp.state === 'error' && (
          <div style={s.body}>
            <div style={s.errorIcon}>!</div>
            <h2 style={s.title}>Ogiltig länk</h2>
            <p style={s.text}>{rsvp.errorMsg}</p>
          </div>
        )}

        {rsvp.state === 'loaded' && rsvp.info && (
          <RsvpResponseForm
            info={rsvp.info}
            submitting={rsvp.submitting}
            errorMsg={rsvp.errorMsg}
            dietaryNotes={rsvp.dietaryNotes}
            setDietaryNotes={rsvp.setDietaryNotes}
            plusOneName={rsvp.plusOneName}
            setPlusOneName={rsvp.setPlusOneName}
            plusOneEmail={rsvp.plusOneEmail}
            setPlusOneEmail={rsvp.setPlusOneEmail}
            onRespond={rsvp.handleRespond}
            onStartCancel={() => rsvp.setState('confirm-cancel')}
          />
        )}

        {rsvp.state === 'confirm-cancel' && rsvp.info && (
          <RsvpCancelConfirm
            info={rsvp.info}
            submitting={rsvp.submitting}
            errorMsg={rsvp.errorMsg}
            onCancel={rsvp.handleCancel}
            onKeep={() => rsvp.setState('loaded')}
          />
        )}

        {(rsvp.state === 'responded' || rsvp.state === 'cancelled') && rsvp.info && (
          <RsvpConfirmation
            info={rsvp.info}
            responseName={rsvp.responseName}
            responseStatus={rsvp.responseStatus}
          />
        )}

        <div style={s.footer}>
          <span>Powered by Stage — Consid</span>
        </div>
      </div>
    </div>
  );
}

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
  loadingText: { fontSize: '0.9375rem', color: 'var(--color-text-muted)', padding: '40px 0' },
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
  footer: {
    padding: '16px 32px',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    borderTop: '1px solid var(--color-border)',
  },
};
