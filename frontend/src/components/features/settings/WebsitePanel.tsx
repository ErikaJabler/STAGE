import { useState, type CSSProperties } from 'react';
import type { EventWithCount, WebsiteData } from '@stage/shared';
import { Button, Input } from '../../ui';
import { useToast } from '../../ui/Toast';
import { useWebsite, useSaveWebsite } from '../../../hooks/useWebsite';

interface Props {
  event: EventWithCount;
}

const TEMPLATES = [
  {
    id: 'hero-info',
    name: 'Hero + Info',
    description: 'Enkel sida med hero-bild, eventinfo och anmälningsformulär.',
  },
  {
    id: 'hero-program-plats',
    name: 'Hero + Program + Plats',
    description: 'Hero-bild, programsektion med tidslinje, platsbeskrivning och anmälningsformulär.',
  },
] as const;

export function WebsitePanel({ event }: Props) {
  const { data: website, isLoading } = useWebsite(event.id);
  const saveWebsite = useSaveWebsite();
  const { toast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<WebsiteData>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize state from server data
  if (website && !initialized) {
    setSelectedTemplate(website.template);
    setWebsiteData(website.data ?? {});
    setInitialized(true);
  }

  const published = website?.published ?? false;
  const slug = event.slug;
  const publicUrl = `${window.location.origin}/stage/e/${slug}`;

  const handleSave = async () => {
    try {
      await saveWebsite.mutateAsync({
        eventId: event.id,
        data: {
          template: selectedTemplate ?? undefined,
          data: websiteData,
        },
      });
      toast('Webbplats sparad', 'success');
    } catch {
      toast('Kunde inte spara webbplats', 'error');
    }
  };

  const handleTogglePublish = async () => {
    try {
      await saveWebsite.mutateAsync({
        eventId: event.id,
        data: {
          template: selectedTemplate ?? undefined,
          data: websiteData,
          published: !published,
        },
      });
      toast(published ? 'Webbplats avpublicerad' : 'Webbplats publicerad', 'success');
    } catch {
      toast('Kunde inte ändra publiceringsstatus', 'error');
    }
  };

  const setField = <K extends keyof WebsiteData>(key: K, value: WebsiteData[K]) => {
    setWebsiteData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div style={styles.loading}>Laddar webbplatsinställningar...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Template selector */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Välj mall</h3>
      </div>
      <div style={styles.templateGrid}>
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => setSelectedTemplate(tmpl.id)}
            style={{
              ...styles.templateCard,
              ...(selectedTemplate === tmpl.id ? styles.templateCardActive : {}),
            }}
          >
            <div style={styles.templateIcon}>
              {tmpl.id === 'hero-info' ? '🖼️' : '📋'}
            </div>
            <div style={styles.templateName}>{tmpl.name}</div>
            <div style={styles.templateDesc}>{tmpl.description}</div>
          </button>
        ))}
      </div>

      {/* Template-specific fields */}
      {selectedTemplate && (
        <div style={styles.fieldsSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Innehåll</h3>
          </div>

          <Input
            label="Hero-rubrik (valfritt)"
            value={websiteData.hero_title ?? ''}
            onChange={(e) => setField('hero_title', e.target.value)}
            placeholder={event.name}
            hint="Lämna tomt för att använda eventnamnet"
          />
          <div style={{ marginTop: '12px' }}>
            <Input
              label="Hero-underrubrik (valfritt)"
              value={websiteData.hero_subtitle ?? ''}
              onChange={(e) => setField('hero_subtitle', e.target.value)}
              placeholder="Välkommen till..."
            />
          </div>

          {selectedTemplate === 'hero-program-plats' && (
            <>
              <ProgramEditor
                items={websiteData.program_items ?? []}
                onChange={(items) => setField('program_items', items)}
              />
              <div style={{ marginTop: '12px' }}>
                <div style={styles.fieldLabel}>Platsbeskrivning</div>
                <textarea
                  value={websiteData.venue_description ?? ''}
                  onChange={(e) => setField('venue_description', e.target.value)}
                  style={styles.textarea}
                  rows={3}
                  placeholder="Beskriv platsen..."
                />
              </div>
              <div style={{ marginTop: '12px' }}>
                <Input
                  label="Adress"
                  value={websiteData.venue_address ?? ''}
                  onChange={(e) => setField('venue_address', e.target.value)}
                  placeholder="Storgatan 1, 111 22 Stockholm"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!selectedTemplate || saveWebsite.isPending}
        >
          {saveWebsite.isPending ? 'Sparar...' : 'Spara webbplats'}
        </Button>

        {selectedTemplate && (
          <Button
            variant={published ? 'ghost' : 'secondary'}
            onClick={handleTogglePublish}
            disabled={saveWebsite.isPending}
          >
            {published ? 'Avpublicera' : 'Publicera'}
          </Button>
        )}
      </div>

      {/* Public URL */}
      {published && (
        <div style={styles.urlSection}>
          <div style={styles.urlLabel}>Publik webbadress:</div>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
            {publicUrl}
          </a>
        </div>
      )}
    </div>
  );
}

/* ---- Program Editor sub-component ---- */
function ProgramEditor({
  items,
  onChange,
}: {
  items: { time: string; title: string; description?: string }[];
  onChange: (items: { time: string; title: string; description?: string }[]) => void;
}) {
  const addItem = () => {
    onChange([...items, { time: '', title: '' }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={styles.sectionHeader}>
        <div style={styles.fieldLabel}>Programpunkter</div>
        <Button variant="ghost" size="sm" onClick={addItem}>+ Lägg till</Button>
      </div>
      {items.map((item, index) => (
        <div key={index} style={styles.programItem}>
          <div style={styles.programRow}>
            <input
              type="time"
              value={item.time}
              onChange={(e) => updateItem(index, 'time', e.target.value)}
              style={styles.timeInput}
            />
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(index, 'title', e.target.value)}
              placeholder="Aktivitet..."
              style={styles.titleInput}
            />
            <button onClick={() => removeItem(index)} style={styles.removeBtn}>×</button>
          </div>
          <input
            type="text"
            value={item.description ?? ''}
            onChange={(e) => updateItem(index, 'description', e.target.value)}
            placeholder="Beskrivning (valfritt)"
            style={styles.descInput}
          />
        </div>
      ))}
    </div>
  );
}

/* ---- Styles ---- */
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
  fieldsSection: {
    marginBottom: '20px',
  },
  fieldLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-secondary)',
    marginBottom: '4px',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
  },
  programItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px',
    marginBottom: '8px',
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-md)',
  },
  programRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  timeInput: {
    width: '100px',
    height: '32px',
    padding: '0 8px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'inherit',
  },
  titleInput: {
    flex: 1,
    height: '32px',
    padding: '0 8px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'inherit',
  },
  descInput: {
    height: '32px',
    padding: '0 8px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    fontSize: 'var(--font-size-xs)',
    fontFamily: 'inherit',
    color: 'var(--color-text-muted)',
  },
  removeBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '18px',
    fontFamily: 'inherit',
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
};
