import { SynthSoundType, SynthSettings } from '../types';

/**
 * Note to Frequency Conversion
 */
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50
};

export class SynthVoice {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  /**
   * Play a melodic note with rich synthesizer parameters
   */
  public playNote(
    sound: SynthSoundType,
    note: string,
    time: number,
    duration: number = 0.4,
    velocity: number = 0.8,
    destination: AudioNode,
    customSettings?: Partial<SynthSettings>,
    pitchOffset: number = 0
  ) {
    const baseFreq = NOTE_FREQUENCIES[note] || 261.63;
    const freq = baseFreq * Math.pow(2, pitchOffset / 12);
    const vel = Math.max(0.05, Math.min(1.0, velocity));

    switch (sound) {
      case '808-sub':
        this.play808Sub(freq, time, duration, vel, destination);
        break;
      case 'neon-lead':
        this.playNeonLead(freq, time, duration, vel, destination, customSettings);
        break;
      case 'cyber-pluck':
        this.playCyberPluck(freq, time, duration, vel, destination);
        break;
      case 'lofi-rhodes':
        this.playLofiRhodes(freq, time, duration, vel, destination);
        break;
      case 'retro-bass':
        this.playRetroBass(freq, time, duration, vel, destination);
        break;
      case 'warm-pad':
        this.playWarmPad(freq, time, duration, vel, destination);
        break;
      default:
        this.playCustomSynth(freq, time, duration, vel, destination, customSettings);
        break;
    }
  }

  /**
   * Powerful 808 Sub-Bass with subtle saturation
   */
  private play808Sub(freq: number, time: number, duration: number, vel: number, dest: AudioNode) {
    // 808 sub plays best in lower octaves (around 35-120 Hz)
    const targetFreq = freq > 160 ? freq / 2 : freq;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const shaper = this.ctx.createWaveShaper();

    shaper.curve = this.makeSoftClipCurve();
    shaper.oversample = '2x';

    osc.type = 'sine';
    // Pitch envelope: subtle quick dip for punch
    osc.frequency.setValueAtTime(targetFreq * 1.25, time);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, time + 0.04);

    const actualDuration = Math.max(duration, 0.45);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 1.1, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(vel * 0.7, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + actualDuration);

    osc.connect(gain);
    gain.connect(shaper);
    shaper.connect(dest);

    osc.start(time);
    osc.stop(time + actualDuration + 0.05);
  }

  /**
   * Neon Lead - Dual detuned supersaw with dynamic lowpass sweep
   */
  private playNeonLead(
    freq: number,
    time: number,
    duration: number,
    vel: number,
    dest: AudioNode,
    settings?: Partial<SynthSettings>
  ) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = settings?.waveform || 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(freq, time);
    // Subtle detune (+8 cents) for thick stereo shimmer
    osc2.frequency.setValueAtTime(freq * 1.005, time);

    filter.type = 'lowpass';
    const cutoff = settings?.cutoff || 3800;
    filter.frequency.setValueAtTime(cutoff * 0.6, time);
    filter.frequency.exponentialRampToValueAtTime(Math.min(18000, cutoff * 2.2), time + 0.08);
    filter.frequency.exponentialRampToValueAtTime(cutoff, time + duration);
    filter.Q.setValueAtTime(settings?.resonance || 3.5, time);

    const attack = settings?.attack || 0.02;
    const release = settings?.release || 0.15;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.45, time + attack);
    gain.gain.setValueAtTime(vel * 0.4, time + duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + release + 0.05);
    osc2.stop(time + duration + release + 0.05);
  }

  /**
   * Cyber Pluck - Crisp fast-decaying melodic pluck
   */
  private playCyberPluck(freq: number, time: number, duration: number, vel: number, dest: AudioNode) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + 0.16);
    filter.Q.setValueAtTime(6.0, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.6, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(duration, 0.3));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  /**
   * Lo-Fi Rhodes - Warm mellow electric piano
   */
  private playLofiRhodes(freq: number, time: number, duration: number, vel: number, dest: AudioNode) {
    const fundamental = this.ctx.createOscillator();
    const harmonic = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    fundamental.type = 'sine';
    harmonic.type = 'triangle';

    fundamental.frequency.setValueAtTime(freq, time);
    harmonic.frequency.setValueAtTime(freq * 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(1.0, time);

    const actualDuration = Math.max(duration, 0.5);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.7, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(vel * 0.35, time + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + actualDuration);

    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.25;

    fundamental.connect(filter);
    harmonic.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    fundamental.start(time);
    harmonic.start(time);
    fundamental.stop(time + actualDuration + 0.05);
    harmonic.stop(time + actualDuration + 0.05);
  }

  /**
   * Retro Synth Bass - Punchy 80s / Synthwave Bassline
   */
  private playRetroBass(freq: number, time: number, duration: number, vel: number, dest: AudioNode) {
    const base = freq > 200 ? freq / 2 : freq;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(base, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(250, time + 0.14);
    filter.Q.setValueAtTime(4.5, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.8, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(vel * 0.5, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  /**
   * Warm Pad - Atmospheric dreamy pad
   */
  private playWarmPad(freq: number, time: number, duration: number, vel: number, dest: AudioNode) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.004, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.linearRampToValueAtTime(2200, time + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(1000, time + duration);
    filter.Q.setValueAtTime(2.0, time);

    const padDur = Math.max(duration, 0.8);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.5, time + 0.12);
    gain.gain.setValueAtTime(vel * 0.45, time + padDur - 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + padDur + 0.25);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + padDur + 0.3);
    osc2.stop(time + padDur + 0.3);
  }

  /**
   * Custom Synth Voice based on synth settings panel
   */
  private playCustomSynth(
    freq: number,
    time: number,
    duration: number,
    vel: number,
    dest: AudioNode,
    settings?: Partial<SynthSettings>
  ) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = settings?.waveform || 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const cutoff = settings?.cutoff || 2500;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.setValueAtTime(settings?.resonance || 2.0, time);

    const attack = Math.max(0.005, settings?.attack || 0.02);
    const decay = Math.max(0.01, settings?.decay || 0.1);
    const sustain = Math.max(0.0, Math.min(1.0, settings?.sustain ?? 0.7));
    const release = Math.max(0.01, settings?.release || 0.15);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.6, time + attack);
    gain.gain.exponentialRampToValueAtTime(vel * 0.6 * sustain + 0.001, time + attack + decay);
    gain.gain.setValueAtTime(vel * 0.6 * sustain + 0.001, time + duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + duration + release + 0.05);
  }

  private makeSoftClipCurve(): Float32Array {
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      // Hyperbolic tangent soft clipping
      curve[i] = Math.tanh(x * 1.5);
    }
    return curve;
  }
}
