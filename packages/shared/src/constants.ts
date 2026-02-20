export const EVENT_STATUS = {
  PLANNING: "planning",
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const EVENT_TYPE = {
  CONFERENCE: "conference",
  WORKSHOP: "workshop",
  SEMINAR: "seminar",
  NETWORKING: "networking",
  INTERNAL: "internal",
  OTHER: "other",
} as const;

export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

export const PARTICIPANT_STATUS = {
  INVITED: "invited",
  ATTENDING: "attending",
  DECLINED: "declined",
  WAITLISTED: "waitlisted",
  CANCELLED: "cancelled",
} as const;

export type ParticipantStatus = (typeof PARTICIPANT_STATUS)[keyof typeof PARTICIPANT_STATUS];

export const PARTICIPANT_CATEGORY = {
  INTERNAL: "internal",
  PUBLIC_SECTOR: "public_sector",
  PRIVATE_SECTOR: "private_sector",
  PARTNER: "partner",
  OTHER: "other",
} as const;

export type ParticipantCategory = (typeof PARTICIPANT_CATEGORY)[keyof typeof PARTICIPANT_CATEGORY];

export const VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
} as const;

export type Visibility = (typeof VISIBILITY)[keyof typeof VISIBILITY];

export const MAILING_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
} as const;

export type MailingStatus = (typeof MAILING_STATUS)[keyof typeof MAILING_STATUS];
