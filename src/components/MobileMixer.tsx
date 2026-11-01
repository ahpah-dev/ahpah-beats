import React from 'react';
import { ProjectData, Track } from '../types';
import { PRESET_PROJECTS } from '../audio/presets';
import {
  Download,
  FolderDown,
  Layers,
  Sparkles,
  Monitor,
  Sliders
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
    <div className="w-full flex flex-col gap-3 select-none pb-6">
      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onExportWav}
          className="btn-primary h-11"
          title="Render and download lossless WAV"
        >
          <Download className="w-4 h-4" />
          <span>Export WAV</span>
        </button>

        <button
          onClick={onRandomizeBeat}
          className="btn h-11"
          title="Generate a fresh beat pattern"
        >
          <Sparkles className="w-4 h-4 text-magenta" />
          <span>AI Randomizer</span>
        </button>
      </div>

      {/* Song Length / Bars Selector */}
      {onChangeStepCount && (
        <div className="panel p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Layers className="w-4 h-4 text-accent" />
              <span>Song Length (Bars)</span>
            </div>
            <span className="micro-label normal-case tracking-normal">
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
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                  project.stepCount === count
                    ? 'bg-raised text-ink border-line-strong'
                    : 'bg-well text-ink-3 border-line hover:text-ink-2'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preset Selector */}
      <div className="panel p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-ink">
          <Layers className="w-4 h-4 text-accent" />
          <span>Load Preset Song</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(PRESET_PROJECTS).map((preset) => (
            <button
              key={preset}
              onClick={() => onSelectPreset(preset)}
              className="p-2 rounded-lg bg-well border border-line text-ink-2 text-xs font-semibold text-center truncate hover:bg-raised hover:text-ink transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Track Faders List */}
      <div className="panel p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Track Volume & Mix</span>
          </div>
          <span className="micro-label normal-case tracking-normal">
            {project.tracks.length} Tracks
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {project.tracks.map((track, i) => {
            const isMuted = track.muted || (anySoloActive && !track.solo);

            return (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                  isMuted
                    ? 'bg-base/40 border-line opacity-60'
                    : 'bg-well border-line'
                }`}
              >
                <div
                  className="w-1.5 h-7 rounded-full flex-shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <div className="w-24 truncate">
                  <div className="text-xs font-bold text-ink truncate">
                    {track.name}
                  </div>
                  <div className="micro-label normal-case tracking-normal">
                    {track.type}
                  </div>
                </div>

                {/* Mute & Solo */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleMute(i)}
                    className={`w-7 h-7 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                      track.muted
                        ? 'bg-rose-500 text-white border-rose-400/40'
                        : 'bg-raised text-ink-3 border-line hover:text-ink'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => onToggleSolo(i)}
                    className={`w-7 h-7 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                      track.solo
                        ? 'bg-amber-400 text-zinc-950 border-amber-300/50'
                        : 'bg-raised text-ink-3 border-line hover:text-ink'
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
                    className="w-full"
                  />
                  <span className="text-[10px] font-mono text-accent w-8 text-right">
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
          className="btn h-11"
          title="Save project file (.ahpah)"
        >
          <FolderDown className="w-4 h-4" />
          <span>Save File</span>
        </button>

        <button
          onClick={onOpenDesktopModal}
          className="btn h-11"
          title="Download desktop app for Windows"
        >
          <Monitor className="w-4 h-4" />
          <span>Desktop .EXE</span>
        </button>
      </div>
    </div>
  );
};
