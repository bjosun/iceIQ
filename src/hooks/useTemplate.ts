// TODO: implement useTemplate hook
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../services/firebase';

interface TemplateAction {
  id: string;
  name: { sv: string; en: string };
  points: number;
  type: 'positive' | 'negative';
}

interface Template {
  id: string;
  name: { sv: string; en: string };
  actions: TemplateAction[];
  softSkills?: TemplateAction[];
}

const DEFAULT_TEMPLATES: Record<string, Template> = {
  defenseman: {
    id: 'defenseman',
    name: { sv: 'Back', en: 'Defenseman' },
    actions: [
      { id: '1', name: { sv: 'Lyckad passning', en: 'Successful Pass' }, points: 1, type: 'positive' },
      { id: '2', name: { sv: 'Tackling', en: 'Tackle' }, points: 2, type: 'positive' },
      { id: '3', name: { sv: 'Tackling med puckvinst', en: 'Tackle with Puck Recovery' }, points: 4, type: 'positive' },
      { id: '4', name: { sv: 'Skott på mål', en: 'Shot on Goal' }, points: 2, type: 'positive' },
      { id: '5', name: { sv: 'Mål', en: 'Goal' }, points: 10, type: 'positive' },
      { id: '6', name: { sv: 'Assist', en: 'Assist' }, points: 5, type: 'positive' },
      { id: '7', name: { sv: 'Löser stressad situation', en: 'Solves Pressured Situation' }, points: 5, type: 'positive' },
      { id: '8', name: { sv: 'Blockerat skott', en: 'Blocked Shot' }, points: 3, type: 'positive' },
      { id: '9', name: { sv: 'Misslyckad passning', en: 'Failed Pass' }, points: -1, type: 'negative' },
      { id: '10', name: { sv: 'Pucktapp (turnover)', en: 'Turnover' }, points: -3, type: 'negative' },
      { id: '11', name: { sv: 'Utvisning', en: 'Penalty' }, points: -4, type: 'negative' },
      { id: '12', name: { sv: 'Slår bort pucken (stress)', en: 'Clears Puck Under Pressure' }, points: -2, type: 'negative' },
      { id: '13', name: { sv: 'Insläppt mål på isen', en: 'Goal Against on Ice' }, points: -5, type: 'negative' },
    ]
  },
  // Add forward and goalie templates...
};

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Record<string, Template>>(DEFAULT_TEMPLATES);
  const [currentTemplate, setCurrentTemplate] = useState<string>('defenseman');
  const [customTemplates, setCustomTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState(false);

  // Load user's custom templates
  useEffect(() => {
    const loadCustomTemplates = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userData = await firestore.getUserData(user.uid);
        const userTemplates = userData?.customTemplates || {};
        
        setCustomTemplates(userTemplates);
        setTemplates({ ...DEFAULT_TEMPLATES, ...userTemplates });
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomTemplates();
  }, [user]);

  const saveTemplate = useCallback(async (templateId: string, templateData: Template) => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    try {
      setLoading(true);
      
      // Save to Firestore
      await firestore.saveTemplate(user.uid, templateId, templateData);
      
      // Update local state
      const updatedCustomTemplates = {
        ...customTemplates,
        [templateId]: templateData
      };
      
      setCustomTemplates(updatedCustomTemplates);
      setTemplates({ ...DEFAULT_TEMPLATES, ...updatedCustomTemplates });
      
      return { success: true };
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, customTemplates]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Don't allow deleting default templates
      if (DEFAULT_TEMPLATES[templateId]) {
        throw new Error('Cannot delete default templates');
      }

      // Delete from Firestore
      await firestore.deleteTemplate(user.uid, templateId);
      
      // Update local state
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [templateId]: removed, ...remaining } = customTemplates;
      setCustomTemplates(remaining);
      setTemplates({ ...DEFAULT_TEMPLATES, ...remaining });
      
      // If current template was deleted, switch to default
      if (currentTemplate === templateId) {
        setCurrentTemplate('defenseman');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, customTemplates, currentTemplate]);

  const getTemplate = useCallback((templateId: string): Template | null => {
    return templates[templateId] || null;
  }, [templates]);

  const getTemplateList = useCallback((): Array<{ id: string; name: string }> => {
    const currentLang = 'en'; // Replace with actual language from context
    return Object.entries(templates).map(([id, template]) => ({
      id,
      name: template.name[currentLang] || template.name.en
    }));
  }, [templates]);

  return {
    templates,
    currentTemplate,
    customTemplates,
    loading,
    setCurrentTemplate,
    saveTemplate,
    deleteTemplate,
    getTemplate,
    getTemplateList
  };
}