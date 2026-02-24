/**
 * GrapeJS Consid Brand Configuration
 * Restricts the editor to Consid Brand Guidelines 2025
 */

/** Approved Consid brand color palette */
export const BRAND_COLORS = [
  { id: '#701131', label: 'Burgundy' },
  { id: '#B5223F', label: 'Raspberry Red' },
  { id: '#F49E88', label: 'Light Orange' },
  { id: '#EFE6DD', label: 'Beige' },
  { id: '#1C1C1C', label: 'Black' },
  { id: '#492A34', label: 'Dark Purple' },
  { id: '#A99B94', label: 'Greige' },
  { id: '#EC6B6A', label: 'Orange' },
  { id: '#FFFFFF', label: 'White' },
] as const;

/** Color palette array for the GrapeJS color picker */
export const COLOR_PALETTE = BRAND_COLORS.map((c) => c.id);

/** Approved font stack for emails */
export const EMAIL_FONT_FAMILY = "'Consid Sans', Arial, Helvetica, sans-serif";

/** CTA button style (Raspberry Red, not editable) */
export const CTA_STYLE = {
  backgroundColor: '#B5223F',
  color: '#FFFFFF',
  padding: '12px 28px',
  borderRadius: '6px',
  fontFamily: EMAIL_FONT_FAMILY,
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
} as const;

/** Default email body style */
export const EMAIL_BODY_STYLE = {
  backgroundColor: '#EFE6DD',
  fontFamily: EMAIL_FONT_FAMILY,
  margin: '0',
  padding: '0',
} as const;

/** Default content area style */
export const CONTENT_STYLE = {
  backgroundColor: '#FFFFFF',
  maxWidth: '600px',
  margin: '0 auto',
  width: '100%',
} as const;

/**
 * Lock branded components (header/footer) in a GrapeJS editor.
 * Finds components with data-locked-header or data-locked-footer attributes
 * and makes them non-editable, non-draggable, non-removable.
 */
export function lockBrandComponents(editor: import('grapesjs').Editor) {
  // Small delay to ensure components are fully loaded
  setTimeout(() => {
    const wrapper = editor.getWrapper();
    if (!wrapper) return;

    // Recursive function to find and lock components by attribute
    function lockByAttribute(component: import('grapesjs').Component, attr: string, label: string) {
      const attributes = component.getAttributes();
      if (attributes[attr] !== undefined) {
        component.set({
          selectable: false,
          hoverable: false,
          draggable: false,
          droppable: false,
          removable: false,
          copyable: false,
          editable: false,
          layerable: true,
          toolbar: [],
        } as Record<string, unknown>);
        // Set a custom name in the layer panel
        component.set('custom-name', label);
        // Also lock all children
        component.components().forEach((child: import('grapesjs').Component) => {
          lockRecursive(child);
        });
        return true;
      }
      return false;
    }

    function lockRecursive(component: import('grapesjs').Component) {
      component.set({
        selectable: false,
        hoverable: false,
        draggable: false,
        droppable: false,
        removable: false,
        copyable: false,
        editable: false,
        toolbar: [],
      } as Record<string, unknown>);
      component.components().forEach((child: import('grapesjs').Component) => {
        lockRecursive(child);
      });
    }

    function findAndLock(component: import('grapesjs').Component) {
      lockByAttribute(component, 'data-locked-header', 'Consid Header (låst)');
      lockByAttribute(component, 'data-locked-footer', 'Footer (låst)');
      component.components().forEach((child: import('grapesjs').Component) => {
        findAndLock(child);
      });
    }

    findAndLock(wrapper);
  }, 200);
}

/** GrapeJS editor configuration with brand constraints */
export function getBrandEditorConfig() {
  return {
    // Restrict color picker to brand palette
    colorPicker: {
      appendTo: 'parent',
      showPalette: true,
      showSelectionPalette: false,
      showAlpha: false,
      preferredFormat: 'hex' as const,
      palette: [COLOR_PALETTE],
    },

    // Style manager with brand-restricted options
    styleManager: {
      sectors: [
        {
          name: 'Typografi',
          open: true,
          properties: [
            {
              type: 'select' as const,
              property: 'font-family',
              label: 'Typsnitt',
              default: EMAIL_FONT_FAMILY,
              options: [{ id: EMAIL_FONT_FAMILY, label: 'Consid Sans' }],
            },
            {
              type: 'select' as const,
              property: 'font-size',
              label: 'Textstorlek',
              default: '15px',
              options: [
                { id: '12px', label: '12px' },
                { id: '13px', label: '13px' },
                { id: '14px', label: '14px' },
                { id: '15px', label: '15px' },
                { id: '16px', label: '16px' },
                { id: '18px', label: '18px' },
                { id: '20px', label: '20px' },
                { id: '24px', label: '24px' },
                { id: '28px', label: '28px' },
                { id: '32px', label: '32px' },
              ],
            },
            {
              type: 'select' as const,
              property: 'font-weight',
              label: 'Vikt',
              default: '400',
              options: [
                { id: '400', label: 'Regular' },
                { id: '500', label: 'Medium' },
                { id: '600', label: 'Semibold' },
              ],
            },
            {
              type: 'select' as const,
              property: 'text-align',
              label: 'Justering',
              default: 'left',
              options: [
                { id: 'left', label: 'Vänster' },
                { id: 'center', label: 'Center' },
                { id: 'right', label: 'Höger' },
              ],
            },
            { type: 'color' as const, property: 'color', label: 'Textfärg', default: '#1C1C1C' },
          ],
        },
        {
          name: 'Bakgrund',
          open: false,
          properties: [
            {
              type: 'color' as const,
              property: 'background-color',
              label: 'Bakgrundsfärg',
              default: '#FFFFFF',
            },
          ],
        },
        {
          name: 'Spacing',
          open: false,
          properties: [
            {
              type: 'select' as const,
              property: 'padding',
              label: 'Padding',
              default: '0',
              options: [
                { id: '0', label: '0' },
                { id: '8px', label: '8px' },
                { id: '12px', label: '12px' },
                { id: '16px', label: '16px' },
                { id: '20px', label: '20px' },
                { id: '24px', label: '24px' },
                { id: '32px', label: '32px' },
              ],
            },
          ],
        },
      ],
    },
  };
}
