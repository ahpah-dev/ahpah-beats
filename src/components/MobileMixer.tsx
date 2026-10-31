import React from 'react';
import { ProjectData, Track } from '../types';
import { PRESET_PROJECTS } from '../audio/presets';
import {
  Volume2,
  Sliders,
  Download,
  FolderDown,
  Layers,
  Sparkles,
  Monitor
} from 'lucide-react';

interface MobileMixerProps {
  project: ProjectData;
  onUpdateTrackVolume: (index: number, volume: number) => void;
  onToggleMute: (index: number) => void;
  onToggleSolo: (index: number) => void;
  onSelectPreset: (presetName: string) => void;
  onExportWav: () => void;
  onSaveProject: () => void;
  onOpenDesktopModal: () => void;
  onRandomizeBeat: () => void;
  onChangeStepCount?: (newCount: number) => void;
}

export const MobileMixer: React.FC<MobileMixerProps> = ({
  project,
  onUpdateTrackVolume,
  onToggleMute,
  onToggleSolo,
  onSelectPreset,
  onExportWav,
  onSaveProject,
  onOpenDesktopModal,
  onRandomizeBeat,
  onChangeStepCount
}) => {
  const anySoloActive = project.tracks.some((t) => t.solo);

  return (
    <div className="w-full flex flex-col gap-4 select-none pb-6">
      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onExportWav}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export WAV</span>
        </button>

        <button
          onClick={onRandomizeBeat}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-300 font-bold text-xs active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Randomizer</span>
        </button>
      </div>

      {/* Song Length / Bars Selector */}
      {onChangeStepCount && (
        <div className="bg-[#121622] p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Song Length (Bars)</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
              {project.stepCount} Steps
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { count: 16, label: '1 Bar' },
              { count: 32, label: '2 Bars' },
              { count: 64, label: '4 Bars' },
              { count: 128, label: '8 Bars' }
            ].map(({ count, label }) => (
              <button
                key={count}
                onClick={() => onChangeStepCount(count)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 ${
                  project.stepCount === count
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preset Selector */}
      <div className="bg-[#121622] p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Load Preset Song</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(PRESET_PROJECTS).map((preset) => (
            <button
              key={preset}
              onClick={() => onSelectPreset(preset)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center truncate border border-slate-700/60 active:scale-95"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Track Faders List */}
      <div className="bg-[#121622] p-3 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Track Volume & Mix</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {project.tracks.length} Tracks
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {project.tracks.map((track, i) => {
            const isMuted = track.muted || (anySoloActive && !track.solo);

            return (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                  isMuted
                    ? 'bg-slate-950/40 border-slate-900 opacity-60'
                    : 'bg-[#0e121b] border-slate-800'
                }`}
              >
                <div
                  className="w-2 h-7 rounded-full flex-shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <div className="w-24 truncate">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {track.name}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono uppercase">
                    {track.type}
                  </div>
                </div>

                {/* Mute & Solo */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleMute(i)}
                    className={`w-6 h-6 rounded text-[9px] font-mono font-bold ${
                      track.muted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => onToggleSolo(i)}
                    className={`w-6 h-6 rounded text-[9px] font-mono font-bold ${
                      track.solo ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    S
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={track.volume}
                    onChange={(e) => onUpdateTrackVolume(i, Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none accent-cyan-400"
                  />
                  <span className="text-[10px] font-mono text-cyan-400 w-8 text-right">
                    {Math.round(track.volume * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Project & Desktop App Links */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onSaveProject}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-semibold active:scale-95 transition-all"
        >
          <FolderDown className="w-4 h-4" />
          <span>Save File</span>
        </button>

        <button
          onClick={onOpenDesktopModal}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-pink-950/60 hover:bg-pink-900 border border-pink-800/60 text-pink-300 text-xs font-semibold active:scale-95 transition-all"
        >
          <Monitor className="w-4 h-4 text-pink-400" />
          <span>Desktop .EXE</span>
        </button>
      </div>
    </div>
  );
};
