import { useState, useCallback } from 'react';
import type { CreateEventPayload } from '../api/client';

export interface EventFormData {
  name: string;
  emoji: string;
  date: string;
  time: string;
  end_date: string;
  end_time: string;
  location: string;
  description: string;
  organizer: string;
  organizer_email: string;
  type: string;
  status: string;
  visibility: string;
  max_participants: string;
  overbooking_limit: string;
}

export interface FormErrors {
  [key: string]: string;
}

export function useEventFormValidation() {
  const [errors, setErrors] = useState<FormErrors>({});

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback((form: EventFormData): FormErrors => {
    const errs: FormErrors = {};

    if (!form.name.trim()) errs.name = 'Namn krävs';
    if (!form.date.trim()) errs.date = 'Datum krävs';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errs.date = 'Måste vara YYYY-MM-DD';
    if (!form.time.trim()) errs.time = 'Tid krävs';
    else if (!/^\d{2}:\d{2}$/.test(form.time)) errs.time = 'Måste vara HH:MM';
    if (!form.location.trim()) errs.location = 'Plats krävs';
    if (!form.organizer.trim()) errs.organizer = 'Arrangör krävs';
    if (!form.organizer_email.trim()) errs.organizer_email = 'E-post krävs';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.organizer_email))
      errs.organizer_email = 'Ogiltig e-postadress';

    if (form.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.end_date))
      errs.end_date = 'Måste vara YYYY-MM-DD';
    if (form.end_time && !/^\d{2}:\d{2}$/.test(form.end_time)) errs.end_time = 'Måste vara HH:MM';

    if (form.max_participants) {
      const n = Number(form.max_participants);
      if (!Number.isFinite(n) || n < 1) errs.max_participants = 'Måste vara minst 1';
    }

    return errs;
  }, []);

  const buildPayload = useCallback((form: EventFormData): CreateEventPayload => {
    return {
      name: form.name.trim(),
      date: form.date,
      time: form.time,
      location: form.location.trim(),
      organizer: form.organizer.trim(),
      organizer_email: form.organizer_email.trim(),
      emoji: form.emoji || null,
      end_date: form.end_date || null,
      end_time: form.end_time || null,
      description: form.description.trim() || null,
      type: form.type,
      status: form.status,
      visibility: form.visibility,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      overbooking_limit: Number(form.overbooking_limit) || 0,
    };
  }, []);

  return { errors, setErrors, clearFieldError, validate, buildPayload };
}
