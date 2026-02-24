import type { TemplateDefinition } from '../template-renderer';

export const reminder: TemplateDefinition = {
  id: 'reminder',
  name: 'Påminnelse',
  description: 'Påminnelse till de som inte svarat',
  defaultSubject: 'Påminnelse: {{event}}',
  body: `Hej {{name}},

Vi vill påminna dig om {{event}}! Vi har ännu inte fått ditt svar och hoppas att du fortfarande kan delta.

Datum: {{datum}}
Tid: {{tid}}
Plats: {{plats}}

Svara gärna via länken nedan:
{{rsvp_link}}

Glöm inte att platsen kan vara begränsad, så svara gärna så snart du kan.

Vi hoppas vi ses!

Med vänlig hälsning,
{{organizer}}`,
  mergeFields: ['name', 'event', 'datum', 'tid', 'plats', 'rsvp_link', 'organizer'],
};
