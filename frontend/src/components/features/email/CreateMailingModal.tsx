import { useState } from 'react';
import { Button, Input, Modal, useToast } from '../../ui';
import { useCreateMailing } from '../../../hooks/useMailings';
import { useTemplates } from '../../../hooks/useTemplates';
import type { CreateMailingPayload } from '../../../api/client';
import { sharedStyles } from '../shared-styles';

export function CreateMailingModal({ eventId, open, onClose }: {
  eventId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createMailing = useCreateMailing(eventId);
  const { data: templates } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: '',
    body: '',
    recipient_filter: 'all',
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

  function handleTemplateSelect(templateId: string) {
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null);
      return;
    }
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setForm((prev) => ({ ...prev, subject: template.defaultSubject, body: template.body }));
      setErrors({});
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.subject.trim()) errs.subject = 'Ämne krävs';
    if (!form.body.trim()) errs.body = 'Meddelande krävs';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: CreateMailingPayload = {
      subject: form.subject.trim(),
      body: form.body.trim(),
      recipient_filter: form.recipient_filter,
    };

    createMailing.mutate(payload, {
      onSuccess: () => {
        toast('Utskick skapat', 'success');
        setSelectedTemplate(null);
        setForm({ subject: '', body: '', recipient_filter: 'all' });
        setErrors({});
        onClose();
      },
      onError: () => toast('Kunde inte skapa utskicket', 'error'),
    });
  }

  const displayTemplates = templates ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nytt utskick"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>Avbryt</Button>
          <Button variant="primary" size="md" onClick={handleSubmit as unknown as () => void} loading={createMailing.isPending}>
            Skapa utkast
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={sharedStyles.modalSelectLabel}>Välj mall</label>
          <div style={styles.templateGrid}>
            {displayTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateSelect(t.id)}
                style={{
                  ...styles.templateCard,
                  ...(selectedTemplate === t.id ? styles.templateCardActive : {}),
                }}
              >
                <span style={styles.templateName}>{t.name}</span>
                <span style={styles.templateDesc}>{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={sharedStyles.modalSelectLabel}>Mottagare</label>
          <select
            value={form.recipient_filter}
            onChange={(e) => updateField('recipient_filter', e.target.value)}
            style={sharedStyles.modalSelect}
          >
            <option value="all">Alla deltagare</option>
            <optgroup label="Per status">
              <option value="invited">Inbjudna</option>
              <option value="attending">Deltar</option>
              <option value="declined">Avböjda</option>
              <option value="waitlisted">Väntelista</option>
            </optgroup>
            <optgroup label="Per kategori">
              <option value="internal">Interna</option>
              <option value="public_sector">Offentlig sektor</option>
              <option value="private_sector">Privat sektor</option>
              <option value="partner">Partners</option>
              <option value="other">Övriga</option>
            </optgroup>
          </select>
        </div>
        <Input
          label="Ämne"
          value={form.subject}
          onChange={(e) => updateField('subject', e.target.value)}
          error={errors.subject}
          placeholder="Välkommen till eventet!"
          required
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={sharedStyles.modalSelectLabel}>Meddelande</label>
          <textarea
            value={form.body}
            onChange={(e) => updateField('body', e.target.value)}
            placeholder="Hej {{name}},&#10;&#10;Välkommen till eventet! Svara gärna via länken nedan.&#10;&#10;{{rsvp_link}}"
            rows={8}
            style={{
              ...sharedStyles.modalSelect,
              height: 'auto',
              padding: '10px 12px',
              resize: 'vertical' as const,
              lineHeight: 'var(--line-height-normal)',
            }}
          />
          {errors.body && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>{errors.body}</span>
          )}
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            Variabler: <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{name}}'}</code> = mottagarens namn, <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{rsvp_link}}'}</code> = personlig svarslänk, <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{event}}'}</code> = eventnamn, <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{datum}}'}</code> = datum, <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{plats}}'}</code> = plats. RSVP-länk läggs till automatiskt om den inte finns i meddelandet.
          </span>
        </div>
      </form>
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  templateCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-card)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
    fontFamily: 'inherit',
  },
  templateCardActive: {
    borderColor: 'var(--color-burgundy)',
    backgroundColor: 'rgba(112, 17, 49, 0.04)',
  },
  templateName: { fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' },
  templateDesc: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: '1.3' },
};
