import type { TemplateDefinition } from '../template-renderer';

export const saveTheDate: TemplateDefinition = {
  id: 'save-the-date',
  name: 'Save the date',
  description: 'Tidigt meddelande för att boka datum',
  defaultSubject: 'Save the date: {{event}}',
  body: `Hej {{name}},

Vi vill ge dig en tidig heads-up! Vi planerar {{event}} och hoppas att du kan vara med.

Boka gärna {{datum}} i din kalender redan nu. Mer information och en formell inbjudan kommer inom kort.

Vi återkommer snart med fler detaljer!

Med vänlig hälsning,
{{organizer}}`,
  mergeFields: ['name', 'event', 'datum', 'plats', 'organizer'],
};
