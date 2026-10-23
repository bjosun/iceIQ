import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface TemplateAction {
  name: { sv: string; en: string };
  points: number;
  type: 'positive' | 'negative';
  isBonus?: boolean;
}

// Hur knapparna läggs ut på telefonen (se utils/gridLayout.ts). Namnen är de
// ENGELSKA aktionsnamnen. `positive` är de fasta platserna, resten av tolv
// är "dagens fokus" (förvalen i `focus`). Utan layout visas hela listan.
export interface TemplateLayout {
  positive: string[];
  negative: string[];
  focus: string[];
  focusSlots?: number;
}

export interface Template {
  id: string;
  name: { sv: string; en: string };
  actions: TemplateAction[];
  isDefault?: boolean;
  layout?: TemplateLayout;
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
  updateAction: (actionIndex: number, updates: Partial<TemplateAction>) => void;
  deleteAction: (actionIndex: number) => void;
}

const pos = (sv: string, en: string, points: number, isBonus?: boolean): TemplateAction =>
  ({ name: { sv, en }, points, type: 'positive', ...(isBonus ? { isBonus } : {}) });
const neg = (sv: string, en: string, points: number): TemplateAction =>
  ({ name: { sv, en }, points, type: 'negative' });

// Gemensam bas för alla utespelare (back, forward, center). Rollerna lägger
// sedan till det lilla extra som just den rollen ska få poäng för. De
// engelska namnen är nyckeln i sparade matcher, utmärkelser och coachen, så
// byt aldrig namn på en befintlig aktion, lägg bara till nya.
// Skott på mål ger olika poäng per roll (back 2, övriga 3), därför en parameter.
const skaterBase = (shotPoints: number): TemplateAction[] => [
  pos('Kontrollerat zoninträde', 'Controlled Zone Entry', 2),
  pos('Lyckad passning', 'Successful Pass', 1),
  pos('Tackling', 'Tackle', 2),
  pos('Vunnen sargduell', 'Wins Board Battle', 3),
  pos('Poke check (Puckvinst)', 'Poke Check', 2),
  pos('Blockerat skott', 'Blocked Shot', 3),
  pos('Skott på mål', 'Shot on Goal', shotPoints),
  pos('Mål', 'Goal', 10),
  pos('Assist', 'Assist', 5),
  pos('På isen vid mål (FRAMÅT)', 'On Ice For Goal (FOR)', 3),
  neg('Misslyckad passning', 'Failed Pass', -1),
  neg('Missat skott', 'Missed Shot', -1),
  neg('Mitt skott blockerades', 'Shot Blocked (Own)', -1),
  neg('Pucktapp (turnover)', 'Turnover', -3),
  neg('Utvisning', 'Penalty', -4),
  neg('På isen vid mål (BAKÅT)', 'On Ice For Goal (AGAINST)', -3),
];

// Backens extra: hålla ihop försvaret och lösa press.
const defensemanExtras: TemplateAction[] = [
  pos('Avvärjer anfall (Bra gap)', 'Denies Entry (Gap Control)', 3),
  pos('Löser stressad situation', 'Solves Pressured Situation', 5),
  pos('Kontrollerad defensiv rensning', 'Controlled Defensive Clear', 3),
  pos('Höll blålinjen', 'Kept Zone', 2),
  neg('Panikrensning / Slänger bort pucken', 'Panic Turnover / Throwaway', -2),
];

// Forwardens extra: skapa chanser och jobba framåt, men också hjälpa till
// bakåt (täcka fickan, backen vid blå linje, backen i hörnet).
const forwardExtras: TemplateAction[] = [
  pos('Vunnen tekning', 'Faceoff Win', 2),
  pos('Lyckad dribbling', 'Successful Deke', 2),
  pos('Skapad målchans', 'Scoring Chance Created', 4),
  pos('Forechecking med puckvinst', 'Forecheck Puck Recovery', 4),
  pos('Backcheck med puckvinst', 'Backcheck Puck Recovery', 3),
  pos('Täcker fickan', 'Low Slot Coverage', 2),
  pos('Täcker backen vid blå', 'Covers the Point', 2),
  pos('Hjälper backen i hörnet', 'Supports Defenseman Down Low', 2),
  neg('Förlorad tekning', 'Faceoff Loss', -1),
  neg('Pucktapp (offensiv zon)', 'Offensive Zone Turnover', -4),
  neg('Offside', 'Offside', -1),
  neg('Tappar sin täckning', 'Loses Defensive Coverage', -2),
];

