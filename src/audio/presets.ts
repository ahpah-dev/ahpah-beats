import { ProjectData, Track, NoteStep } from '../types';

export const SCALES: Record<string, number[]> = {
  'Minor (Aeolian)': [0, 2, 3, 5, 7, 8, 10],
  'Major (Ionian)': [0, 2, 4, 5, 7, 9, 11],
  'Trap Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  'Blues Scale': [0, 3, 5, 6, 7, 10],
};

function emptySteps(count: number = 16): NoteStep[] {
  return Array.from({ length: count }, () => ({
    active: false,
    velocity: 0.85,
    pitchOffset: 0
  }));
}

function createPattern(
  activeIndices: number[],
  notes?: (string | undefined)[],
  rolls?: number[],
  velocities?: number[],
  count: number = 16
): NoteStep[] {
  const steps = emptySteps(count);
  activeIndices.forEach((idx, i) => {
    if (idx < count) {
      steps[idx] = {
        active: true,
        note: notes ? notes[i] : 'C4',
        velocity: velocities && velocities[i] ? velocities[i] : 0.85,
        pitchOffset: 0,
        isRoll: rolls ? rolls.includes(idx) : false
      };
    }
  });
  return steps;
}

export const PRESET_PROJECTS: Record<string, ProjectData> = {
  'Cyber Trap': {
    title: 'AhPah - Cyber Trap',
    bpm: 140,
    swing: 12,
    masterVolume: 0.85,
    key: 'C',
    scale: 'Trap Phrygian',
    stepCount: 16,
    tracks: [
      {
        id: 't-kick',
        name: '808 Kick',
        type: 'drum',
        sound: 'kick-808',
        color: '#ff0055',
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([0, 6, 10, 14])
      },
      {
        id: 't-snare',
        name: 'Trap Snare',
        type: 'drum',
        sound: 'snare-trap',
        color: '#ff5500',
        volume: 0.85,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([4, 12])
      },
      {
        id: 't-clap',
        name: 'Layer Clap',
        type: 'drum',
        sound: 'snare-clap',
        color: '#ffaa00',
        volume: 0.75,
        pan: 0.1,
        muted: false,
        solo: false,
        steps: createPattern([4, 12])
      },
      {
        id: 't-hihat-c',
        name: 'Hi-Hat (Rolls)',
        type: 'drum',
        sound: 'hihat-closed',
        color: '#00f2fe',
        volume: 0.8,
        pan: -0.15,
        muted: false,
        solo: false,
        // Hi-hats on every 16th note with rolls on steps 7, 11, 15
        steps: createPattern(
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          undefined,
          [7, 11, 15],
          [0.9, 0.6, 0.8, 0.6, 0.9, 0.6, 0.8, 0.95, 0.9, 0.6, 0.8, 0.95, 0.9, 0.6, 0.8, 0.95]
        )
      },
      {
        id: 't-hihat-o',
        name: 'Open Hat',
        type: 'drum',
        sound: 'hihat-open',
        color: '#4facfe',
        volume: 0.65,
        pan: 0.25,
        muted: false,
        solo: false,
        steps: createPattern([2, 10])
      },
      {
        id: 't-sub808',
        name: 'Deep 808 Sub',
        type: 'synth',
        sound: '808-sub',
        color: '#b000ff',
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern(
          [0, 6, 10, 14],
          ['C2', 'C2', 'D#2', 'G2']
        )
      },
      {
        id: 't-lead',
        name: 'Cyber Lead',
        type: 'synth',
        sound: 'neon-lead',
        color: '#00ff88',
        volume: 0.75,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern(
          [0, 3, 6, 8, 11, 14],
          ['C4', 'D#4', 'G4', 'F4', 'D#4', 'D4']
        )
      },
      {
        id: 't-pluck',
        name: 'Neon Bell',
        type: 'synth',
        sound: 'cyber-pluck',
        color: '#f093fb',
        volume: 0.7,
        pan: 0.2,
        muted: false,
        solo: false,
        steps: createPattern(
          [2, 5, 8, 12, 15],
          ['G4', 'C5', 'D#5', 'G5', 'D#5']
        )
      }
    ],
    effects: {
      reverbWet: 0.25,
      reverbDecay: 2.5,
      delayWet: 0.22,
      delayTime: 0.26,
      delayFeedback: 0.35,
      distortionWet: 0.12,
      distortionDrive: 20,
      filterCutoff: 18000,
      filterResonance: 1.2,
      filterType: 'lowpass',
      masterCompressor: true,
      masterLimiter: true
    },
    synth: {
      waveform: 'sawtooth',
      attack: 0.015,
      decay: 0.18,
      sustain: 0.5,
      release: 0.2,
      cutoff: 4200,
      resonance: 3.5,
      filterEnv: 0.6,
      glide: 0.02
    }
  },

  'Synthwave Night': {
    title: 'AhPah - Synthwave 1984',
    bpm: 118,
    swing: 0,
    masterVolume: 0.85,
    key: 'A',
    scale: 'Minor (Aeolian)',
    stepCount: 16,
    tracks: [
      {
        id: 'sw-kick',
        name: 'Punch Kick',
        type: 'drum',
        sound: 'kick-punch',
        color: '#ff0055',
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([0, 4, 8, 12]) // Four on the floor!
      },
      {
        id: 'sw-snare',
        name: '80s Snare',
        type: 'drum',
        sound: 'snare-trap',
        color: '#ff5500',
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([4, 12])
      },
      {
        id: 'sw-hihat-c',
        name: 'Hi-Hat (16ths)',
        type: 'drum',
        sound: 'hihat-closed',
        color: '#00f2fe',
        volume: 0.7,
        pan: -0.2,
        muted: false,
        solo: false,
        steps: createPattern([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
      },
      {
        id: 'sw-hihat-o',
        name: 'Offbeat Hat',
        type: 'drum',
        sound: 'hihat-open',
        color: '#4facfe',
        volume: 0.7,
        pan: 0.2,
        muted: false,
        solo: false,
        steps: createPattern([2, 6, 10, 14])
      },
      {
        id: 'sw-bass',
        name: 'Driving Bass',
        type: 'synth',
        sound: 'retro-bass',
        color: '#ff007f',
        volume: 0.88,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern(
          [0, 2, 4, 6, 8, 10, 12, 14],
          ['A2', 'A2', 'A2', 'C3', 'F2', 'F2', 'G2', 'G2']
        )
      },
      {
        id: 'sw-lead',
        name: 'Supersaw Lead',
        type: 'synth',
        sound: 'neon-lead',
        color: '#00ff88',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern(
          [0, 3, 6, 8, 11, 14],
          ['E4', 'G4', 'A4', 'C5', 'B4', 'G4']
        )
      },
      {
        id: 'sw-pad',
        name: 'Warm Pad',
        type: 'synth',
        sound: 'warm-pad',
        color: '#7928ca',
        volume: 0.65,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([0, 8], ['A3', 'F3'])
      }
    ],
    effects: {
      reverbWet: 0.35,
      reverbDecay: 3.2,
      delayWet: 0.28,
      delayTime: 0.32,
      delayFeedback: 0.4,
      distortionWet: 0.08,
      distortionDrive: 12,
      filterCutoff: 16000,
      filterResonance: 1.5,
      filterType: 'lowpass',
      masterCompressor: true,
      masterLimiter: true
    },
    synth: {
      waveform: 'sawtooth',
      attack: 0.03,
      decay: 0.22,
      sustain: 0.6,
      release: 0.3,
      cutoff: 4800,
      resonance: 4.0,
      filterEnv: 0.7,
      glide: 0.03
    }
  },

  'Chillhop Lo-Fi': {
    title: 'AhPah - Chillhop Coffee',
    bpm: 84,
    swing: 35, // Relaxed laid back swing
    masterVolume: 0.82,
    key: 'F',
    scale: 'Dorian',
    stepCount: 16,
    tracks: [
      {
        id: 'lf-kick',
        name: 'Mellow Kick',
        type: 'drum',
        sound: 'kick-punch',
        color: '#ff7700',
        volume: 0.88,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([0, 5, 10])
      },
      {
        id: 'lf-snare',
        name: 'Lo-Fi Snare',
        type: 'drum',
        sound: 'snare-trap',
        color: '#ffaa00',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([4, 12])
      },
      {
        id: 'lf-hat',
        name: 'Swing Hat',
        type: 'drum',
        sound: 'hihat-closed',
        color: '#00f2fe',
        volume: 0.65,
        pan: -0.15,
        muted: false,
        solo: false,
        steps: createPattern([0, 2, 4, 6, 8, 10, 12, 14])
      },
      {
        id: 'lf-rhodes',
        name: 'Vintage Rhodes',
        type: 'synth',
        sound: 'lofi-rhodes',
        color: '#00ff88',
        volume: 0.85,
        pan: 0.1,
        muted: false,
        solo: false,
        steps: createPattern(
          [0, 4, 8, 12],
          ['F3', 'A3', 'C4', 'D#4']
        )
      },
      {
        id: 'lf-sub',
        name: 'Warm Sub',
        type: 'synth',
        sound: '808-sub',
        color: '#b000ff',
        volume: 0.75,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([0, 8], ['F2', 'C2'])
      }
    ],
    effects: {
      reverbWet: 0.38,
      reverbDecay: 2.8,
      delayWet: 0.18,
      delayTime: 0.36,
      delayFeedback: 0.25,
      distortionWet: 0.15,
      distortionDrive: 25,
      filterCutoff: 3800, // Lo-Fi warm low-pass filter
      filterResonance: 1.0,
      filterType: 'lowpass',
      masterCompressor: true,
      masterLimiter: true
    },
    synth: {
      waveform: 'triangle',
      attack: 0.05,
      decay: 0.3,
      sustain: 0.7,
      release: 0.4,
      cutoff: 2200,
      resonance: 1.5,
      filterEnv: 0.3,
      glide: 0.01
    }
  },

  'Club House / EDM': {
    title: 'AhPah - Ibiza Club',
    bpm: 126,
    swing: 8,
    masterVolume: 0.85,
    key: 'G',
    scale: 'Minor (Aeolian)',
    stepCount: 16,
    tracks: [
      {
        id: 'ch-kick',
        name: 'Punchy 909',
        type: 'drum',
        sound: 'kick-punch',
        color: '#ff0055',
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([0, 4, 8, 12])
      },
      {
        id: 'ch-clap',
        name: 'Club Clap',
        type: 'drum',
        sound: 'snare-clap',
        color: '#ffaa00',
        volume: 0.85,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern([4, 12])
      },
      {
        id: 'ch-hat-o',
        name: 'Offbeat Hat',
        type: 'drum',
        sound: 'hihat-open',
        color: '#00f2fe',
        volume: 0.8,
        pan: 0.15,
        muted: false,
        solo: false,
        steps: createPattern([2, 6, 10, 14])
      },
      {
        id: 'ch-perc',
        name: 'Rim Groove',
        type: 'drum',
        sound: 'percussion',
        color: '#ff5500',
        volume: 0.75,
        pan: -0.2,
        muted: false,
        solo: false,
        steps: createPattern([3, 7, 11, 15])
      },
      {
        id: 'ch-bass',
        name: 'Bouncy Bass',
        type: 'synth',
        sound: 'retro-bass',
        color: '#00ff88',
        volume: 0.88,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern(
          [1, 3, 5, 7, 9, 11, 13, 15],
          ['G2', 'G2', 'A#2', 'G2', 'C3', 'G2', 'F2', 'G2']
        )
      },
      {
        id: 'ch-pluck',
        name: 'Club Pluck',
        type: 'synth',
        sound: 'cyber-pluck',
        color: '#b000ff',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        steps: createPattern(
          [0, 3, 6, 8, 12, 14],
          ['G4', 'A#4', 'D5', 'C5', 'A#4', 'G4']
        )
      }
    ],
    effects: {
      reverbWet: 0.22,
      reverbDecay: 2.0,
      delayWet: 0.24,
      delayTime: 0.24,
      delayFeedback: 0.3,
      distortionWet: 0.1,
      distortionDrive: 14,
      filterCutoff: 18000,
      filterResonance: 1.2,
      filterType: 'lowpass',
      masterCompressor: true,
      masterLimiter: true
    },
    synth: {
      waveform: 'square',
      attack: 0.01,
      decay: 0.15,
      sustain: 0.4,
      release: 0.15,
      cutoff: 4000,
      resonance: 3.5,
      filterEnv: 0.6,
      glide: 0.02
    }
  }
};
