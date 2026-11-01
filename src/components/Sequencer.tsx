import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import {
  RotateCcw,
  Plus,
  Trash2,
  Disc,
  Copy,
  Undo2,
  Redo2,
  Volume2
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
  onClearAllNotes
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
    <div className="w-full bg-[#0d111a] rounded-xl border border-slate-800/80 p-3 sm:p-4 shadow-xl flex flex-col gap-3">
      {/* Sequencer Header Strip */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center">
            <Disc className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
              Pattern Sequencer & Drum Matrix
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="text-cyan-400 font-semibold">{totalBars} {totalBars === 1 ? 'Bar' : 'Bars'}</span>
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
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
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
              <span>Copy to Bar {((activeBar + 1) % totalBars) + 1}</span>
            </button>
          )}

          <button
            onClick={() => setFollowPlayhead(!followPlayhead)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              followPlayhead
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
            }`}
            title="Auto-switch view to currently playing bar"
          >
            Follow
          </button>

          {onClearAllNotes && (
            <button
              onClick={onClearAllNotes}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-semibold cursor-pointer"
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700/60 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Drum</span>
          </button>
          <button
            onClick={() => onAddTrack('synth')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-pink-400 border border-slate-700/60 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Synth</span>
          </button>
        </div>
      </div>

      {/* Step Numbers Strip with 4-Beat Measure Grouping */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1 bg-[#10141f] rounded-lg border border-slate-800/60">
        <span className="font-mono text-[11px] text-cyan-300 font-semibold">
          Bar {activeBar + 1} • Steps {activeBar * 16 + 1}–{activeBar * 16 + 16}
        </span>
        <div className="hidden sm:flex items-center gap-1.5">
          {Array.from({ length: 16 }).map((_, i) => {
            const globalIdx = activeBar * 16 + i;
            const isBeatStart = i % 4 === 0;
            const isCurrent = isPlaying && currentStep === globalIdx;

            return (
              <div
                key={i}
                className={`w-8 sm:w-9 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all ${
                  isCurrent
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-sm shadow-cyan-400/50 scale-105'
                    : isBeatStart
                    ? 'bg-slate-800 text-slate-200 border border-slate-700/60'
                    : 'bg-slate-900/60 text-slate-500'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracks Grid */}
      <div className="flex flex-col gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {tracks.map((track, trackIndex) => {
          const isMuted = track.muted || (anySoloActive && !track.solo);

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all border ${
                isMuted
                  ? 'bg-slate-950/40 border-slate-900 opacity-50'
                  : 'bg-[#10141f] border-slate-800/80 hover:border-slate-700/90'
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
                    className="w-2.5 h-8 rounded-full flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm"
                    style={{ backgroundColor: track.color }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {track.name}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                      {track.sound}
                    </div>
                  </div>
                </button>

                {/* Mute & Solo Hardware Switches */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleMute(trackIndex)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      track.muted
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/40 border border-rose-500'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                    title="Mute Track"
                  >
                    M
                  </button>
                  <button
                    onClick={() => onToggleSolo(trackIndex)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      track.solo
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm shadow-amber-400/40 border border-amber-300'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
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
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    title={`Channel Level: ${Math.round(track.volume * 100)}%`}
                  />
                </div>

                {/* Clear / Delete Controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onClearTrack(trackIndex)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title="Clear pattern steps"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  {tracks.length > 3 && (
                    <button
                      onClick={() => onRemoveTrack(trackIndex)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
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
                      className={`relative h-11 w-8 sm:w-9 rounded-md flex flex-col items-center justify-between p-1 transition-all active:scale-95 cursor-pointer border ${
                        isCurrent
                          ? 'border-cyan-300 ring-2 ring-cyan-400/50'
                          : isBeatQuarter
                          ? 'border-slate-700/80'
                          : 'border-slate-800/60'
                      } ${
                        isActive
                          ? 'shadow-md'
                          : isBeatQuarter
                          ? 'bg-[#151a27] hover:bg-slate-800/80'
                          : 'bg-[#0f131e] hover:bg-slate-800/60'
                      }`}
                      style={{
                        backgroundColor: isActive ? track.color : undefined,
                        boxShadow: isActive ? `0 0 12px ${track.color}55` : undefined
                      }}
                      title={`${track.name} • Step ${localIdx + 1}${
                        step?.isRoll ? ' (1/32 Roll)' : ''
                      } (Right click to toggle roll)`}
                    >
                      {/* Beat downbeat indicator dot */}
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isActive
                            ? 'bg-slate-950'
                            : isBeatQuarter
                            ? 'bg-slate-500'
                            : 'bg-transparent'
                        }`}
                      />

                      {/* Note or Roll badge */}
                      <span
                        className={`text-[8px] font-mono font-bold leading-none select-none ${
                          isActive ? 'text-slate-950 font-black' : 'text-slate-500'
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
                          isActive ? 'bg-slate-950/40' : 'bg-transparent'
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