// Centern ärver forwardens aktioner och får tekningar per zon samt jobb i
// egen och offensiv zon.
const centerExtras: TemplateAction[] = [
  pos('Vunnen tekning i egen zon', 'Faceoff Win (Defensive Zone)', 3),
  pos('Vunnen tekning i offensiv zon', 'Faceoff Win (Offensive Zone)', 3),
  pos('Täcker högt som tredje man', 'Third Man High Coverage', 2),
  pos('Ger utspelsstöd', 'Breakout Support', 2),
  pos('Står framför mål', 'Net-Front Presence', 3),
  pos('Skyddar pucken (kring)', 'Puck Protection (Cycle)', 2),
  neg('Förlorad tekning i egen zon', 'Faceoff Loss (Defensive Zone)', -2),
];

export const defaultTemplates: Record<string, Template> = {
  defenseman: {
    id: 'defenseman',
    name: { sv: 'Back', en: 'Defenseman' },
    actions: [...skaterBase(2), ...defensemanExtras],
    layout: {
      positive: [
        'Goal', 'Assist', 'Shot on Goal', 'Successful Pass', 'Controlled Zone Entry', 'Denies Entry (Gap Control)',
        'Solves Pressured Situation', 'Controlled Defensive Clear', 'Blocked Shot', 'Wins Board Battle', 'Tackle',
      ],
      negative: ['Turnover', 'Failed Pass', 'Missed Shot', 'Panic Turnover / Throwaway', 'Penalty', 'On Ice For Goal (AGAINST)'],
      focus: ['Kept Zone'],
    },
  },
  forward: {
    id: 'forward',
    name: { sv: 'Forward', en: 'Forward' },
    actions: [...skaterBase(3), ...forwardExtras],
    layout: {
      positive: [
        'Goal', 'Assist', 'Shot on Goal', 'Scoring Chance Created', 'Successful Pass', 'Controlled Zone Entry',
        'Forecheck Puck Recovery', 'Backcheck Puck Recovery', 'Wins Board Battle', 'Tackle', 'Low Slot Coverage',
      ],
      negative: ['Turnover', 'Failed Pass', 'Missed Shot', 'Penalty', 'On Ice For Goal (AGAINST)', 'Loses Defensive Coverage'],
      focus: ['Covers the Point'],
    },
  },
  center: {
    id: 'center',
    name: { sv: 'Center', en: 'Center' },
    actions: [...skaterBase(3), ...forwardExtras, ...centerExtras],
    layout: {
      positive: [
        'Goal', 'Assist', 'Shot on Goal', 'Scoring Chance Created', 'Faceoff Win', 'Successful Pass',
        'Controlled Zone Entry', 'Forecheck Puck Recovery', 'Backcheck Puck Recovery', 'Wins Board Battle', 'Low Slot Coverage',
      ],
      negative: ['Turnover', 'Failed Pass', 'Faceoff Loss', 'Penalty', 'On Ice For Goal (AGAINST)', 'Loses Defensive Coverage'],
      focus: ['Net-Front Presence'],
    },
  },
  goalie: {
    id: 'goalie',
    name: { sv: 'Målvakt', en: 'Goalie' },
    actions: [
      pos('Räddning', 'Save', 2),
      pos('Svår räddning', 'Difficult Save', 4),
      pos('Hållen nolla (period)', 'Shutout (Period)', 5),
      pos('Kontrollerad retur', 'Controlled Rebound', 2),
      pos('Spela pucken (lyckat)', 'Successful Puck Play', 1),
      pos('Assist', 'Assist', 10),
      neg('Insläppt mål', 'Goal Against', -10),
      neg('Dålig retur', 'Bad Rebound', -3),
      neg('Spela pucken (misslyckat)', 'Failed Puck Play', -4),
      neg('Utvisning', 'Penalty', -4),
    ],
    // Målvakten ryms på ett varv: inga fokusplatser och inget "Mer…".
    layout: {
      positive: ['Save', 'Difficult Save', 'Controlled Rebound', 'Successful Puck Play', 'Shutout (Period)', 'Assist'],
      negative: ['Goal Against', 'Bad Rebound', 'Failed Puck Play', 'Penalty'],
      focus: [],
      focusSlots: 0,
    },
  },
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
        // Dynamisk import: se motsvarande kommentar i AuthContext.
        const { firestore } = await import('../services/firestore');
        const userData = await firestore.getUserDataCached(user.uid);
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
      const { firestore } = await import('../services/firestore');
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

      const { firestore } = await import('../services/firestore');
      await firestore.deleteTemplate(user.uid, templateId);
      
      // Update local state
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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