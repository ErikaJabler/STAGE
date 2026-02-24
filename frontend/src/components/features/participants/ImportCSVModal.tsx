import { useState } from 'react';
import { Button, Modal, useToast } from '../../ui';
import { useImportParticipants } from '../../../hooks/useParticipants';
import type { ImportParticipantsResult } from '../../../api/client';
import { UploadIcon } from '../shared-icons';
import { sharedStyles } from '../shared-styles';

export function ImportCSVModal({
  eventId,
  open,
  onClose,
}: {
  eventId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const importParticipants = useImportParticipants(eventId);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [result, setResult] = useState<ImportParticipantsResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const rows = lines.slice(0, 6).map((line) => {
          const sep = line.includes(';') && !line.includes(',') ? ';' : ',';
          return line.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
        });
        setPreview(rows);
      };
      reader.readAsText(f);
    } else {
      setPreview(null);
    }
  }

  function handleImport() {
    if (!file) return;
    importParticipants.mutate(file, {
      onSuccess: (r) => {
        setResult(r);
        if (r.imported > 0) toast(`${r.imported} deltagare importerade`, 'success');
        if (r.skipped > 0) toast(`${r.skipped} rader hoppades över`, 'info');
      },
      onError: () => toast('Import misslyckades', 'error'),
    });
  }

  function handleClose() {
    setFile(null);
    setPreview(null);
    setResult(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importera deltagare från CSV"
      footer={
        result ? (
          <Button variant="primary" size="md" onClick={handleClose}>
            Stäng
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="md" onClick={handleClose}>
              Avbryt
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleImport}
              loading={importParticipants.isPending}
              disabled={!file}
            >
              Importera
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={styles.importResultCard}>
            <div style={styles.importResultRow}>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                {result.imported}
              </span>
              <span> importerade</span>
            </div>
            {result.skipped > 0 && (
              <div style={styles.importResultRow}>
                <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                  {result.skipped}
                </span>
                <span> hoppades &ouml;ver</span>
              </div>
            )}
            <div style={styles.importResultRow}>
              <span style={{ color: 'var(--color-text-muted)' }}>{result.total}</span>
              <span style={{ color: 'var(--color-text-muted)' }}> rader totalt</span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div>
              <span style={sharedStyles.detailLabel}>Detaljer</span>
              <div style={styles.importErrorList}>
                {result.errors.slice(0, 20).map((err, i) => (
                  <div key={i} style={styles.importErrorItem}>
                    <span
                      style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}
                    >
                      Rad {err.row}:
                    </span>{' '}
                    {err.reason}
                  </div>
                ))}
                {result.errors.length > 20 && (
                  <div style={{ ...styles.importErrorItem, color: 'var(--color-text-muted)' }}>
                    ...och {result.errors.length - 20} till
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.fileUploadLabel}>
              <UploadIcon />
              <span>{file ? file.name : 'Välj CSV-fil...'}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              lineHeight: '1.5',
            }}
          >
            <strong>Format:</strong> CSV med kolumner namn, email, företag, kategori. Header-rad
            identifieras automatiskt. Stöder{' '}
            <code
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                padding: '1px 4px',
                borderRadius: '3px',
              }}
            >
              ,
            </code>{' '}
            och{' '}
            <code
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                padding: '1px 4px',
                borderRadius: '3px',
              }}
            >
              ;
            </code>{' '}
            som separator. Duplicerade e-postadresser hoppas över.
          </div>

          {preview && preview.length > 0 && (
            <div>
              <span style={sharedStyles.detailLabel}>Förhandsgranskning</span>
              <div style={{ ...sharedStyles.tableWrapper, maxHeight: '200px', overflow: 'auto' }}>
                <table style={sharedStyles.table}>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          ...sharedStyles.tr,
                          ...(i === 0
                            ? { backgroundColor: 'var(--color-bg-primary)', fontWeight: 600 }
                            : {}),
                        }}
                      >
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            style={{ ...sharedStyles.td, fontSize: 'var(--font-size-xs)' }}
                          >
                            {cell || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length >= 6 && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Visar de 5 första raderna...
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  importResultCard: {
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    fontSize: 'var(--font-size-base)',
  },
  importResultRow: {
    display: 'flex',
    gap: '4px',
    alignItems: 'baseline',
  },
  importErrorList: {
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    maxHeight: '160px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  importErrorItem: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.4',
  },
  fileUploadLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '2px dashed var(--color-border-strong)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    transition: 'border-color var(--transition-fast)',
    justifyContent: 'center',
  },
};
