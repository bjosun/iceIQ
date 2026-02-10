import React from 'react';
import { 
  Save, 
  RotateCcw, 
  Calculator, 
  DollarSign, 
  Target, 
  TrendingUp, 
  MousePointer2, 
  Check,
  Trophy,
  Banknote
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';

interface SummarySectionProps {
  actionCounts: Record<string, number>;
  onSaveGame: () => Promise<void>;
  onReset: () => void;
  totalPoints: number;
  totalBonus: number;
  totalFinal: number;
  carriedOverBalance: number;
  onBalanceChange: (value: number) => void;
  bonusFactor: number;
  isMoneyMode: boolean;       // Ny prop för läge
  onSettleBalance: () => void; // Ny prop för att nolla saldo
}

export default function SummarySection({
  actionCounts,
  onSaveGame,
  onReset,
  totalPoints,
  totalBonus,
  totalFinal,
  carriedOverBalance,
  onBalanceChange,
  bonusFactor,
  isMoneyMode,
  onSettleBalance
}: SummarySectionProps) {
  const { t, language } = useLanguage();

  // 1. Räkna ut totalt antal registrerade klick/händelser
  const totalActionsRegistered = Object.values(actionCounts).reduce((a, b) => a + b, 0);

  // 2. Bestäm valuta och etiketter baserat på läge (Pengar eller Poäng)
  const currencySymbol = isMoneyMode 
    ? (language === 'en' ? 'USD' : 'SEK') 
    : 'Pts';

  const balanceLabel = isMoneyMode 
    ? (t('totalBalance') || 'Total Balance') 
    : (t('totalScore') || 'Total Score');

  const carriedOverLabel = isMoneyMode
    ? (t('carriedOverBalance') || 'Carried Over')
    : (t('previousScore') || 'Previous Pts');

  return (
    <Card elevated className="mb-6">
      {/* Header med Titel och Antal Aktioner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
          {isMoneyMode ? <Banknote size={24} /> : <Trophy size={24} />}
          {t('summaryAndControls') || 'Summary'}
        </h2>
        
        {/* Visar antal registrerade aktioner */}
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
              {t('basePoints') || 'Base Pts'}
            </h3>
          </div>
          <p className={`text-3xl font-bold ${
            totalPoints > 0 ? 'text-green-400' : 
            totalPoints < 0 ? 'text-red-400' : 'text-white'
          }`}>
            {totalPoints}
          </p>
        </Card>

        {/* 2. Bonus Points - Visar viktningen */}
        <Card border={false} className="text-center p-4 bg-gray-800/40">
          <div className="flex items-center justify-center mb-1">
             <Calculator size={14} className="text-cyan-400 mr-1"/>
             <h3 className="text-sm font-medium text-gray-300">
               Bonus <span className="text-cyan-400 text-xs">(x{bonusFactor})</span>
             </h3>
          </div>
          <p className="text-2xl font-bold text-cyan-400">+{totalBonus}</p>
        </Card>

        {/* 3. Överfört Saldo (Med Settle-knapp) */}
        <Card border={false} className={`text-center p-4 bg-gray-800/40 border relative group ${isMoneyMode ? 'border-yellow-500/20' : 'border-purple-500/20'}`}>
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className={isMoneyMode ? "text-yellow-500 mr-2" : "text-purple-400 mr-2"} size={20} />
            <h3 className="text-sm font-medium text-gray-300">
              {carriedOverLabel}
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className={`text-2xl font-bold mb-2 ${isMoneyMode ? 'text-yellow-500' : 'text-purple-400'}`}>
              {carriedOverBalance} <span className="text-xs font-normal opacity-70">{currencySymbol}</span>
            </div>
            
            {/* Reglera-knapp (visas bara om saldo finns) */}
            {carriedOverBalance !== 0 && (
              <button
                onClick={onSettleBalance}
                className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-green-500/20 hover:bg-green-500/40 text-green-400 px-2 py-1 rounded-full transition-all"
                title="Nollställ saldot"
              >
                <Check size={10} /> {isMoneyMode ? (t('markAsSettled') || 'Betald') : (t('resetScore') || 'Reset')}
              </button>
            )}
          </div>
        </Card>

        {/* 4. Slutsumma (Total) */}
        <Card border={false} className="text-center p-4 bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-center mb-2">
            {isMoneyMode ? (
                <DollarSign className="text-cyan-400 mr-2" size={20} />
            ) : (
                <Trophy className="text-cyan-400 mr-2" size={20} />
            )}
            <h3 className="text-sm font-medium text-gray-300">
              {balanceLabel}
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
          variant="secondary"
          onClick={onReset}
          className="flex-1 py-4 text-lg"
          icon={RotateCcw}
        >
          {t('resetAll')}
        </Button>
        <Button
          variant="primary"
          onClick={onSaveGame}
          className="flex-1 py-4 text-lg shadow-lg shadow-cyan-500/20"
          icon={Save}
        >
          {t('saveMatch')}
        </Button>
      </div>

      {/* Upgrade CTA (Optional visual fluff) */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
           {t('proTip') || 'Pro Tip'}: {t('checkHistory') || 'Check history to see trends.'}
        </p>
      </div>
    </Card>
  );
}