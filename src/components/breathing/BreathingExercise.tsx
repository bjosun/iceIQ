import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Andningsövning med två mönster. Ren SVG + rAF — inget bibliotek, några kB,
// samma primitiv som är tänkt att rita rink-diagrammen längre fram.
//
// Två mönster, inte ett, för att de löser olika saker:
//   calm  4 in / 6 ut — längre utandning än inandning är det som faktiskt
//         drar ner pulsen. Det här är den man vill ha före nedsläpp.
//   box   4-4-4-4 — kvadraten ÄR instruktionen; efter första gången behöver
//         man inte läsa något. Hållmomenten är obehagliga för de yngsta,
//         så 'calm' är default tills vi vet spelarens ålder.
//
// Spelardokumentet har i dag inget födelseår (se PlayerForm). Får det ett
// blir åldersstyrd default en rad här — tills dess är det snällare
// mönstret förvalt och byte sker manuellt.

type PatternId = 'calm' | 'box';
type PhaseKey = 'in' | 'hold' | 'out' | 'holdOut';

interface Phase {
  key: PhaseKey;
  ms: number;
}

const PATTERNS: Record<PatternId, Phase[]> = {
  calm: [
    { key: 'in', ms: 4000 },
    { key: 'out', ms: 6000 },
  ],
  box: [
    { key: 'in', ms: 4000 },
    { key: 'hold', ms: 4000 },
    { key: 'out', ms: 4000 },
    { key: 'holdOut', ms: 4000 },
  ],
};

// Kvadratens hörn i viewBox-koordinater. Ordningen är vald så att inandning
// går uppåt — det är den enda riktningen som känns rätt i kroppen.
const BOX = { min: 24, max: 176 };
const BOX_EDGES: Array<[number, number, number, number]> = [
  [BOX.min, BOX.max, BOX.min, BOX.min], // in:      vänster sida, nedifrån och upp
  [BOX.min, BOX.min, BOX.max, BOX.min], // hold:    överkanten, vänster till höger
  [BOX.max, BOX.min, BOX.max, BOX.max], // out:     höger sida, uppifrån och ner
  [BOX.max, BOX.max, BOX.min, BOX.max], // holdOut: underkanten, höger till vänster
];

const CIRCLE_MIN = 34;
const CIRCLE_MAX = 78;

