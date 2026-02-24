import { useState } from 'react';
import { Button, Input, Modal, useToast } from '../../ui';
import { useCreateParticipant } from '../../../hooks/useParticipants';
import { PARTICIPANT_CATEGORY } from '@stage/shared';
import type { CreateParticipantPayload } from '../../../api/client';
import { getCategoryLabel } from '../shared-helpers';
import { sharedStyles } from '../shared-styles';

export function AddParticipantModal({
  eventId,
  open,
  onClose,
}: {
  eventId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createParticipant = useCreateParticipant(eventId);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    category: 'other',
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
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: CreateParticipantPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim() || null,
      category: form.category,
    };

    createParticipant.mutate(payload, {
      onSuccess: (p) => {
        toast(`${p.name} lades till`, 'success');
        setForm({ name: '', email: '', company: '', category: 'other' });
        setErrors({});
        onClose();
      },
      onError: () => {
        toast('Kunde inte lägga till deltagaren', 'error');
      },
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lägg till deltagare"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit as unknown as () => void}
            loading={createParticipant.isPending}
          >
            Lägg till
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
      </form>
    </Modal>
  );
}
