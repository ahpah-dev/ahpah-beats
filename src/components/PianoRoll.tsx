import React, { useState, useEffect, useRef } from 'react';
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
  Copy
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
  const [dragTarget, setDragTarget] = useState<{ step: number; note: string } | null>(null);
  const dragTargetRef = useRef<{ step: number; note: string } | null>(null);
  const dragStartRef = useRef<{ step: number; note: string; duration: number } | null>(null);
  const didDragRef = useRef<boolean>(false);

  const synthTracks = tracks
    .map((t, idx) => ({ track: t, originalIdx: idx }))
    .filter((t) => t.track.type === 'synth');

  const currentTrack = tracks[selectedTrackIndex];
  const isSynth = currentTrack && currentTrack.type === 'synth';
  const totalBars = Math.max(1, Math.ceil(stepCount / 16));

  // Global drag listeners for moving notes
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const cell = el?.closest('[data-pr-step][data-pr-note]') as HTMLElement | null;
      if (cell) {
        const step = parseInt(cell.getAttribute('data-pr-step') || '', 10);
        const note = cell.getAttribute('data-pr-note') || '';
        if (!isNaN(step) && note) {
          if (step !== dragStartRef.current.step || note !== dragStartRef.current.note) {
            didDragRef.current = true;
          }
          const t = { step, note };
          dragTargetRef.current = t;
          setDragTarget(t);
          return;
        }
      }
      dragTargetRef.current = null;
      setDragTarget(null);
    };

    const handleUp = () => {
      if (!dragStartRef.current) return;
      const start = dragStartRef.current;
      const target = dragTargetRef.current;
      dragStartRef.current = null;
      if (didDragRef.current && target && (target.step !== start.step || target.note !== start.note)) {
        // Move: clear original, place at target
        onSetNote(selectedTrackIndex, start.step, null);
        onSetNote(selectedTrackIndex, target.step, target.note, start.duration);
        if (currentTrack) {
          audioEngine.triggerSound(currentTrack, target.note, 0.85);
        }
      }
      didDragRef.current = false;
      dragTargetRef.current = null;
      setDragTarget(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [selectedTrackIndex, currentTrack, onSetNote]);

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
      <div className="w-full panel p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-magenta/10 border border-magenta/20 flex items-center justify-center mb-3">
          <Music className="w-6 h-6 text-magenta" />
        </div>
        <h3 className="text-sm font-bold text-ink">Piano Roll Melodic Editor</h3>
        <p className="text-xs text-ink-2 max-w-sm mt-1 mb-4">
          Select a synthesizer or bass voice below to compose melodies, basslines, and chord patterns.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {synthTracks.map(({ track, originalIdx }) => (
            <button
              key={track.id}
              onClick={() => onSelectTrack(originalIdx)}
              className="btn"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: track.color }}
              />
              <span>Open {track.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full panel p-3 sm:p-4 flex flex-col gap-3">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-magenta/10 border border-magenta/20 flex items-center justify-center flex-shrink-0">
              <Music className="w-4 h-4 text-magenta" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Melodic Piano Roll
            </h3>
          </div>

          {/* Synth Track Selector Tabs */}
          <div className="flex items-center gap-1 bg-well p-1 rounded-md border border-line overflow-x-auto max-w-full">
            {synthTracks.map(({ track, originalIdx }) => (
              <button
                key={track.id}
                onClick={() => onSelectTrack(originalIdx)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedTrackIndex === originalIdx
                    ? 'bg-raised text-ink border-line-strong'
                    : 'text-ink-3 border-transparent hover:text-ink-2'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <span>{track.name}</span>
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
                className={`relative px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-raised text-ink border-line-strong'
                    : 'bg-well text-ink-3 border-line hover:text-ink-2'
                }`}
              >
                {isPlayingBar && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                <span>Bar {barIdx + 1}</span>
              </button>
            );
          })}

          {onAddBar && (
            <button
              onClick={onAddBar}
              className="btn h-7"
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
              className="btn h-7"
              title="Duplicate current bar notes to next bar"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Bar</span>
            </button>
          )}

          <button
            onClick={() => setFollowPlayhead(!followPlayhead)}
            className={`h-7 px-2.5 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer border ${
              followPlayhead
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                : 'bg-well text-ink-3 border-line hover:text-ink-2'
            }`}
            title="Auto-switch view to playing bar"
          >
            Follow
          </button>
        </div>

        {/* Note Duration & Octave Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Note Duration Picker */}
          <div className="flex items-center gap-1 well px-2.5 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-accent mr-1 flex-shrink-0" />
            <span className="micro-label mr-1">Length</span>
            {[
              { steps: 1, label: '1/16' },
              { steps: 2, label: '1/8' },
              { steps: 4, label: '1/4' },
              { steps: 8, label: '1/2' }
            ].map(({ steps, label }) => (
              <button
                key={steps}
                onClick={() => setSelectedDuration(steps)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                  selectedDuration === steps
                    ? 'bg-raised text-ink border-line-strong'
                    : 'text-ink-3 border-transparent hover:text-ink-2'
                }`}
                title={`Set new notes duration to ${steps} steps (${label})`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Octave Navigation */}
          <div className="flex items-center gap-1 well px-2 py-1 text-xs">
            <span className="micro-label">Octave</span>
            <span className="text-accent font-mono font-bold">C{octaveOffset}–B{octaveOffset + 1}</span>
            <button
              onClick={() => setOctaveOffset((o) => Math.max(1, o - 1))}
              className="p-1 text-ink-3 hover:text-ink cursor-pointer"
              title="Lower Octave"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOctaveOffset((o) => Math.min(5, o + 1))}
              className="p-1 text-ink-3 hover:text-ink cursor-pointer"
              title="Higher Octave"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-md border border-accent/20">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>{rootKey} {scaleName}</span>
          </div>
        </div>
      </div>

      {/* Grid Guide Banner */}
      <div className="flex items-center justify-between text-[10px] text-ink-3 px-2 py-1 bg-well rounded-md border border-line font-mono">
        <span>Bar {activeBar + 1} • Steps {activeBar * 16 + 1}–{activeBar * 16 + 16} • Cyan dot marks notes in {rootKey} {scaleName}</span>
        <span className="text-accent font-semibold">{currentTrack?.name} Active</span>
      </div>

      {/* Piano Roll Grid Container */}
      <div className="w-full max-h-[380px] overflow-y-auto rounded-lg border border-line bg-well">
        <div className="flex flex-col">
          {displayNotes.map((note) => {
            const pitchName = note.replace(/\d+/, '');
            const isBlackKey = pitchName.includes('#');
            const isInScale = scaleNoteNames.has(pitchName);

            return (
              <div
                key={note}
                className={`flex items-center border-b border-line/50 ${
                  isBlackKey ? 'bg-base/60' : ''
                }`}
              >
                {/* Piano Key */}
                <button
                  onClick={() => handleKeyClick(note)}
                  className={`w-20 sm:w-24 h-7 flex-shrink-0 flex items-center justify-between px-2 text-[10px] font-mono font-bold border-r border-line transition-colors cursor-pointer ${
                    isBlackKey
                      ? 'bg-well text-ink-3 hover:text-ink-2'
                      : 'bg-raised text-ink-2 hover:text-ink'
                  }`}
                  title={`Play note ${note}`}
                >
                  <span>{note}</span>
                  {isInScale && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/70" />
                  )}
                </button>

                {/* 16 Step Cells for Active Bar */}
                <div className="flex flex-1 items-center relative h-7 min-w-max">
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
                        data-pr-step={globalStepIdx}
                        data-pr-note={note}
                        onClick={() => {
                          if (didDragRef.current) {
                            didDragRef.current = false;
                            return;
                          }
                          handleCellClick(localStepIdx, note);
                        }}
                        onMouseDown={() => {
                          if (isNoteHead && step) {
                            dragStartRef.current = {
                              step: globalStepIdx,
                              note,
                              duration: step.duration || 1
                            };
                            didDragRef.current = false;
                          }
                        }}
                        onContextMenu={(e) => isNoteHead && handleCycleDuration(e, globalStepIdx)}
                        className={`flex-1 h-7 border-r border-line/40 transition-colors relative flex items-center justify-between px-0.5 cursor-pointer ${
                          isCurrent ? 'bg-accent/[0.07]' : ''
                        } ${isBeatQuarter ? 'border-l border-line/70' : ''} ${
                          isNoteHead
                            ? dragTarget && dragTarget.step === globalStepIdx && dragTarget.note === note
                              ? 'ring-2 ring-accent'
                              : ''
                            : isSustainedTail
                            ? 'border-t border-b'
                            : isInScale
                            ? 'hover:bg-raised/60'
                            : 'hover:bg-raised/30'
                        } ${dragTarget && dragTarget.step === globalStepIdx && dragTarget.note === note && !isNoteHead ? 'bg-accent/20 ring-1 ring-accent' : ''}`}
                        style={
                          isNoteHead
                            ? { backgroundColor: currentTrack.color, opacity: dragStartRef.current?.step === globalStepIdx && dragStartRef.current?.note === note ? 0.6 : 1 }
                            : isSustainedTail
                            ? {
                                backgroundColor: `${currentTrack.color}26`,
                                borderTopColor: `${currentTrack.color}55`,
                                borderBottomColor: `${currentTrack.color}55`
                              }
                             : undefined
                        }
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
                            <span className="text-[9px] font-mono font-bold leading-none select-none pl-0.5 truncate text-black/80">
                              {note}
                            </span>
                            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleStepDurationAdjust(e, globalStepIdx, -1)}
                                className="w-3.5 h-3.5 flex items-center justify-center rounded bg-black/30 hover:bg-black/60 text-[8px] leading-none text-white cursor-pointer"
                                title="Shorten note (-1 step)"
                              >
                                -
                              </button>
                              <button
                                onClick={(e) => handleStepDurationAdjust(e, globalStepIdx, 1)}
                                className="w-3.5 h-3.5 flex items-center justify-center rounded bg-black/30 hover:bg-black/60 text-[8px] leading-none text-white cursor-pointer"
                                title="Lengthen note (+1 step)"
                              >
                                +
                              </button>
                            </div>
                          </>
                        )}
                        {isSustainedTail && (
                          <div className="w-full h-0.5 rounded-full mx-auto" style={{ backgroundColor: `${currentTrack.color}66` }} />
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
