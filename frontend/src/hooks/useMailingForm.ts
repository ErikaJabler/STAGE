import { useState, useCallback } from 'react';

export type EditMode = null | 'form' | 'editor';

interface MailingFormData {
  subject: string;
  body: string;
  recipient_filter: string;
}

interface MailingTemplate {
  id: string;
  name: string;
  description: string;
  defaultSubject: string;
  body: string;
}

export function useMailingForm() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [form, setForm] = useState<MailingFormData>({
    subject: '',
    body: '',
    recipient_filter: 'all',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetState = useCallback(() => {
    setSelectedTemplate(null);
    setEditMode(null);
    setForm({ subject: '', body: '', recipient_filter: 'all' });
    setErrors({});
  }, []);

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleTemplateSelect = useCallback(
    (templateId: string, templates: MailingTemplate[] | undefined) => {
      if (selectedTemplate === templateId) {
        setSelectedTemplate(null);
        return;
      }
      const template = templates?.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplate(templateId);
        setForm((prev) => ({ ...prev, subject: template.defaultSubject, body: template.body }));
        setErrors({});
        setEditMode('form');
      }
    },
    [selectedTemplate],
  );

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.subject.trim()) errs.subject = 'Ämne krävs';
    if (!form.body.trim()) errs.body = 'Meddelande krävs';
    return errs;
  }, [form.subject, form.body]);

  return {
    form,
    errors,
    setErrors,
    editMode,
    setEditMode,
    selectedTemplate,
    resetState,
    updateField,
    handleTemplateSelect,
    validate,
  };
}
