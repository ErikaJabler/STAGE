import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, useToast } from '../../ui';
import { useReorderParticipant } from '../../../hooks/useParticipants';
import type { Participant } from '@stage/shared';
import { getParticipantStatusLabel, getParticipantStatusVariant } from '../shared-helpers';
import { DragHandleIcon } from '../shared-icons';

interface WaitlistPanelProps {
  eventId: number;
  participants: Participant[];
}

export function WaitlistPanel({ eventId, participants }: WaitlistPanelProps) {
  const waitlisted = participants
    .filter((p) => p.status === 'waitlisted')
    .sort((a, b) => (a.queue_position ?? 999) - (b.queue_position ?? 999));

  const { toast } = useToast();
  const reorderParticipant = useReorderParticipant(eventId);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (waitlisted.length === 0) return null;

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = waitlisted.findIndex((p) => p.id === active.id);
    const newIndex = waitlisted.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // New queue position = target item's position
    const targetPos = waitlisted[newIndex].queue_position ?? newIndex + 1;

    reorderParticipant.mutate(
      { id: active.id as number, queuePosition: targetPos },
      { onError: () => toast('Kunde inte ändra köplats', 'error') },
    );
  }

  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Väntelista ({waitlisted.length})</h4>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as number)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={waitlisted.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div style={styles.list}>
            {waitlisted.map((p) => (
              <SortableItem key={p.id} participant={p} isActive={activeId === p.id} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableItem({ participant, isActive }: { participant: Participant; isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: participant.id,
  });

  const style: React.CSSProperties = {
    ...styles.item,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isActive ? 0.5 : 1,
    zIndex: isActive ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners} style={styles.handle}>
        <DragHandleIcon />
      </div>
      <span style={styles.position}>#{participant.queue_position}</span>
      <div style={styles.info}>
        <span style={styles.name}>{participant.name}</span>
        <span style={styles.email}>{participant.email}</span>
      </div>
      <Badge variant={getParticipantStatusVariant(participant.status)}>
        {getParticipantStatusLabel(participant.status)}
      </Badge>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    marginTop: '20px',
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '16px',
  },
  title: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
    marginBottom: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border)',
  },
  handle: {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--color-text-muted)',
    cursor: 'grab',
    touchAction: 'none',
  },
  position: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    minWidth: '24px',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  name: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-primary)',
  },
  email: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
};
