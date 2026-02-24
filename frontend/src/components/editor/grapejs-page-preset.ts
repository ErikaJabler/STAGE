/**
 * GrapeJS Page Preset — Website-specific block types
 * Uses modern CSS (flexbox/grid) instead of table-layout.
 * Consid Brand Guidelines 2025.
 */
import type { Editor } from 'grapesjs';
import { EMAIL_FONT_FAMILY, CTA_STYLE } from './grapejs-brand-config';

const FONT = EMAIL_FONT_FAMILY;
const CATEGORY_PAGE = 'Webbsida';
const CATEGORY_COMMON = 'Generella';

/** Register all page blocks on the editor */
export function registerPageBlocks(editor: Editor) {
  const bm = editor.Blocks;

  /* ==============================
   * WEBSITE-SPECIFIC BLOCKS
   * ============================== */

  // 1. Hero section
  bm.add('page-hero', {
    label: 'Hero',
    category: CATEGORY_PAGE,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="2" y="4" width="36" height="32" rx="3" fill="#701131"/><text x="20" y="22" text-anchor="middle" fill="#FFF" font-size="9" font-weight="600">HERO</text></svg>`,
    content: `<header data-locked-header style="background-color:#701131; padding:60px 24px; text-align:center; color:#FFFFFF;">
  <div style="max-width:700px; margin:0 auto;">
    <div style="font-size:14px; font-weight:600; letter-spacing:2px; text-transform:uppercase; opacity:0.8; margin-bottom:16px; font-family:${FONT};">Stage</div>
    <h1 style="font-family:${FONT}; font-size:2.5rem; font-weight:600; margin:0 0 12px; line-height:1.15; color:#FFFFFF;">Eventets rubrik</h1>
    <p style="font-family:${FONT}; font-size:1.125rem; opacity:0.9; margin:0; line-height:1.5; color:#FFFFFF;">En kort beskrivning av eventet</p>
  </div>
</header>`,
  });

  // 2. Info cards (date, time, location, organizer)
  bm.add('page-info-grid', {
    label: 'Eventinfo',
    category: CATEGORY_PAGE,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="2" y="6" width="16" height="12" rx="3" fill="#EFE6DD" stroke="#701131" stroke-width="1"/><rect x="22" y="6" width="16" height="12" rx="3" fill="#EFE6DD" stroke="#701131" stroke-width="1"/><rect x="2" y="22" width="16" height="12" rx="3" fill="#EFE6DD" stroke="#701131" stroke-width="1"/><rect x="22" y="22" width="16" height="12" rx="3" fill="#EFE6DD" stroke="#701131" stroke-width="1"/></svg>`,
    content: `<section style="max-width:700px; margin:0 auto; padding:32px 24px;">
  <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">
    <div style="display:flex; align-items:center; gap:12px; padding:14px 16px; background-color:#FFFFFF; border-radius:12px; box-shadow:0 1px 4px rgba(28,28,28,0.06);">
      <span style="font-size:20px;">📅</span>
      <div>
        <div style="font-family:${FONT}; font-size:0.75rem; color:#A99B94; text-transform:uppercase; letter-spacing:0.5px;">Datum</div>
        <div style="font-family:${FONT}; font-size:0.9375rem; font-weight:500; color:#1C1C1C;">1 januari 2026</div>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:12px; padding:14px 16px; background-color:#FFFFFF; border-radius:12px; box-shadow:0 1px 4px rgba(28,28,28,0.06);">
      <span style="font-size:20px;">🕐</span>
      <div>
        <div style="font-family:${FONT}; font-size:0.75rem; color:#A99B94; text-transform:uppercase; letter-spacing:0.5px;">Tid</div>
        <div style="font-family:${FONT}; font-size:0.9375rem; font-weight:500; color:#1C1C1C;">18:00 – 22:00</div>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:12px; padding:14px 16px; background-color:#FFFFFF; border-radius:12px; box-shadow:0 1px 4px rgba(28,28,28,0.06);">
      <span style="font-size:20px;">📍</span>
      <div>
        <div style="font-family:${FONT}; font-size:0.75rem; color:#A99B94; text-transform:uppercase; letter-spacing:0.5px;">Plats</div>
        <div style="font-family:${FONT}; font-size:0.9375rem; font-weight:500; color:#1C1C1C;">Eventlokal</div>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:12px; padding:14px 16px; background-color:#FFFFFF; border-radius:12px; box-shadow:0 1px 4px rgba(28,28,28,0.06);">
      <span style="font-size:20px;">👤</span>
      <div>
        <div style="font-family:${FONT}; font-size:0.75rem; color:#A99B94; text-transform:uppercase; letter-spacing:0.5px;">Arrangör</div>
        <div style="font-family:${FONT}; font-size:0.9375rem; font-weight:500; color:#1C1C1C;">Consid</div>
      </div>
    </div>
  </div>
</section>`,
  });

  // 3. Program timeline
  bm.add('page-program', {
    label: 'Program',
    category: CATEGORY_PAGE,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><line x1="12" y1="4" x2="12" y2="36" stroke="#F49E88" stroke-width="2"/><circle cx="12" cy="10" r="4" fill="#B5223F"/><circle cx="12" cy="22" r="4" fill="#B5223F"/><circle cx="12" cy="34" r="4" fill="#B5223F"/><rect x="20" y="7" width="16" height="6" rx="2" fill="#EFE6DD"/><rect x="20" y="19" width="16" height="6" rx="2" fill="#EFE6DD"/><rect x="20" y="31" width="16" height="6" rx="2" fill="#EFE6DD"/></svg>`,
    content: `<section style="max-width:700px; margin:0 auto; padding:32px 24px;">
  <h2 style="font-family:${FONT}; font-size:1.5rem; font-weight:600; color:#701131; margin:0 0 20px;">Program</h2>
  <div style="display:flex; flex-direction:column; padding-left:20px; border-left:2px solid #F49E88;">
    <div style="display:flex; gap:16px; padding:16px 0; position:relative;">
      <div style="position:absolute; left:-26px; top:22px; width:12px; height:12px; border-radius:50%; background-color:#B5223F; border:2px solid #EFE6DD;"></div>
      <div style="flex:1;">
        <div style="font-family:${FONT}; font-size:0.8125rem; font-weight:600; color:#B5223F;">18:00</div>
        <div style="font-family:${FONT}; font-size:1rem; font-weight:600; color:#1C1C1C; margin-top:2px;">Mingel och registrering</div>
        <div style="font-family:${FONT}; font-size:0.875rem; color:#A99B94; margin-top:4px; line-height:1.5;">Välkommen med dryck och tilltugg</div>
      </div>
    </div>
    <div style="display:flex; gap:16px; padding:16px 0; position:relative;">
      <div style="position:absolute; left:-26px; top:22px; width:12px; height:12px; border-radius:50%; background-color:#B5223F; border:2px solid #EFE6DD;"></div>
      <div style="flex:1;">
        <div style="font-family:${FONT}; font-size:0.8125rem; font-weight:600; color:#B5223F;">19:00</div>
        <div style="font-family:${FONT}; font-size:1rem; font-weight:600; color:#1C1C1C; margin-top:2px;">Presentation</div>
        <div style="font-family:${FONT}; font-size:0.875rem; color:#A99B94; margin-top:4px; line-height:1.5;">Huvudtalare presenterar ämnet</div>
      </div>
    </div>
  </div>
</section>`,
  });

  // 4. Venue / location
  bm.add('page-venue', {
    label: 'Plats',
    category: CATEGORY_PAGE,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M20 6C14.5 6 10 10.5 10 16c0 8 10 18 10 18s10-10 10-18c0-5.5-4.5-10-10-10z" fill="#F49E88"/><circle cx="20" cy="16" r="4" fill="#701131"/></svg>`,
    content: `<section style="max-width:700px; margin:0 auto; padding:32px 24px;">
  <h2 style="font-family:${FONT}; font-size:1.5rem; font-weight:600; color:#701131; margin:0 0 20px;">Plats</h2>
  <p style="font-family:${FONT}; font-size:1rem; line-height:1.7; color:#492A34; margin:0 0 12px;">Beskriv platsen här — hur man hittar dit, vad som finns i närheten, parkeringsmöjligheter.</p>
  <div style="display:flex; align-items:center; gap:8px; padding:12px 16px; background-color:#FFFFFF; border-radius:12px; font-family:${FONT}; font-size:0.9375rem;">
    <span style="font-size:16px;">📍</span>
    <span>Storgatan 1, 111 22 Stockholm</span>
  </div>
</section>`,
  });

  // 5. Registration form placeholder
  bm.add('page-register-form', {
    label: 'Anmälan',
    category: CATEGORY_PAGE,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="6" y="6" width="28" height="28" rx="4" fill="#FFFFFF" stroke="#701131" stroke-width="1.5"/><rect x="10" y="12" width="20" height="3" rx="1.5" fill="#EFE6DD"/><rect x="10" y="18" width="20" height="3" rx="1.5" fill="#EFE6DD"/><rect x="10" y="24" width="12" height="6" rx="3" fill="#B5223F"/></svg>`,
    content: `<section style="max-width:700px; margin:0 auto; padding:32px 24px;">
  <h2 style="font-family:${FONT}; font-size:1.5rem; font-weight:600; color:#701131; margin:0 0 20px;">Anmälan</h2>
  <div data-page-register-form="true" style="padding:24px; background-color:#FFFFFF; border-radius:16px; box-shadow:0 2px 12px rgba(28,28,28,0.06); text-align:center;">
    <p style="font-family:${FONT}; font-size:0.9375rem; color:#A99B94; margin:0 0 16px;">Anmälningsformuläret visas automatiskt här på den publika sidan.</p>
    <div style="display:inline-block; padding:12px 28px; background-color:#B5223F; color:#FFFFFF; border-radius:6px; font-family:${FONT}; font-size:0.9375rem; font-weight:600;">Anmäl mig</div>
  </div>
</section>`,
  });

  // 6. Footer
  bm.add('page-footer', {
    label: 'Footer',
    category: CATEGORY_PAGE,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="2" y="28" width="36" height="8" rx="2" fill="#701131" opacity="0.3"/><rect x="14" y="30" width="12" height="4" rx="1" fill="#701131"/></svg>`,
    content: `<footer data-locked-footer style="text-align:center; padding:24px; font-family:${FONT}; font-size:0.75rem; color:#A99B94;">
  Powered by Stage — Consid
</footer>`,
  });

  /* ==============================
   * COMMON / GENERAL BLOCKS
   * ============================== */

  // Text block
  bm.add('page-text', {
    label: 'Text',
    category: CATEGORY_COMMON,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="10" width="32" height="3" rx="1.5" fill="#701131"/><rect x="4" y="17" width="28" height="3" rx="1.5" fill="#A99B94"/><rect x="4" y="24" width="32" height="3" rx="1.5" fill="#A99B94"/></svg>`,
    content: `<div style="max-width:700px; margin:0 auto; padding:16px 24px;">
  <p style="font-family:${FONT}; font-size:1rem; line-height:1.7; color:#1C1C1C; margin:0;">Skriv din text här. Använd <strong>fetstil</strong> för att framhäva viktiga delar.</p>
</div>`,
  });

  // Heading block
  bm.add('page-heading', {
    label: 'Rubrik',
    category: CATEGORY_COMMON,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="14" width="32" height="5" rx="2" fill="#701131"/><rect x="4" y="23" width="20" height="3" rx="1.5" fill="#A99B94"/></svg>`,
    content: `<div style="max-width:700px; margin:0 auto; padding:16px 24px;">
  <h2 style="font-family:${FONT}; font-size:1.5rem; font-weight:600; color:#701131; margin:0;">Rubrik</h2>
</div>`,
  });

  // Image block
  bm.add('page-image', {
    label: 'Bild',
    category: CATEGORY_COMMON,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="8" width="32" height="24" rx="3" stroke="#701131" stroke-width="1.5" fill="none"/><circle cx="13" cy="16" r="3" fill="#F49E88"/><path d="M4 26l10-8 8 6 6-4 8 6" stroke="#701131" stroke-width="1.5" fill="none"/></svg>`,
    content: `<div style="max-width:700px; margin:0 auto; padding:16px 24px; text-align:center;">
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='650' height='300' fill='%23EFE6DD'%3E%3Crect width='650' height='300'/%3E%3Ctext x='325' y='155' text-anchor='middle' fill='%23A99B94' font-size='16'%3EKlicka f%C3%B6r att v%C3%A4lja bild%3C/text%3E%3C/svg%3E" alt="Bild" style="max-width:100%; height:auto; display:block; margin:0 auto; border-radius:12px;" />
</div>`,
  });

  // CTA Button
  bm.add('page-button', {
    label: 'CTA-knapp',
    category: CATEGORY_COMMON,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="6" y="13" width="28" height="14" rx="4" fill="#B5223F"/><text x="20" y="23" text-anchor="middle" fill="#FFF" font-size="10" font-weight="600">Knapp</text></svg>`,
    content: `<div style="max-width:700px; margin:0 auto; padding:16px 24px; text-align:center;">
  <a href="#" style="display:${CTA_STYLE.display}; padding:${CTA_STYLE.padding}; background-color:${CTA_STYLE.backgroundColor}; color:${CTA_STYLE.color}; border-radius:${CTA_STYLE.borderRadius}; font-family:${CTA_STYLE.fontFamily}; font-size:${CTA_STYLE.fontSize}; font-weight:${CTA_STYLE.fontWeight}; text-decoration:${CTA_STYLE.textDecoration};">Klicka här</a>
</div>`,
  });

  // Divider
  bm.add('page-divider', {
    label: 'Avdelare',
    category: CATEGORY_COMMON,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><line x1="4" y1="20" x2="36" y2="20" stroke="#A99B94" stroke-width="1.5"/></svg>`,
    content: `<div style="max-width:700px; margin:0 auto; padding:8px 24px;">
  <hr style="border:none; border-top:1px solid #e8e0d8; margin:0;" />
</div>`,
  });

  // Two columns
  bm.add('page-columns', {
    label: 'Kolumner',
    category: CATEGORY_COMMON,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="8" width="14" height="24" rx="2" stroke="#701131" stroke-width="1.5" fill="none"/><rect x="22" y="8" width="14" height="24" rx="2" stroke="#701131" stroke-width="1.5" fill="none"/></svg>`,
    content: `<div style="max-width:700px; margin:0 auto; padding:16px 24px;">
  <div style="display:flex; gap:24px;">
    <div style="flex:1; font-family:${FONT}; font-size:1rem; line-height:1.7; color:#1C1C1C;">
      Vänster kolumn — skriv text eller infoga innehåll här.
    </div>
    <div style="flex:1; font-family:${FONT}; font-size:1rem; line-height:1.7; color:#1C1C1C;">
      Höger kolumn — skriv text eller infoga innehåll här.
    </div>
  </div>
</div>`,
  });

  // Spacer
  bm.add('page-spacer', {
    label: 'Mellanrum',
    category: CATEGORY_COMMON,
    media: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><line x1="20" y1="8" x2="20" y2="32" stroke="#A99B94" stroke-width="1" stroke-dasharray="3 3"/><line x1="8" y1="8" x2="32" y2="8" stroke="#A99B94" stroke-width="1"/><line x1="8" y1="32" x2="32" y2="32" stroke="#A99B94" stroke-width="1"/></svg>`,
    content: `<div style="height:40px;"></div>`,
  });
}

/**
 * Build initial page HTML from template + event data.
 * Used as starting point when opening the editor for the first time.
 */
export function buildInitialPageHtml(
  template: string,
  event: {
    name: string;
    date: string;
    time: string;
    end_time?: string | null;
    location: string;
    organizer: string;
    description?: string | null;
    image_url?: string | null;
  },
  websiteData?: {
    hero_title?: string;
    hero_subtitle?: string;
    program_items?: { time: string; title: string; description?: string }[];
    venue_description?: string;
    venue_address?: string;
  },
): string {
  const heroTitle = websiteData?.hero_title || event.name;
  const heroSubtitle = websiteData?.hero_subtitle || '';
  const heroStyle = event.image_url
    ? `background:linear-gradient(rgba(112,17,49,0.65), rgba(112,17,49,0.85)), url(${event.image_url}) center/cover; padding:60px 24px; text-align:center; color:#FFFFFF;`
    : `background-color:#701131; padding:60px 24px; text-align:center; color:#FFFFFF;`;

  let html = `<header data-locked-header style="${heroStyle}">
  <div style="max-width:700px; margin:0 auto;">
    <div style="font-family:${FONT}; font-size:14px; font-weight:600; letter-spacing:2px; text-transform:uppercase; opacity:0.8; margin-bottom:16px; color:#FFFFFF;">Stage</div>
    <h1 style="font-family:${FONT}; font-size:2.5rem; font-weight:600; margin:0 0 12px; line-height:1.15; color:#FFFFFF;">${esc(heroTitle)}</h1>
    ${heroSubtitle ? `<p style="font-family:${FONT}; font-size:1.125rem; opacity:0.9; margin:0; line-height:1.5; color:#FFFFFF;">${esc(heroSubtitle)}</p>` : ''}
  </div>
</header>`;

  // Info grid
  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };
  const timeStr = event.end_time ? `${event.time} – ${event.end_time}` : event.time;
  html += `
<section style="max-width:700px; margin:0 auto; padding:32px 24px;">
  <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">
    <div style="display:flex; align-items:center; gap:12px; padding:14px 16px; background-color:#FFFFFF; border-radius:12px; box-shadow:0 1px 4px rgba(28,28,28,0.06);">
      <span style="font-size:20px;">📅</span>
      <div><div style="font-family:${FONT}; font-size:0.75rem; color:#A99B94; text-transform:uppercase; letter-spacing:0.5px;">Datum</div><div style="font-family:${FONT}; font-size:0.9375rem; font-weight:500; color:#1C1C1C;">${esc(formatDate(event.date))}</div></div>
    </div>
    <div style="display:flex; align-items:center; gap:12px; padding:14px 16px; background-color:#FFFFFF; border-radius:12px; box-shadow:0 1px 4px rgba(28,28,28,0.06);">
      <span style="font-size:20px;">🕐</span>
      <div><div style="font-family:${FONT}; font-size:0.75rem; color:#A99B94; text-transform:uppercase; letter-spacing:0.5px;">Tid</div><div style="font-family:${FONT}; font-size:0.9375rem; font-weight:500; color:#1C1C1C;">${esc(timeStr)}</div></div>
    </div>
    <div style="display:flex; align-items:center; gap:12px; padding:14px 16px; background-color:#FFFFFF; border-radius:12px; box-shadow:0 1px 4px rgba(28,28,28,0.06);">
      <span style="font-size:20px;">📍</span>
      <div><div style="font-family:${FONT}; font-size:0.75rem; color:#A99B94; text-transform:uppercase; letter-spacing:0.5px;">Plats</div><div style="font-family:${FONT}; font-size:0.9375rem; font-weight:500; color:#1C1C1C;">${esc(event.location)}</div></div>
    </div>
    <div style="display:flex; align-items:center; gap:12px; padding:14px 16px; background-color:#FFFFFF; border-radius:12px; box-shadow:0 1px 4px rgba(28,28,28,0.06);">
      <span style="font-size:20px;">👤</span>
      <div><div style="font-family:${FONT}; font-size:0.75rem; color:#A99B94; text-transform:uppercase; letter-spacing:0.5px;">Arrangör</div><div style="font-family:${FONT}; font-size:0.9375rem; font-weight:500; color:#1C1C1C;">${esc(event.organizer)}</div></div>
    </div>
  </div>
  ${event.description ? `<p style="font-family:${FONT}; font-size:1rem; line-height:1.7; color:#492A34; margin:20px 0 0;">${esc(event.description)}</p>` : ''}
</section>`;

  // Program (hero-program-plats only)
  if (
    template === 'hero-program-plats' &&
    websiteData?.program_items &&
    websiteData.program_items.length > 0
  ) {
    html += `
<section style="max-width:700px; margin:0 auto; padding:32px 24px;">
  <h2 style="font-family:${FONT}; font-size:1.5rem; font-weight:600; color:#701131; margin:0 0 20px;">Program</h2>
  <div style="display:flex; flex-direction:column; padding-left:20px; border-left:2px solid #F49E88;">`;
    for (const item of websiteData.program_items) {
      html += `
    <div style="display:flex; gap:16px; padding:16px 0; position:relative;">
      <div style="position:absolute; left:-26px; top:22px; width:12px; height:12px; border-radius:50%; background-color:#B5223F; border:2px solid #EFE6DD;"></div>
      <div style="flex:1;">
        <div style="font-family:${FONT}; font-size:0.8125rem; font-weight:600; color:#B5223F;">${esc(item.time)}</div>
        <div style="font-family:${FONT}; font-size:1rem; font-weight:600; color:#1C1C1C; margin-top:2px;">${esc(item.title)}</div>
        ${item.description ? `<div style="font-family:${FONT}; font-size:0.875rem; color:#A99B94; margin-top:4px; line-height:1.5;">${esc(item.description)}</div>` : ''}
      </div>
    </div>`;
    }
    html += `
  </div>
</section>`;
  }

  // Venue (hero-program-plats only)
  if (
    template === 'hero-program-plats' &&
    (websiteData?.venue_description || websiteData?.venue_address)
  ) {
    html += `
<section style="max-width:700px; margin:0 auto; padding:32px 24px;">
  <h2 style="font-family:${FONT}; font-size:1.5rem; font-weight:600; color:#701131; margin:0 0 20px;">Plats</h2>
  ${websiteData.venue_description ? `<p style="font-family:${FONT}; font-size:1rem; line-height:1.7; color:#492A34; margin:0 0 12px;">${esc(websiteData.venue_description)}</p>` : ''}
  ${websiteData.venue_address ? `<div style="display:flex; align-items:center; gap:8px; padding:12px 16px; background-color:#FFFFFF; border-radius:12px; font-family:${FONT}; font-size:0.9375rem;"><span style="font-size:16px;">📍</span><span>${esc(websiteData.venue_address)}</span></div>` : ''}
</section>`;
  }

  // Registration form placeholder
  html += `
<section style="max-width:700px; margin:0 auto; padding:32px 24px;">
  <h2 style="font-family:${FONT}; font-size:1.5rem; font-weight:600; color:#701131; margin:0 0 20px;">Anmälan</h2>
  <div data-page-register-form="true" style="padding:24px; background-color:#FFFFFF; border-radius:16px; box-shadow:0 2px 12px rgba(28,28,28,0.06); text-align:center;">
    <p style="font-family:${FONT}; font-size:0.9375rem; color:#A99B94; margin:0 0 16px;">Anmälningsformuläret visas automatiskt här på den publika sidan.</p>
    <div style="display:inline-block; padding:12px 28px; background-color:#B5223F; color:#FFFFFF; border-radius:6px; font-family:${FONT}; font-size:0.9375rem; font-weight:600;">Anmäl mig</div>
  </div>
</section>`;

  // Footer (locked — brand)
  html += `
<footer data-locked-footer style="text-align:center; padding:24px; font-family:${FONT}; font-size:0.75rem; color:#A99B94;">
  Powered by Stage — Consid
</footer>`;

  return html;
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
