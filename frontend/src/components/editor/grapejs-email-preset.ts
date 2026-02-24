/**
 * GrapeJS Email Preset — 6 email-safe block types
 * All blocks use table-based layout for email client compatibility.
 */
import type { Editor } from 'grapesjs';
import { EMAIL_FONT_FAMILY, CTA_STYLE, CONTENT_STYLE } from './grapejs-brand-config';

const CATEGORY = 'Email-block';

/** Register all email blocks on the editor */
export function registerEmailBlocks(editor: Editor) {
  const bm = editor.Blocks;

  // 1. Text block
  bm.add('email-text', {
    label: 'Text',
    category: CATEGORY,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="10" width="32" height="3" rx="1.5" fill="#701131"/><rect x="4" y="17" width="28" height="3" rx="1.5" fill="#A99B94"/><rect x="4" y="24" width="32" height="3" rx="1.5" fill="#A99B94"/></svg>`,
    content: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr>
    <td style="padding:16px 32px; font-family:${EMAIL_FONT_FAMILY}; font-size:15px; line-height:1.7; color:#1C1C1C;">
      Skriv din text här. Använd <strong>fetstil</strong> för att framhäva viktiga delar.
    </td>
  </tr>
</table>`,
  });

  // 2. Heading block
  bm.add('email-heading', {
    label: 'Rubrik',
    category: CATEGORY,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="14" width="32" height="5" rx="2" fill="#701131"/><rect x="4" y="23" width="20" height="3" rx="1.5" fill="#A99B94"/></svg>`,
    content: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr>
    <td style="padding:16px 32px; font-family:${EMAIL_FONT_FAMILY}; font-size:24px; font-weight:600; line-height:1.3; color:#701131;">
      Rubrik
    </td>
  </tr>
</table>`,
  });

  // 3. Image block
  bm.add('email-image', {
    label: 'Bild',
    category: CATEGORY,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="8" width="32" height="24" rx="3" stroke="#701131" stroke-width="1.5" fill="none"/><circle cx="13" cy="16" r="3" fill="#F49E88"/><path d="M4 26l10-8 8 6 6-4 8 6" stroke="#701131" stroke-width="1.5" fill="none"/></svg>`,
    content: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr>
    <td style="padding:16px 32px; text-align:center;">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='520' height='200' fill='%23EFE6DD'%3E%3Crect width='520' height='200'/%3E%3Ctext x='260' y='105' text-anchor='middle' fill='%23A99B94' font-size='16'%3EKlicka f%C3%B6r att v%C3%A4lja bild%3C/text%3E%3C/svg%3E" alt="Bild" width="520" style="max-width:100%; height:auto; display:block; margin:0 auto; border-radius:8px;" />
    </td>
  </tr>
</table>`,
  });

  // 4. CTA Button block
  bm.add('email-button', {
    label: 'CTA-knapp',
    category: CATEGORY,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="6" y="13" width="28" height="14" rx="4" fill="#B5223F"/><text x="20" y="23" text-anchor="middle" fill="#FFF" font-size="10" font-weight="600">Knapp</text></svg>`,
    content: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr>
    <td style="padding:16px 32px; text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:${CTA_STYLE.backgroundColor}; border-radius:${CTA_STYLE.borderRadius};">
            <a href="#" target="_blank" style="display:${CTA_STYLE.display}; padding:${CTA_STYLE.padding}; color:${CTA_STYLE.color}; font-family:${CTA_STYLE.fontFamily}; font-size:${CTA_STYLE.fontSize}; font-weight:${CTA_STYLE.fontWeight}; text-decoration:${CTA_STYLE.textDecoration};">
              Klicka här
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
  });

  // 5. Divider block
  bm.add('email-divider', {
    label: 'Avdelare',
    category: CATEGORY,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><line x1="4" y1="20" x2="36" y2="20" stroke="#A99B94" stroke-width="1.5"/></svg>`,
    content: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr>
    <td style="padding:8px 32px;">
      <hr style="border:none; border-top:1px solid #e8e0d8; margin:0;" />
    </td>
  </tr>
</table>`,
  });

  // 6. Two-column block
  bm.add('email-columns', {
    label: 'Kolumner',
    category: CATEGORY,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="8" width="14" height="24" rx="2" stroke="#701131" stroke-width="1.5" fill="none"/><rect x="22" y="8" width="14" height="24" rx="2" stroke="#701131" stroke-width="1.5" fill="none"/></svg>`,
    content: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr>
    <td style="padding:16px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
        <tr>
          <td width="50%" valign="top" style="padding-right:12px; font-family:${EMAIL_FONT_FAMILY}; font-size:15px; line-height:1.7; color:#1C1C1C;">
            Vänster kolumn — skriv text eller infoga innehåll här.
          </td>
          <td width="50%" valign="top" style="padding-left:12px; font-family:${EMAIL_FONT_FAMILY}; font-size:15px; line-height:1.7; color:#1C1C1C;">
            Höger kolumn — skriv text eller infoga innehåll här.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
  });

  // 7. Spacer block
  bm.add('email-spacer', {
    label: 'Mellanrum',
    category: CATEGORY,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><line x1="20" y1="8" x2="20" y2="32" stroke="#A99B94" stroke-width="1" stroke-dasharray="3 3"/><line x1="8" y1="8" x2="32" y2="8" stroke="#A99B94" stroke-width="1"/><line x1="8" y1="32" x2="32" y2="32" stroke="#A99B94" stroke-width="1"/></svg>`,
    content: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr>
    <td style="height:24px; line-height:24px; font-size:1px;">&nbsp;</td>
  </tr>
</table>`,
  });
}

/** Get the initial email template HTML to load in the editor */
export function getEmailCanvasHtml(bodyContent?: string): string {
  const content =
    bodyContent ||
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr>
    <td style="padding:16px 32px; font-family:${EMAIL_FONT_FAMILY}; font-size:15px; line-height:1.7; color:#1C1C1C;">
      Börja skriva ditt mail här, eller dra block från panelen till vänster.
    </td>
  </tr>
</table>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#EFE6DD; margin:0; padding:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="${CONTENT_STYLE.maxWidth}" style="max-width:${CONTENT_STYLE.maxWidth}; width:100%;">
        <!-- Header (låst — Consid brand) -->
        <tr data-locked-header>
          <td style="background-color:#701131; padding:24px 32px; border-radius:12px 12px 0 0;">
            <span style="font-family:${EMAIL_FONT_FAMILY}; font-size:18px; font-weight:600; color:#ffffff; letter-spacing:0.5px;">
              Stage
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff; padding:0;">
            ${content}
          </td>
        </tr>
        <!-- Footer (låst — unsubscribe + kontakt) -->
        <tr data-locked-footer>
          <td style="background-color:#ffffff; padding:24px 32px 28px; border-radius:0 0 12px 12px;">
            <p style="font-family:${EMAIL_FONT_FAMILY}; font-size:12px; color:#9b9490; margin:0; border-top:1px solid #e8e0d8; padding-top:16px;">
              Detta mail skickades via Stage, Consids eventplattform.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}
