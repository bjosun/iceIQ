// Mikrofon in (16 kHz PCM16) och uppspelning ut (24 kHz PCM16) för Gemini Live.
// Ljudet lever bara i minnet: det skickas vidare i realtid och sparas aldrig.

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;

// AudioWorklet som inline-modul (Blob-URL) så att Vite inte behöver ett separat
// assetsteg. Nedsamplar från enhetens rate (ofta 44,1/48 kHz) till 16 kHz med
// linjär interpolation och skickar ~40 ms-block som Int16 + RMS-nivå.
const WORKLET_SRC = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${INPUT_RATE};
    this.pos = 0;
    this.prev = 0;
    this.out = new Int16Array(640);
    this.n = 0;
    this.sumSq = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      const cur = ch[i];
      while (this.pos < 1) {
        const v = this.prev + (cur - this.prev) * this.pos;
        const s = Math.max(-1, Math.min(1, v));
        this.out[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        this.sumSq += s * s;
        this.pos += this.ratio;
        if (this.n === this.out.length) {
          const rms = Math.sqrt(this.sumSq / this.n);
          this.port.postMessage({ pcm: this.out.buffer, rms }, [this.out.buffer]);
          this.out = new Int16Array(640);
          this.n = 0;
          this.sumSq = 0;
        }
      }
      this.pos -= 1;
      this.prev = cur;
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`;

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function base64ToInt16(b64: string): Int16Array {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return new Int16Array(buf);
}

export interface AudioEngine {
  /** Spelar upp ett base64-kodat PCM16/24 kHz-block från modellen. */
  play: (b64: string) => void;
  /** Avbryter allt som köats (modellen blev avbruten av användaren). */
  stopPlayback: () => void;
  /** Stänger mikrofonen men behåller uppspelningen igång. */
  setMicEnabled: (enabled: boolean) => void;
  /** Mikrofonnivå 0..1 (senaste blocket). */
  getInputLevel: () => number;
  /** Utnivå 0..1 (modellens röst just nu). */
  getOutputLevel: () => number;
  /** Är modellen i färd med att tala (köat ljud kvar)? */
  isSpeaking: () => boolean;
  close: () => void;
}

// OBS: måste anropas direkt i en klick-handler (iOS kräver användargest för
// att AudioContext ska få starta).
export async function startAudio(onMicChunk: (b64: string) => void): Promise<AudioEngine> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  });

  const Ctx: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  if (ctx.state === 'suspended') await ctx.resume();

  const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
  try {
    await ctx.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }

  const source = ctx.createMediaStreamSource(stream);
  const worklet = new AudioWorkletNode(ctx, 'pcm-capture');
  let micEnabled = true;
  let inputLevel = 0;
  worklet.port.onmessage = (e: MessageEvent) => {
    inputLevel = e.data.rms;
    if (!micEnabled) return;
    onMicChunk(bytesToBase64(new Uint8Array(e.data.pcm)));
  };
  // Worklet-noden måste vara kopplad för att köras, men får inte låta
  // mikrofonen höras i högtalarna: koppla via en tyst gain.
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(worklet);
  worklet.connect(mute);
  mute.connect(ctx.destination);

  // Uppspelning
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.connect(ctx.destination);
  const levelBuf = new Uint8Array(analyser.fftSize);
  let nextTime = 0;
  const playing = new Set<AudioBufferSourceNode>();

  const play = (b64: string) => {
    const pcm = base64ToInt16(b64);
    if (pcm.length === 0) return;
    const buf = ctx.createBuffer(1, pcm.length, OUTPUT_RATE);
    const data = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i] / 0x8000;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(analyser);
    const startAt = Math.max(ctx.currentTime + 0.02, nextTime);
    src.start(startAt);
    nextTime = startAt + buf.duration;
    playing.add(src);
    src.onended = () => playing.delete(src);
  };

  const stopPlayback = () => {
    playing.forEach((s) => {
      try { s.stop(); } catch { /* redan stoppad */ }
    });
    playing.clear();
    nextTime = 0;
  };

  return {
    play,
    stopPlayback,
    setMicEnabled: (enabled) => { micEnabled = enabled; },
    getInputLevel: () => (micEnabled ? Math.min(1, inputLevel * 6) : 0),
    getOutputLevel: () => {
      analyser.getByteTimeDomainData(levelBuf);
      let sum = 0;
      for (let i = 0; i < levelBuf.length; i++) {
        const v = (levelBuf[i] - 128) / 128;
        sum += v * v;
      }
      return Math.min(1, Math.sqrt(sum / levelBuf.length) * 4);
    },
    isSpeaking: () => playing.size > 0 && nextTime > ctx.currentTime,
    close: () => {
      stopPlayback();
      stream.getTracks().forEach((t) => t.stop());
      source.disconnect();
      worklet.disconnect();
      worklet.port.onmessage = null;
      ctx.close().catch(() => undefined);
    },
  };
}
