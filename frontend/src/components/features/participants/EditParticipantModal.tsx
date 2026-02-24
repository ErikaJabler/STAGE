import { useState } from 'react';
import { Button, Input, Modal, useToast } from '../../ui';
import { useUpdateParticipant } from '../../../hooks/useParticipants';
import { PARTICIPANT_CATEGORY } from '@stage/shared';
import type { Participant } from '@stage/shared';
import type { UpdateParticipantPayload } from '../../../api/client';
import { getCategoryLabel } from '../shared-helpers';
import { sharedStyles } from '../shared-styles';

export function EditParticipantModal({
  eventId,
  participant,
  open,
  onClose,
}: {
  eventId: number;
  participant: Participant;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const updateParticipant = useUpdateParticipant(eventId);
  const [form, setForm] = useState({
    name: participant.name,
    email: participant.email,
    company: participant.company ?? '',
    category: participant.category,
    dietary_notes: participant.dietary_notes ?? '',
    plus_one_name: participant.plus_one_name ?? '',
    plus_one_email: participant.plus_one_email ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Namn krävs';
    if (!form.email.trim()) errs.email = 'E-post krävs';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Ogiltig e-postadress';
    if (form.plus_one_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.plus_one_email))
      errs.plus_one_email = 'Ogiltig e-postadress';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: UpdateParticipantPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim() || null,
      category: form.category,
      dietary_notes: form.dietary_notes.trim() || null,
      plus_one_name: form.plus_one_name.trim() || null,
      plus_one_email: form.plus_one_email.trim() || null,
    };

    updateParticipant.mutate(
      { id: participant.id, data: payload },
      {
        onSuccess: () => {
          toast(`${form.name.trim()} uppdaterades`, 'success');
          onClose();
        },
        onError: () => {
          toast('Kunde inte uppdatera deltagaren', 'error');
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Redigera deltagare"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit as unknown as () => void}
            loading={updateParticipant.isPending}
          >
            Spara
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <Input
          label="Namn"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          placeholder="Anna Svensson"
          required
        />
        <Input
          label="E-post"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          placeholder="anna@consid.se"
          required
        />
        <Input
          label="Företag"
          value={form.company}
          onChange={(e) => updateField('company', e.target.value)}
          placeholder="Consid AB"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={sharedStyles.modalSelectLabel}>Kategori</label>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            style={sharedStyles.modalSelect}
          >
            {Object.values(PARTICIPANT_CATEGORY).map((c) => (
              <option key={c} value={c}>
                {getCategoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={editStyles.textareaLabel}>Allergier / Kost</label>
          <textarea
            value={form.dietary_notes}
            onChange={(e) => updateField('dietary_notes', e.target.value)}
            placeholder="T.ex. glutenfri, vegetarian, nötallergi..."
            rows={2}
            style={editStyles.textarea}
          />
        </div>
        <Input
          label="Plus-one namn"
          value={form.plus_one_name}
          onChange={(e) => updateField('plus_one_name', e.target.value)}
          placeholder="Anna Svensson"
        />
        <Input
          label="Plus-one e-post"
          type="email"
          value={form.plus_one_email}
          onChange={(e) => updateField('plus_one_email', e.target.value)}
          error={errors.plus_one_email}
          placeholder="anna@example.se"
        />
      </form>
    </Modal>
  );
}

const editStyles: Record<string, React.CSSProperties> = {
  textareaLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-secondary)',
  },
  textarea: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    resize: 'vertical' as const,
  },
};
