import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  Download,
  Upload,
  Wand2,
  Smartphone,
  Monitor,
  Radio,
  FolderDown,
  Layers,
  Undo2,
  Redo2,
  Minus,
  Plus
} from 'lucide-react';
import { Select } from './Select';
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
    <header className="sticky top-0 z-40 w-full border-b border-line bg-base/70 backdrop-blur-xl">
      <div className="aurora-bar absolute top-0 left-0 right-0" />
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 px-3 sm:px-4 py-2 pt-2.5">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(139,92,246,0.2))', border: '1px solid rgba(34,211,238,0.4)', boxShadow: '0 0 18px -4px rgba(34,211,238,0.5)' }}>
            <Radio className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-ink font-display">
                AhPah Beats
              </h1>
              <span className="badge text-accent border-accent/30">STUDIO</span>
            </div>
            <p className="micro-label mt-0.5 text-ink-2">DAW • v1.1.0 • Aurora Engine</p>
          </div>
        </div>

        {/* Center Hardware Transport Console */}
        <div className="flex items-center gap-2 well px-2 py-1.5">
          {/* Play/Pause Button */}
          <button
            onClick={onPlayToggle}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer font-bold ${
              isPlaying
                ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-glow'
                : 'text-[#05060b] shadow-glow'
            }`}
            style={isPlaying ? {} : { background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)' }}
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Stop Button */}
          <button
            onClick={onStop}
            className="btn-icon w-8 h-8"
            title="Stop & Reset to Start"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Undo & Redo Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="btn-icon w-7 h-7"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="btn-icon w-7 h-7"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-line" />

          {/* BPM Selector with +/- buttons */}
          <div className="flex flex-col gap-1">
            <span className="micro-label">Tempo</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onBpmChange(Math.max(40, project.bpm - 1))}
                className="btn-icon w-5 h-6 rounded"
                title="Decrease BPM"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min={40}
                max={240}
                value={project.bpm}
                onChange={(e) => onBpmChange(Number(e.target.value))}
                className="w-12 h-6 bg-base border border-line rounded px-1 text-xs font-mono font-bold text-ink text-center focus:outline-none focus:border-accent/50"
              />
              <button
                onClick={() => onBpmChange(Math.min(240, project.bpm + 1))}
                className="btn-icon w-5 h-6 rounded"
                title="Increase BPM"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button
            onClick={handleTapTempo}
            className="self-end h-6 px-2 rounded bg-raised border border-line text-[10px] font-mono font-bold text-ink-2 hover:text-ink transition-colors cursor-pointer flex items-center"
            title="Tap Tempo"
          >
            TAP
          </button>

          <div className="h-5 w-px bg-line" />

          {/* Swing Slider */}
          <div className="flex flex-col w-20 gap-1">
            <div className="flex justify-between micro-label">
              <span>Swing</span>
              <span className="text-accent normal-case tracking-normal">{project.swing}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={project.swing}
              onChange={(e) => onSwingChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="h-5 w-px bg-line" />

          {/* Master Volume */}
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-ink-3 flex-shrink-0" />
            <div className="flex flex-col w-20 gap-1">
              <div className="flex justify-between micro-label">
                <span>Master</span>
                <span className="text-accent normal-case tracking-normal">{Math.round(project.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1.2}
                step={0.01}
                value={project.masterVolume}
                onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Musical Key, Scale, Presets & Studio Tools */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Preset Selector */}
          <Select
            value={Object.keys(PRESET_PROJECTS).find((k) => PRESET_PROJECTS[k].title === project.title) || ''}
            options={[
              { value: '', label: 'Demo Presets', accent: '#f472b6' },
              ...Object.keys(PRESET_PROJECTS).map((p) => ({ value: p, label: p, accent: '#22d3ee' }))
            ]}
            onChange={onSelectPreset}
            placeholder="Demo Presets"
            leadingIcon={<Layers className="w-3.5 h-3.5" />}
          />

          {/* Key & Scale Selector */}
          <div className="flex items-center gap-1.5 well px-2.5 py-1.5 text-xs">
            <span className="micro-label mr-1">Key</span>
            <Select
              value={project.key}
              options={keys.map((k) => ({ value: k, label: k, accent: '#22d3ee' }))}
              onChange={(v) => onKeyScaleChange(v, project.scale)}
              size="sm"
              variant="ghost"
            />
            <Select
              value={project.scale}
              options={Object.keys(SCALES).map((s) => ({ value: s, label: s, accent: '#8b5cf6' }))}
              onChange={(v) => onKeyScaleChange(project.key, v)}
              size="sm"
              variant="ghost"
            />
          </div>

          {/* Song Length / Bars Selector */}
          {onChangeStepCount && (
            <div className="hidden xl:flex seg">
              {[
                { count: 16, label: '1B' },
                { count: 32, label: '2B' },
                { count: 64, label: '4B' },
                { count: 128, label: '8B' }
              ].map(({ count, label }) => (
                <button
                  key={count}
                  onClick={() => onChangeStepCount(count)}
                  className={`seg-item ${project.stepCount === count ? 'seg-item-active' : ''}`}
                  title={`Set song length to ${count / 16} Bar${count === 16 ? '' : 's'} (${count} steps)`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* AI Beat Generator */}
          <button
            onClick={onRandomizeBeat}
            className="btn"
            title="Generate Fresh Beat Pattern"
          >
            <Wand2 className="w-3.5 h-3.5 text-magenta" />
            <span className="hidden sm:inline">AI Beat</span>
          </button>

          {/* WAV Export Button - Primary Studio Action */}
          <button
            onClick={onExportWav}
            className="btn-primary"
            title="Export Lossless 32-bit Studio WAV Audio"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export WAV</span>
          </button>

          {/* Project File Save / Load */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSaveProject}
              className="btn-icon"
              title="Save Project File (.ahpah)"
            >
              <FolderDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-icon"
              title="Open Project File (.ahpah, .json)"
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
            className="btn"
            title="Download Desktop App for Windows (.exe)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop .EXE</span>
          </button>

          {/* Responsive View Mode Switcher */}
          <button
            onClick={onToggleViewMode}
            className="btn"
            title={`Switch to ${viewMode === 'mobile' ? 'Desktop' : 'Mobile'} View`}
          >
            {viewMode === 'mobile' ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-accent" />
                <span className="hidden sm:inline">Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Mobile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
