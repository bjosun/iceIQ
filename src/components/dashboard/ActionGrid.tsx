import React from 'react';
import { Minus } from 'lucide-react';
import { useTemplates } from '../../contexts/TemplateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../ui/Card';

interface ActionGridProps {
  actionCounts: Record<string, number>;
  onCountChange: (counts: Record<string, number>) => void;
}

// Byggd för användning vid rinken: hela kortet är tryckytan (+1),
// minus-knappen i hörnet ångrar. Stora ytor, direkt feedback, ingen
// scroll mitt i registreringen.
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

  const renderTiles = (actions: typeof positiveActions, isPositive: boolean) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {actions.map((action, index) => {
        const key = JSON.stringify(action.name);
        const count = actionCounts[key] || 0;
        const actionName = action.name[language] || action.name.en;
        const activeClasses = isPositive
          ? 'border-green-500/60 bg-green-500/10'
          : 'border-red-500/60 bg-red-500/10';
        const countColor = isPositive ? 'text-green-400' : 'text-red-400';

        return (
          <div key={index} className="relative">
            <button
              onClick={() => updateCount(action.name, 1)}
              className={`w-full min-h-[96px] p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all active:scale-[0.96] touch-manipulation select-none ${
                count > 0
                  ? activeClasses
                  : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
              }`}
            >
              <p className="font-semibold text-white text-sm leading-snug pr-7">
                {actionName}
              </p>
              <div className="flex items-end justify-between">
                <span className="text-xs text-gray-400">
                  {action.points > 0 ? '+' : ''}{action.points} p
                </span>
                <span className={`text-3xl font-black leading-none ${count > 0 ? countColor : 'text-gray-600'}`}>
                  {count}
                </span>
              </div>
            </button>

            {count > 0 && (
              <button
                onClick={() => updateCount(action.name, -1)}
                aria-label={`${actionName} -1`}
                className="absolute top-2 right-2 w-8 h-8 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center text-gray-300 transition-colors touch-manipulation"
              >
                <Minus size={15} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

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
        {renderTiles(positiveActions, true)}
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
        {renderTiles(negativeActions, false)}
      </Card>
    </div>
  );
}
