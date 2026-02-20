/** Email abstraction layer — currently Resend, swappable to O365 later */

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
}

/** Resend email provider */
export class ResendProvider implements EmailProvider {
  constructor(private apiKey: string) {}

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from ?? "Stage <noreply@mikwik.se>",
          to: [message.to],
          subject: message.subject,
          text: message.body,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err };
      }

      const data = (await res.json()) as { id: string };
      return { success: true, messageId: data.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
}

/** Console/log provider for development and testing */
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailResult> {
    console.log(`[EMAIL] To: ${message.to}, Subject: ${message.subject}`);
    return { success: true, messageId: `console-${Date.now()}` };
  }
}

/** Factory: create the right provider based on env */
export function createEmailProvider(apiKey?: string): EmailProvider {
  if (apiKey) {
    return new ResendProvider(apiKey);
  }
  return new ConsoleEmailProvider();
}
