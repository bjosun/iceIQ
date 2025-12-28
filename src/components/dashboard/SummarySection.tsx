import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Target } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTemplates } from '../../contexts/TemplateContext';
import Card from '../ui/Card';
import Input from '../ui/Input';

interface SummarySectionProps {
  actionCounts: Record<string, number>;
  carriedOverBonus?: number;
  onSaveGame?: () => void;
  onReset?: () => void;
}

export default function SummarySection({
  actionCounts,
  carriedOverBonus = 0,
  onSaveGame,
  onReset
}: SummarySectionProps) {
  const { t, language } = useLanguage();
  const { currentTemplate } = useTemplates();
  const [bonusFactor, setBonusFactor] = useState(10);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentBonus, setCurrentBonus] = useState(0);
  const [totalBonus, setTotalBonus] = useState(0);

  // Calculate totals when actionCounts change
  useEffect(() => {
    if (!currentTemplate) return;

    let calculatedTotal = 0;
    Object.entries(actionCounts).forEach(([key, count]) => {
      try {
        const actionName = JSON.parse(key);
        const action = currentTemplate.actions.find(a => 
          a.name.en === actionName.en || a.name.sv === actionName.sv
        );
        if (action) {
          calculatedTotal += count * action.points;
        }
      } catch {
        // Handle non-JSON keys (for backward compatibility)
        const action = currentTemplate.actions.find(a => 
          a.name.en === key || a.name.sv === key
        );
        if (action) {
          calculatedTotal += count * action.points;
        }
      }
    });

    setTotalPoints(calculatedTotal);
    const calculatedCurrentBonus = calculatedTotal * bonusFactor;
    setCurrentBonus(calculatedCurrentBonus);
    setTotalBonus(calculatedCurrentBonus + carriedOverBonus);
  }, [actionCounts, bonusFactor, carriedOverBonus, currentTemplate]);

  const currencySymbol = language === 'en' ? 'USD' : 'SEK';

  return (
    <Card elevated className="mb-6">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6">
        {t('summaryAndControls')}
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Points */}
        <Card border={false} className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <Target className="text-cyan-400 mr-2" size={20} />
            <h3 className="text-sm font-medium text-gray-300">
              {t('totalPointsMatch')}
            </h3>
          </div>
          <p className={`text-3xl font-bold ${
            totalPoints > 0 ? 'text-green-400' : 
            totalPoints < 0 ? 'text-red-400' : 'text-white'
          }`}>
            {totalPoints}
          </p>
        </Card>

        {/* Bonus Factor */}
        <Card border={false} className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <Calculator className="text-cyan-400 mr-2" size={20} />
            <h3 className="text-sm font-medium text-gray-300">
              {t('bonusFactor')}
            </h3>
          </div>
          <div className="flex items-center justify-center">
            <Input
              type="number"
              value={bonusFactor}
              onChange={(e) => setBonusFactor(Number(e.target.value))}
              className="w-20 text-center text-2xl font-bold"
              min="0"
              step="1"
            />
            <span className="ml-2 text-gray-400">/pt</span>
          </div>
        </Card>

        {/* Carried Over Balance */}
        <Card border={false} className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="text-cyan-400 mr-2" size={20} />
            <h3 className="text-sm font-medium text-gray-300">
              {t('carriedOverBalance')}
            </h3>
          </div>
          <p className={`text-2xl font-bold ${
            carriedOverBonus >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {carriedOverBonus.toLocaleString()} {currencySymbol}
          </p>
        </Card>

        {/* Total Bonus */}
        <Card border={false} className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="text-yellow-400 mr-2" size={20} />
            <h3 className="text-sm font-medium text-gray-300">
              {t('totalBonus')}
            </h3>
          </div>
          <p className={`text-3xl font-bold ${
            totalBonus >= 0 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {totalBonus.toLocaleString()} {currencySymbol}
          </p>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onSaveGame}
          className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:opacity-90 text-white rounded-xl font-semibold transition-all"
        >
          {t('saveMatchAndReset')}
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
        >
          {t('resetAll')}
        </button>
      </div>

      {/* Save Limit Warning */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400">
          {t('freeTierLimitPlayer')}{' '}
          <button className="text-cyan-400 hover:text-cyan-300 underline">
            {t('upgrade')}
          </button>
        </p>
      </div>
    </Card>
  );
}