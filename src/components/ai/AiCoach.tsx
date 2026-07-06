import React, { useState, useRef, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase'; // OBS! Kolla så denna sökväg stämmer till din firebase-fil
import { useAuth } from '../../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase'; 
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Sparkles, Send, Lock, BrainCircuit, Loader2, RefreshCw } from 'lucide-react';

interface AiCoachProps {
  playerStats: any;
  onUpgrade: () => void;
}

interface Message {
  role: 'ai' | 'user';
  text: string;
}

export default function AiCoach({ playerStats, onUpgrade }: AiCoachProps) {
  const { user } = useAuth();
  
  const { t, language } = useLanguage();
  
  const { isPremium, isElite } = useSubscription(); 
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const credits = (user as any)?.aiCredits !== undefined ? (user as any).aiCredits : 5; 
  const [displayCredits, setDisplayCredits] = useState(credits); // <--- Skapa variabeln först!
  const isLocked = !isPremium && displayCredits <= 0; // <--- Använd den sen!

  useEffect(() => {
    if (!user) return;

    // Eftersom du använder en speciell sökväg i databasen:
    const userRef = doc(db, 'artifacts', 'default-app-id', 'users', user.uid);
    
    // onSnapshot lyssnar på ändringar i realtid!
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        // Uppdatera skärmen direkt när databasen ändras (manuellt eller av AI:n)
        if (userData.aiCredits !== undefined) {
          setDisplayCredits(userData.aiCredits);
        }
      }
    });

    // Städa upp lyssnaren när vi stänger komponenten
    return () => unsubscribe();
  }, [user]);

  // Scrolla ner automatiskt
  useEffect(() => {
    if (messages.length > 0 || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, loading]);

  const handleAskCoach = async (specificQuestion?: string) => {
    // 1. Avbryt om slut på krediter (Använd displayCredits här nu)
    if (displayCredits <= 0) return;

    setLoading(true);
    setError('');
    
    // 2. Om användaren ställde en specifik fråga, visa den i chatten direkt
    if (specificQuestion) {
      setMessages(prev => [...prev, { role: 'user', text: specificQuestion }]);
    }

    console.group("🤖 Sending to AI Coach");
    console.log("Language:", language);
    console.log("Current Session Stats:", playerStats.stats);
    console.log("History Length:", playerStats.history?.length || 0);
    console.log("History Data:", playerStats.history);
    console.log("Totals:", playerStats.totals);
    console.groupEnd();

    try {
      const askCoach = httpsCallable(functions, 'askCoach');
      
      const result: any = await askCoach({ 
        playerStats: playerStats,
        question: specificQuestion || "",
        lang: language 
      });
      
      if (result.data.success) {
        // Lägg till AI:ns svar i chatten
        setMessages(prev => [...prev, { role: 'ai', text: result.data.analysis }]);
        setInputQuestion(''); 
        
        // --- HÄR ÄR MAGIN ---
        // Vi uppdaterar UI:t med den nya siffran vi fick tillbaka från servern!
        setDisplayCredits(result.data.creditsLeft);
      }
      
    } catch (err: any) {
      console.error("❌ AI Error:", err);
      
      if (err.message.includes('permission-denied')) {
        onUpgrade(); 
      } else if (err.message.includes('resource-exhausted')) {
        setError(t('ai.outOfCredits'));
        setDisplayCredits(0); // Tvinga till 0 om servern säger stopp
      } else {
        setError(t('ai.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setError('');
    setInputQuestion('');
  };

  // --- LÅST VY (FREE PLAN) ---
  if (isLocked) {
    return (
      <div className="relative overflow-hidden bg-gray-900/50 rounded-2xl p-6 border border-gray-700 text-center mt-8 group hover:border-cyan-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-purple-900/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-gray-800 p-3 rounded-full mb-3 shadow-lg">
            <Lock className="text-cyan-400" size={24} />
          </div>
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            Ice IQ Coach <span className="text-[10px] bg-cyan-500 text-black px-1.5 py-0.5 rounded font-black">AI</span>
          </h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            {t('ai.upsellDesc')}
          </p>
          <button 
            onClick={onUpgrade}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105"
          >
            {t('ai.unlock')}
          </button>
        </div>
      </div>
    );
  }

  // --- CHATT VY (PREMIUM/ELITE) ---
  return (
    <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl relative flex flex-col min-h-[300px]">
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
            <BrainCircuit className="text-indigo-300" size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm leading-none">Ice IQ Coach</h3>
            <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">
              {t('ai.engineName')}{isElite ? ' Pro' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
          <Sparkles className="text-yellow-400" size={12} />
          <span className="text-xs font-medium text-gray-300">
            {displayCredits} {t('ai.credits')}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-grow flex flex-col gap-4">
        
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              {t('ai.readyDesc')}
            </p>
            <button
              onClick={() => handleAskCoach()}
              // LÅS KNAPPEN OM displayCredits ÄR 0
              disabled={loading || displayCredits <= 0}
              className={`relative group flex items-center justify-center gap-2 mx-auto px-8 py-3 rounded-xl font-bold text-white transition-all ${
                loading || displayCredits <= 0 
                  ? 'bg-gray-700 cursor-not-allowed opacity-70' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
              }`}
            >
              <Sparkles size={18} className="group-hover:animate-pulse" />
              <span>
                {t('ai.analyzeBtn')}
              </span>
            </button>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-black/30 border border-white/10 text-gray-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
             <div className="bg-black/30 border border-white/10 text-gray-200 rounded-2xl rounded-bl-none p-4 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-indigo-400" />
                <span className="text-xs text-gray-400 italic">
                  {t('ai.analyzing')}
                </span>
             </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 text-red-200 p-3 rounded-lg text-sm text-center border border-red-500/20">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && (
        <div className="p-4 bg-black/20 border-t border-white/5 backdrop-blur-sm">
           <div className="flex gap-2">
             <input
               type="text"
               value={inputQuestion}
               onChange={(e) => setInputQuestion(e.target.value)}
               placeholder={t('ai.followUpPlaceholder')}
               className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
               onKeyDown={(e) => e.key === 'Enter' && inputQuestion.trim() && handleAskCoach(inputQuestion)}
             />
             <button
               onClick={() => handleAskCoach(inputQuestion)}
               // LÅS ÄVEN HÄR OM displayCredits ÄR 0
               disabled={!inputQuestion.trim() || loading || displayCredits <= 0}
               className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
             >
               <Send size={18} />
             </button>
           </div>
           
           <div className="flex justify-between items-center mt-2 px-1">
             <span className="text-[10px] text-gray-500">
               {t('ai.costNote')}
             </span>
             <button 
               onClick={handleReset}
               className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
             >
               <RefreshCw size={10} /> {t('ai.resetChat')}
             </button>
           </div>
        </div>
      )}
    </div>
  );
}