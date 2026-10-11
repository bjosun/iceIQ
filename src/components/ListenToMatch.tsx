import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ListenClip } from '../utils/listenClips';

interface ListenToMatchProps {
  clips: ListenClip[];
}

// Röst: telefonens/webbläsarens egen text-till-tal. Gratis, inget lämnar
// enheten och inget ljud sparas. Rösten väljs efter språk; en bättre
// (molnbaserad) röst är ett senare steg, se docs/player-link-coach-plan.md.
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const wanted = lang === 'sv' ? 'sv' : 'en';
  const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(wanted));
  // Föredra de bättre rösterna (de heter ofta "Enhanced"/"Premium"/"Natural").
  return (
    matches.find((v) => /enhanced|premium|natural/i.test(v.name)) ||
    matches.find((v) => v.localService) ||
    matches[0] ||
    null
  );
}

// TikTok-takt: lite snabbare än normalt, korta meningar som spelas direkt efter varandra.
const RATE = 1.12;

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
    const speakSentence = (i: number) => {
      if (runId.current !== myRun) return;
      if (i >= clip.sentences.length) {
        setPlaying(false);
        // Nästa klipp startar av sig självt (som i en videoström).
        if (auto && index + 1 < clips.length) {
          window.setTimeout(() => { if (runId.current === myRun) playClip(index + 1, true); }, 350);
        } else if (index + 1 >= clips.length) {
          setDone(true);
        }
        return;
      }
      const text = clip.sentences[i];
      setCaption(text);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language === 'sv' ? 'sv-SE' : 'en-US';
      if (voice) u.voice = voice;
      u.rate = RATE;
      u.pitch = 1.05;
      // Vissa webbläsare (och enheter utan svensk röst) skickar aldrig "end".
      // Då går vi vidare efter en rimlig tid i stället för att fastna.
      let advanced = false;
      const advance = () => {
        if (advanced) return;
        advanced = true;
        window.clearTimeout(fallback);
        speakSentence(i + 1);
      };
      const fallback = window.setTimeout(advance, Math.max(1800, text.length * 110));
      u.onend = advance;
      u.onerror = () => {
        window.clearTimeout(fallback);
        if (runId.current === myRun) setPlaying(false);
      };
      window.speechSynthesis.speak(u);
    };
    speakSentence(0);
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