export default function BreathingExercise() {
  const { t } = useLanguage();

  const [pattern, setPattern] = useState<PatternId>('calm');
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [cycles, setCycles] = useState(0);

  // Rörelse är inte informationen — fasen framgår av text och position också.
  // Den som slagit på reducerad rörelse får samma övning utan animationen.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const phases = PATTERNS[pattern];
  const phase = phases[phaseIndex];

  // Refs i stället för state i loopen: rAF-callbacken får annars en inaktuell
  // closure över phaseIndex och hoppar tillbaka till fas 0 vid varje byte.
  const phaseIndexRef = useRef(0);
  const phaseStartRef = useRef(0);
  const rafRef = useRef<number>();

  const vibrate = (ms: number) => {
    // Hela poängen är att kunna blunda. Utan haptik måste man titta på
    // skärmen, och då gör övningen inte det den ska.
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        /* Vissa webbläsare kastar bakom en användarinställning — strunt samma. */
      }
    }
  };

  // Skärmen får inte slockna mitt i en övning man gör med slutna ögon.
  const wakeLockRef = useRef<any>(null);
  useEffect(() => {
    const nav = navigator as any;
    if (!running || !nav.wakeLock?.request) return;
    let released = false;
    nav.wakeLock
      .request('screen')
      .then((lock: any) => {
        if (released) lock.release?.();
        else wakeLockRef.current = lock;
      })
      .catch(() => {
        /* Nekas i bakgrundsflik eller av batterisparläge — övningen fungerar ändå. */
      });
    return () => {
      released = true;
      wakeLockRef.current?.release?.();
      wakeLockRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;

    phaseStartRef.current = performance.now();

    const tick = (now: number) => {
      const current = phases[phaseIndexRef.current];
      const elapsed = now - phaseStartRef.current;

      if (elapsed >= current.ms) {
        // Fasbyte: räkna varv när vi rullar runt till början igen.
        const next = (phaseIndexRef.current + 1) % phases.length;
        if (next === 0) setCycles((c) => c + 1);
        phaseIndexRef.current = next;
        phaseStartRef.current = now;
        setPhaseIndex(next);
        setPhaseProgress(0);
        vibrate(next === 0 || phases[next].key === 'in' ? 60 : 30);
      } else {
        setPhaseProgress(elapsed / current.ms);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, phases]);

  const reset = (nextPattern?: PatternId) => {
    setRunning(false);
    phaseIndexRef.current = 0;
    setPhaseIndex(0);
    setPhaseProgress(0);
    setCycles(0);
    if (nextPattern) setPattern(nextPattern);
  };

  // --- Geometri för den aktuella fasen ---

  // Cirkeln: växer under inandning, krymper under utandning, står stilla
  // under håll. Reducerad rörelse fryser den i mitten.
  const circleRadius = (() => {
    if (reducedMotion) return (CIRCLE_MIN + CIRCLE_MAX) / 2;
    const span = CIRCLE_MAX - CIRCLE_MIN;
    switch (phase.key) {
      case 'in':
        return CIRCLE_MIN + span * phaseProgress;
      case 'out':
        return CIRCLE_MAX - span * phaseProgress;
      case 'hold':
        return CIRCLE_MAX;
      case 'holdOut':
        return CIRCLE_MIN;
    }
  })();

  // Kvadraten: punkten vandrar en sida per fas.
  const [x1, y1, x2, y2] = BOX_EDGES[phaseIndex] ?? BOX_EDGES[0];
  const dotX = x1 + (x2 - x1) * (reducedMotion ? 0.5 : phaseProgress);
  const dotY = y1 + (y2 - y1) * (reducedMotion ? 0.5 : phaseProgress);

  const secondsLeft = Math.max(0, Math.ceil((phase.ms * (1 - phaseProgress)) / 1000));
  const phaseLabel = t(`breathing.phase.${phase.key}`);

  return (
    <div className="flex flex-col items-center">
      {/* Mönstervalet: två knappar, ingen dold inställning. */}
      <div className="flex gap-2 mb-5" role="group" aria-label={t('breathing.patternLabel')}>
        {(['calm', 'box'] as PatternId[]).map((id) => (
          <button
            key={id}
            onClick={() => reset(id)}
            aria-pressed={pattern === id}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              pattern === id
                ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200'
                : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {t(`breathing.pattern.${id}`)}
          </button>
        ))}
      </div>

      <div className="relative">
        <svg viewBox="0 0 200 200" className="w-56 h-56" aria-hidden="true">
          {pattern === 'calm' ? (
            <>
              <circle cx="100" cy="100" r={CIRCLE_MAX} className="fill-none stroke-white/10" strokeWidth="1" />
              <circle
                cx="100"
                cy="100"
                r={circleRadius}
                className="fill-cyan-400/10 stroke-cyan-300"
                strokeWidth="2.5"
              />
            </>
          ) : (
            <>
              <rect
                x={BOX.min}
                y={BOX.min}
                width={BOX.max - BOX.min}
                height={BOX.max - BOX.min}
                rx="10"
                className="fill-none stroke-white/10"
                strokeWidth="1"
              />
              {/* Den sida som pågår markeras — formen bär informationen,
                  inte färgen ensam. */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="stroke-cyan-300"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {!reducedMotion && <circle cx={dotX} cy={dotY} r="7" className="fill-cyan-300" />}
            </>
          )}
        </svg>

        {/* Fastexten är den egentliga instruktionen. aria-live gör att en
            skärmläsare läser upp varje byte utan att flytta fokus. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span aria-live="polite" className="text-white font-bold text-xl tracking-wide">
            {running ? phaseLabel : t('breathing.ready')}
          </span>
          {running && <span className="text-cyan-300/80 text-sm mt-1 tabular-nums">{secondsLeft}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-colors"
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? t('breathing.pause') : t('breathing.start')}
        </button>
        <button
          onClick={() => reset()}
          title={t('breathing.reset')}
          className="p-2 rounded-full border border-white/10 text-gray-400 hover:text-white bg-black/30 transition-colors"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <p className="text-gray-500 text-xs mt-4 text-center max-w-xs">
        {cycles > 0 ? t('breathing.cycles', { count: cycles }) : t(`breathing.hint.${pattern}`)}
      </p>
    </div>
  );
}
