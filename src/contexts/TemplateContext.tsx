import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { firestore } from '../services/firebase';

export interface TemplateAction {
  name: { sv: string; en: string };
  points: number;
  type: 'positive' | 'negative';
}

export interface Template {
  id: string;
  name: { sv: string; en: string };
  actions: TemplateAction[];
  softSkills?: TemplateAction[];
}

interface TemplateContextType {
  templates: Record<string, Template>;
  currentTemplate: Template | null;
  currentTemplateId: string;
  customTemplates: Record<string, Template>;
  loading: boolean;
  setCurrentTemplate: (templateId: string) => void;
  saveTemplate: (templateId: string, template: Template) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  addAction: (action: TemplateAction) => void;
  updateAction: (actionId: string, updates: Partial<TemplateAction>) => void;
  deleteAction: (actionId: string) => void;
}

const defaultTemplates: Record<string, Template> = {
  defenseman: {
    id: 'defenseman',
    name: { sv: 'Back', en: 'Defenseman' },
    actions: [
      { name: {sv: 'Lyckad passning', en: 'Successful Pass'}, points: 1, type: 'positive' },
      { name: {sv: 'Tackling', en: 'Tackle'}, points: 2, type: 'positive' },
      { name: {sv: 'Tackling med puckvinst', en: 'Tackle with Puck Recovery'}, points: 4, type: 'positive' },
      { name: {sv: 'Skott på mål', en: 'Shot on Goal'}, points: 2, type: 'positive' },
      { name: {sv: 'Mål', en: 'Goal'}, points: 10, type: 'positive' },
      { name: {sv: 'Assist', en: 'Assist'}, points: 5, type: 'positive' },
      { name: {sv: 'Löser stressad situation', en: 'Solves Pressured Situation'}, points: 5, type: 'positive' },
      { name: {sv: 'Blockerat skott', en: 'Blocked Shot'}, points: 3, type: 'positive' },
      { name: {sv: 'Misslyckad passning', en: 'Failed Pass'}, points: -1, type: 'negative' },
      { name: {sv: 'Pucktapp (turnover)', en: 'Turnover'}, points: -3, type: 'negative' },
      { name: {sv: 'Utvisning', en: 'Penalty'}, points: -4, type: 'negative' },
      { name: {sv: 'Slår bort pucken (stress)', en: 'Clears Puck Under Pressure'}, points: -2, type: 'negative' },
      { name: {sv: 'Insläppt mål på isen', en: 'Goal Against on Ice'}, points: -5, type: 'negative' },
    ]
  },
  forward: {
    id: 'forward',
    name: { sv: 'Forward', en: 'Forward' },
    actions: [
      { name: {sv: 'Vunnen tekning', en: 'Faceoff Win'}, points: 2, type: 'positive' },
      { name: {sv: 'Skott på mål', en: 'Shot on Goal'}, points: 3, type: 'positive' },
      { name: {sv: 'Mål', en: 'Goal'}, points: 10, type: 'positive' },
      { name: {sv: 'Assist', en: 'Assist'}, points: 5, type: 'positive' },
      { name: {sv: 'Skapad målchans', en: 'Scoring Chance Created'}, points: 4, type: 'positive' },
      { name: {sv: 'Lyckad dribbling', en: 'Successful Deke'}, points: 2, type: 'positive' },
      { name: {sv: 'Forechecking med puckvinst', en: 'Forecheck Puck Recovery'}, points: 4, type: 'positive' },
      { name: {sv: 'Tackling', en: 'Tackle'}, points: 2, type: 'positive' },
      { name: {sv: 'Backcheck med puckvinst', en: 'Backcheck Puck Recovery'}, points: 3, type: 'positive' },
      { name: {sv: 'Förlorad tekning', en: 'Faceoff Loss'}, points: -1, type: 'negative' },
      { name: {sv: 'Missat skott', en: 'Missed Shot'}, points: -1, type: 'negative' },
      { name: {sv: 'Pucktapp (offensiv zon)', en: 'Offensive Zone Turnover'}, points: -4, type: 'negative' },
      { name: {sv: 'Utvisning', en: 'Penalty'}, points: -4, type: 'negative' },
      { name: {sv: 'Offside', en: 'Offside'}, points: -1, type: 'negative' },
    ]
  },
  goalie: {
    id: 'goalie',
    name: { sv: 'Målvakt', en: 'Goalie' },
    actions: [
      { name: {sv: 'Räddning', en: 'Save'}, points: 2, type: 'positive' },
      { name: {sv: 'Svår räddning', en: 'Difficult Save'}, points: 4, type: 'positive' },
      { name: {sv: 'Hållen nolla (period)', en: 'Shutout (Period)'}, points: 5, type: 'positive' },
      { name: {sv: 'Kontrollerad retur', en: 'Controlled Rebound'}, points: 2, type: 'positive' },
      { name: {sv: 'Spela pucken (lyckat)', en: 'Successful Puck Play'}, points: 1, type: 'positive' },
      { name: {sv: 'Assist', en: 'Assist'}, points: 10, type: 'positive' },
      { name: {sv: 'Insläppt mål', en: 'Goal Against'}, points: -10, type: 'negative' },
      { name: {sv: 'Dålig retur', en: 'Bad Rebound'}, points: -3, type: 'negative' },
      { name: {sv: 'Spela pucken (misslyckat)', en: 'Failed Puck Play'}, points: -4, type: 'negative' },
      { name: {sv: 'Utvisning', en: 'Penalty'}, points: -4, type: 'negative' },
    ]
  }
};

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

