import { useState } from 'react';
import { Button, Input, Modal, useToast } from '../../ui';
import { useCreateMailing } from '../../../hooks/useMailings';
import type { CreateMailingPayload } from '../../../api/client';
import { sharedStyles } from '../shared-styles';

const MAIL_TEMPLATES = [
  {
    id: 'save-the-date',
    name: 'Save the date',
    description: 'Tidigt meddelande för att boka datum',
    subject: 'Save the date!',
    body: `Hej {{name}},

Vi vill ge dig en tidig heads-up! Vi planerar ett event som vi gärna vill att du deltar i.

Mer information och en formell inbjudan kommer inom kort. Under tiden, boka gärna datumet i din kalender.

Vi återkommer snart med fler detaljer!

Med vänlig hälsning,
Consid`,
  },
  {
    id: 'official-invitation',
    name: 'Officiell inbjudan',
    description: 'Formell inbjudan med RSVP-länk',
    subject: 'Inbjudan: Du är välkommen!',
    body: `Hej {{name}},

Du är varmt välkommen att delta i vårt kommande event!

Vi har ett spännande program planerat och hoppas att du kan vara med. Svara gärna på inbjudan via länken nedan så snart du kan.

{{rsvp_link}}

Har du frågor? Tveka inte att höra av dig.

Varmt välkommen!
Consid`,
  },
  {
    id: 'reminder',
    name: 'Påminnelse',
    description: 'Påminnelse till de som inte svarat',
    subject: 'Påminnelse: Har du svarat på inbjudan?',
    body: `Hej {{name}},

Vi vill påminna dig om vårt kommande event! Vi har ännu inte fått ditt svar och hoppas att du fortfarande kan delta.

Svara gärna via länken nedan:

{{rsvp_link}}

Glöm inte att platsen kan vara begränsad, så svara gärna så snart du kan.

Vi hoppas vi ses!
Consid`,
  },
] as const;

export function CreateMailingModal({ eventId, open, onClose }: {
  eventId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createMailing = useCreateMailing(eventId);
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
    const template = MAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setForm((prev) => ({ ...prev, subject: template.subject, body: template.body }));
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
            {MAIL_TEMPLATES.map((t) => (
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
            Variabler: <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{name}}'}</code> = mottagarens namn, <code style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{rsvp_link}}'}</code> = personlig svarslänk. RSVP-länk läggs till automatiskt om den inte finns i meddelandet.
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
