/** Email module — re-exports for backward compatibility */

export type { EmailMessage, EmailResult, EmailProvider } from "./email.interface";
export { ResendProvider } from "./resend.adapter";
export { ConsoleEmailProvider } from "./console.adapter";
export { createEmailProvider } from "./factory";
export { buildEmailHtml, escapeHtml } from "./html-builder";
export { templates, getTemplate, renderText, renderEmail, buildMergeContext } from "./template-renderer";
export type { TemplateDefinition, MergeContext } from "./template-renderer";
