import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import { useMemo } from 'react';
import { translateFor } from '../utils/translate';
import type { Language } from '../utils/translations';
import { ListenClip } from '../utils/listenClips';
import { isInAppBrowser } from '../utils/inAppBrowser';
import { fetchClipAudio, VoiceGender } from '../utils/cloudVoice';
import { logListen } from '../utils/listenStats';

const VOICE_KEY = 'iceiq-listen-voice';

// En tyst, giltig WAV. iOS släpper bara igenom uppspelning som startar i ett
// tryck, och molnljudet hämtas först efter trycket. Därför "låser" vi upp ett
// ljudelement med den här i trycket och återanvänder det för riktiga klipp.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

interface ListenToMatchProps {
  clips: ListenClip[];
  /** Spelarlänkens token. Med den används molnrösten; utan den telefonens röst. */
  token?: string;
  /** Språket för kortets texter OCH rösten (coachens språk), inte besökarens. */
  lang: Language;
  /** Liten notering under kortet (t.ex. att coachens text är på ett annat språk). */
  note?: string;
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

// Reservrösten (telefonens): nära normal takt; molnrösten styrs av SPEAKING_RATE i functions/listenAudio.js.
const RATE = 1.15;

export default function ListenToMatch({ clips, token, lang, note }: ListenToMatchProps) {
  const language = lang;
  const t = useMemo(() => translateFor(lang), [lang]);
  const [clipIndex, setClipIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [caption, setCaption] = useState('');
  const [done, setDone] = useState(false);
  const runId = useRef(0);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  // Hämtat molnljud per klipp. null = hämtningen misslyckades (använd telefonens röst).
  const cloudAudio = useRef<Map<string, string[] | null>>(new Map());
  const cloudDown = useRef(false);
  // Röstens kön (kvinna/man). Sparas på enheten och gäller bara molnrösten.
  const [gender, setGender] = useState<VoiceGender>(() => {
    try { return localStorage.getItem(VOICE_KEY) === 'm' ? 'm' : 'f'; } catch { return 'f'; }
  });
  // Visar vilken röst som användes (och varför molnet föll bort) — en
  // testhjälp medan rösten trimmas in.
  const [voiceInfo, setVoiceInfo] = useState('');

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    runId.current += 1;
    window.speechSynthesis?.cancel();
    audioEl.current?.pause();
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

    // Molnrösten: hämta (eller använd redan hämtat) ljud för klippet och spela
    // meningarna i följd. Misslyckas något går vi till telefonens röst.
    const cacheKey = (id: string) => `${gender}:${id}`;
    const prefetch = (i: number) => {
      const c = clips[i];
      if (!c || !token || cloudDown.current || cloudAudio.current.has(cacheKey(c.id))) return;
      cloudAudio.current.set(cacheKey(c.id), null);
      fetchClipAudio(token, language, c.sentences, gender).then((res) => {
        if (res.urls) cloudAudio.current.set(cacheKey(c.id), res.urls);
        else {
          cloudDown.current = true;
          setVoiceInfo(`telefonens röst (molnet: ${res.error})`);
        }
      });
    };

    const playCloud = async (): Promise<boolean> => {
      if (!token || cloudDown.current || !audioEl.current) return false;
      let urls = cloudAudio.current.get(cacheKey(clip.id)) ?? null;
      if (!urls) {
        setCaption(clip.sentences[0]);
        const res = await fetchClipAudio(token, language, clip.sentences, gender);
        if (runId.current !== myRun) return true; // avbrutet under tiden
        if (!res.urls) {
          cloudDown.current = true;
          setVoiceInfo(`telefonens röst (molnet: ${res.error})`);
          logListen(token, 'cloud_fallback');
          return false;
        }
        cloudAudio.current.set(cacheKey(clip.id), res.urls);
        urls = res.urls;
      }
      setVoiceInfo(gender === 'm' ? 'Google, man' : 'Google, kvinna');
      logListen(token, 'cloud_ok');
      prefetch(index + 1);
      const el = audioEl.current;

      // Ett enda ljud för hela klippet: meningarna visas i takt med ljudet, och
      // ljudets längd fördelas efter meningarnas längd (plus lite för pausen).
      if (urls.length === 1 && clip.sentences.length > 1) {
        const weights = clip.sentences.map((x) => x.length + 6);
        const total = weights.reduce((a, b) => a + b, 0);
        let shown = -1;
        const applyRate = (i: number) => {
          // Lite långsammare på det som ska stå ut, lite snabbare på inledningar.
          try {
            (el as any).preservesPitch = true;
            (el as any).webkitPreservesPitch = true;
            el.playbackRate = clip.rates?.[i] ?? 1;
          } catch { /* enheten tillåter inte taktändring: spelas i normal takt */ }
        };
        const showFor = (fraction: number) => {
          let acc = 0;
          for (let i = 0; i < weights.length; i++) {
            acc += weights[i] / total;
            if (fraction <= acc + 0.0001) {
              if (i !== shown) { shown = i; setCaption(clip.sentences[i]); applyRate(i); }
              return;
            }
          }
        };
        setCaption(clip.sentences[0]);
        el.src = urls[0];
        applyRate(0);
        el.ontimeupdate = () => {
          if (runId.current !== myRun || !el.duration) return;
          showFor(el.currentTime / el.duration);
        };
        el.onended = () => { el.ontimeupdate = null; finishClipCloud(); };
        el.onerror = () => { el.ontimeupdate = null; finishClipCloud(); };
        el.play().catch(() => finishClipCloud());
        return true;
      }

      const playSentence = (i: number) => {
        if (runId.current !== myRun) return;
        if (i >= urls!.length) {
          finishClipCloud();
          return;
        }
        setCaption(clip.sentences[i]);
        el.src = urls![i];
        try { el.playbackRate = clip.rates?.[i] ?? 1; } catch { /* normal takt */ }
        el.onended = () => playSentence(i + 1);
        el.onerror = () => finishClipCloud();
        el.play().catch(() => finishClipCloud());
      };
      const finishClipCloud = () => {
        if (runId.current !== myRun) return;
        setPlaying(false);
        logListen(token, `clip_${Math.min(index + 1, 3)}_done` as 'clip_1_done');
        if (index + 1 >= clips.length) logListen(token, 'finished');
        if (auto && index + 1 < clips.length) {
          window.setTimeout(() => { if (runId.current === myRun) playClip(index + 1, true); }, 200);
        } else if (index + 1 >= clips.length) {
          setDone(true);
        }
      };
      playSentence(0);
      return true;
    };

    const playDevice = () => {
    const voice = pickVoice(language);

    // Hela klippets meningar läggs i kö på en gång. Att vänta på "end" för
    // varje mening och först då starta nästa gav en märkbar paus emellan
    // (och en seg känsla); kön gör att de följer direkt på varandra.
    const finishClip = () => {
      if (runId.current !== myRun) return;
      setPlaying(false);
      logListen(token, `clip_${Math.min(index + 1, 3)}_done` as 'clip_1_done');
      if (index + 1 >= clips.length) logListen(token, 'finished');
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
      u.rate = RATE * (clip.rates?.[i] ?? 1);
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
    };

    // Molnet först, annars telefonens röst.
    playCloud().then((usedCloud) => {
      if (!usedCloud && runId.current === myRun) playDevice();
    });
  }, [clips, language, stop, supported, token, gender]);

  // En räkning när kortet visas (för att kunna se hur många som trycker spela).
  const openLogged = useRef(false);
  useEffect(() => {
    if (clips.length > 0 && !openLogged.current) {
      openLogged.current = true;
      logListen(token, 'open');
    }
  }, [clips.length, token]);

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
          onClick={() => {
            // Skapa och "lås upp" ljudelementet i själva trycket (se SILENT_WAV).
            if (!audioEl.current) audioEl.current = new Audio();
            audioEl.current.src = SILENT_WAV;
            audioEl.current.play().catch(() => {});
            logListen(token, 'play');
            logListen(token, language === 'sv' ? 'lang_sv' : 'lang_en');
            logListen(token, gender === 'm' ? 'voice_m' : 'voice_f');
            playClip(0, true);
          }}
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
              onClick={() => { logListen(token, 'again'); playClip(clipIndex, false); }}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-5 py-3 rounded-xl"
            >
              <RotateCcw size={18} /> {t('listen.again')}
            </button>
            {nextIndex < total && (
              <button
                onClick={() => { logListen(token, 'next'); playClip(nextIndex, true); }}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-5 py-3 rounded-xl"
              >
                {t('listen.next')} <SkipForward size={18} />
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>{t('listen.voice')}</span>
            {(['f', 'm'] as VoiceGender[]).map((g) => (
              <button
                key={g}
                onClick={() => {
                  if (g === gender) return;
                  stop();
                  try { localStorage.setItem(VOICE_KEY, g); } catch { /* lagring blockerad */ }
                  cloudAudio.current.clear();
                  cloudDown.current = false;
                  setGender(g);
                }}
                className={`px-3 py-1 rounded-full border ${
                  g === gender ? 'border-cyan-400 text-cyan-200' : 'border-gray-600 text-gray-400'
                }`}
              >
                {t(g === 'f' ? 'listen.voiceFemale' : 'listen.voiceMale')}
              </button>
            ))}
          </div>
          {voiceInfo && <p className="mt-2 text-[10px] text-gray-500">{voiceInfo}</p>}

          {playing && (
            <p className="mt-3 text-xs text-gray-400 flex items-center justify-center gap-1">
              <Volume2 size={12} /> {t('listen.volumeHint')}
            </p>
          )}
          {done && !playing && <p className="mt-3 text-sm text-cyan-200">{t('listen.done')}</p>}
        </>
      )}

      {note && <p className="text-[11px] text-gray-500 mt-3">{note}</p>}
      {!supported && <p className="text-sm text-gray-400 mt-3">{t('listen.unsupported')}</p>}
    </div>
  );
}
