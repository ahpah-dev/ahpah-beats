import { DrumSynthesizer } from './DrumSynthesizer';
import { SynthVoice, NOTE_FREQUENCIES } from './SynthVoice';
import {
  Track,
  SynthSoundType,
  DrumSoundType,
  EffectsSettings,
  SynthSettings,
  ProjectData
} from '../types';

export class AudioEngine {
  public ctx: AudioContext;
  public drumSynth: DrumSynthesizer;
  public synthVoice: SynthVoice;

  // Master Nodes
  public masterGain: GainNode;
  public masterAnalyser: AnalyserNode;
  public masterCompressor: DynamicsCompressorNode;
  public masterFilter: BiquadFilterNode;
  
  // FX Nodes
  public reverbNode: ConvolverNode;
  public reverbGain: GainNode;
  public delayNode: DelayNode;
  public delayFeedbackGain: GainNode;
  public delayGain: GainNode;
  public distortionNode: WaveShaperNode;
  public distortionGain: GainNode;
  public dryGain: GainNode;

  // Track Busses
  private trackBusses: Map<string, { gain: GainNode; panner: StereoPannerNode }> = new Map();

  // Settings
  public effectsSettings: EffectsSettings;
  public synthSettings: SynthSettings;

  // Sequencer / Scheduler State
  public isPlaying: boolean = false;
  public bpm: number = 130;
  public swing: number = 15; // 0 to 100%
  public currentStep: number = 0;
  private totalSteps: number = 16;
  private nextNoteTime: number = 0;
  private scheduleTimer: number | null = null;
  private stepCallbacks: Set<(step: number) => void> = new Set();
  private tracks: Track[] = [];

  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording: boolean = false;

  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.drumSynth = new DrumSynthesizer(this.ctx);
    this.synthVoice = new SynthVoice(this.ctx);

    // Initial default effects settings
    this.effectsSettings = {
      reverbWet: 0.25,
      reverbDecay: 2.2,
      delayWet: 0.2,
      delayTime: 0.28,
      delayFeedback: 0.35,
      distortionWet: 0.1,
      distortionDrive: 15,
      filterCutoff: 18000,
      filterResonance: 1.0,
      filterType: 'lowpass',
      masterCompressor: true,
      masterLimiter: true
    };

    // Initial default synth settings
    this.synthSettings = {
      waveform: 'sawtooth',
      attack: 0.02,
      decay: 0.15,
      sustain: 0.6,
      release: 0.25,
      cutoff: 4000,
      resonance: 3.0,
      filterEnv: 0.5,
      glide: 0.02
    };

    // 1. Master Analyser (for visuals)
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterAnalyser.smoothingTimeConstant = 0.85;

    // 2. Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    // 3. Master Limiter/Compressor
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -3;
    this.masterCompressor.knee.value = 10;
    this.masterCompressor.ratio.value = 8;
    this.masterCompressor.attack.value = 0.003;
    this.masterCompressor.release.value = 0.15;

    // 4. Master Filter
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = this.effectsSettings.filterCutoff;
    this.masterFilter.Q.value = this.effectsSettings.filterResonance;

    // 5. Reverb
    this.reverbNode = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = this.effectsSettings.reverbWet;
    this.generateImpulseResponse(this.effectsSettings.reverbDecay);

    // 6. Stereo Delay
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = this.effectsSettings.delayTime;
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.value = this.effectsSettings.delayFeedback;
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.value = this.effectsSettings.delayWet;

