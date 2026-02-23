import { useState, lazy, Suspense } from 'react';
import { Button, Input, Modal, useToast } from '../../ui';
import { useCreateMailing } from '../../../hooks/useMailings';
import { useTemplates } from '../../../hooks/useTemplates';
import type { CreateMailingPayload } from '../../../api/client';
import { sharedStyles } from '../shared-styles';

const EmailEditor = lazy(() => import('../../editor/EmailEditor'));

type EditMode = null | 'form' | 'editor';

export function CreateMailingModal({ eventId, open, onClose }: {
  eventId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createMailing = useCreateMailing(eventId);
  const { data: templates } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [form, setForm] = useState({
    subject: '',
    body: '',
    recipient_filter: 'all',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function resetState() {
    setSelectedTemplate(null);
    setEditMode(null);
    setForm({ subject: '', body: '', recipient_filter: 'all' });
    setErrors({});
  }

  function handleClose() {
    resetState();
    onClose();
  }

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
      setEditMode('form');
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
        resetState();
        onClose();
      },
      onError: () => toast('Kunde inte skapa utskicket', 'error'),
    });
  }

  /** Called when the visual editor saves */
  function handleEditorSave(htmlBody: string, editorData: string) {
    if (!form.subject.trim()) {
      toast('Ange ett ämne innan du sparar', 'error');
      return;
    }

    const payload: CreateMailingPayload = {
      subject: form.subject.trim(),
      body: form.body.trim() || '(Visuellt redigerat mail)',
      html_body: htmlBody,
      editor_data: editorData,
      recipient_filter: form.recipient_filter,
    };

    createMailing.mutate(payload, {
      onSuccess: () => {
        toast('Utskick skapat med visuell editor', 'success');
        resetState();
        onClose();
      },
      onError: () => toast('Kunde inte skapa utskicket', 'error'),
    });
  }

  const displayTemplates = templates ?? [];

  // Full-screen editor mode
  if (editMode === 'editor') {
    return (
      <div style={editorStyles.fullscreen}>
        {/* Ämne + filter bar above editor */}
        <div style={editorStyles.topBar}>
          <div style={editorStyles.topBarField}>
            <label style={editorStyles.topBarLabel}>Ämne</label>
            <input
              value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              placeholder="Ämne för utskicket"
              style={editorStyles.topBarInput}
            />
          </div>
          <div style={editorStyles.topBarField}>
            <label style={editorStyles.topBarLabel}>Mottagare</label>
            <select
              value={form.recipient_filter}
              onChange={(e) => updateField('recipient_filter', e.target.value)}
              style={editorStyles.topBarSelect}
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
        </div>
        <Suspense fallback={<div style={editorStyles.loading}>Laddar editor...</div>}>
          <EmailEditor
            initialHtml={undefined}
            onSave={handleEditorSave}
            onCancel={() => setEditMode(null)}
            onError={(msg) => toast(msg, 'error')}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nytt utskick"
      footer={
        editMode === 'form' ? (
          <>
            <Button variant="secondary" size="md" onClick={handleClose}>Avbryt</Button>
            <Button variant="primary" size="md" onClick={handleSubmit as unknown as () => void} loading={createMailing.isPending}>
              Skapa utkast
            </Button>
          </>
        ) : undefined
      }
    >
      {/* Step 1: Choose template */}
      {editMode === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayTemplates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={sharedStyles.modalSelectLabel}>Välj mall (valfritt)</label>
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
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={sharedStyles.modalSelectLabel}>Välj redigeringsläge</label>
            <div style={styles.modeGrid}>
              <button
                type="button"
                onClick={() => setEditMode('editor')}
                style={styles.modeCard}
              >
                <span style={styles.modeIcon}><EditorIcon /></span>
                <span style={styles.modeName}>Visuell editor</span>
                <span style={styles.modeDesc}>
                  Dra-och-släpp block, bilder och knappar. Full kontroll över layout.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditMode('form')}
                style={styles.modeCard}
              >
                <span style={styles.modeIcon}><FormIcon /></span>
                <span style={styles.modeName}>Snabbredigering</span>
                <span style={styles.modeDesc}>
                  Skriv ämne och brödtext i formulär. Automatisk Consid-mall.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Form mode */}
      {editMode === 'form' && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          <button type="button" onClick={() => setEditMode(null)} style={styles.backLink}>
            &larr; Byt redigeringsläge
          </button>
        </form>
      )}
    </Modal>
  );
}

/* ---- Icons ---- */

function EditorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="2" y="2" width="24" height="24" rx="4" stroke="#701131" strokeWidth="1.5" />
      <rect x="5" y="5" width="8" height="6" rx="1" fill="#F49E88" />
      <rect x="15" y="5" width="8" height="6" rx="1" fill="#EFE6DD" stroke="#A99B94" strokeWidth="0.5" />
      <rect x="5" y="13" width="18" height="3" rx="1" fill="#EFE6DD" />
      <rect x="5" y="18" width="18" height="3" rx="1" fill="#EFE6DD" />
      <rect x="9" y="23" width="10" height="3" rx="1.5" fill="#B5223F" />
    </svg>
  );
}

function FormIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="3" width="20" height="22" rx="3" stroke="#701131" strokeWidth="1.5" />
      <rect x="7" y="7" width="14" height="2" rx="1" fill="#701131" />
      <rect x="7" y="12" width="14" height="6" rx="1" fill="#EFE6DD" />
      <rect x="7" y="21" width="8" height="2" rx="1" fill="#B5223F" />
    </svg>
  );
}

/* ---- Styles ---- */

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
  modeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  modeCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '20px 16px',
    borderRadius: 'var(--radius-lg, 12px)',
    border: '1.5px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-card)',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'border-color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast)',
    fontFamily: 'inherit',
  },
  modeIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modeName: { fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' },
  modeDesc: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: '1.4' },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 0',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'inherit',
  },
};

const editorStyles: Record<string, React.CSSProperties> = {
  fullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #e8e0d8',
    flexShrink: 0,
  },
  topBarField: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  topBarLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#6b6360',
    whiteSpace: 'nowrap' as const,
  },
  topBarInput: {
    padding: '5px 10px',
    border: '1px solid #e8e0d8',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    minWidth: '240px',
  },
  topBarSelect: {
    padding: '5px 10px',
    border: '1px solid #e8e0d8',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    color: '#6b6360',
  },
};
