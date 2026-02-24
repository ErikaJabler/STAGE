import { useState, lazy, Suspense } from 'react';
import { Button, Input, Modal, useToast } from '../../ui';
import { useUpdateMailing } from '../../../hooks/useMailings';
import type { UpdateMailingPayload } from '../../../api/client';
import type { Mailing } from '@stage/shared';
import { sharedStyles } from '../shared-styles';

const EmailEditor = lazy(() => import('../../editor/EmailEditor'));

type EditMode = 'form' | 'editor';

export function EditMailingModal({
  eventId,
  mailing,
  open,
  onClose,
}: {
  eventId: number;
  mailing: Mailing;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const updateMailing = useUpdateMailing(eventId);
  const hasEditorData = !!mailing.editor_data;

  // If no editor_data, skip mode picker and go straight to form
  const [editMode, setEditMode] = useState<EditMode | null>(hasEditorData ? null : 'form');
  const [form, setForm] = useState({
    subject: mailing.subject,
    body: mailing.body,
    recipient_filter: mailing.recipient_filter,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function resetState() {
    setEditMode(hasEditorData ? null : 'form');
    setForm({
      subject: mailing.subject,
      body: mailing.body,
      recipient_filter: mailing.recipient_filter,
    });
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

    const payload: UpdateMailingPayload = {
      subject: form.subject.trim(),
      body: form.body.trim(),
      recipient_filter: form.recipient_filter,
    };

    updateMailing.mutate(
      { mailingId: mailing.id, data: payload },
      {
        onSuccess: () => {
          toast('Utskick uppdaterat', 'success');
          resetState();
          onClose();
        },
        onError: () => toast('Kunde inte uppdatera utskicket', 'error'),
      },
    );
  }

  function handleEditorSave(htmlBody: string, editorData: string) {
    if (!form.subject.trim()) {
      toast('Ange ett ämne innan du sparar', 'error');
      return;
    }

    const payload: UpdateMailingPayload = {
      subject: form.subject.trim(),
      body: form.body.trim() || '(Visuellt redigerat mail)',
      html_body: htmlBody,
      editor_data: editorData,
      recipient_filter: form.recipient_filter,
    };

    updateMailing.mutate(
      { mailingId: mailing.id, data: payload },
      {
        onSuccess: () => {
          toast('Utskick uppdaterat med visuell editor', 'success');
          resetState();
          onClose();
        },
        onError: () => toast('Kunde inte uppdatera utskicket', 'error'),
      },
    );
  }

  // Full-screen editor mode
  if (editMode === 'editor') {
    return (
      <div style={editorStyles.fullscreen}>
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
            initialHtml={mailing.html_body ?? undefined}
            initialProjectData={mailing.editor_data ?? undefined}
            onSave={handleEditorSave}
            onCancel={() => setEditMode(null)}
            onError={(msg) => toast(msg, 'error')}
          />
        </Suspense>
      </div>
    );
  }

  // Choose mode or show form
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Redigera utskick"
      footer={
        editMode === 'form' ? (
          <>
            <Button variant="secondary" size="md" onClick={handleClose}>
              Avbryt
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit as unknown as () => void}
              loading={updateMailing.isPending}
            >
              Spara ändringar
            </Button>
          </>
        ) : undefined
      }
    >
      {/* Mode selection — only if the mailing has editor_data */}
      {editMode === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p
            style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: 0 }}
          >
            Det här utskicket skapades med den visuella editorn. Välj redigeringsläge:
          </p>
          <div style={styles.modeGrid}>
            <button type="button" onClick={() => setEditMode('editor')} style={styles.modeCard}>
              <span style={styles.modeName}>Visuell editor</span>
              <span style={styles.modeDesc}>Redigera layout, bilder och knappar.</span>
            </button>
            <button type="button" onClick={() => setEditMode('form')} style={styles.modeCard}>
              <span style={styles.modeName}>Snabbredigering</span>
              <span style={styles.modeDesc}>Ändra ämne, brödtext och mottagare.</span>
            </button>
          </div>
        </div>
      )}

      {/* Form mode */}
      {editMode === 'form' && (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
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
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
                {errors.body}
              </span>
            )}
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                lineHeight: '1.4',
              }}
            >
              Variabler:{' '}
              <code
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                {'{{name}}'}
              </code>{' '}
              = mottagarens namn,{' '}
              <code
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                {'{{rsvp_link}}'}
              </code>{' '}
              = personlig svarslänk,{' '}
              <code
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                {'{{event}}'}
              </code>{' '}
              = eventnamn,{' '}
              <code
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                {'{{datum}}'}
              </code>{' '}
              = datum,{' '}
              <code
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                {'{{plats}}'}
              </code>{' '}
              = plats.
            </span>
          </div>
          {hasEditorData && (
            <button type="button" onClick={() => setEditMode(null)} style={styles.backLink}>
              &larr; Byt redigeringsläge
            </button>
          )}
        </form>
      )}
    </Modal>
  );
}

/* ---- Styles ---- */

const styles: Record<string, React.CSSProperties> = {
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
    transition:
      'border-color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast)',
    fontFamily: 'inherit',
  },
  modeName: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  modeDesc: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: '1.4',
  },
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
    zIndex: 'var(--z-fullscreen-editor)' as unknown as number,
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
