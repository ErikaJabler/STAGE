/**
 * EmailEditor — GrapeJS WYSIWYG wrapper for email editing.
 * Lazy-loaded via React.lazy() in CreateMailingModal.
 */
import { useRef, useCallback, useState } from 'react';
import grapesjs, { type Editor } from 'grapesjs';
import GjsEditor from '@grapesjs/react';
import { getBrandEditorConfig } from './grapejs-brand-config';
import { registerEmailBlocks, getEmailCanvasHtml } from './grapejs-email-preset';
import { imagesApi } from '../../api/client';
import juice from 'juice';

export interface EmailEditorProps {
  /** Initial HTML to load (from template or saved editor_data) */
  initialHtml?: string;
  /** GrapeJS project JSON for re-editing */
  initialProjectData?: string;
  /** Called when user clicks "Spara" — receives HTML + project JSON */
  onSave: (html: string, projectData: string) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

export default function EmailEditor({ initialHtml, initialProjectData, onSave, onCancel }: EmailEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const brandConfig = getBrandEditorConfig();

  const handleEditorInit = useCallback((editor: Editor) => {
    editorRef.current = editor;

    // Register email blocks
    registerEmailBlocks(editor);

    // Make table cells editable (double-click to edit text)
    editor.DomComponents.addType('cell', {
      extend: 'cell',
      model: {
        defaults: {
          editable: true,
        },
      },
    });

    // Load initial content
    if (initialProjectData) {
      try {
        editor.loadProjectData(JSON.parse(initialProjectData));
      } catch {
        // Fallback to HTML
        const html = initialHtml || getEmailCanvasHtml();
        editor.setComponents(html);
      }
    } else {
      const html = initialHtml || getEmailCanvasHtml();
      editor.setComponents(html);
    }

    // Set canvas size for email (600px max)
    editor.Canvas.getFrameEl()?.style.setProperty('max-width', '100%');
  }, [initialHtml, initialProjectData]);

  function handleSave() {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.getHtml();
    const css = editor.getCss() || '';

    // Inline CSS for email compatibility
    const fullHtml = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body style="margin:0; padding:0;">
${html}
</body>
</html>`;

    const inlinedHtml = juice(fullHtml);
    const projectData = JSON.stringify(editor.getProjectData());

    onSave(inlinedHtml, projectData);
  }

  function handlePreviewToggle(mode: 'desktop' | 'mobile') {
    setPreviewMode(mode);
    const editor = editorRef.current;
    if (!editor) return;

    const frame = editor.Canvas.getFrameEl();
    if (frame) {
      frame.style.width = mode === 'mobile' ? '375px' : '100%';
      frame.style.margin = mode === 'mobile' ? '0 auto' : '0';
    }
  }

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <button onClick={onCancel} style={styles.toolbarBtn} title="Tillbaka">
            <ArrowLeftIcon /> Tillbaka
          </button>
        </div>
        <div style={styles.toolbarCenter}>
          <button
            onClick={() => handlePreviewToggle('desktop')}
            style={{ ...styles.previewBtn, ...(previewMode === 'desktop' ? styles.previewBtnActive : {}) }}
            title="Desktop"
          >
            <DesktopIcon />
          </button>
          <button
            onClick={() => handlePreviewToggle('mobile')}
            style={{ ...styles.previewBtn, ...(previewMode === 'mobile' ? styles.previewBtnActive : {}) }}
            title="Mobil"
          >
            <MobileIcon />
          </button>
        </div>
        <div style={styles.toolbarRight}>
          <button onClick={onCancel} style={styles.cancelBtn}>Avbryt</button>
          <button onClick={handleSave} style={styles.saveBtn}>Spara mail</button>
        </div>
      </div>

      {/* GrapeJS Editor */}
      <div style={styles.editorWrapper}>
        <GjsEditor
          grapesjs={grapesjs}
          grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
          options={{
            height: '100%',
            width: 'auto',
            storageManager: false,
            undoManager: { trackSelection: false },
            canvas: {
              styles: [
                `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap`,
              ],
            },
            // Asset manager with R2 upload
            assetManager: {
              upload: false,
              uploadFile: async (ev: DragEvent | Event) => {
                const editor = editorRef.current;
                if (!editor) return;

                // Handle both drag-and-drop and click-to-upload
                const dragEv = ev as DragEvent;
                const inputEv = ev as unknown as { target: HTMLInputElement };
                const files = dragEv.dataTransfer?.files || inputEv.target?.files;
                if (!files || files.length === 0) return;

                for (let i = 0; i < files.length; i++) {
                  const file = files[i];

                  // Validate size (5 MB max)
                  if (file.size > 5 * 1024 * 1024) {
                    alert(`Filen "${file.name}" är för stor (max 5 MB)`);
                    continue;
                  }

                  // Validate type
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    alert(`Filen "${file.name}" har fel format (JPEG, PNG eller WebP)`);
                    continue;
                  }

                  try {
                    const result = await imagesApi.upload(file);
                    // Make URL absolute so it works inside GrapeJS iframe
                    const absoluteUrl = result.url.startsWith('http')
                      ? result.url
                      : `${window.location.origin}${result.url}`;
                    editor.AssetManager.add({
                      src: absoluteUrl,
                      type: 'image',
                      name: file.name,
                    });
                    // Auto-select the uploaded image on the selected component
                    const selected = editor.getSelected();
                    if (selected && selected.is('image')) {
                      selected.set('src', absoluteUrl);
                    }
                  } catch {
                    alert(`Kunde inte ladda upp "${file.name}"`);
                  }
                }
              },
            },
            // Brand-restricted panels
            ...brandConfig,
            // Disable features not relevant for email
            plugins: [],
            pluginsOpts: {},
          }}
          onEditor={handleEditorInit}
        />
      </div>
    </div>
  );
}

/* ---- Icons ---- */

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="2" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 16h6M9 13v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="4" y="1" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ---- Styles ---- */

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #e8e0d8',
    gap: '12px',
    flexShrink: 0,
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
  toolbarCenter: { display: 'flex', alignItems: 'center', gap: '4px' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' },
  toolbarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#1C1C1C',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    borderRadius: '6px',
  },
  previewBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    border: '1.5px solid #e8e0d8',
    backgroundColor: '#FFFFFF',
    color: '#6b6360',
    cursor: 'pointer',
    borderRadius: '6px',
  },
  previewBtnActive: {
    borderColor: '#701131',
    color: '#701131',
    backgroundColor: 'rgba(112, 17, 49, 0.06)',
  },
  cancelBtn: {
    padding: '7px 16px',
    border: '1.5px solid #e8e0d8',
    backgroundColor: '#FFFFFF',
    color: '#1C1C1C',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    borderRadius: '6px',
    fontWeight: 500,
  },
  saveBtn: {
    padding: '7px 16px',
    border: 'none',
    backgroundColor: '#B5223F',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    borderRadius: '6px',
    fontWeight: 600,
  },
  editorWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
};
