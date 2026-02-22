import type { TemplateDefinition } from "../template-renderer";

export const invitation: TemplateDefinition = {
  id: "invitation",
  name: "Officiell inbjudan",
  description: "Formell inbjudan med RSVP-länk",
  defaultSubject: "Inbjudan: {{event}}",
  body: `Hej {{name}},

Du är varmt välkommen att delta i {{event}}!

Vi har ett spännande program planerat och hoppas att du kan vara med.

Datum: {{datum}}
Tid: {{tid}}
Plats: {{plats}}

Svara gärna på inbjudan via länken nedan så snart du kan.

{{rsvp_link}}

Har du frågor? Kontakta {{organizer}}.

Varmt välkommen!`,
  mergeFields: ["name", "event", "datum", "tid", "plats", "rsvp_link", "organizer"],
};