interface TemplateProviderProps {
  children: ReactNode;
}

export function TemplateProvider({ children }: TemplateProviderProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Record<string, Template>>(defaultTemplates);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('defenseman');
  const [customTemplates, setCustomTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState(false);

  const currentTemplate = templates[currentTemplateId] || null;

  // Load user's custom templates
  useEffect(() => {
    const loadUserTemplates = async () => {
      if (!user) {
        setTemplates(defaultTemplates);
        setCustomTemplates({});
        return;
      }

      try {
        setLoading(true);
        const userData = await firestore.getUserData(user.uid);
        const userCustomTemplates = userData?.customTemplates || {};
        
        setCustomTemplates(userCustomTemplates);
        setTemplates({ ...defaultTemplates, ...userCustomTemplates });
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserTemplates();
  }, [user]);

  const setCurrentTemplate = (templateId: string) => {
    if (templates[templateId]) {
      setCurrentTemplateId(templateId);
    }
  };

  const saveTemplate = async (templateId: string, template: Template) => {
    if (!user) {
      throw new Error('User must be logged in to save templates');
    }

    try {
      setLoading(true);
      
      // Save to Firestore
      await firestore.saveTemplate(user.uid, templateId, template);
      
      // Update local state
      const updatedCustomTemplates = {
        ...customTemplates,
        [templateId]: template
      };
      
      setCustomTemplates(updatedCustomTemplates);
      setTemplates({ ...defaultTemplates, ...updatedCustomTemplates });
      
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user) {
      throw new Error('User must be logged in to delete templates');
    }

    // Don't allow deleting default templates
    if (defaultTemplates[templateId]) {
      throw new Error('Cannot delete default templates');
    }

    try {
      setLoading(true);
      
      await firestore.deleteTemplate(user.uid, templateId);
      
      // Update local state
      const { [templateId]: removed, ...remaining } = customTemplates;
      setCustomTemplates(remaining);
      setTemplates({ ...defaultTemplates, ...remaining });
      
      // If current template was deleted, switch to default
      if (currentTemplateId === templateId) {
        setCurrentTemplateId('defenseman');
      }
      
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addAction = (action: TemplateAction) => {
    if (!currentTemplate) return;
    
    const updatedTemplate = {
      ...currentTemplate,
      actions: [...currentTemplate.actions, action]
    };
    
    saveTemplate(currentTemplateId, updatedTemplate);
  };

  const updateAction = (actionIndex: number, updates: Partial<TemplateAction>) => {
    if (!currentTemplate) return;
    
    const updatedActions = [...currentTemplate.actions];
    updatedActions[actionIndex] = { ...updatedActions[actionIndex], ...updates };
    
    const updatedTemplate = {
      ...currentTemplate,
      actions: updatedActions
    };
    
    saveTemplate(currentTemplateId, updatedTemplate);
  };

  const deleteAction = (actionIndex: number) => {
    if (!currentTemplate) return;
    
    const updatedActions = currentTemplate.actions.filter((_, index) => index !== actionIndex);
    const updatedTemplate = {
      ...currentTemplate,
      actions: updatedActions
    };
    
    saveTemplate(currentTemplateId, updatedTemplate);
  };

  const value = {
    templates,
    currentTemplate,
    currentTemplateId,
    customTemplates,
    loading,
    setCurrentTemplate,
    saveTemplate,
    deleteTemplate,
    addAction,
    updateAction,
    deleteAction
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
}