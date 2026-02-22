import type { EmailMessage, EmailResult, EmailProvider } from "./email.interface";

/** Resend email provider */
export class ResendProvider implements EmailProvider {
  constructor(private apiKey: string) {}

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const payload: Record<string, unknown> = {
        from: message.from ?? "Stage <noreply@mikwik.se>",
        to: [message.to],
        subject: message.subject,
        text: message.body,
      };
      if (message.html) {
        payload.html = message.html;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
