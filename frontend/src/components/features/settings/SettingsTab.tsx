import type { CSSProperties } from 'react';
import type { EventWithCount } from '@stage/shared';
import { EventInfoSection } from './EventInfoSection';
import { HeroImageSection } from './HeroImageSection';
import { VisibilitySection, SenderSection, GdprSection } from './VisibilitySection';
import { PermissionsPanel } from './PermissionsPanel';
import { WebsitePanel } from './WebsitePanel';
import { DangerZone } from './DangerZone';

interface Props {
  event: EventWithCount;
}

export function SettingsTab({ event }: Props) {
  return (
    <div style={styles.container}>
      <EventInfoSection event={event} />
      <HeroImageSection event={event} />
      <VisibilitySection event={event} />
      <SenderSection event={event} />
      <GdprSection event={event} />
      <div style={styles.section}>
        <WebsitePanel event={event} />
      </div>
      <div style={styles.section}>
        <PermissionsPanel eventId={event.id} />
      </div>
      <DangerZone eventId={event.id} eventName={event.name} />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    maxWidth: '720px',
  },
  section: {
    padding: '20px 0',
    borderBottom: '1px solid var(--color-border)',
  },
};
