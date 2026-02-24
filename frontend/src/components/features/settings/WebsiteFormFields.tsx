import type { CSSProperties } from 'react';
import type { WebsiteData } from '@stage/shared';
import { Button, Input } from '../../ui';

interface Props {
  selectedTemplate: string;
  websiteData: WebsiteData;
  hasCustomPage: boolean;
  eventName: string;
  onSetField: <K extends keyof WebsiteData>(key: K, value: WebsiteData[K]) => void;
}

export function WebsiteFormFields({
  selectedTemplate,
  websiteData,
  hasCustomPage,
  eventName,
  onSetField,
}: Props) {
  return (
    <div style={styles.fieldsSection}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Snabbredigering</h3>
      </div>

      <Input
        label="Hero-rubrik (valfritt)"
        value={websiteData.hero_title ?? ''}
        onChange={(e) => onSetField('hero_title', e.target.value)}
        placeholder={eventName}
        hint="Lämna tomt för att använda eventnamnet"
      />
      <div style={{ marginTop: '12px' }}>
        <Input
          label="Hero-underrubrik (valfritt)"
          value={websiteData.hero_subtitle ?? ''}
          onChange={(e) => onSetField('hero_subtitle', e.target.value)}
          placeholder="Välkommen till..."
        />
      </div>

      {selectedTemplate === 'hero-program-plats' && (
        <>
          <ProgramEditor
            items={websiteData.program_items ?? []}
            onChange={(items) => onSetField('program_items', items)}
          />
          <div style={{ marginTop: '12px' }}>
            <div style={styles.fieldLabel}>Platsbeskrivning</div>
            <textarea
              value={websiteData.venue_description ?? ''}
              onChange={(e) => onSetField('venue_description', e.target.value)}
              style={styles.textarea}
              rows={3}
              placeholder="Beskriv platsen..."
            />
          </div>
          <div style={{ marginTop: '12px' }}>
            <Input
              label="Adress"
              value={websiteData.venue_address ?? ''}
              onChange={(e) => onSetField('venue_address', e.target.value)}
              placeholder="Storgatan 1, 111 22 Stockholm"
            />
          </div>
        </>
      )}

      {hasCustomPage && (
        <div style={styles.quickEditNote}>
          Snabbredigering påverkar bara mallbaserad rendering. Använd visuella editorn för att ändra den anpassade sidan.
        </div>
      )}
    </div>
  );
}

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
            <button
              onClick={() => removeItem(index)}
              style={styles.removeBtn}
              aria-label="Ta bort programpunkt"
            >
              ×
            </button>
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

const styles: Record<string, CSSProperties> = {
  fieldsSection: {
    marginBottom: '20px',
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
  quickEditNote: {
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: 'rgba(112, 17, 49, 0.05)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: 1.4,
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
    width: '44px',
    height: '44px',
    minWidth: '44px',
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
};
