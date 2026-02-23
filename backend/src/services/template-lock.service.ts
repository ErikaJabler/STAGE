/**
 * Template Lock Service
 *
 * Defines locked zones per template type. Locked zones are sections in
 * GrapeJS editors that cannot be edited, moved, or deleted by users.
 *
 * - Email: Header (Consid logo) + Footer (unsubscribe + contact info)
 * - Page: Header (Consid logo + nav) + Footer (copyright + contact)
 *
 * Enforcement happens in the frontend GrapeJS editors.
 * This service provides the zone definitions.
 */

export interface LockedZone {
  /** CSS selector or data attribute to identify the zone */
  selector: string;
  /** Human-readable label shown in editor */
  label: string;
  /** What type of lock */
  lockType: "full";
}

export interface TemplateLockConfig {
  email: LockedZone[];
  page: LockedZone[];
}

export const TemplateLockService = {
  /** Get locked zone definitions for GrapeJS editors */
  getLockedZones(): TemplateLockConfig {
    return {
      email: [
        {
          selector: "[data-locked-header]",
          label: "Consid Header (låst)",
          lockType: "full",
        },
        {
          selector: "[data-locked-footer]",
          label: "Footer — unsubscribe + kontakt (låst)",
          lockType: "full",
        },
      ],
      page: [
        {
          selector: "[data-locked-header]",
          label: "Consid Header (låst)",
          lockType: "full",
        },
        {
          selector: "[data-locked-footer]",
          label: "Footer — kontaktinfo (låst)",
          lockType: "full",
        },
      ],
    };
  },
};