    // Delay loop
    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);

    // 7. Distortion
    this.distortionNode = this.ctx.createWaveShaper();
    this.distortionGain = this.ctx.createGain();
    this.distortionGain.gain.value = this.effectsSettings.distortionWet;
    this.updateDistortionCurve(this.effectsSettings.distortionDrive);

    // Dry bus
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1.0;

    // Wire up the master FX routing
    // Track Busses -> FX Split (Dry + Reverb + Delay + Distortion) -> Master Filter -> Master Compressor -> Master Gain -> Master Analyser -> Destination
    const effectsSum = this.ctx.createGain();
    effectsSum.gain.value = 1.0;

    this.dryGain.connect(effectsSum);
    this.reverbGain.connect(effectsSum);
    this.delayGain.connect(effectsSum);
    this.distortionGain.connect(effectsSum);

    effectsSum.connect(this.masterFilter);
    this.masterFilter.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
  }

  // Sample buffers for imported custom instruments
  public sampleBuffers: Map<string, AudioBuffer> = new Map();

  public async loadSample(id: string, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    const buf = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
    this.sampleBuffers.set(id, buf);
    return buf;
  }

  public playSample(id: string | undefined, time: number, velocity: number, destination: AudioNode, pitchOffset: number = 0) {
    if (!id) return;
    const buf = this.sampleBuffers.get(id);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, pitchOffset / 12);
    const gain = this.ctx.createGain();
    gain.gain.value = Math.max(0.01, Math.min(1.5, velocity));
    src.connect(gain);
    gain.connect(destination);
    src.start(time);
  }

  public ensureContextRunning() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setTracks(tracks: Track[]) {
    this.tracks = tracks;
    // Ensure all tracks have bus nodes
    tracks.forEach((track) => {
      this.getOrCreateTrackBus(track.id);
    });
  }

  public getOrCreateTrackBus(trackId: string) {
    let bus = this.trackBusses.get(trackId);
    if (!bus) {
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : (gain as any);
      
      gain.connect(panner);
      // Route track bus into dry, reverb, delay, distortion
      panner.connect(this.dryGain);
      panner.connect(this.reverbNode);
      this.reverbNode.connect(this.reverbGain);
      panner.connect(this.delayNode);
      panner.connect(this.distortionNode);
      this.distortionNode.connect(this.distortionGain);

      bus = { gain, panner };
      this.trackBusses.set(trackId, bus);
    }
    return bus;
  }

  public updateTrackMix(track: Track, anySoloActive: boolean) {
    const bus = this.getOrCreateTrackBus(track.id);
    if (track.muted || (anySoloActive && !track.solo)) {
      bus.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
    } else {
      bus.gain.gain.setTargetAtTime(track.volume, this.ctx.currentTime, 0.01);
    }
    if (bus.panner && bus.panner.pan) {
      bus.panner.pan.setTargetAtTime(track.pan, this.ctx.currentTime, 0.01);
    }
  }

  public updateEffects(settings: Partial<EffectsSettings>) {
    this.effectsSettings = { ...this.effectsSettings, ...settings };
    const now = this.ctx.currentTime;

    if (settings.reverbWet !== undefined) {
      this.reverbGain.gain.setTargetAtTime(this.effectsSettings.reverbWet, now, 0.02);
    }
    if (settings.reverbDecay !== undefined) {
      this.generateImpulseResponse(this.effectsSettings.reverbDecay);
    }
    if (settings.delayWet !== undefined) {
      this.delayGain.gain.setTargetAtTime(this.effectsSettings.delayWet, now, 0.02);
    }
    if (settings.delayTime !== undefined) {
      this.delayNode.delayTime.setTargetAtTime(this.effectsSettings.delayTime, now, 0.02);
    }
    if (settings.delayFeedback !== undefined) {
      this.delayFeedbackGain.gain.setTargetAtTime(this.effectsSettings.delayFeedback, now, 0.02);
    }
    if (settings.distortionWet !== undefined) {
      this.distortionGain.gain.setTargetAtTime(this.effectsSettings.distortionWet, now, 0.02);
    }
    if (settings.distortionDrive !== undefined) {
      this.updateDistortionCurve(this.effectsSettings.distortionDrive);
    }
    if (settings.filterCutoff !== undefined) {
      this.masterFilter.frequency.setTargetAtTime(this.effectsSettings.filterCutoff, now, 0.02);
    }
    if (settings.filterResonance !== undefined) {
      this.masterFilter.Q.setTargetAtTime(this.effectsSettings.filterResonance, now, 0.02);
    }
    if (settings.filterType !== undefined) {
      this.masterFilter.type = this.effectsSettings.filterType;
    }
  }

  public setMasterVolume(vol: number) {
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.5, vol)), this.ctx.currentTime, 0.02);
  }

  /**
   * Preview a sound immediately (e.g. clicking pad or piano key)
   */
  public triggerSound(
    track: Track,
    note: string = 'C4',
    velocity: number = 0.9,
    pitchOffset: number = 0
  ) {
    this.ensureContextRunning();
    const bus = this.getOrCreateTrackBus(track.id);
    const time = this.ctx.currentTime;

    if (track.type === 'drum') {
      this.drumSynth.playSound(track.sound as DrumSoundType, time, velocity, bus.gain, pitchOffset);
    } else if (track.type === 'sample') {
      this.playSample(track.sampleId, time, velocity, bus.gain, pitchOffset);
    } else {
      this.synthVoice.playNote(
        track.sound as SynthSoundType,
        note,
        time,
        0.35,
        velocity,
        bus.gain,
        this.synthSettings,
        pitchOffset
      );
    }
  }

  /**
   * Start playback
   */
  public start(bpm: number, swing: number, totalSteps: number = 16) {
    this.ensureContextRunning();
    this.bpm = bpm;
    this.swing = swing;
    this.totalSteps = totalSteps;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.scheduleTimer !== null) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    this.currentStep = 0;
    this.notifyStep(0);
  }

  public pause() {
    this.isPlaying = false;
    if (this.scheduleTimer !== null) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  public onStep(callback: (step: number) => void) {
    this.stepCallbacks.add(callback);
    return () => this.stepCallbacks.delete(callback);
  }

  private notifyStep(step: number) {
    this.stepCallbacks.forEach((cb) => cb(step));
  }

  /**
   * Rock-solid Web Audio lookahead scheduler
   */
  private scheduler = () => {
    const lookaheadMs = 25.0; // run every 25ms
    const scheduleAheadTime = 0.1; // lookahead 100ms

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime && this.isPlaying) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }

    if (this.isPlaying) {
      this.scheduleTimer = window.setTimeout(this.scheduler, lookaheadMs);
    }
  };

  private advanceStep() {
    // 16th note base time
    const secondsPerBeat = 60.0 / this.bpm;
    const base16th = 0.25 * secondsPerBeat;

    // Swing groove: even steps are standard, odd steps delayed by swing amount
    const isOddStep = this.currentStep % 2 === 1;
    const swingFactor = (this.swing / 100) * 0.5; // up to 50% shift
    const stepDuration = isOddStep ? base16th * (1 - swingFactor) : base16th * (1 + swingFactor);

    this.nextNoteTime += stepDuration;

    // UI step update
    const cur = this.currentStep;
    setTimeout(() => {
      if (this.isPlaying) {
        this.notifyStep(cur);
      }
    }, Math.max(0, (this.nextNoteTime - this.ctx.currentTime - stepDuration) * 1000));

    this.currentStep = (this.currentStep + 1) % this.totalSteps;
  }

  private scheduleStep(stepIndex: number, time: number) {
    const anySoloActive = this.tracks.some((t) => t.solo);

    this.tracks.forEach((track) => {
      if (track.muted || (anySoloActive && !track.solo)) return;

      const stepData = track.steps[stepIndex];
      if (stepData && stepData.active) {
        const bus = this.getOrCreateTrackBus(track.id);
        const vel = stepData.velocity || 0.85;
        const pitch = stepData.pitchOffset || 0;

        if (track.type === 'drum') {
          this.drumSynth.playSound(track.sound as DrumSoundType, time, vel, bus.gain, pitch);
          if (stepData.isRoll) {
            // 1/32 roll hit halfway through step
            const rollTime = time + (60.0 / this.bpm) * 0.125;
            this.drumSynth.playSound(track.sound as DrumSoundType, rollTime, vel * 0.7, bus.gain, pitch);
          }
        } else if (track.type === 'sample') {
          this.playSample(track.sampleId, time, vel, bus.gain, pitch);
        } else {
          const note = stepData.note || 'C4';
          const stepBase = (60.0 / this.bpm) * 0.25;
          const noteDuration = Math.max(0.08, (stepData.duration || 1) * stepBase * 0.95);
          this.synthVoice.playNote(
            track.sound as SynthSoundType,
            note,
            time,
            noteDuration,
            vel,
            bus.gain,
            this.synthSettings,
            pitch
          );
        }
      }
    });
  }

  private generateImpulseResponse(decay: number) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * Math.max(0.5, decay));
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const factor = Math.pow(n / length, 2.5);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    this.reverbNode.buffer = impulse;
  }

  private updateDistortionCurve(drive: number) {
    const k = drive;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    this.distortionNode.curve = curve;
  }
}

// Global Singleton Instance
export const audioEngine = new AudioEngine();
