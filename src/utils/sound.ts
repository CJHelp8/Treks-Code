let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.3));
  }
  noiseBuffer = buffer;
  return buffer;
}

export function playKeystrokeSound(volume = 0.55, key?: string): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const clampedVol = Math.max(0.05, Math.min(1, volume));
  const now = ctx.currentTime;

  // Slight organic pitch variation so rapid typing feels natural
  const jitter = 0.94 + Math.random() * 0.12;
  const isEnter = key === 'Enter';
  const isSpace = key === ' ';
  const isBackspace = key === 'Backspace' || key === 'Delete';

  const baseFreq = isEnter
    ? 175 * jitter
    : isSpace
    ? 195 * jitter
    : isBackspace
    ? 260 * jitter
    : 230 * jitter;

  // 1. Tactile low-mid key body ("thock")
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(75, now + 0.024);

  oscGain.gain.setValueAtTime(0.001, now);
  oscGain.gain.linearRampToValueAtTime(0.18 * clampedVol, now + 0.002);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.03);

  // 2. Crisp short switch click transient
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(
    isBackspace ? 1600 * jitter : isEnter ? 1400 * jitter : 2200 * jitter,
    now
  );
  filter.Q.setValueAtTime(1.6, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.linearRampToValueAtTime(0.22 * clampedVol, now + 0.0015);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.022);
}
