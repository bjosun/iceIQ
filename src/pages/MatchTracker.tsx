import React, { useState, useEffect } from 'react';
// OBS: Kontrollera var ActionGrid ligger. Jag gissar på components baserat på tidigare,
// men ändra om den ligger någon annanstans.
import ActionGrid from '../components/dashboard/ActionGrid'; 

// HÄR är ändringen för din SummarySection:
import SummarySection from '../components/dashboard/SummarySection';

import { useLanguage } from '../contexts/LanguageContext';

export default function MatchTracker() {
  useLanguage();

  // TypeScript-syntaxen nedan kräver att filen heter .tsx
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  
  const [carriedOverBonus, setCarriedOverBonus] = useState(0);

  useEffect(() => {
    setCarriedOverBonus(500); 
  }, []);

  const handleSaveGame = async () => {
    console.log("Saving game data:", actionCounts);
    // Din spara-logik här
    alert("Match saved!"); 
    setActionCounts({});
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset current match data?")) {
      setActionCounts({});
    }
  };
  

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Match Tracker</h1>
      </div>

      <SummarySection 
        actionCounts={actionCounts}
        carriedOverBonus={carriedOverBonus}
        onSaveGame={handleSaveGame}
        onReset={handleReset}
      />

      <ActionGrid 
        actionCounts={actionCounts}
        onCountChange={setActionCounts}
      />
      
    </div>
  );
}