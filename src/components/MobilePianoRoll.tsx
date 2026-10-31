import React, { useState, useEffect } from 'react';
import { Track, NoteStep } from '../types';
import { SCALES } from '../audio/presets';
import { audioEngine } from '../audio/AudioEngine';
import {
  Music,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Copy,
  Plus,
  Trash2,
  Lock,
  Layers,
  Check
} from 'lucide-react';

interface MobilePianoRollProps {
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
  onDuplicateBar?: (sourceBar: number, targetBar: number) => void;
  onAddBar?: () => void;
  onChangeStepCount?: (newCount: number) => void;
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MobilePianoRoll: React.FC<MobilePianoRollProps> = ({
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
  onDuplicateBar,
  onAddBar
}) => {
  const [octave, setOctave] = useState<number>(4);
  const [activeBar, setActiveBar] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [scaleOnly, setScaleOnly] = useState<boolean>(true);
  const [followPlayhead, setFollowPlayhead] = useState<boolean>(false);

  const synthTracks = tracks
    .map((t, idx) => ({ track: t, originalIdx: idx }))
    .filter((t) => t.track.type === 'synth');

  const currentTrack = tracks[selectedTrackIndex] || synthTracks[0]?.track;
  const totalBars = Math.max(1, Math.ceil(stepCount / 16));

  // Auto-follow playhead if enabled
  useEffect(() => {
    if (isPlaying && followPlayhead) {
      const playingBar = Math.floor(currentStep / 16);
      if (playingBar !== activeBar && playingBar < totalBars) {
        setActiveBar(playingBar);
      }
    }
  }, [isPlaying, currentStep, followPlayhead, activeBar, totalBars]);

  // Notes in scale
  const scaleIntervals = SCALES[scaleName] || SCALES['Minor (Aeolian)'];
  const rootIndex = ALL_NOTES.indexOf(rootKey);
  const scaleNoteNames = new Set(
    scaleIntervals.map((interval) => ALL_NOTES[(rootIndex + interval) % 12])
  );

  // Generate displayed notes (from high to low)
  const displayNotes: string[] = [];
  const octavesToDisplay = [octave + 1, octave];

  for (const oct of octavesToDisplay) {
    for (let i = ALL_NOTES.length - 1; i >= 0; i--) {
      const noteName = ALL_NOTES[i];
      if (!scaleOnly || scaleNoteNames.has(noteName)) {
        displayNotes.push(`${noteName}${oct}`);
      }
    }
  }

  const handleKeyClick = (note: string) => {
    if (currentTrack) {
      audioEngine.triggerSound(currentTrack, note, 0.9);
    }
  };

  const handleCellClick = (localStepIdx: number, note: string) => {
    if (!currentTrack) return;
    const globalStepIdx = activeBar * 16 + localStepIdx;
    const step = currentTrack.steps[globalStepIdx];

    if (step && step.active && step.note === note) {
      // Delete note
      onSetNote(selectedTrackIndex, globalStepIdx, null);
    } else {
      // Place note
      onSetNote(selectedTrackIndex, globalStepIdx, note, selectedDuration);
      audioEngine.triggerSound(currentTrack, note, 0.9);
    }
  };

  const handleCycleDuration = (e: React.MouseEvent, globalStepIdx: number) => {
    e.stopPropagation();
    if (!currentTrack) return;
    const step = currentTrack.steps[globalStepIdx];
    if (step && step.active) {
      const durations = [1, 2, 4, 8];
      const curDur = step.duration || 1;
      const nextDur = durations[(durations.indexOf(curDur) + 1) % durations.length];
      if (onResizeNote) {
        onResizeNote(selectedTrackIndex, globalStepIdx, nextDur);
      } else {
        onSetNote(selectedTrackIndex, globalStepIdx, step.note || 'C4', nextDur);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none pb-6">
      {/* 1. Synth Track Selector */}
      <div className="w-full bg-[#121622] p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin py-0.5 flex-1 min-w-0">
          {synthTracks.map(({ track, originalIdx }) => {
            const isSelected = selectedTrackIndex === originalIdx;
            return (
              <button
                key={track.id}
                onClick={() => onSelectTrack(originalIdx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <span>{track.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Bar Navigation & Song Length Bar */}
      <div className="w-full bg-[#121622] px-3 py-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        {/* Bars Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {Array.from({ length: totalBars }).map((_, barIdx) => {
            const isCurrentPlayingBar = isPlaying && Math.floor(currentStep / 16) === barIdx;
            const isSelectedBar = activeBar === barIdx;

            return (
              <button
                key={barIdx}
                onClick={() => setActiveBar(barIdx)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all relative ${
                  isSelectedBar
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {isCurrentPlayingBar && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <span>Bar {barIdx + 1}</span>
              </button>
            );
          })}

          {onAddBar && (
            <button
              onClick={onAddBar}
              className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700/60"
              title="Add another bar (makes song 16 steps longer)"
            >
              + Bar
            </button>
          )}
        </div>

        {/* Duplicate Bar & Follow Mode */}
        <div className="flex items-center gap-1.5">
          {onDuplicateBar && totalBars > 1 && (
            <button
              onClick={() => {
                const nextBar = (activeBar + 1) % totalBars;
                onDuplicateBar(activeBar, nextBar);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-purple-300 border border-slate-700 text-xs font-semibold"
              title="Duplicate current bar notes to next bar"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Bar</span>
            </button>
          )}

          <button
            onClick={() => setFollowPlayhead(!followPlayhead)}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              followPlayhead
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="Auto-switch view to playing bar"
          >
            Follow
          </button>
        </div>
      </div>

      {/* 3. Toolbar: Length, Scale Filter & Octave */}
      <div className="w-full bg-[#121622] px-3 py-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        {/* Note Length */}
        <div className="flex items-center gap-1 text-xs">
          <Clock className="w-3.5 h-3.5 text-cyan-400 mr-0.5" />
          {[
            { steps: 1, label: '1/16' },
            { steps: 2, label: '1/8' },
            { steps: 4, label: '1/4' },
            { steps: 8, label: '1/2' }
          ].map(({ steps, label }) => (
            <button
              key={steps}
              onClick={() => setSelectedDuration(steps)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                selectedDuration === steps
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 bg-slate-800/80 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Scale Filter & Octave */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScaleOnly(!scaleOnly)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              scaleOnly
                ? 'bg-pink-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="Show only notes in active musical scale"
          >
            <Lock className="w-3 h-3" />
            <span>{scaleOnly ? 'SCALE ONLY' : 'ALL KEYS'}</span>
          </button>

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setOctave((o) => Math.max(2, o - 1))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-cyan-300 px-1">
              C{octave}
            </span>
            <button
              onClick={() => setOctave((o) => Math.min(6, o + 1))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Touch Piano Roll Grid */}
      <div className="w-full max-h-[380px] overflow-y-auto scrollbar-thin rounded-2xl border border-slate-800 bg-[#080b11] shadow-2xl">
        <div className="flex flex-col">
          {displayNotes.map((note) => {
            const pitchName = note.replace(/\d+/, '');
            const isBlackKey = pitchName.includes('#');
            const isInScale = scaleNoteNames.has(pitchName);

            return (
              <div
                key={note}
                className={`flex items-center border-b border-slate-900 ${
                  isBlackKey ? 'bg-[#0a0d14]' : 'bg-[#0f1420]'
                }`}
              >
                {/* Piano Key button */}
                <button
                  onClick={() => handleKeyClick(note)}
                  className={`w-16 h-8 flex-shrink-0 flex items-center justify-between px-2 text-[11px] font-mono font-bold border-r border-slate-800 transition-colors active:bg-cyan-500 active:text-slate-950 ${
                    isBlackKey
                      ? 'bg-slate-950 text-slate-400 hover:bg-slate-900'
                      : 'bg-slate-800/60 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <span>{note}</span>
                  {isInScale && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"></span>
                  )}
                </button>

                {/* 16 Step Cells for the active bar */}
                <div className="flex flex-1 items-center relative">
                  {Array.from({ length: 16 }).map((_, localIdx) => {
                    const globalStepIdx = activeBar * 16 + localIdx;
                    const step = currentTrack?.steps[globalStepIdx];
                    const isNoteHead = step && step.active && step.note === note;
                    const isCurrent = isPlaying && currentStep === globalStepIdx;
                    const isBeatQuarter = localIdx % 4 === 0;

                    // Check if covered by a sustained note
                    let isSustainedTail = false;
                    if (!isNoteHead && currentTrack) {
                      for (let prev = Math.max(0, globalStepIdx - 15); prev < globalStepIdx; prev++) {
                        const prevStep = currentTrack.steps[prev];
                        if (
                          prevStep &&
                          prevStep.active &&
                          prevStep.note === note &&
                          prev + (prevStep.duration || 1) > globalStepIdx
                        ) {
                          isSustainedTail = true;
                          break;
                        }
                      }
                    }

                    const noteDuration = isNoteHead ? (step?.duration || 1) : 1;

                    return (
                      <button
                        key={localIdx}
                        onClick={() => handleCellClick(localIdx, note)}
                        onContextMenu={(e) => isNoteHead && handleCycleDuration(e, globalStepIdx)}
                        className={`flex-1 h-8 border-r border-slate-900/60 transition-all relative flex items-center justify-center p-0.5 cursor-pointer active:scale-95 ${
                          isCurrent ? 'bg-cyan-950/50' : ''
                        } ${
                          isNoteHead
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-md shadow-pink-500/40 text-white font-bold'
                            : isSustainedTail
                            ? 'bg-purple-900/40 border-t border-b border-purple-500/40'
                            : isInScale
                            ? isBeatQuarter
                              ? 'bg-slate-900/30'
                              : 'bg-transparent'
                            : isBeatQuarter
                            ? 'bg-slate-950/40'
                            : 'bg-slate-950/70'
                        }`}
                        title={
                          isNoteHead
                            ? `${note} (Length: ${noteDuration} steps) - Tap to delete, right-click to resize`
                            : isSustainedTail
                            ? `${note} (Sustained)`
                            : `${note} at Bar ${activeBar + 1}, Step ${localIdx + 1}`
                        }
                      >
                        {isNoteHead && (
                          <span className="text-[9px] font-mono leading-none select-none font-black">
                            {noteDuration > 1 ? `♪${noteDuration}` : '♪'}
                          </span>
                        )}
                        {isSustainedTail && (
                          <div className="w-full h-1 bg-pink-400/50 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-mono">
        <span>Bar {activeBar + 1} of {totalBars} • Step {activeBar * 16 + 1}-{activeBar * 16 + 16}</span>
        <span className="text-cyan-400">Total Song Steps: {stepCount}</span>
      </div>
    </div>
  );
};
