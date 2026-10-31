import React, { useState } from 'react';
import { Track, NoteStep } from '../types';
import { SCALES } from '../audio/presets';
import { audioEngine } from '../audio/AudioEngine';
import { Music, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

interface PianoRollProps {
  tracks: Track[];
  selectedTrackIndex: number;
  currentStep: number;
  isPlaying: boolean;
  scaleName: string;
  rootKey: string;
  onSelectTrack: (index: number) => void;
  onSetNote: (trackIndex: number, stepIndex: number, note: string | null) => void;
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const PianoRoll: React.FC<PianoRollProps> = ({
  tracks,
  selectedTrackIndex,
  currentStep,
  isPlaying,
  scaleName,
  rootKey,
  onSelectTrack,
  onSetNote
}) => {
  const [octaveOffset, setOctaveOffset] = useState<number>(3); // base octave: 3 (C3 to B4)
  const synthTracks = tracks.map((t, idx) => ({ track: t, originalIdx: idx })).filter((t) => t.track.type === 'synth');

  const currentTrack = tracks[selectedTrackIndex];
  const isSynth = currentTrack && currentTrack.type === 'synth';

  // Build 2 octaves of notes from top to bottom (e.g. B4 down to C3)
  const displayNotes: string[] = [];
  for (let oct = octaveOffset + 1; oct >= octaveOffset; oct--) {
    for (let i = ALL_NOTES.length - 1; i >= 0; i--) {
      displayNotes.push(`${ALL_NOTES[i]}${oct}`);
    }
  }

  // Calculate notes in scale
  const scaleIntervals = SCALES[scaleName] || SCALES['Minor (Aeolian)'];
  const rootIndex = ALL_NOTES.indexOf(rootKey);
  const scaleNoteNames = new Set(
    scaleIntervals.map((interval) => ALL_NOTES[(rootIndex + interval) % 12])
  );

  const handleKeyClick = (note: string) => {
    if (currentTrack) {
      audioEngine.triggerSound(currentTrack, note, 0.85);
    }
  };

  const handleCellClick = (stepIdx: number, note: string) => {
    if (!currentTrack) return;
    const step = currentTrack.steps[stepIdx];
    if (step && step.active && step.note === note) {
      // Toggle off
      onSetNote(selectedTrackIndex, stepIdx, null);
    } else {
      // Toggle on with this note
      onSetNote(selectedTrackIndex, stepIdx, note);
      audioEngine.triggerSound(currentTrack, note, 0.85);
    }
  };

  if (!isSynth) {
    return (
      <div className="w-full bg-[#0d111a] rounded-2xl border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center">
        <Music className="w-10 h-10 text-slate-600 mb-2" />
        <h3 className="text-sm font-bold text-slate-400">Piano Roll Melodic Editor</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Select a synthesizer or bass track above to compose melodies, basslines, and chord progressions.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {synthTracks.map(({ track, originalIdx }) => (
            <button
              key={track.id}
              onClick={() => onSelectTrack(originalIdx)}
              className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-300 text-xs font-semibold transition-all active:scale-95"
            >
              Open {track.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0d111a] rounded-2xl border border-slate-800/80 p-4 shadow-2xl flex flex-col gap-3">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-slate-200">Piano Roll Melody Editor</h3>
          </div>

          {/* Synth Track Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-[#121622] p-1 rounded-xl border border-slate-800">
            {synthTracks.map(({ track, originalIdx }) => (
              <button
                key={track.id}
                onClick={() => onSelectTrack(originalIdx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedTrackIndex === originalIdx
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {track.name}
              </button>
            ))}
          </div>
        </div>

        {/* Octave Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#121622] px-2 py-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-500 font-mono font-bold">OCTAVE:</span>
            <span className="text-cyan-400 font-mono font-bold">C{octaveOffset}-C{octaveOffset + 2}</span>
            <button
              onClick={() => setOctaveOffset((o) => Math.max(1, o - 1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Lower Octave"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOctaveOffset((o) => Math.min(5, o + 1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Higher Octave"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-xl border border-cyan-800/40">
            <Sparkles className="w-3 h-3" />
            <span>Scale Locked: {rootKey} {scaleName}</span>
          </div>
        </div>
      </div>

      {/* Piano Roll Grid Container */}
      <div className="w-full max-h-[340px] overflow-y-auto scrollbar-thin rounded-xl border border-slate-800 bg-[#080b11]">
        <div className="flex flex-col">
          {displayNotes.map((note) => {
            const pitchName = note.replace(/\d+/, '');
            const isBlackKey = pitchName.includes('#');
            const isInScale = scaleNoteNames.has(pitchName);

            return (
              <div
                key={note}
                className={`flex items-center border-b border-slate-900/80 ${
                  isBlackKey ? 'bg-[#0a0d14]' : 'bg-[#0f1420]'
                }`}
              >
                {/* Piano Key button */}
                <button
                  onClick={() => handleKeyClick(note)}
                  className={`w-20 sm:w-24 h-7 flex-shrink-0 flex items-center justify-between px-2 text-[11px] font-mono font-bold border-r border-slate-800 transition-colors active:bg-cyan-500 active:text-slate-950 ${
                    isBlackKey
                      ? 'bg-slate-950 text-slate-400 hover:bg-slate-900'
                      : 'bg-slate-800/50 text-slate-200 hover:bg-slate-700/60'
                  }`}
                >
                  <span>{note}</span>
                  {isInScale && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"></span>
                  )}
                </button>

                {/* 16 Step Cells */}
                <div className="flex flex-1 items-center">
                  {Array.from({ length: 16 }).map((_, stepIdx) => {
                    const step = currentTrack.steps[stepIdx];
                    const isActive = step && step.active && step.note === note;
                    const isCurrent = isPlaying && currentStep === stepIdx;
                    const isBeatQuarter = stepIdx % 4 === 0;

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => handleCellClick(stepIdx, note)}
                        className={`flex-1 h-7 border-r border-slate-900/60 transition-all ${
                          isCurrent ? 'bg-cyan-950/50' : ''
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-md shadow-pink-500/30 font-bold text-[9px] text-white flex items-center justify-center'
                            : isInScale
                            ? isBeatQuarter
                              ? 'hover:bg-slate-800/60 bg-slate-900/20'
                              : 'hover:bg-slate-800/40 bg-transparent'
                            : isBeatQuarter
                            ? 'hover:bg-slate-800/40 bg-slate-950/40'
                            : 'hover:bg-slate-800/30 bg-slate-950/70'
                        }`}
                        title={`${note} at step ${stepIdx + 1}`}
                      >
                        {isActive && <span>♪</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
