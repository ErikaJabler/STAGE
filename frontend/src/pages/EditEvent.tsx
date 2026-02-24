import { useNavigate, useParams, Link } from 'react-router-dom';
import { Topbar } from '../components/layout';
import { Button, useToast, EventDetailSkeleton } from '../components/ui';
import { EventForm } from '../components/EventForm';
import { useEvent, useUpdateEvent } from '../hooks/useEvents';
import type { UpdateEventPayload } from '../api/client';

export function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: event, isLoading, error } = useEvent(eventId);
  const updateEvent = useUpdateEvent();

  function handleSubmit(data: UpdateEventPayload) {
    updateEvent.mutate(
      { id: eventId, data },
      {
        onSuccess: (updated) => {
          toast(`"${updated.name}" uppdaterades!`, 'success');
          navigate(`/events/${eventId}`);
        },
        onError: () => {
          toast('Kunde inte uppdatera eventet. Kontrollera formuläret.', 'error');
        },
      },
    );
  }

  if (isLoading) {
    return (
      <>
        <Topbar title="Laddar..." />
        <EventDetailSkeleton />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Topbar title="Event" />
        <div style={styles.empty}>
          <h3 style={styles.emptyTitle}>Event hittades inte</h3>
          <p style={styles.emptyText}>Det event du söker finns inte eller har tagits bort.</p>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Tillbaka till översikt</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={`Redigera: ${event.emoji || ''} ${event.name}`}
        actions={
          <Link to={`/events/${eventId}`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">
              <BackIcon /> Avbryt
            </Button>
          </Link>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        <EventForm
          initialData={event}
          onSubmit={handleSubmit as (data: unknown) => void}
          loading={updateEvent.isPending}
          submitLabel="Spara ändringar"
        />
      </div>
    </>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    textAlign: 'center',
    gap: '8px',
  },
  emptyTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
  },
  emptyText: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-muted)',
    marginBottom: '8px',
  },
};
