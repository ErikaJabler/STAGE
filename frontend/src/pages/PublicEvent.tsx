import { useState, useEffect, useRef, useMemo, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import type { Event, WebsiteData } from '@stage/shared';
import type { RegisterResult } from '../api/client';
import { PublicRegistrationForm, RegistrationConfirmation } from './PublicRegistrationForm';
import { PublicEventRenderer } from './PublicEventRenderer';

interface PublicEventData {
  event: Event & { website_data_parsed: WebsiteData | null };
}

type PageState = 'loading' | 'loaded' | 'registered' | 'error';

export function PublicEvent() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<PageState>('loading');
  const [eventData, setEventData] = useState<PublicEventData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [regResult, setRegResult] = useState<RegisterResult | null>(null);

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

  const event = eventData?.event;
  const websiteData = event?.website_data_parsed;
  const hasCustomPage = !!websiteData?.page_html;

  // Sanitize custom page HTML to prevent XSS
  const sanitizedPageHtml = useMemo(() => {
    if (!websiteData?.page_html) return '';
    return DOMPurify.sanitize(websiteData.page_html, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['target', 'data-page-register-form'],
    });
  }, [websiteData?.page_html]);

  function handleRegistered(result: RegisterResult) {
    setRegResult(result);
    setState('registered');
  }

  // Registration form or confirmation (shared between custom page and template page)
  const registrationForm =
    event &&
    slug &&
    (state === 'registered' && regResult ? (
      <RegistrationConfirmation event={event} regResult={regResult} />
    ) : state === 'loaded' ? (
      <PublicRegistrationForm event={event} slug={slug} onRegistered={handleRegistered} />
    ) : null);

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
          <div ref={customPageRef} dangerouslySetInnerHTML={{ __html: sanitizedPageHtml }} />
          {/* Portal the React registration form into the placeholder */}
          {formPortalTarget && registrationForm && createPortal(registrationForm, formPortalTarget)}
        </>
      )}

      {/* Template-based page (fallback) */}
      {(state === 'loaded' || state === 'registered') && event && !hasCustomPage && (
        <PublicEventRenderer
          event={event}
          websiteData={websiteData ?? null}
          registrationForm={registrationForm}
        />
      )}
    </div>
  );
}

/* ---- Styles (only page-level + loading/error) ---- */
const s: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#EFE6DD',
    fontFamily: "'Consid Sans', system-ui, -apple-system, sans-serif",
    color: '#1C1C1C',
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  loadingText: { fontSize: '1rem', color: '#A99B94' },
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '40px',
    textAlign: 'center',
  },
  errorIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#B5223F',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '16px',
  },
  errorTitle: { fontSize: '1.5rem', fontWeight: 600, color: '#701131', margin: '0 0 8px' },
  errorText: { fontSize: '1rem', color: '#A99B94' },
};
