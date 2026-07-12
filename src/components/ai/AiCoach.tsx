import React, { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAiCredits } from '../../hooks/useAiCredits';
import { useCoachChats, CoachChat, CoachChatMessage } from '../../hooks/useCoachChats';
import { Sparkles, Send, Lock, BrainCircuit, Loader2, Crown, History, Plus, Trash2 } from 'lucide-react';

interface AiCoachProps {
  playerStats: any;
  onUpgrade: () => void;
}

// Hur länge varje laddningssteg visas innan nästa tar över (ms).
// Anropet är ett enda blockerande httpsCallable, så stegen är en
// klient-side-uppskattning — inte faktisk progress från servern.
const LOADING_STEP_MS = 2500;

// Pekar ut vilken sparad chatt som är "aktiv" så att en omladdning
// återställer rätt konversation — och så att "Ny chatt" inte
// återuppstår vid nästa besök.
const ACTIVE_CHAT_KEY = 'iceiq-active-coach-chat';

export default function AiCoach({ playerStats, onUpgrade }: AiCoachProps) {
  const { t, language } = useLanguage();
  const { isPremium, isElite } = useSubscription();
  const { credits: displayCredits, setCredits: setDisplayCredits } = useAiCredits();
  const { listChats, saveChat, deleteChat } = useCoachChats();

  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<CoachChat[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [showUpgradeCta, setShowUpgradeCta] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLocked = !isPremium && displayCredits <= 0;
  const playerName: string = playerStats?.player || '';

  const quickQuestions = [t('ai.quick1'), t('ai.quick2'), t('ai.quick3')];
  const loadingSteps = [t('ai.loading1'), t('ai.loading2'), t('ai.loading3')];

  // Återställ den aktiva chatten vid mount / spelarbyte
  useEffect(() => {
    let cancelled = false;

    setMessages([]);
    setChatId(null);
    setError('');
    setShowUpgradeCta(false);

    listChats()
      .then((all) => {
        if (cancelled) return;
        setChats(all);
        const activeId = localStorage.getItem(ACTIVE_CHAT_KEY);
        const active = all.find(
          (c) => c.id === activeId && c.playerName === playerName && c.messages.length > 0
        );
        if (active) {
          setMessages(active.messages);
          setChatId(active.id);
        }
      })
      .catch((err) => console.error('Could not load coach chats:', err));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName]);

  // Stega laddningstexten framåt medan vi väntar på svaret
  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, loadingSteps.length - 1));
    }, LOADING_STEP_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Scrolla ner automatiskt
  useEffect(() => {
    if (messages.length > 0 || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, loading]);

  const persistChat = async (finalMessages: CoachChatMessage[]) => {
    try {
      const id = await saveChat(chatId, playerName, finalMessages);
      if (!chatId) setChatId(id);
      localStorage.setItem(ACTIVE_CHAT_KEY, id);
    } catch (err) {
      // Sparfel ska inte störa själva chatten
      console.error('Could not save coach chat:', err);
    }
  };

  const handleAskCoach = async (specificQuestion?: string) => {
    if (displayCredits <= 0) return;

    setLoading(true);
    setError('');
    setShowUpgradeCta(false);

    const baseMessages: CoachChatMessage[] = specificQuestion
      ? [...messages, { role: 'user', text: specificQuestion }]
      : messages;
    if (specificQuestion) setMessages(baseMessages);

    try {
      const askCoach = httpsCallable(functions, 'askCoach');

      const result: any = await askCoach({
        playerStats: playerStats,
        question: specificQuestion || "",
        // Tidigare turer så coachen minns sina egna svar vid följdfrågor
        history: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
        lang: language
      });

      if (result.data.success) {
        const finalMessages: CoachChatMessage[] = [
          ...baseMessages,
          { role: 'ai', text: result.data.analysis },
        ];
        setMessages(finalMessages);
        setInputQuestion('');

        // Uppdatera UI:t direkt med siffran från servern (snapshotten
        // i useAiCredits hinner ikapp strax efter)
        setDisplayCredits(result.data.creditsLeft);

        await persistChat(finalMessages);
      }

    } catch (err: any) {
      console.error("AI Error:", err);

      if (err.message.includes('permission-denied')) {
        onUpgrade();
      } else if (err.message.includes('resource-exhausted')) {
        setError(t('ai.outOfCredits'));
        setShowUpgradeCta(true);
        setDisplayCredits(0); // Tvinga till 0 om servern säger stopp
      } else {
        setError(t('ai.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Startar en ny chatt — den gamla finns kvar i historiken
  const handleNewChat = () => {
    setMessages([]);
    setChatId(null);
    setError('');
    setShowUpgradeCta(false);
    setInputQuestion('');
    localStorage.removeItem(ACTIVE_CHAT_KEY);
  };

  const handleOpenHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next) {
      try {
        setChats(await listChats());
      } catch (err) {
        console.error('Could not load coach chats:', err);
      }
    }
  };

  const handleLoadChat = (chat: CoachChat) => {
    setMessages(chat.messages);
    setChatId(chat.id);
    setError('');
    setShowUpgradeCta(false);
    setShowHistory(false);
    localStorage.setItem(ACTIVE_CHAT_KEY, chat.id);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chat: CoachChat) => {
    e.stopPropagation();
    try {
      await deleteChat(chat.id);
      setChats(prev => prev.filter(c => c.id !== chat.id));
      if (chat.id === chatId) {
        // Den öppna chatten togs bort — fortsatt konversation blir en ny chatt
        setChatId(null);
        localStorage.removeItem(ACTIVE_CHAT_KEY);
      }
    } catch (err) {
      console.error('Could not delete coach chat:', err);
    }
  };

  const formatChatDate = (chat: CoachChat) => {
    const date = chat.updatedAt?.toDate?.();
    if (!date) return '';
    return date.toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const chatSnippet = (chat: CoachChat) => {
    const firstUser = chat.messages.find(m => m.role === 'user');
    const text = (firstUser || chat.messages[0])?.text || '';
    return text.length > 60 ? text.slice(0, 60) + '…' : text;
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenHistory}
            title={t('ai.history')}
            className={`p-2 rounded-full border transition-colors ${
              showHistory
                ? 'border-indigo-400 text-indigo-200 bg-indigo-500/20'
                : 'border-white/5 text-gray-400 hover:text-white bg-black/40'
            }`}
          >
            <History size={14} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
            <Sparkles className="text-yellow-400" size={12} />
            <span className="text-xs font-medium text-gray-300">
              {displayCredits} {t('ai.credits')}
            </span>
          </div>
        </div>
      </div>

      {/* Historikpanel */}
      {showHistory && (
        <div className="border-b border-white/5 bg-black/30 max-h-64 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-6">{t('ai.historyEmpty')}</p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleLoadChat(chat)}
                className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer border-b border-white/5 last:border-0 transition-colors ${
                  chat.id === chatId ? 'bg-indigo-500/15' : 'hover:bg-white/5'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">
                    {chat.playerName} <span className="text-gray-500 font-normal">• {formatChatDate(chat)}</span>
                  </p>
                  <p className="text-gray-400 text-xs truncate">{chatSnippet(chat)}</p>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat)}
                  title={t('ai.deleteChat')}
                  className="shrink-0 p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="p-6 flex-grow flex flex-col gap-4">

        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              {t('ai.readyDesc')}
            </p>

            {/* Snabbfrågor som chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-lg mx-auto">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleAskCoach(question)}
                  disabled={loading || displayCredits <= 0}
                  className="px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-200 text-xs font-medium hover:bg-indigo-500/25 hover:border-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {question}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleAskCoach()}
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
                  {loadingSteps[loadingStep]}
                </span>
             </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 text-red-200 p-4 rounded-lg text-sm text-center border border-red-500/20">
            <p className="mb-0">{error}</p>
            {showUpgradeCta && (
              <button
                onClick={onUpgrade}
                className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-sm py-2 px-5 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/20"
              >
                <Crown size={16} />
                {t('ai.upgradeCta')}
              </button>
            )}
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
               onClick={handleNewChat}
               className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
             >
               <Plus size={10} /> {t('ai.newChat')}
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
