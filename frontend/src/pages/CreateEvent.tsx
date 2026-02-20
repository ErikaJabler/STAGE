import { useNavigate, Link } from 'react-router-dom';
import { Topbar } from '../components/layout';
import { Button, useToast } from '../components/ui';
import { EventForm } from '../components/EventForm';
import { useCreateEvent } from '../hooks/useEvents';
import type { CreateEventPayload } from '../api/client';

export function CreateEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createEvent = useCreateEvent();

  function handleSubmit(data: CreateEventPayload) {
    createEvent.mutate(data, {
      onSuccess: (event) => {
        toast(`"${event.name}" skapades!`, 'success');
        navigate(`/events/${event.id}`);
      },
      onError: () => {
        toast('Kunde inte skapa eventet. Kontrollera formuläret.', 'error');
      },
    });
  }

  return (
    <>
      <Topbar
        title="Skapa event"
        actions={
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">
              <BackIcon /> Avbryt
            </Button>
          </Link>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        <EventForm
          onSubmit={handleSubmit as (data: unknown) => void}
          loading={createEvent.isPending}
        />
      </div>
    </>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
