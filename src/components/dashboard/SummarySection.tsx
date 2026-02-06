import React from 'react';
import { Calculator, DollarSign, TrendingUp, Target, Check, MousePointer2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface SummarySectionProps {
  actionCounts: Record<string, number>;
  onSaveGame: () => Promise<void>;
  onReset: () => void;
  totalPoints: number;
  totalBonus: number;
  totalFinal: number;
  carriedOverBalance: number;
  onBalanceChange: (value: number) => void;
}

export default function SummarySection({
  actionCounts, // Används nu för att visa antal registrerade händelser
  onSaveGame,
  onReset,
  totalPoints,
  totalBonus,
  totalFinal,
  carriedOverBalance,
  onBalanceChange
}: SummarySectionProps) {
  const { t, language } = useLanguage();
  
  const currencySymbol = language === 'en' ? 'USD' : 'SEK';

  // Räkna totalt antal registrerade klick för att använda actionCounts
  const totalActionsRegistered = Object.values(actionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Card elevated className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-cyan-400">
          {t('summaryAndControls')}
        </h2>
        
        {/* Visar antal registrerade aktioner - här används actionCounts */}
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
          <MousePointer2 size={16} className="text-cyan-400" />
          <span className="text-sm font-medium text-gray-300">
            {totalActionsRegistered} {t('actionsRegistered') || 'Actions'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        {/* 1. Aktioner (Baspoäng) */}
        <Card border={false} className="text-center p-4 bg-gray-800/40">
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

        {/* 2. Bonus Poäng */}
        <Card border={false} className="text-center p-4 bg-gray-800/40">
          <div className="flex items-center justify-center mb-2">
            <Calculator className="text-cyan-400 mr-2" size={20} />
            <h3 className="text-sm font-medium text-gray-300">
              Bonus
            </h3>
          </div>
          <p className="text-3xl font-bold text-cyan-400">
            +{totalBonus}
          </p>
        </Card>

        {/* 3. Överfört Saldo (Med Reset-knapp) */}
        <Card border={false} className="text-center p-4 bg-gray-800/40 border border-yellow-500/20 relative group">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="text-yellow-500 mr-2" size={20} />
            <h3 className="text-sm font-medium text-gray-300">
              {t('carriedOverBalance')}
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-yellow-500 mb-2">
              {carriedOverBalance} <span className="text-xs font-normal opacity-70">{currencySymbol}</span>
            </div>
            
            {/* Reglera-knapp (visas bara om saldo finns) */}
            {carriedOverBalance !== 0 && (
              <button
                onClick={() => {
                  if (window.confirm(t('settleBalanceConfirm') || 'Reset balance?')) {
                    onBalanceChange(0);
                  }
                }}
                className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-green-500/20 hover:bg-green-500/40 text-green-400 px-2 py-1 rounded-full transition-all"
              >
                <Check size={10} /> {t('markAsSettled') || 'Settle'}
              </button>
            )}
          </div>
        </Card>

        {/* 4. Slutsumma (Total) */}
        <Card border={false} className="text-center p-4 bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="text-cyan-400 mr-2" size={20} />
            <h3 className="text-sm font-medium text-gray-300">
              {t('totalBalance') || 'Total Balance'}
            </h3>
          </div>
          <p className="text-3xl font-black text-white">
            {totalFinal.toLocaleString()} <span className="text-sm font-normal text-gray-400">{currencySymbol}</span>
          </p>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="primary"
          onClick={onSaveGame}
          className="flex-1 py-4 text-lg shadow-lg shadow-cyan-500/20"
        >
          {t('saveMatchAndReset')}
        </Button>
        <Button
          variant="secondary"
          onClick={onReset}
          className="flex-1 py-4 text-lg"
        >
          {t('resetAll')}
        </Button>
      </div>

      {/* Save Limit Warning */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400 italic">
          {t('freeTierLimitPlayer')}{' '}
          <button className="text-cyan-400 hover:text-cyan-300 underline not-italic font-medium">
            {t('upgrade')}
          </button>
        </p>
      </div>
    </Card>
  );
}