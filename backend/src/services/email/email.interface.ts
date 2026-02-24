/** Email abstraction layer — currently Resend, swappable to O365 later */

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** True when the failure is transient (e.g. 429 rate-limit) and a retry may succeed */
  retryable?: boolean;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
}
