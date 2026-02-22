import type { TemplateDefinition } from "../template-renderer";

export const confirmation: TemplateDefinition = {
  id: "confirmation",
  name: "Bekräftelse",
  description: "Bekräftelse på att deltagaren är med",
  defaultSubject: "Bekräftelse: {{event}}",
  body: `Hej {{name}},

Vad roligt att du kommer till {{event}}! Din plats är nu bokad.

Datum: {{datum}}
Tid: {{tid}}
Plats: {{plats}}

Lägg till eventet i din kalender:
{{calendar_link}}

Behöver du ändra dig? Du kan avboka via din personliga länk:
{{rsvp_link}}

Vi ses!

Med vänlig hälsning,
{{organizer}}`,
  mergeFields: ["name", "event", "datum", "tid", "plats", "rsvp_link", "calendar_link", "organizer"],
};
