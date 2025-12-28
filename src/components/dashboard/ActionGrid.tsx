import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useTemplates } from '../../contexts/TemplateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../ui/Card';

interface ActionGridProps {
  actionCounts: Record<string, number>;
  onCountChange: (counts: Record<string, number>) => void;
}

export default function ActionGrid({ actionCounts, onCountChange }: ActionGridProps) {
  const { currentTemplate } = useTemplates();
  const { t, language } = useLanguage();

  if (!currentTemplate) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400">Loading template...</p>
          </div>
        </Card>
      </div>
    );
  }

  const positiveActions = currentTemplate.actions.filter(a => a.type === 'positive');
  const negativeActions = currentTemplate.actions.filter(a => a.type === 'negative');

  const updateCount = (actionName: { sv: string; en: string }, change: number) => {
    const key = JSON.stringify(actionName);
    const current = actionCounts[key] || 0;
    const newCount = Math.max(0, current + change);
    
    const newCounts = { ...actionCounts };
    if (newCount === 0) {
      delete newCounts[key];
    } else {
      newCounts[key] = newCount;
    }
    
    onCountChange(newCounts);
  };

  const calculatePoints = (actions: typeof positiveActions) => {
    return actions.reduce((total, action) => {
      const key = JSON.stringify(action.name);
      const count = actionCounts[key] || 0;
      return total + (count * action.points);
    }, 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Positive Actions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-green-400">
            {t('positiveActions')}
          </h2>
          <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
            +{calculatePoints(positiveActions)} pts
          </span>
        </div>
        
        <div className="space-y-3">
          {positiveActions.map((action, index) => {
            const key = JSON.stringify(action.name);
            const count = actionCounts[key] || 0;
            const actionName = action.name[language] || action.name.en;
            
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">{actionName}</p>
                  <p className="text-sm text-gray-400">
                    {action.points > 0 ? '+' : ''}{action.points} points
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCount(action.name, -1)}
                    className="w-10 h-10 bg-gray-600 hover:bg-red-500 rounded-full flex items-center justify-center font-bold text-lg transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  
                  <span className="font-bold text-2xl min-w-[3rem] text-center">
                    {count}
                  </span>
                  
                  <button
                    onClick={() => updateCount(action.name, 1)}
                    className="w-10 h-10 bg-gray-600 hover:bg-green-500 rounded-full flex items-center justify-center font-bold text-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Negative Actions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-red-400">
            {t('negativeActions')}
          </h2>
          <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-sm">
            {calculatePoints(negativeActions)} pts
          </span>
        </div>
        
        <div className="space-y-3">
          {negativeActions.map((action, index) => {
            const key = JSON.stringify(action.name);
            const count = actionCounts[key] || 0;
            const actionName = action.name[language] || action.name.en;
            
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">{actionName}</p>
                  <p className="text-sm text-gray-400">
                    {action.points} points
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCount(action.name, -1)}
                    className="w-10 h-10 bg-gray-600 hover:bg-red-500 rounded-full flex items-center justify-center font-bold text-lg transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  
                  <span className="font-bold text-2xl min-w-[3rem] text-center">
                    {count}
                  </span>
                  
                  <button
                    onClick={() => updateCount(action.name, 1)}
                    className="w-10 h-10 bg-gray-600 hover:bg-green-500 rounded-full flex items-center justify-center font-bold text-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}