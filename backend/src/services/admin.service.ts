import type { EventWithCount, AdminDashboardData, EventConflict } from "@stage/shared";

export const AdminService = {
  /** List ALL non-deleted events (admin-only, no permission filter) */
  async listAllEvents(db: D1Database): Promise<EventWithCount[]> {
    const result = await db
      .prepare(
        `SELECT e.*, COUNT(p.id) AS participant_count
         FROM events e
         LEFT JOIN participants p ON p.event_id = e.id
         WHERE e.deleted_at IS NULL
         GROUP BY e.id
         ORDER BY e.date ASC`
      )
      .all<EventWithCount>();
    return result.results;
  },

  /** Get aggregated dashboard data across all events */
  async getDashboardData(db: D1Database): Promise<AdminDashboardData> {
    const today = new Date().toISOString().split("T")[0];

    // Total events (active vs historical)
    const eventStats = await db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN date >= ? THEN 1 ELSE 0 END) AS active,
           SUM(CASE WHEN date < ? THEN 1 ELSE 0 END) AS historical
         FROM events WHERE deleted_at IS NULL`
      )
      .bind(today, today)
      .first<{ total: number; active: number; historical: number }>();

    // Total participants
    const participantTotal = await db
      .prepare(
        `SELECT COUNT(*) AS total FROM participants p
         INNER JOIN events e ON e.id = p.event_id
         WHERE e.deleted_at IS NULL`
      )
      .first<{ total: number }>();

    // Participants by category
    const catRows = await db
      .prepare(
        `SELECT p.category, COUNT(*) AS count FROM participants p
         INNER JOIN events e ON e.id = p.event_id
         WHERE e.deleted_at IS NULL
         GROUP BY p.category`
      )
      .all<{ category: string; count: number }>();

    const participantsByCategory: Record<string, number> = {};
    for (const row of catRows.results) {
      participantsByCategory[row.category] = row.count;
    }

    // Upcoming events with participant counts (next 10)
    const upcoming = await db
      .prepare(
        `SELECT e.*, COUNT(p.id) AS participant_count
         FROM events e
         LEFT JOIN participants p ON p.event_id = e.id
         WHERE e.deleted_at IS NULL AND e.date >= ?
         GROUP BY e.id
         ORDER BY e.date ASC
         LIMIT 10`
      )
      .bind(today)
      .all<EventWithCount>();

    const todayMs = new Date(today + "T00:00:00Z").getTime();
    const upcomingWithDays = upcoming.results.map((e) => ({
      ...e,
      days_until: Math.round(
        (new Date(e.date + "T00:00:00Z").getTime() - todayMs) / 86400000
      ),
    }));

    // Recent mailings (last 20, cross-event)
    const recentMailings = await db
      .prepare(
        `SELECT m.id, m.event_id, e.name AS event_name, m.subject, m.status, m.sent_at, m.created_at
         FROM mailings m
         INNER JOIN events e ON e.id = m.event_id
         WHERE e.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT 20`
      )
      .all<{
        id: number;
        event_id: number;
        event_name: string;
        subject: string;
        status: string;
        sent_at: string | null;
        created_at: string;
      }>();

    return {
      total_events: eventStats?.total ?? 0,
      active_events: eventStats?.active ?? 0,
      historical_events: eventStats?.historical ?? 0,
      total_participants: participantTotal?.total ?? 0,
      participants_by_category: participantsByCategory,
      upcoming_events: upcomingWithDays,
      recent_mailings: recentMailings.results,
    };
  },

  /** Check for conflicting events (same date + same location) */
  async checkConflicts(
    db: D1Database,
    date: string,
    location: string,
    excludeEventId?: number
  ): Promise<EventConflict[]> {
    const query = excludeEventId
      ? `SELECT id, name, date, time, location FROM events
         WHERE deleted_at IS NULL AND date = ? AND LOWER(location) = LOWER(?) AND id != ?
         ORDER BY time ASC`
      : `SELECT id, name, date, time, location FROM events
         WHERE deleted_at IS NULL AND date = ? AND LOWER(location) = LOWER(?)
         ORDER BY time ASC`;

    const result = excludeEventId
      ? await db.prepare(query).bind(date, location, excludeEventId).all<EventConflict>()
      : await db.prepare(query).bind(date, location).all<EventConflict>();

    return result.results;
  },
};
