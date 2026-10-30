import { useCallback, useEffect, useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from '@google/genai';
import { euFunctions } from '../services/firestore';
import { startAudio, type AudioEngine } from './audio';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'reconnecting' | 'error';

export interface TranscriptLine {
  id: number;
  role: 'user' | 'coach';
  text: string;
  final: boolean;
}

export interface ToolHandlers {
  /** Returnerar ett objekt som skickas tillbaka till modellen som verktygssvar. */
  registerAction: (actionId: string, phrase?: string) => Record<string, unknown>;
  undoLast: () => Record<string, unknown>;
  getMatchStats: () => Record<string, unknown>;
}

export interface VoiceUsage {
  /** Token-summor över alla anslutningar, per modalitet (AUDIO/TEXT/...). */
  input: Record<string, number>;
  output: Record<string, number>;
  total: number;
  /** Senaste usageMetadata, rått, för felsökning av hur API:t räknar. */
  lastRaw: unknown;
}

export interface StartOptions {
  systemInstruction: string;
  tools: any[]; // FunctionDeclaration[]
}

// Live-sessioner har en tidsgräns (ca 15 min för ljud) — vid frånkoppling
// återansluter vi automatiskt med sessionResumption-handtaget. Högst så här
// många försök i rad innan vi ger upp och visar fel.
const MAX_RECONNECTS = 5;

const emptyUsage = (): VoiceUsage => ({ input: {}, output: {}, total: 0, lastRaw: null });

export function useVoiceCoach(handlers: ToolHandlers) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [usage, setUsage] = useState<VoiceUsage>(emptyUsage());
  const [reconnects, setReconnects] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const audioRef = useRef<AudioEngine | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const connectedRef = useRef(false);
  const stoppedRef = useRef(true);
  const optionsRef = useRef<StartOptions | null>(null);
  const resumeHandleRef = useRef<string | null>(null);
  const reconnectCountRef = useRef(0);
  const lineIdRef = useRef(0);
  // Per-anslutning högsta värden (usageMetadata antas vara kumulativ inom en
  // anslutning) + summan av avslutade anslutningar.
  const connUsageRef = useRef<{ input: Record<string, number>; output: Record<string, number>; total: number }>(
    { input: {}, output: {}, total: 0 }
  );
  const doneUsageRef = useRef<VoiceUsage>(emptyUsage());

  const publishUsage = useCallback((lastRaw?: unknown) => {
    const merge = (a: Record<string, number>, b: Record<string, number>) => {
      const out = { ...a };
      Object.entries(b).forEach(([k, v]) => { out[k] = (out[k] || 0) + v; });
      return out;
    };
    setUsage({
      input: merge(doneUsageRef.current.input, connUsageRef.current.input),
      output: merge(doneUsageRef.current.output, connUsageRef.current.output),
      total: doneUsageRef.current.total + connUsageRef.current.total,
      lastRaw: lastRaw ?? doneUsageRef.current.lastRaw,
    });
  }, []);

  const closeSession = useCallback(() => {
    connectedRef.current = false;
    try { sessionRef.current?.close(); } catch { /* redan stängd */ }
    sessionRef.current = null;
  }, []);

  const appendTranscript = useCallback((role: 'user' | 'coach', text: string) => {
    if (!text) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.final) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { id: ++lineIdRef.current, role, text, final: false }];
    });
  }, []);

  const finalizeTranscript = useCallback(() => {
    setTranscript((prev) => prev.map((l) => (l.final ? l : { ...l, final: true })));
  }, []);

  const handleToolCall = useCallback((msg: LiveServerMessage) => {
    const calls = msg.toolCall?.functionCalls;
    if (!calls || !sessionRef.current) return;
    const responses = calls.map((fc) => {
      const args = (fc.args || {}) as Record<string, any>;
      let response: Record<string, unknown>;
      try {
        if (fc.name === 'register_action') {
          response = handlersRef.current.registerAction(String(args.action), args.phrase ? String(args.phrase) : undefined);
        } else if (fc.name === 'undo_last') {
          response = handlersRef.current.undoLast();
        } else if (fc.name === 'get_match_stats') {
          response = handlersRef.current.getMatchStats();
        } else {
          response = { ok: false, error: `Okänt verktyg: ${fc.name}` };
        }
      } catch (e: any) {
        response = { ok: false, error: e?.message || 'Verktygsfel' };
      }
      return { id: fc.id, name: fc.name, response };
    });
    try {
      sessionRef.current.sendToolResponse({ functionResponses: responses });
    } catch (e) {
      console.warn('voice: kunde inte skicka verktygssvar', e);
    }
  }, []);

  const onMessage = useCallback((msg: LiveServerMessage) => {
    const sc = msg.serverContent;
    if (sc) {
      if (sc.interrupted) audioRef.current?.stopPlayback();
      sc.modelTurn?.parts?.forEach((p) => {
        if (p.inlineData?.data) audioRef.current?.play(p.inlineData.data);
      });
      if (sc.inputTranscription?.text) appendTranscript('user', sc.inputTranscription.text);
      if (sc.outputTranscription?.text) appendTranscript('coach', sc.outputTranscription.text);
      if (sc.turnComplete) finalizeTranscript();
    }
    if (msg.toolCall) handleToolCall(msg);
    if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
      resumeHandleRef.current = msg.sessionResumptionUpdate.newHandle;
    }
    if (msg.usageMetadata) {
      const u = msg.usageMetadata;
      const take = (details: { modality?: string; tokenCount?: number }[] | undefined, into: Record<string, number>) => {
        details?.forEach((d) => {
          const k = String(d.modality || 'UNKNOWN');
          into[k] = Math.max(into[k] || 0, d.tokenCount || 0);
        });
      };
      take(u.promptTokensDetails, connUsageRef.current.input);
      take(u.responseTokensDetails, connUsageRef.current.output);
      connUsageRef.current.total = Math.max(connUsageRef.current.total, u.totalTokenCount || 0);
      publishUsage(u);
    }
  }, [appendTranscript, finalizeTranscript, handleToolCall, publishUsage]);

  const connect = useCallback(async (isReconnect: boolean) => {
    const opts = optionsRef.current;
    if (!opts) return;

    const mint = httpsCallable<unknown, { token: string; model: string }>(euFunctions, 'mintVoiceSession');
    const { data } = await mint({});
    if (stoppedRef.current) return;

    const ai = new GoogleGenAI({ apiKey: data.token });
    const session = await ai.live.connect({
      model: data.model,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: opts.systemInstruction,
        tools: [{ functionDeclarations: opts.tools }],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        sessionResumption: resumeHandleRef.current ? { handle: resumeHandleRef.current } : {},
        contextWindowCompression: { slidingWindow: {} },
      },
      callbacks: {
        onopen: () => undefined,
        onmessage: (m: LiveServerMessage) => {
          if (m.setupComplete) {
            connectedRef.current = true;
            reconnectCountRef.current = 0;
            setStatus('listening');
            if (!isReconnect) {
              try {
                session.sendRealtimeInput({ text: 'Säg bara "Redo" — ett enda ord.' });
              } catch { /* inte kritiskt */ }
            }
          }
          onMessage(m);
        },
        onerror: (e: ErrorEvent) => {
          console.warn('voice: socketfel', e);
        },
        onclose: (e: CloseEvent) => {
          connectedRef.current = false;
          if (stoppedRef.current) return;
          // Avsluta den här anslutningens usage i totalen innan en ny startar
          const done = doneUsageRef.current;
          Object.entries(connUsageRef.current.input).forEach(([k, v]) => { done.input[k] = (done.input[k] || 0) + v; });
          Object.entries(connUsageRef.current.output).forEach(([k, v]) => { done.output[k] = (done.output[k] || 0) + v; });
          done.total += connUsageRef.current.total;
          connUsageRef.current = { input: {}, output: {}, total: 0 };
          if (reconnectCountRef.current >= MAX_RECONNECTS) {
            setError(`Anslutningen bröts (${e.code || '?'} ${e.reason || ''}). Gav upp efter ${MAX_RECONNECTS} försök.`);
            setStatus('error');
            return;
          }
          reconnectCountRef.current += 1;
          setReconnects((n) => n + 1);
          setStatus('reconnecting');
          setTimeout(() => {
            if (stoppedRef.current) return;
            connect(true).catch((err: any) => {
              setError(err?.message || 'Kunde inte återansluta');
              setStatus('error');
            });
          }, 1000);
        },
      },
    });
    if (stoppedRef.current) {
      try { session.close(); } catch { /* */ }
      return;
    }
    sessionRef.current = session;
  }, [onMessage]);

  const start = useCallback(async (opts: StartOptions) => {
    if (!stoppedRef.current) return;
    stoppedRef.current = false;
    optionsRef.current = opts;
    resumeHandleRef.current = null;
    reconnectCountRef.current = 0;
    connUsageRef.current = { input: {}, output: {}, total: 0 };
    doneUsageRef.current = emptyUsage();
    setError('');
    setTranscript([]);
    setUsage(emptyUsage());
    setReconnects(0);
    setStatus('connecting');

    try {
      // Mikrofon/AudioContext först — direkt i klick-handlern (iOS).
      audioRef.current = await startAudio((b64) => {
        if (!connectedRef.current || !sessionRef.current) return;
        try {
          sessionRef.current.sendRealtimeInput({ audio: { data: b64, mimeType: 'audio/pcm;rate=16000' } });
        } catch { /* socket stängs just nu — onclose sköter återanslutning */ }
      });
      setStartedAt(Date.now());
      await connect(false);
    } catch (e: any) {
      audioRef.current?.close();
      audioRef.current = null;
      closeSession();
      stoppedRef.current = true;
      const name = e?.name;
      setError(
        name === 'NotAllowedError' ? 'Mikrofonen nekades. Tillåt mikrofon för sidan i webbläsaren.'
        : name === 'NotFoundError' ? 'Ingen mikrofon hittades.'
        : e?.message || 'Kunde inte starta röstsessionen.'
      );
      setStatus('error');
    }
  }, [closeSession, connect]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    closeSession();
    audioRef.current?.close();
    audioRef.current = null;
    setStatus('idle');
    setStartedAt(null);
  }, [closeSession]);

  const setMicEnabled = useCallback((enabled: boolean) => {
    audioRef.current?.setMicEnabled(enabled);
  }, []);

  // listening <-> speaking utifrån om modellens ljud spelas just nu
  useEffect(() => {
    const id = window.setInterval(() => {
      const a = audioRef.current;
      if (!a || !connectedRef.current) return;
      setStatus((s) => {
        if (s !== 'listening' && s !== 'speaking') return s;
        return a.isSpeaking() ? 'speaking' : 'listening';
      });
    }, 120);
    return () => window.clearInterval(id);
  }, []);

  // Stäng allt om sidan lämnas
  useEffect(() => () => {
    stoppedRef.current = true;
    closeSession();
    audioRef.current?.close();
    audioRef.current = null;
  }, [closeSession]);

  /** För pulscirkeln: nivå 0..1 och vems röst det är. Anropas per animationsframe. */
  const getLevel = useCallback((): { level: number; who: 'user' | 'coach' } => {
    const a = audioRef.current;
    if (!a) return { level: 0, who: 'user' };
    const out = a.getOutputLevel();
    if (out > 0.02) return { level: out, who: 'coach' };
    return { level: a.getInputLevel(), who: 'user' };
  }, []);

  return { status, error, transcript, usage, reconnects, startedAt, start, stop, setMicEnabled, getLevel };
}
