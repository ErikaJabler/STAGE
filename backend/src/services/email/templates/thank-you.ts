import type { TemplateDefinition } from '../template-renderer';

export const thankYou: TemplateDefinition = {
  id: 'thank-you',
  name: 'Tackmail',
  description: 'Tack för deltagandet — skickas efter eventet',
  defaultSubject: 'Tack för att du deltog: {{event}}',
  body: `Hej {{name}},

Stort tack för att du deltog i {{event}}! Vi hoppas att du hade en givande upplevelse.

Har du feedback eller frågor? Kontakta gärna {{organizer}}.

Vi hoppas att vi ses igen snart!

Med vänlig hälsning,
{{organizer}}`,
  mergeFields: ['name', 'event', 'organizer'],
};
