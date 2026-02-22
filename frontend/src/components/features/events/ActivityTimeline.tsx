import type { Activity } from '@stage/shared';
import { useActivities } from '../../../hooks/useActivities';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  event_created: { icon: '🎉', color: 'var(--color-burgundy)' },
  event_updated: { icon: '✏️', color: 'var(--color-dark-purple)' },
  mailing_created: { icon: '📝', color: 'var(--color-accent)' },
  mailing_sent: { icon: '📧', color: 'var(--color-accent)' },
  participant_added: { icon: '👤', color: 'var(--color-burgundy)' },
  participant_removed: { icon: '🗑', color: 'var(--color-text-muted)' },
  participant_status_changed: { icon: '🔄', color: 'var(--color-dark-purple)' },
  participant_imported: { icon: '📥', color: 'var(--color-burgundy)' },
  permission_added: { icon: '🔑', color: 'var(--color-accent)' },
  permission_removed: { icon: '🔒', color: 'var(--color-text-muted)' },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'Just nu';
  if (diffMin < 60) return `${diffMin} min sedan`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} tim sedan`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Igår';
  if (diffDays < 7) return `${diffDays} dagar sedan`;
  return date.toLocaleDateString('sv-SE');
}

function ActivityItem({ activity }: { activity: Activity }) {
  const config = TYPE_CONFIG[activity.type] ?? { icon: '📋', color: 'var(--color-text-muted)' };

  return (
    <div style={styles.item}>
      <div style={styles.iconCol}>
        <span style={{ ...styles.icon, borderColor: config.color }}>{config.icon}</span>
        <div style={styles.line} />
      </div>
      <div style={styles.content}>
        <p style={styles.description}>{activity.description}</p>
        <div style={styles.meta}>
          {activity.created_by && (
            <span style={styles.actor}>{activity.created_by}</span>
          )}
          <span style={styles.time}>{formatTimeAgo(activity.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export function ActivityTimeline({ eventId }: { eventId: number }) {
  const { data: activities, isLoading } = useActivities(eventId, 20);

  if (isLoading) {
    return (
      <div style={styles.card}>
        <h3 style={styles.title}>Aktivitetslogg</h3>
        <p style={styles.empty}>Laddar...</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={styles.title}>Aktivitetslogg</h3>
        <p style={styles.empty}>Ingen aktivitet ännu</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Aktivitetslogg</h3>
      <div style={styles.timeline}>
        {activities.map((a) => (
          <ActivityItem key={a.id} activity={a} />
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    border: '1px solid var(--color-border)',
  },
  title: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    marginBottom: '16px',
    color: 'var(--color-text-primary)',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
  },
  item: {
    display: 'flex',
    gap: '12px',
    minHeight: '48px',
  },
  iconCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '32px',
    flexShrink: 0,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid',
    backgroundColor: 'var(--color-bg-primary)',
    fontSize: '14px',
    flexShrink: 0,
  },
  line: {
    width: '2px',
    flex: 1,
    backgroundColor: 'var(--color-border)',
    marginTop: '4px',
    minHeight: '12px',
  },
  content: {
    flex: 1,
    paddingBottom: '16px',
  },
  description: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
    margin: 0,
    lineHeight: '1.4',
  },
  meta: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
  actor: {
    fontWeight: 500,
  },
  time: {},
  empty: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
};
