import type { EmailProvider } from "./email.interface";
import { ResendProvider } from "./resend.adapter";
import { ConsoleEmailProvider } from "./console.adapter";

/** Factory: create the right provider based on env */
export function createEmailProvider(apiKey?: string): EmailProvider {
  if (apiKey) {
    return new ResendProvider(apiKey);
  }
  return new ConsoleEmailProvider();
}
