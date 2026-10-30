import React, { useEffect, useMemo, useRef, useState } from 'react';
import NoSleep from 'nosleep.js';
import toast from 'react-hot-toast';
import { Mic, MicOff, Square, Undo2, Check, X, Copy, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTemplates } from '../contexts/TemplateContext';
import Card from '../components/ui/Card';
import { useVoiceCoach, type ToolHandlers } from '../voice/useVoiceCoach';
import { buildVoiceTools, actionId, actionLabel, type VoiceLanguage } from '../voice/voiceTools';
import { buildVoicePrompt } from '../voice/voicePrompt';

// Röstlabbet (fas 0 i docs/voice-coach-plan.md): ett internt testverktyg för
// att prova Gemini Live under en riktig match. Registreringarna här sparas
// INTE i någon match — syftet är att mäta träffsäkerhet, fördröjning och
// kostnad. Ljud sparas aldrig; bara den här sidans minne hålls under sessionen.

interface LabEvent {
  id: number;
  t: number; // ms sedan start
  key: string; // action.name.en
  label: string;
  phrase?: string;
  undone: boolean;
  verdict: 'right' | 'wrong' | null;
}

const fmtTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function VoiceLab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang: VoiceLanguage = language === 'sv' ? 'sv' : 'en';
  const { templates, currentTemplate, currentTemplateId, setCurrentTemplate } = useTemplates();

  const [playerName, setPlayerName] = useState('');
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [missed, setMissed] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [priceAudioIn, setPriceAudioIn] = useState('');
  const [priceAudioOut, setPriceAudioOut] = useState('');
  const [now, setNow] = useState(Date.now());

  const eventsRef = useRef<LabEvent[]>([]);
  const idRef = useRef(0);
  const startRef = useRef(0);
  const templateRef = useRef(currentTemplate);
  templateRef.current = currentTemplate;
  const noSleepRef = useRef<NoSleep | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  const commitEvents = (next: LabEvent[]) => {
    eventsRef.current = next;
    setEvents(next);
  };

  const countsFrom = (list: LabEvent[]) => {
    const tpl = templateRef.current;
    const counts: Record<string, { label: string; count: number; points: number }> = {};
    let total = 0;
    list.filter((e) => !e.undone).forEach((e) => {
      const a = tpl?.actions.find((x) => actionId(x) === e.key);
      const pts = a?.points ?? 0;
      counts[e.key] = counts[e.key] || { label: e.label, count: 0, points: pts };
      counts[e.key].count += 1;
      total += pts;
    });
    return { counts, total };
  };

  const handlers: ToolHandlers = {
    registerAction: (key, phrase) => {
      const tpl = templateRef.current;
      const action = tpl?.actions.find((a) => actionId(a) === key);
      if (!action) return { ok: false, error: `Okänd händelse: ${key}` };
      const label = actionLabel(action, lang);
      const ev: LabEvent = {
        id: ++idRef.current,
        t: Date.now() - startRef.current,
        key,
        label,
        phrase,
        undone: false,
        verdict: null,
      };
      const next = [...eventsRef.current, ev];
      commitEvents(next);
      const { counts, total } = countsFrom(next);
      return { ok: true, registered: label, countForThisAction: counts[key]?.count ?? 1, totalPoints: total };
    },
    undoLast: () => {
      const list = eventsRef.current;
      const idx = [...list].reverse().findIndex((e) => !e.undone);
      if (idx === -1) return { ok: false, error: 'Inget att ångra' };
      const realIdx = list.length - 1 - idx;
      const next = list.map((e, i) => (i === realIdx ? { ...e, undone: true } : e));
      commitEvents(next);
      return { ok: true, undone: list[realIdx].label };
    },
    getMatchStats: () => {
      const { counts, total } = countsFrom(eventsRef.current);
      return {
        ok: true,
        totalPoints: total,
        actions: Object.values(counts).map((c) => ({ action: c.label, count: c.count, pointsEach: c.points })),
      };
    },
  };

  const voice = useVoiceCoach(handlers);
  const active = voice.status !== 'idle' && voice.status !== 'error';

  // Håll skärmen tänd medan labbet kör (NoSleep täcker även browsers utan Wake Lock)
  useEffect(() => {
    if (active && !noSleepRef.current) {
      noSleepRef.current = new NoSleep();
      noSleepRef.current.enable().catch(() => undefined);
    }
    if (!active && noSleepRef.current) {
      noSleepRef.current.disable();
      noSleepRef.current = null;
    }
  }, [active]);
  useEffect(() => () => { noSleepRef.current?.disable(); }, []);

  // Klocka för tid/minut-siffror
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  // Pulscirkel — uppdateras direkt på DOM-noden per frame (ingen React-rendering)
  useEffect(() => {
    let raf = 0;
    let smooth = 0;
    const tick = () => {
      const el = circleRef.current;
      if (el) {
        const { level, who } = active ? voice.getLevel() : { level: 0, who: 'user' as const };
        smooth += (level - smooth) * 0.25;
        el.style.transform = `scale(${1 + smooth * 0.7})`;
        const color = who === 'coach' ? '251,191,36' : '34,211,238';
        el.style.boxShadow = `0 0 ${20 + smooth * 70}px ${smooth * 18}px rgba(${color},${0.25 + smooth * 0.4})`;
        el.style.background = `rgb(${color})`;
        el.style.opacity = active ? '1' : '0.3';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, voice]);

  const handleStart = () => {
    if (!currentTemplate) return;
    commitEvents([]);
    setMissed(0);
    setMicOn(true);
    startRef.current = Date.now();
    setNow(Date.now());
    voice.start({
      systemInstruction: buildVoicePrompt({
        playerName,
        language: lang,
        actionLabels: currentTemplate.actions.map((a) => `${actionId(a)} ("${actionLabel(a, lang)}")`),
      }),
      tools: buildVoiceTools(currentTemplate, lang),
    });
  };

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    voice.setMicEnabled(next);
  };

  const setVerdict = (id: number, verdict: 'right' | 'wrong') =>
    commitEvents(eventsRef.current.map((e) => (e.id === id ? { ...e, verdict: e.verdict === verdict ? null : verdict } : e)));

  const manualUndo = (id: number) =>
    commitEvents(eventsRef.current.map((e) => (e.id === id ? { ...e, undone: true } : e)));

  const elapsedMs = voice.startedAt ? now - voice.startedAt : 0;
  const minutes = Math.max(elapsedMs / 60000, 1 / 60);

  const stats = useMemo(() => {
    const live = events.filter((e) => !e.undone);
    const right = live.filter((e) => e.verdict === 'right').length;
    const wrong = live.filter((e) => e.verdict === 'wrong').length;
    const judged = right + wrong;
    return {
      registered: live.length,
      right,
      wrong,
      precision: judged > 0 ? Math.round((right / judged) * 100) : null,
      recall: right + missed > 0 ? Math.round((right / (right + missed)) * 100) : null,
    };
  }, [events, missed]);

  const tokenSum = (rec: Record<string, number>) => Object.values(rec).reduce((a, b) => a + b, 0);
  const costNumber = (s: string) => {
    const n = parseFloat(s.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const pIn = costNumber(priceAudioIn);
  const pOut = costNumber(priceAudioOut);
  const inTok = tokenSum(voice.usage.input);
  const outTok = tokenSum(voice.usage.output);
  const cost = pIn !== null && pOut !== null ? (inTok * pIn + outTok * pOut) / 1_000_000 : null;

  const copyLog = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      player: playerName,
      template: currentTemplateId,
      language: lang,
      durationSec: Math.round(elapsedMs / 1000),
      reconnects: voice.reconnects,
      missedMarkedByTester: missed,
      stats,
      usage: voice.usage,
      events,
      transcript: voice.transcript,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('Loggen kopierad');
    } catch {
      toast.error('Kunde inte kopiera');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-300">
        Logga in för att använda röstlabbet.
      </div>
    );
  }

  const statusText: Record<string, string> = {
    idle: 'Redo att starta',
    connecting: 'Ansluter…',
    listening: 'Lyssnar',
    speaking: 'Coachen pratar',
    reconnecting: 'Återansluter…',
    error: 'Fel',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-1">Röstlabb</h1>
        <p className="text-sm text-gray-400">
          Internt test. Inget här sparas i någon match, och ljud sparas aldrig.
        </p>
      </div>

      <div className="flex items-start gap-2 text-xs text-amber-300/90 bg-amber-900/20 border border-amber-700/40 rounded-xl p-3">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <span>
          Använd hörlurar. Ljudet skickas till Googles Gemini Live för tolkning (inte Vertex i EU som vanliga
          coachen). Testa bara med ljud du är bekväm med att skicka dit.
        </span>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-gray-300">
            Spelarens namn
            <input
              className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white disabled:opacity-50"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="t.ex. Elias"
              disabled={active}
            />
          </label>
          <label className="text-sm text-gray-300">
            Mall
            <select
              className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white disabled:opacity-50"
              value={currentTemplateId}
              onChange={(e) => setCurrentTemplate(e.target.value)}
              disabled={active}
            >
              {Object.values(templates).map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name[lang] || tpl.name.en}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="h-40 flex items-center justify-center">
          <div ref={circleRef} className="w-24 h-24 rounded-full transition-colors" />
        </div>
        <div className="text-gray-300 text-sm" aria-live="polite">
          {statusText[voice.status]}
          {active && ` · ${fmtTime(elapsedMs)}`}
          {voice.reconnects > 0 && ` · ${voice.reconnects} återanslutning${voice.reconnects > 1 ? 'ar' : ''}`}
        </div>
        {voice.error && <div className="text-red-400 text-sm text-center max-w-md">{voice.error}</div>}

        <div className="flex gap-3">
          {!active ? (
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
            >
              <Mic size={18} /> Starta
            </button>
          ) : (
            <>
              <button
                onClick={toggleMic}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold"
              >
                {micOn ? <><MicOff size={18} /> Pausa</> : <><Mic size={18} /> Fortsätt</>}
              </button>
              <button
                onClick={voice.stop}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                <Square size={16} /> Stoppa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mätare */}
      <Card>
        <h2 className="text-white font-semibold mb-3">Mätare</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat label="Registrerade" value={stats.registered} />
          <Stat label="Träffsäkerhet" value={stats.precision === null ? '–' : `${stats.precision}%`} hint="rätt av bedömda" />
          <Stat label="Missade" value={missed} hint="hände men registrerades inte" />
          <Stat label="Täckning" value={stats.recall === null ? '–' : `${stats.recall}%`} hint="rätt av rätt+missade" />
        </div>
        <button
          onClick={() => setMissed((m) => m + 1)}
          disabled={!active}
          className="mt-3 w-full text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-40"
        >
          + Missad händelse (jag sa något som inte registrerades)
        </button>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat label="Tokens in" value={inTok.toLocaleString('sv-SE')} hint={Object.entries(voice.usage.input).map(([k, v]) => `${k} ${v}`).join(' · ')} />
          <Stat label="Tokens ut" value={outTok.toLocaleString('sv-SE')} hint={Object.entries(voice.usage.output).map(([k, v]) => `${k} ${v}`).join(' · ')} />
          <Stat label="Tokens/min" value={active || voice.usage.total ? Math.round((inTok + outTok) / minutes).toLocaleString('sv-SE') : '–'} />
          <Stat label="Uppskattad kostnad" value={cost === null ? '–' : `$${cost.toFixed(3)}`} hint={cost !== null ? `≈ $${(cost / minutes).toFixed(3)}/min` : 'fyll i priser'} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <label className="text-gray-400">
            Pris ljud in ($ per 1M tokens)
            <input inputMode="decimal" value={priceAudioIn} onChange={(e) => setPriceAudioIn(e.target.value)}
              className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white" placeholder="från prislistan" />
          </label>
          <label className="text-gray-400">
            Pris ljud ut ($ per 1M tokens)
            <input inputMode="decimal" value={priceAudioOut} onChange={(e) => setPriceAudioOut(e.target.value)}
              className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white" placeholder="från prislistan" />
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Kostnaden räknar med att API:ts tokensiffror är kumulativa per anslutning (det ska verifieras mot Googles
          fakturering efter första testet) och använder samma pris för all ljudtext. Kontrollera mot prislistan.
        </p>
      </Card>

      {/* Händelser */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Registrerade händelser</h2>
          <button onClick={copyLog} className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white">
            <Copy size={14} /> Kopiera logg
          </button>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">Inget registrerat ännu.</p>
        ) : (
          <ul className="space-y-2">
            {[...events].reverse().map((e) => (
              <li key={e.id} className={`flex items-center gap-3 rounded-lg bg-gray-800/60 px-3 py-2 ${e.undone ? 'opacity-40 line-through' : ''}`}>
                <span className="text-xs text-gray-500 w-10 shrink-0">{fmtTime(e.t)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm">{e.label}</div>
                  {e.phrase && <div className="text-xs text-gray-400 truncate">”{e.phrase}”</div>}
                </div>
                {!e.undone && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button aria-label="Rätt" onClick={() => setVerdict(e.id, 'right')}
                      className={`p-2 rounded-lg ${e.verdict === 'right' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}><Check size={14} /></button>
                    <button aria-label="Fel" onClick={() => setVerdict(e.id, 'wrong')}
                      className={`p-2 rounded-lg ${e.verdict === 'wrong' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}><X size={14} /></button>
                    <button aria-label="Ta bort" onClick={() => manualUndo(e.id)}
                      className="p-2 rounded-lg bg-gray-700 text-gray-300"><Undo2 size={14} /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Transkript */}
      <Card>
        <h2 className="text-white font-semibold mb-3">Transkript</h2>
        {voice.transcript.length === 0 ? (
          <p className="text-sm text-gray-500">Det som sägs visas här (bara som text).</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {voice.transcript.slice(-40).map((l) => (
              <li key={l.id} className={l.role === 'coach' ? 'text-amber-300' : 'text-cyan-200'}>
                <span className="text-gray-500">{l.role === 'coach' ? 'Coach: ' : 'Du: '}</span>
                {l.text}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg bg-gray-800/60 px-2 py-3">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
      {hint && <div className="text-[10px] text-gray-500 mt-0.5 break-words">{hint}</div>}
    </div>
  );
}
