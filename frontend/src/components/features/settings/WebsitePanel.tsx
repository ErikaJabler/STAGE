import { lazy, Suspense, type CSSProperties } from 'react';
import type { EventWithCount } from '@stage/shared';
import { Button } from '../../ui';
import { useWebsiteForm } from '../../../hooks/useWebsiteForm';
import { WebsiteTemplateSelector } from './WebsiteTemplateSelector';
import { WebsiteFormFields } from './WebsiteFormFields';

const PageEditor = lazy(() => import('../../editor/PageEditor'));

interface Props {
  event: EventWithCount;
}

export function WebsitePanel({ event }: Props) {
  const form = useWebsiteForm(event);

  if (form.isLoading) {
    return <div style={styles.loading}>Laddar webbplatsinställningar...</div>;
  }

  // Fullscreen editor mode
  if (form.showEditor) {
    return (
      <div style={styles.editorOverlay}>
        <Suspense fallback={<div style={styles.editorLoading}>Laddar visuell editor...</div>}>
          <PageEditor
            initialHtml={form.getEditorInitialHtml()}
            initialProjectData={form.websiteData.page_editor_data}
            onSave={form.handleEditorSave}
            onCancel={form.handleEditorCancel}
            onError={form.handleEditorError}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <WebsiteTemplateSelector
        selectedTemplate={form.selectedTemplate}
        onSelectTemplate={form.setSelectedTemplate}
        hasCustomPage={form.hasCustomPage}
        onOpenEditor={() => form.setShowEditor(true)}
        onResetToTemplate={form.handleResetToTemplate}
      />

      {form.selectedTemplate && (
        <WebsiteFormFields
          selectedTemplate={form.selectedTemplate}
          websiteData={form.websiteData}
          hasCustomPage={form.hasCustomPage}
          eventName={event.name}
          onSetField={form.setField}
        />
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <Button
          variant="primary"
          onClick={form.handleSave}
          disabled={!form.selectedTemplate || form.isSaving}
        >
          {form.isSaving ? 'Sparar...' : 'Spara webbplats'}
        </Button>

        {form.selectedTemplate && (
          <Button
            variant={form.published ? 'ghost' : 'secondary'}
            onClick={form.handleTogglePublish}
            disabled={form.isSaving}
          >
            {form.published ? 'Avpublicera' : 'Publicera'}
          </Button>
        )}
      </div>

      {/* Public URL */}
      {form.published && (
        <div style={styles.urlSection}>
          <div style={styles.urlLabel}>Publik webbadress:</div>
          <a href={form.publicUrl} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
            {form.publicUrl}
          </a>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  loading: {
    padding: '20px 0',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '8px',
  },
  urlSection: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-md)',
  },
  urlLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
  },
  urlLink: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-burgundy)',
    fontWeight: 500,
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  editorOverlay: {
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
  editorLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '14px',
    color: '#A99B94',
  },
};
