import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Download,
  Upload,
  Wand2,
  Smartphone,
  Monitor,
  Radio,
  Sliders,
  FolderDown,
  Layers,
  Undo2,
  Redo2
} from 'lucide-react';
import { ProjectData } from '../types';
import { PRESET_PROJECTS, SCALES } from '../audio/presets';

interface HeaderProps {
  project: ProjectData;
  isPlaying: boolean;
  isRecording: boolean;
  onPlayToggle: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onSwingChange: (swing: number) => void;
  onMasterVolumeChange: (vol: number) => void;
  onSelectPreset: (presetName: string) => void;
  onExportWav: () => void;
  onSaveProject: () => void;
  onLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRandomizeBeat: () => void;
  onOpenDesktopModal: () => void;
  viewMode: 'desktop' | 'mobile';
  onToggleViewMode: () => void;
  onKeyScaleChange: (key: string, scale: string) => void;
  onChangeStepCount?: (stepCount: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  isPlaying,
  isRecording,
  onPlayToggle,
  onStop,
  onBpmChange,
  onSwingChange,
  onMasterVolumeChange,
  onSelectPreset,
  onExportWav,
  onSaveProject,
  onLoadProject,
  onRandomizeBeat,
  onOpenDesktopModal,
  viewMode,
  onToggleViewMode,
  onKeyScaleChange,
  onChangeStepCount,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const handleTapTempo = () => {
    const now = performance.now();
    const newTimes = [...tapTimes, now].slice(-4);
    setTapTimes(newTimes);

    if (newTimes.length >= 2) {
      let intervals = 0;
      for (let i = 1; i < newTimes.length; i++) {
        intervals += newTimes[i] - newTimes[i - 1];
      }
      const avgInterval = intervals / (newTimes.length - 1);
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        onBpmChange(calculatedBpm);
      }
    }
  };

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return (
    <header className="w-full bg-[#0b0e14]/95 backdrop-blur-md border-b border-slate-800/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-40 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#0b0e14] rounded-[10px] flex items-center justify-center">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent font-['Inter']">
              AhPah Beats
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono font-bold tracking-tight">
              PRO DAW
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Studio Beat Maker & Synth Engine</p>
        </div>
      </div>

      {/* Main Transport & Tempo Controls */}
      <div className="flex items-center gap-2 bg-[#121622] px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
        {/* Play/Pause Button */}
        <button
          onClick={onPlayToggle}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all shadow-md active:scale-95 ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 font-bold'
          }`}
          title="Play / Pause (Space)"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Stop Button */}
        <button
          onClick={onStop}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors active:scale-95 border border-slate-700/60"
          title="Stop & Reset"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        {/* Undo & Redo Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95 border ${
              canUndo
                ? 'bg-slate-800/90 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border-slate-700/80 shadow-sm cursor-pointer'
                : 'bg-slate-900/40 text-slate-600 border-slate-800/30 cursor-not-allowed opacity-40'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95 border ${
              canRedo
                ? 'bg-slate-800/90 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border-slate-700/80 shadow-sm cursor-pointer'
                : 'bg-slate-900/40 text-slate-600 border-slate-800/30 cursor-not-allowed opacity-40'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        {/* BPM Selector */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">BPM</span>
            <input
              type="number"
              min={40}
              max={240}
              value={project.bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-14 bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-sm font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleTapTempo}
            className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono active:scale-95 border border-slate-700/60"
            title="Tap Tempo"
          >
            TAP
          </button>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        {/* Swing Slider */}
        <div className="flex flex-col w-20">
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">
            <span>Swing</span>
            <span className="text-cyan-400">{project.swing}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            value={project.swing}
            onChange={(e) => onSwingChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        {/* Master Volume */}
        <div className="flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col w-20">
            <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">
              <span>Master</span>
              <span className="text-cyan-400">{Math.round(project.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1.2}
              step={0.01}
              value={project.masterVolume}
              onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Musical Key, Scale & Preset Selector */}
      <div className="flex items-center gap-2">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-[#121622] px-2.5 py-1.5 rounded-xl border border-slate-800">
          <Layers className="w-4 h-4 text-purple-400" />
          <select
            value={Object.keys(PRESET_PROJECTS).find((k) => PRESET_PROJECTS[k].title === project.title) || ''}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="" disabled className="bg-slate-900 text-slate-400">
              Demo Presets
            </option>
            {Object.keys(PRESET_PROJECTS).map((preset) => (
              <option key={preset} value={preset} className="bg-slate-900 text-slate-200">
                {preset}
              </option>
            ))}
          </select>
        </div>

        {/* Song Length / Bars Selector */}
        {onChangeStepCount && (
          <div className="hidden xl:flex items-center gap-1 bg-[#121622] px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-500 font-mono font-bold">LENGTH:</span>
            {[
              { count: 16, label: '1 Bar' },
              { count: 32, label: '2 Bars' },
              { count: 64, label: '4 Bars' },
              { count: 128, label: '8 Bars' }
            ].map(({ count, label }) => (
              <button
                key={count}
                onClick={() => onChangeStepCount(count)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                  project.stepCount === count
                    ? 'bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-400/50'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
                title={`Set song length to ${label} (${count} steps)`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Key & Scale */}
        <div className="hidden lg:flex items-center gap-1 bg-[#121622] px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-[10px] text-slate-500 font-mono font-bold">SCALE:</span>
          <select
            value={project.key}
            onChange={(e) => onKeyScaleChange(e.target.value, project.scale)}
            className="bg-transparent font-mono font-bold text-cyan-400 focus:outline-none cursor-pointer"
          >
            {keys.map((k) => (
              <option key={k} value={k} className="bg-slate-900 text-cyan-400">
                {k}
              </option>
            ))}
          </select>
          <select
            value={project.scale}
            onChange={(e) => onKeyScaleChange(project.key, e.target.value)}
            className="bg-transparent font-semibold text-slate-300 focus:outline-none cursor-pointer"
          >
            {Object.keys(SCALES).map((s) => (
              <option key={s} value={s} className="bg-slate-900 text-slate-200">
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Randomize / AI Beat */}
        <button
          onClick={onRandomizeBeat}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 text-xs font-semibold transition-all active:scale-95 shadow-sm"
          title="Generate Fresh Beat Pattern"
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">AI Beat</span>
        </button>

        {/* WAV Export Button */}
        <button
          onClick={onExportWav}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors active:scale-95"
          title="Export to Studio WAV Audio"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export WAV</span>
        </button>

        {/* Project Save/Load */}
        <div className="flex items-center gap-1">
          <button
            onClick={onSaveProject}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors active:scale-95"
            title="Save Project File (.ahpah)"
          >
            <FolderDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors active:scale-95"
            title="Open Project File"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ahpah,.json"
            onChange={onLoadProject}
            className="hidden"
          />
        </div>

        {/* Desktop .exe App Download Modal Button */}
        <button
          onClick={onOpenDesktopModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs transition-colors active:scale-95"
          title="Download Desktop App (.exe)"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Download .EXE</span>
        </button>

        {/* View Mode Switcher: Mobile / Desktop toggle */}
        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
            viewMode === 'mobile'
              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
          }`}
          title={`Switch to ${viewMode === 'mobile' ? 'Desktop' : 'Mobile'} View`}
        >
          {viewMode === 'mobile' ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Desktop View</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Phone View</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
