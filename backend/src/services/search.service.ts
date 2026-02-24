import type { EventWithCount } from '@stage/shared';
import { searchEvents } from '../db/search.queries';

export const SearchService = {
  /** Search events by name, location, or organizer (user-scoped) */
  search(db: D1Database, userId: number, query: string): Promise<EventWithCount[]> {
    return searchEvents(db, userId, query);
  },
};
