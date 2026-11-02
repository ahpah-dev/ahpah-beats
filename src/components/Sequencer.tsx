import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import {
  RotateCcw,
  Plus,
  Trash2,
  Disc,
  Copy
} from 'lucide-react';

interface SequencerProps {
  tracks: Track[];
  currentStep: number;
  stepCount: number; // 16, 32, 64, 128
  isPlaying: boolean;
  onToggleStep: (trackIndex: number, stepIndex: number) => void;
  onToggleRoll: (trackIndex: number, stepIndex: number) => void;
  onUpdateTrackVolume: (trackIndex: number, volume: number) => void;
  onUpdateTrackPan: (trackIndex: number, pan: number) => void;
  onToggleMute: (trackIndex: number) => void;
  onToggleSolo: (trackIndex: number) => void;
  onPreviewSound: (track: Track) => void;
  onClearTrack: (trackIndex: number) => void;
  onAddTrack: (type: 'drum' | 'synth') => void;
  onRemoveTrack: (trackIndex: number) => void;
  onAddBar?: () => void;
  onDuplicateBar?: (sourceBar: number, targetBar: number) => void;
  onChangeStepCount?: (newCount: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onClearAllNotes?: () => void;
  onOpenCustomInstruments?: () => void;
}

export const Sequencer: React.FC<SequencerProps> = ({
  tracks,
  currentStep,
  stepCount,
  isPlaying,
  onToggleStep,
  onToggleRoll,
  onUpdateTrackVolume,
  onToggleMute,
  onToggleSolo,
  onPreviewSound,
  onClearTrack,
  onAddTrack,
  onRemoveTrack,
  onAddBar,
  onDuplicateBar,
  onClearAllNotes,
  onOpenCustomInstruments
}) => {
  const [activeBar, setActiveBar] = useState<number>(0);
  const [followPlayhead, setFollowPlayhead] = useState<boolean>(false);
  const totalBars = Math.max(1, Math.ceil(stepCount / 16));
  const anySoloActive = tracks.some((t) => t.solo);

  // Auto follow playhead if active
  useEffect(() => {
    if (isPlaying && followPlayhead) {
      const playingBar = Math.floor(currentStep / 16);
      if (playingBar !== activeBar && playingBar < totalBars) {
        setActiveBar(playingBar);
      }
    }
  }, [isPlaying, currentStep, followPlayhead, activeBar, totalBars]);

  return (
    <div className="w-full panel p-3 sm:p-4 flex flex-col gap-3">
      {/* Sequencer Header Strip */}
      <div className="flex flex-wrap items-center justify-between border-b border-line pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="tile">
            <Disc className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Pattern Sequencer & Drum Matrix
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-ink-3 font-mono">
              <span className="text-accent font-semibold">{totalBars} {totalBars === 1 ? 'Bar' : 'Bars'}</span>
              <span>•</span>
              <span>{stepCount} Steps Total</span>
            </div>
          </div>
        </div>

        {/* Bar Selector Strip & Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {Array.from({ length: totalBars }).map((_, barIdx) => {
            const isPlayingBar = isPlaying && Math.floor(currentStep / 16) === barIdx;
            const isSelected = activeBar === barIdx;

            return (
              <button
                key={barIdx}
                onClick={() => setActiveBar(barIdx)}
                className={`relative px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors duration-150 cursor-pointer border ${
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
              <span>Copy to Bar {((activeBar + 1) % totalBars) + 1}</span>
            </button>
          )}

          <button
            onClick={() => setFollowPlayhead(!followPlayhead)}
            className={`h-7 px-2.5 rounded-md text-xs font-mono font-bold transition-colors duration-150 cursor-pointer border ${
              followPlayhead
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                : 'bg-well text-ink-3 border-line hover:text-ink-2'
            }`}
            title="Auto-switch view to currently playing bar"
          >
            Follow
          </button>

          {onClearAllNotes && (
            <button
              onClick={onClearAllNotes}
              className="btn h-7"
              title="Clear all pattern steps across all tracks"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Add Track Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => onAddTrack('drum')}
            className="btn h-7"
            title="Add Drum Track"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>Drum</span>
          </button>
          <button
            onClick={() => onAddTrack('synth')}
            className="btn h-7"
            title="Add Synth Track"
          >
            <Plus className="w-3.5 h-3.5 text-magenta" />
            <span>Synth</span>
          </button>
          {onOpenCustomInstruments && (
            <button
              onClick={onOpenCustomInstruments}
              className="btn h-7"
              title="Import custom instruments & find free samples"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Import</span>
            </button>
          )}
        </div>
      </div>

      {/* Step Numbers Strip with 4-Beat Measure Grouping */}
      <div className="flex items-center gap-3 px-2 py-1 bg-well rounded-md border border-line">
        <div className="w-52 sm:w-60 flex-shrink-0">
          <span className="micro-label normal-case tracking-normal">
            Bar {activeBar + 1} • Steps {activeBar * 16 + 1}–{activeBar * 16 + 16}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 flex-1 min-w-max">
          {Array.from({ length: 16 }).map((_, i) => {
            const globalIdx = activeBar * 16 + i;
            const isBeatStart = i % 4 === 0;
            const isCurrent = isPlaying && currentStep === globalIdx;

            return (
              <div
                key={i}
                className={`w-8 sm:w-9 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-colors ${
                  isCurrent
                    ? 'bg-accent text-[#052730]'
                    : isBeatStart
                    ? 'bg-raised text-ink-2 border border-line'
                    : 'text-ink-3'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracks Grid */}
      <div className="flex flex-col gap-2 overflow-x-auto pb-1">
        {tracks.map((track, trackIndex) => {
          const isMuted = track.muted || (anySoloActive && !track.solo);

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors border min-w-max ${
                isMuted
                  ? 'bg-base/40 border-line opacity-50'
                  : 'bg-well border-line'
              }`}
            >
              {/* Channel Strip Header: Info, M/S, Volume */}
              <div className="w-52 sm:w-60 flex-shrink-0 flex items-center justify-between gap-2.5">
                {/* Track Audition & Info */}
                <button
                  onClick={() => onPreviewSound(track)}
                  className="flex items-center gap-2 group text-left flex-1 min-w-0 cursor-pointer"
                  title="Click to audition track sound"
                >
                  <div
                    className="w-2.5 h-8 rounded-full flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: track.color }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-ink group-hover:text-accent transition-colors truncate">
                      {track.name}
                    </div>
                    <div className="micro-label normal-case tracking-normal">
                      {track.sound}
                    </div>
                  </div>
                </button>

                {/* Mute & Solo Hardware Switches */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleMute(trackIndex)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                      track.muted
                        ? 'bg-rose-500 text-white border-rose-400/40'
                        : 'bg-raised text-ink-3 border-line hover:text-ink'
                    }`}
                    title="Mute Track"
                  >
                    M
                  </button>
                  <button
                    onClick={() => onToggleSolo(trackIndex)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                      track.solo
                        ? 'bg-amber-400 text-zinc-950 border-amber-300/50'
                        : 'bg-raised text-ink-3 border-line hover:text-ink'
                    }`}
                    title="Solo Track"
                  >
                    S
                  </button>
                </div>

                {/* Track Volume Fader */}
                <div className="flex items-center gap-1 w-16">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={track.volume}
                    onChange={(e) => onUpdateTrackVolume(trackIndex, Number(e.target.value))}
                    className="w-full"
                    title={`Channel Level: ${Math.round(track.volume * 100)}%`}
                  />
                </div>

                {/* Clear / Delete Controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onClearTrack(trackIndex)}
                    className="btn-icon w-6 h-6 rounded"
                    title="Clear pattern steps"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  {tracks.length > 3 && (
                    <button
                      onClick={() => onRemoveTrack(trackIndex)}
                      className="btn-icon w-6 h-6 rounded hover:text-rose-400"
                      title="Delete Track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 16 Step Buttons for Active Bar */}
              <div className="flex items-center gap-1.5 flex-1 justify-start">
                {Array.from({ length: 16 }).map((_, localIdx) => {
                  const globalStepIdx = activeBar * 16 + localIdx;
                  const step = track.steps[globalStepIdx];
                  const isActive = step && step.active;
                  const isCurrent = isPlaying && currentStep === globalStepIdx;
                  const isBeatQuarter = localIdx % 4 === 0;

                  return (
                    <button
                      key={localIdx}
                      onClick={() => onToggleStep(trackIndex, globalStepIdx)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onToggleRoll(trackIndex, globalStepIdx);
                      }}
                      className={`relative h-11 w-8 sm:w-9 rounded-md flex flex-col items-center justify-between p-1 transition-colors duration-100 cursor-pointer border ${
                        isCurrent
                          ? 'ring-1 ring-accent'
                          : ''
                      } ${
                        isActive
                          ? 'border-transparent'
                          : isBeatQuarter
                          ? 'bg-raised border-line-strong hover:bg-panel'
                          : 'bg-well border-line hover:bg-raised'
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: track.color }
                          : undefined
                      }
                      title={`${track.name} • Step ${localIdx + 1}${
                        step?.isRoll ? ' (1/32 Roll)' : ''
                      } (Right click to toggle roll)`}
                    >
                      {/* Beat downbeat indicator dot */}
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isActive
                            ? 'bg-black/50'
                            : isBeatQuarter
                            ? 'bg-ink-3'
                            : 'bg-transparent'
                        }`}
                      />

                      {/* Note or Roll badge */}
                      <span
                        className={`text-[8px] font-mono font-bold leading-none select-none ${
                          isActive ? 'text-black/70' : 'text-ink-3'
                        }`}
                      >
                        {isActive
                          ? step.isRoll
                            ? 'ROLL'
                            : track.type === 'synth'
                            ? `${step.note || 'C4'}${step.duration && step.duration > 1 ? ` (${step.duration})` : ''}`
                            : ''
                          : ''}
                      </span>

                      {/* Velocity bar */}
                      <div
                        className={`w-full rounded-sm ${
                          isActive ? 'bg-black/30' : 'bg-line'
                        }`}
                        style={{ height: isActive ? `${(step.velocity || 0.8) * 3}px` : '2px' }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
