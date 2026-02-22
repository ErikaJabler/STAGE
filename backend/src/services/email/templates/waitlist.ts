import type { TemplateDefinition } from "../template-renderer";

export const waitlistTemplate: TemplateDefinition = {
  id: "waitlist",
  name: "Väntlista",
  description: "Meddelande om plats på väntlistan",
  defaultSubject: "Väntlista: {{event}}",
  body: `Hej {{name}},

Tack för ditt intresse för {{event}}!

Just nu är alla platser bokade, men du står på vår väntlista. Om en plats blir ledig kontaktar vi dig.

Du kan följa din status via din personliga länk:
{{rsvp_link}}

Vi hoppas att det löser sig!

Med vänlig hälsning,
{{organizer}}`,
  mergeFields: ["name", "event", "rsvp_link", "organizer"],
};
