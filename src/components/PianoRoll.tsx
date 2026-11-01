import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import { SCALES } from '../audio/presets';
import { audioEngine } from '../audio/AudioEngine';
import {
  Music,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Clock,
  Plus,
  Copy,
  Undo2,
  Redo2
} from 'lucide-react';

interface PianoRollProps {
  tracks: Track[];
  selectedTrackIndex: number;
  currentStep: number;
  stepCount: number; // e.g. 16, 32, 64, 128
  isPlaying: boolean;
  scaleName: string;
  rootKey: string;
  onSelectTrack: (index: number) => void;
  onSetNote: (trackIndex: number, stepIndex: number, note: string | null, duration?: number) => void;
  onResizeNote?: (trackIndex: number, stepIndex: number, duration: number) => void;
  onAddBar?: () => void;
  onDuplicateBar?: (sourceBar: number, targetBar: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const PianoRoll: React.FC<PianoRollProps> = ({
  tracks,
  selectedTrackIndex,
  currentStep,
  stepCount,
  isPlaying,
  scaleName,
  rootKey,
  onSelectTrack,
  onSetNote,
  onResizeNote,
  onAddBar,
  onDuplicateBar
}) => {
  const [octaveOffset, setOctaveOffset] = useState<number>(3); // base octave: 3 (C3 to B4)
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // 1, 2, 4, 8 steps
  const [activeBar, setActiveBar] = useState<number>(0);
  const [followPlayhead, setFollowPlayhead] = useState<boolean>(false);

  const synthTracks = tracks
    .map((t, idx) => ({ track: t, originalIdx: idx }))
    .filter((t) => t.track.type === 'synth');

  const currentTrack = tracks[selectedTrackIndex];
  const isSynth = currentTrack && currentTrack.type === 'synth';
  const totalBars = Math.max(1, Math.ceil(stepCount / 16));

  // Follow playhead if enabled
  useEffect(() => {
    if (isPlaying && followPlayhead) {
      const playingBar = Math.floor(currentStep / 16);
      if (playingBar !== activeBar && playingBar < totalBars) {
        setActiveBar(playingBar);
      }
    }
  }, [isPlaying, currentStep, followPlayhead, activeBar, totalBars]);

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

  const handleCellClick = (localStepIdx: number, note: string) => {
    if (!currentTrack) return;
    const globalStepIdx = activeBar * 16 + localStepIdx;
    const step = currentTrack.steps[globalStepIdx];

    if (step && step.active && step.note === note) {
      // Toggle off
      onSetNote(selectedTrackIndex, globalStepIdx, null);
    } else {
      // Toggle on with this note and selected duration
      onSetNote(selectedTrackIndex, globalStepIdx, note, selectedDuration);
      audioEngine.triggerSound(currentTrack, note, 0.85);
    }
  };

  const handleCycleDuration = (e: React.MouseEvent, globalStepIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentTrack) return;
    const step = currentTrack.steps[globalStepIdx];
    if (step && step.active) {
      const durations = [1, 2, 4, 8];
      const curDur = step.duration || 1;
      const nextIdx = (durations.indexOf(curDur) + 1) % durations.length;
      const newDur = durations[nextIdx];
      if (onResizeNote) {
        onResizeNote(selectedTrackIndex, globalStepIdx, newDur);
      } else {
        onSetNote(selectedTrackIndex, globalStepIdx, step.note || 'C4', newDur);
      }
    }
  };

  const handleStepDurationAdjust = (
    e: React.MouseEvent,
    globalStepIdx: number,
    delta: number
  ) => {
    e.stopPropagation();
    if (!currentTrack) return;
    const step = currentTrack.steps[globalStepIdx];
    if (step && step.active) {
      const curDur = step.duration || 1;
      const newDur = Math.max(1, Math.min(16 - (globalStepIdx % 16), curDur + delta));
      if (onResizeNote) {
        onResizeNote(selectedTrackIndex, globalStepIdx, newDur);
      } else {
        onSetNote(selectedTrackIndex, globalStepIdx, step.note || 'C4', newDur);
      }
    }
  };

  if (!isSynth) {
    return (
      <div className="w-full bg-[#0d111a] rounded-xl border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center mb-3">
          <Music className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-200">Piano Roll Melodic Editor</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
          Select a synthesizer or bass voice below to compose melodies, basslines, and chord patterns.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {synthTracks.map(({ track, originalIdx }) => (
            <button
              key={track.id}
              onClick={() => onSelectTrack(originalIdx)}
              className="px-3.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              Open {track.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0d111a] rounded-xl border border-slate-800/80 p-3 sm:p-4 shadow-xl flex flex-col gap-3">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-950/80 border border-pink-800/60 flex items-center justify-center">
              <Music className="w-4 h-4 text-pink-400" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
              Melodic Piano Roll
            </h3>
          </div>

          {/* Synth Track Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#10141f] p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
            {synthTracks.map(({ track, originalIdx }) => (
              <button
                key={track.id}
                onClick={() => onSelectTrack(originalIdx)}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTrackIndex === originalIdx
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm shadow-pink-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {track.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Selector Strip & Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {Array.from({ length: totalBars }).map((_, barIdx) => {
            const isPlayingBar = isPlaying && Math.floor(currentStep / 16) === barIdx;
            const isSelected = activeBar === barIdx;

            return (
              <button
                key={barIdx}
                onClick={() => setActiveBar(barIdx)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700'
                }`}
              >
                {isPlayingBar && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                )}
                <span>Bar {barIdx + 1}</span>
              </button>
            );
          })}

          {onAddBar && (
            <button
              onClick={onAddBar}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-cyan-400 border border-slate-700/60 text-xs font-bold active:scale-95 transition-all cursor-pointer"
              title="Add 1 more bar (16 steps)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
          )}

          {onDuplicateBar && totalBars > 1 && (
            <button
              onClick={() => {
                const nextBar = (activeBar + 1) % totalBars;
                onDuplicateBar(activeBar, nextBar);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-purple-300 border border-slate-700/60 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              title="Duplicate current bar notes to next bar"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Bar</span>
            </button>
          )}

          <button
            onClick={() => setFollowPlayhead(!followPlayhead)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              followPlayhead
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
            }`}
            title="Auto-switch view to playing bar"
          >
            Follow
          </button>
        </div>

        {/* Note Duration & Octave Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Note Duration Picker */}
          <div className="flex items-center gap-1 bg-[#10141f] px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400 mr-1" />
            <span className="text-[10px] text-slate-400 font-mono font-bold mr-1">LENGTH:</span>
            {[
              { steps: 1, label: '1/16' },
              { steps: 2, label: '1/8' },
              { steps: 4, label: '1/4' },
              { steps: 8, label: '1/2' }
            ].map(({ steps, label }) => (
              <button
                key={steps}
                onClick={() => setSelectedDuration(steps)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  selectedDuration === steps
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
                title={`Set new notes duration to ${steps} steps (${label})`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Octave Navigation */}
          <div className="flex items-center gap-1 bg-[#10141f] px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-500 font-mono font-bold">OCTAVE:</span>
            <span className="text-cyan-300 font-mono font-bold">C{octaveOffset}–B{octaveOffset + 1}</span>
            <button
              onClick={() => setOctaveOffset((o) => Math.max(1, o - 1))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Lower Octave"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOctaveOffset((o) => Math.min(5, o + 1))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Higher Octave"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/50">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{rootKey} {scaleName}</span>
          </div>
        </div>
      </div>

      {/* Grid Guide Banner */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 py-1 bg-[#10141f] rounded-lg border border-slate-800/60 font-mono">
        <span>Bar {activeBar + 1} • Steps {activeBar * 16 + 1}–{activeBar * 16 + 16} • Cyan dot marks notes in {rootKey} {scaleName}</span>
        <span className="text-cyan-400 font-semibold">{currentTrack?.name} Active</span>
      </div>

      {/* Piano Roll Grid Container */}
      <div className="w-full max-h-[380px] overflow-y-auto scrollbar-thin rounded-lg border border-slate-800 bg-[#07090f]">
        <div className="flex flex-col">
          {displayNotes.map((note) => {
            const pitchName = note.replace(/\d+/, '');
            const isBlackKey = pitchName.includes('#');
            const isInScale = scaleNoteNames.has(pitchName);

            return (
              <div
                key={note}
                className={`flex items-center border-b border-slate-900/90 ${
                  isBlackKey ? 'bg-[#090c13]' : 'bg-[#0d121c]'
                }`}
              >
                {/* Piano Key */}
                <button
                  onClick={() => handleKeyClick(note)}
                  className={`w-20 sm:w-24 h-7 flex-shrink-0 flex items-center justify-between px-2 text-[10px] font-mono font-bold border-r border-slate-800/90 transition-colors active:bg-cyan-500 active:text-slate-950 cursor-pointer ${
                    isBlackKey
                      ? 'bg-slate-950 text-slate-400 hover:bg-slate-900 shadow-inner'
                      : 'bg-slate-800/40 text-slate-200 hover:bg-slate-700/60'
                  }`}
                  title={`Play note ${note}`}
                >
                  <span>{note}</span>
                  {isInScale && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/90 shadow-sm" />
                  )}
                </button>

                {/* 16 Step Cells for Active Bar */}
                <div className="flex flex-1 items-center relative h-7">
                  {Array.from({ length: 16 }).map((_, localStepIdx) => {
                    const globalStepIdx = activeBar * 16 + localStepIdx;
                    const step = currentTrack.steps[globalStepIdx];
                    const isNoteHead = step && step.active && step.note === note;
                    const isCurrent = isPlaying && currentStep === globalStepIdx;
                    const isBeatQuarter = localStepIdx % 4 === 0;

                    // Sustained tail detection
                    let isSustainedTail = false;
                    if (!isNoteHead && currentTrack) {
                      for (let prevIdx = Math.max(0, globalStepIdx - 15); prevIdx < globalStepIdx; prevIdx++) {
                        const prevStep = currentTrack.steps[prevIdx];
                        if (
                          prevStep &&
                          prevStep.active &&
                          prevStep.note === note &&
                          prevIdx + (prevStep.duration || 1) > globalStepIdx
                        ) {
                          isSustainedTail = true;
                          break;
                        }
                      }
                    }

                    const noteDuration = isNoteHead ? (step?.duration || 1) : 1;

                    return (
                      <div
                        key={localStepIdx}
                        onClick={() => handleCellClick(localStepIdx, note)}
                        onContextMenu={(e) => isNoteHead && handleCycleDuration(e, globalStepIdx)}
                        className={`flex-1 h-7 border-r border-slate-900/60 transition-all relative flex items-center justify-between px-0.5 cursor-pointer ${
                          isCurrent ? 'bg-cyan-950/40 ring-1 ring-cyan-400/40 z-20' : ''
                        } ${
                          isNoteHead
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-sm shadow-pink-500/30 text-white z-10 rounded-sm'
                            : isSustainedTail
                            ? 'bg-purple-900/50 border-t border-b border-purple-500/30'
                            : isInScale
                            ? isBeatQuarter
                              ? 'hover:bg-slate-800/60 bg-slate-900/20'
                              : 'hover:bg-slate-800/40 bg-transparent'
                            : isBeatQuarter
                            ? 'hover:bg-slate-800/40 bg-slate-950/40'
                            : 'hover:bg-slate-800/30 bg-slate-950/70'
                        }`}
                        title={
                          isNoteHead
                            ? `${note} (Bar ${activeBar + 1}, Duration: ${noteDuration} steps) • Right-click or use [+] / [-] to resize`
                            : isSustainedTail
                            ? `${note} (Sustained)`
                            : `${note} at Bar ${activeBar + 1}, Step ${localStepIdx + 1}`
                        }
                      >
                        {isNoteHead && (
                          <>
                            <span className="text-[9px] font-mono font-bold leading-none select-none pl-0.5 truncate">
                              {note}
                            </span>
                            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleStepDurationAdjust(e, globalStepIdx, -1)}
                                className="w-3.5 h-3.5 flex items-center justify-center rounded bg-black/40 hover:bg-black/80 text-[8px] leading-none text-white cursor-pointer"
                                title="Shorten note (-1 step)"
                              >
                                -
                              </button>
                              <button
                                onClick={(e) => handleStepDurationAdjust(e, globalStepIdx, 1)}
                                className="w-3.5 h-3.5 flex items-center justify-center rounded bg-black/40 hover:bg-black/80 text-[8px] leading-none text-white cursor-pointer"
                                title="Lengthen note (+1 step)"
                              >
                                +
                              </button>
                            </div>
                          </>
                        )}
                        {isSustainedTail && (
                          <div className="w-full h-1 bg-pink-400/50 rounded-full mx-auto" />
                        )}
                      </div>
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
