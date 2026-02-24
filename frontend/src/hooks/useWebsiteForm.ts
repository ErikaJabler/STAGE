import { useState } from 'react';
import type { EventWithCount, WebsiteData } from '@stage/shared';
import { useWebsite, useSaveWebsite } from './useWebsite';
import { useToast } from '../components/ui/Toast';
import { buildInitialPageHtml } from '../components/editor/grapejs-page-preset';

export function useWebsiteForm(event: EventWithCount) {
  const { data: website, isLoading } = useWebsite(event.id);
  const saveWebsite = useSaveWebsite();
  const { toast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<WebsiteData>({});
  const [initialized, setInitialized] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Initialize state from server data
  if (website && !initialized) {
    setSelectedTemplate(website.template);
    setWebsiteData(website.data ?? {});
    setInitialized(true);
  }

  const published = website?.published ?? false;
  const slug = event.slug;
  const publicUrl = `${window.location.origin}/stage/e/${slug}`;
  const hasCustomPage = !!websiteData.page_html;

  const setField = <K extends keyof WebsiteData>(key: K, value: WebsiteData[K]) => {
    setWebsiteData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await saveWebsite.mutateAsync({
        eventId: event.id,
        data: {
          template: selectedTemplate ?? undefined,
          data: websiteData,
        },
      });
      toast('Webbplats sparad', 'success');
    } catch {
      toast('Kunde inte spara webbplats', 'error');
    }
  };

  const handleTogglePublish = async () => {
    try {
      await saveWebsite.mutateAsync({
        eventId: event.id,
        data: {
          template: selectedTemplate ?? undefined,
          data: websiteData,
          published: !published,
        },
      });
      toast(published ? 'Webbplats avpublicerad' : 'Webbplats publicerad', 'success');
    } catch {
      toast('Kunde inte ändra publiceringsstatus', 'error');
    }
  };

  const handleEditorSave = async (html: string, projectData: string) => {
    try {
      const newData: WebsiteData = {
        ...websiteData,
        page_html: html,
        page_editor_data: projectData,
      };
      await saveWebsite.mutateAsync({
        eventId: event.id,
        data: {
          template: selectedTemplate ?? undefined,
          data: newData,
        },
      });
      setWebsiteData(newData);
      setShowEditor(false);
      toast('Webbsida sparad', 'success');
    } catch {
      toast('Kunde inte spara webbsida', 'error');
    }
  };

  const handleResetToTemplate = async () => {
    const newData: WebsiteData = { ...websiteData };
    delete newData.page_html;
    delete newData.page_editor_data;
    try {
      await saveWebsite.mutateAsync({
        eventId: event.id,
        data: {
          template: selectedTemplate ?? undefined,
          data: newData,
        },
      });
      setWebsiteData(newData);
      toast('Återställd till mallbaserad sida', 'success');
    } catch {
      toast('Kunde inte återställa', 'error');
    }
  };

  const getEditorInitialHtml = (): string | undefined => {
    if (websiteData.page_html) return undefined;
    if (!selectedTemplate) return undefined;
    return buildInitialPageHtml(selectedTemplate, event, websiteData);
  };

  return {
    isLoading,
    selectedTemplate,
    setSelectedTemplate,
    websiteData,
    setField,
    published,
    publicUrl,
    hasCustomPage,
    showEditor,
    setShowEditor,
    isSaving: saveWebsite.isPending,
    handleSave,
    handleTogglePublish,
    handleEditorSave,
    handleEditorCancel: () => setShowEditor(false),
    handleEditorError: (message: string) => toast(message, 'error'),
    handleResetToTemplate,
    getEditorInitialHtml,
  };
}
