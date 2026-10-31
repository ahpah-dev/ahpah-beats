import React from 'react';
import { Track, NoteStep, DrumSoundType, SynthSoundType } from '../types';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  SlidersHorizontal,
  Flame,
  Music,
  Disc
} from 'lucide-react';

interface SequencerProps {
  tracks: Track[];
  currentStep: number;
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
}

export const Sequencer: React.FC<SequencerProps> = ({
  tracks,
  currentStep,
  isPlaying,
  onToggleStep,
  onToggleRoll,
  onUpdateTrackVolume,
  onUpdateTrackPan,
  onToggleMute,
  onToggleSolo,
  onPreviewSound,
  onClearTrack,
  onAddTrack,
  onRemoveTrack
}) => {
  const stepCount = 16;
  const anySoloActive = tracks.some((t) => t.solo);

  return (
    <div className="w-full bg-[#0d111a] rounded-2xl border border-slate-800/80 p-4 shadow-2xl flex flex-col gap-3">
      {/* Sequencer Header Strip */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Disc className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Pattern Sequencer & Drum Matrix
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">16 Steps (4/4 Bar)</span>
        </div>

        {/* Step Indicator Numbers (1 to 16) */}
        <div className="hidden md:flex items-center gap-1.5 ml-auto mr-4">
          <div className="text-[10px] text-slate-500 font-mono mr-2">BAR 1:</div>
          {Array.from({ length: stepCount }).map((_, i) => {
            const isBeatStart = i % 4 === 0;
            const isCurrent = isPlaying && currentStep === i;
            return (
              <div
                key={i}
                className={`w-8 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all ${
                  isCurrent
                    ? 'bg-cyan-400 text-slate-950 scale-110 shadow-md shadow-cyan-400/50'
                    : isBeatStart
                    ? 'bg-slate-800/90 text-slate-300'
                    : 'bg-slate-900/60 text-slate-600'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Add Track Action */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddTrack('drum')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700/60 text-xs font-semibold active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Drum</span>
          </button>
          <button
            onClick={() => onAddTrack('synth')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-400 border border-slate-700/60 text-xs font-semibold active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Synth</span>
          </button>
        </div>
      </div>

      {/* Tracks Grid */}
      <div className="flex flex-col gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {tracks.map((track, trackIndex) => {
          const isMuted = track.muted || (anySoloActive && !track.solo);

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all border ${
                isMuted
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : 'bg-[#121622]/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Track Info & Quick Controls */}
              <div className="w-48 sm:w-56 flex-shrink-0 flex items-center justify-between gap-2">
                {/* Track Preview Button & Color Accent */}
                <button
                  onClick={() => onPreviewSound(track)}
                  className="flex items-center gap-2 group text-left flex-1 min-w-0"
                  title="Click to trigger sound"
                >
                  <div
                    className="w-2.5 h-7 rounded-full flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: track.color }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {track.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">
                      {track.type}
                    </div>
                  </div>
                </button>

                {/* Mute & Solo Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleMute(trackIndex)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                      track.muted
                        ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/50'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Mute Track"
                  >
                    M
                  </button>
                  <button
                    onClick={() => onToggleSolo(trackIndex)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                      track.solo
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm shadow-amber-400/50'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Solo Track"
                  >
                    S
                  </button>
                </div>

                {/* Volume Mini Fader */}
                <div className="flex items-center gap-1 w-16">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={track.volume}
                    onChange={(e) => onUpdateTrackVolume(trackIndex, Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    title={`Volume: ${Math.round(track.volume * 100)}%`}
                  />
                </div>

                {/* Clear / Delete */}
                <div className="flex items-center">
                  <button
                    onClick={() => onClearTrack(trackIndex)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    title="Clear steps"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  {tracks.length > 3 && (
                    <button
                      onClick={() => onRemoveTrack(trackIndex)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Track"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step Buttons (16 Steps) */}
              <div className="flex items-center gap-1.5 flex-1 justify-start">
                {Array.from({ length: stepCount }).map((_, stepIdx) => {
                  const step = track.steps[stepIdx];
                  const isActive = step && step.active;
                  const isCurrent = isPlaying && currentStep === stepIdx;
                  const isBeatQuarter = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => onToggleStep(trackIndex, stepIdx)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onToggleRoll(trackIndex, stepIdx);
                      }}
                      className={`relative h-11 w-8 sm:w-9 rounded-lg flex flex-col items-center justify-between p-1 transition-all active:scale-95 border ${
                        isCurrent
                          ? 'border-cyan-300 ring-2 ring-cyan-400/40'
                          : isBeatQuarter
                          ? 'border-slate-700/80'
                          : 'border-slate-800/60'
                      } ${
                        isActive
                          ? 'shadow-lg'
                          : isBeatQuarter
                          ? 'bg-[#151a28] hover:bg-slate-800/80'
                          : 'bg-[#0f131c] hover:bg-slate-800/60'
                      }`}
                      style={{
                        backgroundColor: isActive ? track.color : undefined,
                        boxShadow: isActive ? `0 0 14px ${track.color}66` : undefined
                      }}
                      title={`${track.name} - Step ${stepIdx + 1}${
                        step?.isRoll ? ' (1/32 Roll)' : ''
                      } (Right-click to toggle roll)`}
                    >
                      {/* Sub-beat indicator dot */}
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isActive
                            ? 'bg-slate-950'
                            : isBeatQuarter
                            ? 'bg-slate-600'
                            : 'bg-transparent'
                        }`}
                      />

                      {/* Note / Pitch or Roll label */}
                      <span
                        className={`text-[9px] font-mono font-bold leading-none select-none ${
                          isActive ? 'text-slate-950 font-black' : 'text-slate-600'
                        }`}
                      >
                        {isActive
                          ? step.isRoll
                            ? 'ROLL'
                            : track.type === 'synth'
                            ? step.note || 'C4'
                            : ''
                          : ''}
                      </span>

                      {/* Velocity bar */}
                      <div
                        className={`w-full rounded-sm ${
                          isActive ? 'bg-slate-950/30' : 'bg-transparent'
                        }`}
                        style={{ height: isActive ? `${(step.velocity || 0.8) * 4}px` : '2px' }}
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
