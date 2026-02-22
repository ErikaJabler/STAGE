/** Build Consid-branded HTML email */
export function buildEmailHtml(opts: {
  body: string;
  recipientName: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  rsvpUrl?: string;
  calendarUrl?: string;
}): string {
  const escapedBody = escapeHtml(opts.body).replace(/\n/g, "<br>");

  const rsvpBlock = opts.rsvpUrl
    ? `
      <tr>
        <td style="padding: 24px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="background-color: #B5223F; border-radius: 6px;">
                <a href="${escapeHtml(opts.rsvpUrl)}" target="_blank"
                   style="display: inline-block; padding: 12px 28px; color: #ffffff; font-family: 'Consid Sans', system-ui, sans-serif; font-size: 15px; font-weight: 600; text-decoration: none;">
                  Svara p&aring; inbjudan
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const calendarBlock = opts.calendarUrl
    ? `
      <tr>
        <td style="padding: 12px 32px 0; text-align: center;">
          <a href="${escapeHtml(opts.calendarUrl)}" target="_blank"
             style="font-family: 'Consid Sans', system-ui, sans-serif; font-size: 13px; color: #701131; text-decoration: underline;">
            L&auml;gg till i kalender
          </a>
        </td>
      </tr>`
    : "";

  const eventInfoBlock =
    opts.eventName
      ? `
      <tr>
        <td style="padding: 20px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e8e0d8; padding-top: 16px;">
            <tr>
              <td style="font-family: 'Consid Sans', system-ui, sans-serif; font-size: 13px; color: #6b6360; line-height: 1.6;">
                <strong style="color: #1C1C1C;">${escapeHtml(opts.eventName)}</strong><br>
                ${opts.eventDate ? `${escapeHtml(opts.eventDate)}${opts.eventTime ? ` kl. ${escapeHtml(opts.eventTime)}` : ""}<br>` : ""}
                ${opts.eventLocation ? escapeHtml(opts.eventLocation) : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.eventName ?? "Stage")}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EFE6DD; font-family: 'Consid Sans', system-ui, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #EFE6DD;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width: 560px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #701131; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <span style="font-family: 'Consid Sans', system-ui, sans-serif; font-size: 18px; font-weight: 600; color: #ffffff; letter-spacing: 0.5px;">
                Stage
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 28px 32px;">
              <p style="font-family: 'Consid Sans', system-ui, sans-serif; font-size: 15px; line-height: 1.7; color: #1C1C1C; margin: 0;">
                ${escapedBody}
              </p>
            </td>
          </tr>
          <!-- RSVP button -->
          ${rsvpBlock}
          <!-- Calendar link -->
          ${calendarBlock}
          <!-- Event info -->
          ${eventInfoBlock}
          <!-- Footer -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 32px 28px; border-radius: 0 0 12px 12px;">
              <p style="font-family: 'Consid Sans', system-ui, sans-serif; font-size: 12px; color: #9b9490; margin: 0; border-top: 1px solid #e8e0d8; padding-top: 16px;">
                Detta mail skickades via Stage, Consids eventplattform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
