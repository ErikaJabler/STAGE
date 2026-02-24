import { useState, useEffect } from 'react';
import { rsvpApi, type RsvpInfo } from '../api/client';

export type RsvpState =
  | 'loading'
  | 'loaded'
  | 'responded'
  | 'confirm-cancel'
  | 'cancelled'
  | 'error';

export function useRsvpState(token: string | undefined) {
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
  const [plusOneDietaryNotes, setPlusOneDietaryNotes] = useState('');

  useEffect(() => {
    if (!token) return;
    rsvpApi
      .get(token)
      .then((data: RsvpInfo) => {
        setInfo(data);
        setDietaryNotes(data.participant.dietary_notes ?? '');
        setPlusOneName(data.participant.plus_one_name ?? '');
        setPlusOneEmail(data.participant.plus_one_email ?? '');
        setPlusOneDietaryNotes(data.participant.plus_one_dietary_notes ?? '');
        setState('loaded');
      })
      .catch(() => {
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
        plus_one_dietary_notes: plusOneDietaryNotes || null,
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

  return {
    state,
    setState,
    info,
    responseName,
    responseStatus,
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
    handleRespond,
    handleCancel,
  };
}

/* ---- ICS generation (client-side) ---- */
export function downloadICS(event: RsvpInfo['event']) {
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
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}`,
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

export function formatRsvpDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
