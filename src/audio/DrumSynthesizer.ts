import { DrumSoundType } from '../types';

/**
 * Procedural Drum Synthesizer for AhPah Beats
 * High-fidelity, zero-dependency, zero-latency Web Audio drum engine.
 */
export class DrumSynthesizer {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  public playSound(
    sound: DrumSoundType,
    time: number,
    velocity: number = 0.85,
    destination: AudioNode,
    pitchOffset: number = 0
  ) {
    const vel = Math.max(0.05, Math.min(1.0, velocity));
    const pitchMultiplier = Math.pow(2, pitchOffset / 12);

    switch (sound) {
      case 'kick-808':
        this.play808Kick(time, vel, destination, pitchMultiplier);
        break;
      case 'kick-punch':
        this.playPunchKick(time, vel, destination, pitchMultiplier);
        break;
      case 'snare-trap':
        this.playTrapSnare(time, vel, destination, pitchMultiplier);
        break;
      case 'snare-clap':
        this.playClap(time, vel, destination, pitchMultiplier);
        break;
      case 'hihat-closed':
        this.playHiHat(time, vel, destination, false, pitchMultiplier);
        break;
      case 'hihat-open':
        this.playHiHat(time, vel, destination, true, pitchMultiplier);
        break;
      case 'percussion':
        this.playPercussion(time, vel, destination, pitchMultiplier);
        break;
      case 'cymbal-crash':
        this.playCrash(time, vel, destination, pitchMultiplier);
        break;
    }
  }

  /**
   * Deep 808 Sub Kick with transient click and saturated punch
   */
  private play808Kick(time: number, vel: number, dest: AudioNode, pitchMul: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const drive = this.ctx.createWaveShaper();

    // Saturated soft clipping curve
    drive.curve = this.makeDistortionCurve(18);
    drive.oversample = '2x';

    // Pitch sweep: fast transient drop from 180Hz down to 48Hz
    const baseFreq = 48 * pitchMul;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(175 * pitchMul, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.08);

    // Amplitude envelope: punchy initial hit with sustained sub-rumble
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 1.1, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(vel * 0.45, time + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.65);

    // Click transient
    this.playClickTransient(time, vel * 0.4, dest);

    osc.connect(gain);
    gain.connect(drive);
    drive.connect(dest);

    osc.start(time);
    osc.stop(time + 0.7);
  }

  /**
   * Punchy modern 909/Acoustic Kick
   */
  private playPunchKick(time: number, vel: number, dest: AudioNode, pitchMul: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 * pitchMul, time);
    osc.frequency.exponentialRampToValueAtTime(85 * pitchMul, time + 0.04);
    osc.frequency.exponentialRampToValueAtTime(52 * pitchMul, time + 0.18);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 1.2, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

    this.playClickTransient(time, vel * 0.5, dest);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  /**
   * Dual-layer Trap Snare: Tonal Body + Crisp Filtered White Noise
   */
  private playTrapSnare(time: number, vel: number, dest: AudioNode, pitchMul: number) {
    // 1. Tonal body oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220 * pitchMul, time);
    osc.frequency.exponentialRampToValueAtTime(140 * pitchMul, time + 0.08);

    oscGain.gain.setValueAtTime(vel * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.15);

    // 2. High-frequency noise snap
    const noiseBuffer = this.createNoiseBuffer(0.25);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200 * pitchMul, time);
    filter.Q.setValueAtTime(1.8, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.9, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    noiseSource.start(time);
    noiseSource.stop(time + 0.25);
  }

  /**
   * Staggered Multi-burst Handclap
   */
  private playClap(time: number, vel: number, dest: AudioNode, pitchMul: number) {
    const burstCount = 3;
    const burstInterval = 0.011; // 11ms apart

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600 * pitchMul, time);
    filter.Q.setValueAtTime(2.2, time);
    filter.connect(dest);

    for (let i = 0; i < burstCount; i++) {
      const burstTime = time + i * burstInterval;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.03);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.45, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.02);

      noise.connect(gain);
      gain.connect(filter);
      noise.start(burstTime);
      noise.stop(burstTime + 0.025);
    }

    // Sustained clap tail
    const tailTime = time + burstCount * burstInterval;
    const tailNoise = this.ctx.createBufferSource();
    tailNoise.buffer = this.createNoiseBuffer(0.28);

    const tailGain = this.ctx.createGain();
    tailGain.gain.setValueAtTime(vel * 0.75, tailTime);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, tailTime + 0.24);

    tailNoise.connect(tailGain);
    tailGain.connect(filter);
    tailNoise.start(tailTime);
    tailNoise.stop(tailTime + 0.26);
  }

  /**
   * Metallic Ringing Hi-Hat (Closed / Open)
   */
  private playHiHat(
    time: number,
    vel: number,
    dest: AudioNode,
    isOpen: boolean,
    pitchMul: number
  ) {
    // 6 Harmonic square waves for genuine metallic Roland timbre
    const fundamentalFreqs = [245, 306, 384, 523, 659, 845];
    const merger = this.ctx.createGain();
    merger.gain.value = 0.15;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(8000 * pitchMul, time);
    bandpass.Q.setValueAtTime(1.5, time);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(7000 * pitchMul, time);

    const gain = this.ctx.createGain();
    const duration = isOpen ? 0.45 : 0.06;

    gain.gain.setValueAtTime(vel * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Mix in white noise sizzle for extra high-end crispness
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(duration);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.35;
    noise.connect(noiseGain);
    noiseGain.connect(bandpass);

    fundamentalFreqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq * pitchMul, time);
      osc.connect(merger);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    });

    merger.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + duration);
  }

  /**
   * Snappy Wooden Percussion / Rimshot
   */
  private playPercussion(time: number, vel: number, dest: AudioNode, pitchMul: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 * pitchMul, time);
    osc.frequency.exponentialRampToValueAtTime(400 * pitchMul, time + 0.04);

    gain.gain.setValueAtTime(vel * 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  /**
   * Shimmering Crash Cymbal
   */
  private playCrash(time: number, vel: number, dest: AudioNode, pitchMul: number) {
    const duration = 1.4;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(duration);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(5500 * pitchMul, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    noise.connect(highpass);
    highpass.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + duration);
  }

  /**
   * Click impulse for kick attack snap
   */
  private playClickTransient(time: number, vel: number, dest: AudioNode) {
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();

    click.type = 'square';
    click.frequency.setValueAtTime(800, time);
    clickGain.gain.setValueAtTime(vel, time);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.008);

    click.connect(clickGain);
    clickGain.connect(dest);
    click.start(time);
    click.stop(time + 0.01);
  }

  /**
   * Helper to create noise buffer
   */
  private createNoiseBuffer(duration: number): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Distortion curve generator
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 20;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
}
