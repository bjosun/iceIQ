import React from 'react';
import { History, Crown, Save } from 'lucide-react'; // Eller vilka ikoner du använder

// 1. HÄR ÄR FIXEN: Vi definierar att komponenten ska ta emot dessa tre funktioner
interface MobileBottomNavProps {
  onHistoryClick: () => void;
  onPremiumClick: () => void;
  onRecordGame: () => void;
}

export default function MobileBottomNav({ 
  onHistoryClick, 
  onPremiumClick, 
  onRecordGame 
}: MobileBottomNavProps) {
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 md:hidden z-50">
      <div className="flex justify-around items-center">
        
        {/* History Button */}
        <button 
          onClick={onHistoryClick}
          className="flex flex-col items-center text-gray-400 hover:text-cyan-400"
        >
          <History size={24} />
          <span className="text-xs mt-1">History</span>
        </button>

        {/* Record Game Button (Big Center Button) */}
        <button 
          onClick={onRecordGame}
          className="flex flex-col items-center justify-center w-14 h-14 bg-cyan-600 rounded-full -mt-8 shadow-lg hover:bg-cyan-500 text-white border-4 border-gray-900"
        >
          <Save size={24} />
        </button>

        {/* Premium Button */}
        <button 
          onClick={onPremiumClick}
          className="flex flex-col items-center text-gray-400 hover:text-yellow-400"
        >
          <Crown size={24} />
          <span className="text-xs mt-1">Premium</span>
        </button>
        
      </div>
    </div>
  );
}