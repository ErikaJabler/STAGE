import { useState, useMemo } from 'react';
import {
  useParticipantActivities,
  useParticipantEmailHistory,
} from '../../../hooks/useParticipants';
import { formatDateTime } from '../shared-helpers';
import type { Activity, ParticipantEmailHistory } from '@stage/shared';

interface TimelineEntry {
  id: string;
  description: string;
  date: string;
  color: 'green' | 'red' | 'muted' | 'orange';
  icon: string;
  createdBy?: string | null;
}

const INITIAL_LIMIT = 15;

function activityToEntry(a: Activity): TimelineEntry {
  let color: TimelineEntry['color'] = 'muted';
  let icon = '\u2022'; // bullet

  switch (a.type) {
    case 'participant_added':
    case 'participant_registered':
      color = 'green';
      icon = '+';
      break;
    case 'rsvp_responded': {
      const meta = a.metadata ? JSON.parse(a.metadata) : {};
      if (meta.status === 'attending') {
        color = 'green';
        icon = '\u2713'; // checkmark
      } else {
        color = 'muted';
        icon = '\u2013'; // en-dash
      }
      break;
    }
    case 'rsvp_cancelled':
      color = 'red';
      icon = '\u2717'; // X
      break;
    case 'waitlist_promoted':
      color = 'green';
      icon = '\u2191'; // up arrow
      break;
    case 'participant_edited':
      color = 'muted';
      icon = '\u270E'; // pencil
      break;
    case 'participant_status_changed':
      color = 'muted';
      icon = '\u21C4'; // arrows
      break;
    case 'participant_removed':
      color = 'red';
      icon = '\u2212'; // minus
      break;
    default:
      break;
  }

  let description = a.description;
  if (a.created_by) {
    description += ` (av ${a.created_by})`;
  }

  return {
    id: `activity-${a.id}`,
    description,
    date: a.created_at,
    color,
    icon,
    createdBy: a.created_by,
  };
}

function emailToEntry(e: ParticipantEmailHistory): TimelineEntry {
  const statusLabel =
    e.status === 'sent' ? 'Skickat' : e.status === 'failed' ? 'Misslyckades' : 'Väntar';

  return {
    id: `email-${e.id}`,
    description: `Utskick: "${e.subject}" — ${statusLabel}`,
    date: e.sent_at ?? e.created_at,
    color: 'orange',
    icon: '\u2709', // envelope
  };
}

const colorMap: Record<TimelineEntry['color'], string> = {
  green: 'var(--color-success, #2e7d32)',
  red: 'var(--color-raspberry-red, #B5223F)',
  muted: 'var(--color-text-muted)',
  orange: 'var(--color-light-orange, #F49E88)',
};

export function ParticipantTimeline({
  eventId,
  participantId,
}: {
  eventId: number;
  participantId: number;
}) {
  const [showAll, setShowAll] = useState(false);

  const { data: activities, isLoading: activitiesLoading } = useParticipantActivities(
    eventId,
    participantId,
  );
  const { data: emailHistory, isLoading: emailsLoading } = useParticipantEmailHistory(
    eventId,
    participantId,
  );

  const entries = useMemo(() => {
    const items: TimelineEntry[] = [];
    if (activities) {
      items.push(...activities.map(activityToEntry));
    }
    if (emailHistory) {
      items.push(...emailHistory.map(emailToEntry));
    }
    // Sort newest first
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [activities, emailHistory]);

  const isLoading = activitiesLoading || emailsLoading;
  const totalCount = entries.length;
  const visible = showAll ? entries : entries.slice(0, INITIAL_LIMIT);

  return (
    <div style={styles.section}>
      <h4 style={styles.title}>Aktivitet</h4>
      {isLoading ? (
        <p style={styles.empty}>Laddar\u2026</p>
      ) : entries.length === 0 ? (
        <p style={styles.empty}>Ingen aktivitet</p>
      ) : (
        <>
          <div style={styles.list}>
            {visible.map((entry) => (
              <div key={entry.id} style={styles.row}>
                <span
                  style={{
                    ...styles.icon,
                    color: colorMap[entry.color],
                  }}
                >
                  {entry.icon}
                </span>
                <span style={styles.description}>{entry.description}</span>
                <span style={styles.date}>{formatDateTime(entry.date)}</span>
              </div>
            ))}
          </div>
          {!showAll && totalCount > INITIAL_LIMIT && (
            <button style={styles.showAllBtn} onClick={() => setShowAll(true)}>
              Visa alla ({totalCount})
            </button>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    borderTop: '1px solid var(--color-border)',
    paddingTop: '12px',
    marginBottom: '12px',
  },
  title: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
    marginBottom: '8px',
  },
  empty: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: 'var(--font-size-sm)',
  },
  icon: {
    width: '18px',
    textAlign: 'center' as const,
    flexShrink: 0,
    fontSize: 'var(--font-size-sm)',
    fontWeight: 700,
  },
  description: {
    flex: 1,
    color: 'var(--color-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  date: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  showAllBtn: {
    marginTop: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--color-raspberry-red, #B5223F)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)',
    padding: 0,
    textDecoration: 'underline',
  },
};
