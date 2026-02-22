/** Email module — re-exports for backward compatibility */

export type { EmailMessage, EmailResult, EmailProvider } from "./email.interface";
export { ResendProvider } from "./resend.adapter";
export { ConsoleEmailProvider } from "./console.adapter";
export { createEmailProvider } from "./factory";
export { buildEmailHtml, escapeHtml } from "./html-builder";
