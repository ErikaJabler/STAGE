import type { CSSProperties } from 'react';
import { Button } from '../../ui';

const TEMPLATES = [
  {
    id: 'hero-info',
    name: 'Hero + Info',
    description: 'Enkel sida med hero-bild, eventinfo och anmälningsformulär.',
  },
  {
    id: 'hero-program-plats',
    name: 'Hero + Program + Plats',
    description:
      'Hero-bild, programsektion med tidslinje, platsbeskrivning och anmälningsformulär.',
  },
] as const;

interface Props {
  selectedTemplate: string | null;
  onSelectTemplate: (id: string) => void;
  hasCustomPage: boolean;
  onOpenEditor: () => void;
  onResetToTemplate: () => void;
}

export function WebsiteTemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  hasCustomPage,
  onOpenEditor,
  onResetToTemplate,
}: Props) {
  return (
    <>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Välj mall</h3>
      </div>
      <div style={styles.templateGrid}>
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => onSelectTemplate(tmpl.id)}
            style={{
              ...styles.templateCard,
              ...(selectedTemplate === tmpl.id ? styles.templateCardActive : {}),
            }}
          >
            <div style={styles.templateIcon}>{tmpl.id === 'hero-info' ? '🖼️' : '📋'}</div>
            <div style={styles.templateName}>{tmpl.name}</div>
            <div style={styles.templateDesc}>{tmpl.description}</div>
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <div style={styles.editorSection}>
          <div style={styles.editorCard}>
            <div style={styles.editorCardContent}>
              <div>
                <div style={styles.editorCardTitle}>Visuell editor</div>
                <div style={styles.editorCardDesc}>
                  {hasCustomPage
                    ? 'Sidan har redigerats visuellt. Klicka för att fortsätta redigera.'
                    : 'Drag-and-drop editor för att anpassa sidans utseende och layout.'}
                </div>
              </div>
              <div style={styles.editorCardActions}>
                <Button variant="primary" onClick={onOpenEditor}>
                  {hasCustomPage ? 'Redigera sida' : 'Öppna editor'}
                </Button>
                {hasCustomPage && (
                  <Button variant="ghost" size="sm" onClick={onResetToTemplate}>
                    Återställ till mall
                  </Button>
                )}
              </div>
            </div>
            {hasCustomPage && <div style={styles.editorBadge}>Anpassad sida</div>}
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  templateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 16px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--color-white)',
    cursor: 'pointer',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    fontFamily: 'inherit',
    textAlign: 'center',
    gap: '8px',
  },
  templateCardActive: {
    borderColor: 'var(--color-burgundy)',
    boxShadow: '0 0 0 1px var(--color-burgundy)',
  },
  templateIcon: {
    fontSize: '28px',
  },
  templateName: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    color: 'var(--color-text-primary)',
  },
  templateDesc: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: 1.4,
  },
  editorSection: {
    marginBottom: '20px',
  },
  editorCard: {
    position: 'relative',
    padding: '16px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--color-white)',
  },
  editorCardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  editorCardTitle: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginBottom: '4px',
  },
  editorCardDesc: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: 1.4,
  },
  editorCardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0,
  },
  editorBadge: {
    position: 'absolute',
    top: '-8px',
    right: '12px',
    padding: '2px 8px',
    backgroundColor: '#701131',
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: 600,
    borderRadius: '4px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
};
