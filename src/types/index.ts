// Core Type Definitions for AhPah Beats

export type DrumSoundType = 
  | 'kick-808'
  | 'kick-punch'
  | 'snare-trap'
  | 'snare-clap'
  | 'hihat-closed'
  | 'hihat-open'
  | 'percussion'
  | 'cymbal-crash';

export type SynthSoundType = 
  | '808-sub'
  | 'neon-lead'
  | 'cyber-pluck'
  | 'lofi-rhodes'
  | 'retro-bass'
  | 'warm-pad';

export type TrackType = 'drum' | 'synth';

export interface NoteStep {
  active: boolean;
  note?: string; // e.g. "C3", "D#3", "G3"
  velocity: number; // 0 to 1
  pitchOffset?: number; // semitones +/- 12
  isRoll?: boolean; // 1/32 roll
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  sound: DrumSoundType | SynthSoundType;
  color: string;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
  steps: NoteStep[];
}

export interface SynthSettings {
  waveform: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  cutoff: number;
  resonance: number;
  filterEnv: number;
  glide: number;
}

export interface EffectsSettings {
  reverbWet: number;
  reverbDecay: number;
  delayWet: number;
  delayTime: number; // seconds
  delayFeedback: number;
  distortionWet: number;
  distortionDrive: number;
  filterCutoff: number;
  filterResonance: number;
  filterType: BiquadFilterType;
  masterCompressor: boolean;
  masterLimiter: boolean;
}

export interface ProjectData {
  title: string;
  bpm: number;
  swing: number; // 0 to 100%
  masterVolume: number;
  key: string;
  scale: string;
  stepCount: number; // 16 or 32
  tracks: Track[];
  effects: EffectsSettings;
  synth: SynthSettings;
}

export interface ScaleDefinition {
  name: string;
  intervals: number[]; // semitone steps from root
}
