import type { EmailMessage, EmailResult, EmailProvider } from "./email.interface";

/** Console/log provider for development and testing */
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailResult> {
    console.log(`[EMAIL] To: ${message.to}, Subject: ${message.subject}`);
    console.log(`[EMAIL] Body: ${message.body}`);
    if (message.html) {
      console.log(`[EMAIL] HTML: (${message.html.length} chars)`);
    }
    return { success: true, messageId: `console-${Date.now()}` };
  }
}
