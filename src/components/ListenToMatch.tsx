import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ListenClip } from '../utils/listenClips';
import { isInAppBrowser } from '../utils/inAppBrowser';

interface ListenToMatchProps {
  clips: ListenClip[];
}

// Röst: telefonens/webbläsarens egen text-till-tal. Gratis, inget lämnar
// enheten och inget ljud sparas. Rösten väljs efter språk; en bättre
// (molnbaserad) röst är ett senare steg, se docs/player-link-coach-plan.md.
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const wanted = lang === 'sv' ? 'sv' : 'en';
  const matches = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(wanted));
  if (matches.length === 0) return null;
  // Poängsätt: de bättre, nedladdade rösterna heter ofta Premium/Enhanced/Natural,
  // medan "Compact" är de enklaste och låter mest syntetiska.
  const score = (v: SpeechSynthesisVoice) => {
    let sc = 0;
    if (/premium/i.test(v.name)) sc += 4;
    if (/enhanced|natural|neural|google/i.test(v.name)) sc += 3;
    if (/compact/i.test(v.name)) sc -= 3;
    if (v.localService) sc += 1;
    return sc;
  };
  return [...matches].sort((x, y) => score(y) - score(x))[0];
}

// TikTok-takt: lite snabbare än normalt, korta meningar som spelas direkt efter varandra.
const RATE = 1.25;

export default function ListenToMatch({ clips }: ListenToMatchProps) {
  const { t, language } = useLanguage();
  const [clipIndex, setClipIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [caption, setCaption] = useState('');
  const [done, setDone] = useState(false);
  const runId = useRef(0);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    runId.current += 1;
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }, []);

  // Spelar ett klipp: en mening i taget, med texten som bildtext.
  const playClip = useCallback((index: number, auto: boolean) => {
    const clip = clips[index];
    if (!clip || !supported) return;
    stop();
    const myRun = runId.current;
    setClipIndex(index);
    setStarted(true);
    setDone(false);
    setPlaying(true);

    const voice = pickVoice(language);

    // Hela klippets meningar läggs i kö på en gång. Att vänta på "end" för
    // varje mening och först då starta nästa gav en märkbar paus emellan
    // (och en seg känsla); kön gör att de följer direkt på varandra.
    const finishClip = () => {
      if (runId.current !== myRun) return;
      setPlaying(false);
      // Nästa klipp startar av sig självt (som i en videoström).
      if (auto && index + 1 < clips.length) {
        window.setTimeout(() => { if (runId.current === myRun) playClip(index + 1, true); }, 250);
      } else if (index + 1 >= clips.length) {
        setDone(true);
      }
    };

    // Vissa webbläsare (och enheter utan svensk röst) skickar aldrig "end".
    // Då går vi vidare efter en rimlig tid i stället för att fastna.
    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallback);
      finishClip();
    };
    const totalChars = clip.sentences.reduce((n, sentence) => n + sentence.length, 0);
    const fallback = window.setTimeout(finishOnce, Math.max(2500, (totalChars * 95) / RATE + 1500));

    setCaption(clip.sentences[0]);
    clip.sentences.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language === 'sv' ? 'sv-SE' : 'en-US';
      if (voice) u.voice = voice;
      u.rate = RATE;
      u.pitch = 1;
      u.onstart = () => { if (runId.current === myRun) setCaption(text); };
      if (i === clip.sentences.length - 1) {
        u.onend = finishOnce;
        u.onerror = () => {
          window.clearTimeout(fallback);
          if (runId.current === myRun) setPlaying(false);
        };
      }
      window.speechSynthesis.speak(u);
    });
  }, [clips, language, stop, supported]);

  // Rösterna laddas asynkront i vissa webbläsare; rensa vid avmontering.
  useEffect(() => {
    if (!supported) return;
    const warm = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', warm);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', warm);
      stop();
    };
  }, [supported, stop]);

  if (clips.length === 0) return null;

  const total = clips.length;
  const nextIndex = clipIndex + 1;

  return (
    <div className="bg-gradient-to-br from-cyan-900/40 to-gray-800 border border-cyan-500/20 rounded-2xl p-5 text-center">
      <p className="text-xs uppercase tracking-widest text-cyan-300 mb-3">{t('listen.title')}</p>

      {isInAppBrowser() && (
        <p className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-3">
          {t('listen.inAppHint')}
        </p>
      )}

      {!started ? (
        <button
          onClick={() => playClip(0, true)}
          className="w-full flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-black text-xl py-5 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <Play size={28} fill="currentColor" /> {t('listen.play')}
        </button>
      ) : (
        <>
          {/* Bildtext: stor och kort, så den går att läsa om man inte kan lyssna. */}
          <div className="min-h-[120px] flex items-center justify-center px-1">
            <p className="text-2xl font-bold text-white leading-snug">{caption}</p>
          </div>

          <div className="flex justify-center gap-1.5 my-4" aria-hidden="true">
            {clips.map((c, i) => (
              <span
                key={c.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === clipIndex ? 'w-8 bg-cyan-400' : i < clipIndex ? 'w-4 bg-cyan-700' : 'w-4 bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => playClip(clipIndex, false)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-5 py-3 rounded-xl"
            >
              <RotateCcw size={18} /> {t('listen.again')}
            </button>
            {nextIndex < total && (
              <button
                onClick={() => playClip(nextIndex, true)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-5 py-3 rounded-xl"
              >
                {t('listen.next')} <SkipForward size={18} />
              </button>
            )}
          </div>

          {playing && (
            <p className="mt-3 text-xs text-gray-400 flex items-center justify-center gap-1">
              <Volume2 size={12} /> {t('listen.volumeHint')}
            </p>
          )}
          {done && !playing && <p className="mt-3 text-sm text-cyan-200">{t('listen.done')}</p>}
        </>
      )}

      {!supported && <p className="text-sm text-gray-400 mt-3">{t('listen.unsupported')}</p>}
    </div>
  );
}
