import { useState, useRef, type CSSProperties } from 'react';
import type { EventWithCount } from '@stage/shared';
import { Button } from '../../ui';
import { useUpdateEvent } from '../../../hooks/useEvents';
import { imagesApi } from '../../../api/client';
import { useToast } from '../../ui/Toast';

interface Props {
  event: EventWithCount;
}

export function HeroImageSection({ event }: Props) {
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await imagesApi.upload(file);
      await updateEvent.mutateAsync({ id: event.id, data: { image_url: result.url } });
      toast('Hero-bild uppladdad', 'success');
    } catch {
      toast('Kunde inte ladda upp bild', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await updateEvent.mutateAsync({ id: event.id, data: { image_url: null } });
      toast('Hero-bild borttagen', 'success');
    } catch {
      toast('Kunde inte ta bort bild', 'error');
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Hero-bild</h3>
      </div>
      {event.image_url ? (
        <div>
          <img src={event.image_url} alt="Hero-bild för eventet" style={styles.heroPreview} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
              Byt bild
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              Ta bort
            </Button>
          </div>
        </div>
      ) : (
        <div style={styles.uploadArea} onClick={() => fileRef.current?.click()}>
          <div style={styles.uploadIcon}>+</div>
          <div style={styles.uploadText}>Klicka för att ladda upp en hero-bild</div>
          <div style={styles.uploadHint}>JPEG, PNG eller WebP. Max 5 MB.</div>
        </div>
      )}
      {uploading && <div style={styles.uploadingText}>Laddar upp...</div>}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  section: {
    padding: '20px 0',
    borderBottom: '1px solid var(--color-border)',
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
  heroPreview: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: 'var(--radius-lg)',
    objectFit: 'cover' as const,
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    border: '2px dashed var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast)',
  },
  uploadIcon: {
    fontSize: '24px',
    color: 'var(--color-text-muted)',
    marginBottom: '8px',
  },
  uploadText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
  },
  uploadHint: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  uploadingText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    marginTop: '8px',
  },
};
