import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Wand2,
  Smartphone,
  Monitor,
  Radio,
  FolderDown,
  Undo2,
  Redo2,
  Minus,
  Plus,
  Import,
  Sparkles
} from 'lucide-react';
import { ProjectData } from '../types';

interface HeaderProps {
  project: ProjectData;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onExportWav: () => void;
  onSaveProject: () => void;
  onLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRandomizeBeat: () => void;
  onOpenDesktopModal: () => void;
  onOpenCustomInstruments: () => void;
  viewMode: 'desktop' | 'mobile';
  onToggleViewMode: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  isPlaying,
  onPlayToggle,
  onStop,
  onBpmChange,
  onExportWav,
  onSaveProject,
  onLoadProject,
  onRandomizeBeat,
  onOpenDesktopModal,
  onOpenCustomInstruments,
  viewMode,
  onToggleViewMode,
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
      for (let i = 1; i < newTimes.length; i++) intervals += newTimes[i] - newTimes[i - 1];
      const avg = intervals / (newTimes.length - 1);
      const bpm = Math.round(60000 / avg);
      if (bpm >= 40 && bpm <= 240) onBpmChange(bpm);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full header-glass border-b border-line">
      <div className="aurora-bar absolute top-0 left-0 right-0" />
      <div className="max-w-[1680px] mx-auto flex items-center gap-3 px-3 sm:px-5 h-[66px]">

        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          <div
            className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.28), rgba(139,92,246,0.22))',
              border: '1px solid rgba(34,211,238,0.45)',
              boxShadow: '0 0 20px -5px rgba(34,211,238,0.6)'
            }}
          >
            <Radio className="w-5 h-5 text-accent" />
            <span className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18), transparent 55%)' }} />
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-extrabold tracking-tight text-ink font-display leading-none">
                AhPah <span className="text-aurora">Beats</span>
              </h1>
              <span className="badge text-accent border-accent/25 hidden sm:inline-flex">STUDIO</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" style={{ animation: 'pulseDot 2.4s ease-in-out infinite' }} />
              <span className="text-[10px] font-mono text-ink-3 truncate max-w-[130px]">{project.title}</span>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-px h-7 bg-line flex-shrink-0" />

        {/* Transport + tempo (centered) */}
        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          {/* Transport island */}
          <div className="flex items-center gap-1.5 well px-2 py-1.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="btn-icon w-7 h-7 bg-transparent border-transparent"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onPlayToggle}
              className="relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 cursor-pointer text-[#05060b]"
              style={{
                background: isPlaying
                  ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                  : 'linear-gradient(135deg, #22d3ee, #8b5cf6)',
                boxShadow: isPlaying
                  ? '0 0 26px -4px rgba(251,191,36,0.7)'
                  : '0 0 26px -4px rgba(34,211,238,0.65)'
              }}
              title="Play / Pause (Space)"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onStop}
              className="btn-icon w-7 h-7 bg-transparent border-transparent"
              title="Stop & Reset"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="btn-icon w-7 h-7 bg-transparent border-transparent"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tempo display */}
          <div className="flex items-center gap-2 well px-3 py-1.5">
            <div className="flex flex-col leading-none">
              <span className="micro-label text-[8px] tracking-[0.2em]">BPM</span>
              <input
                type="number"
                min={40}
                max={240}
                value={project.bpm}
                onChange={(e) => onBpmChange(Number(e.target.value))}
                className="w-14 bg-transparent font-display font-bold text-xl text-ink leading-none focus:outline-none mt-1 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => onBpmChange(Math.min(240, project.bpm + 1))}
                className="w-5 h-4 rounded flex items-center justify-center text-ink-3 hover:text-accent hover:bg-white/5 transition-colors cursor-pointer"
                title="Increase BPM"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={() => onBpmChange(Math.max(40, project.bpm - 1))}
                className="w-5 h-4 rounded flex items-center justify-center text-ink-3 hover:text-accent hover:bg-white/5 transition-colors cursor-pointer"
                title="Decrease BPM"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={handleTapTempo}
              className="ml-0.5 h-8 px-2 rounded-md text-[9px] font-mono font-bold text-ink-2 hover:text-ink transition-colors cursor-pointer flex items-center border border-line/70 hover:border-line-strong"
              title="Tap Tempo"
            >
              TAP
            </button>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onRandomizeBeat}
            className="btn h-8"
            title="Generate a fresh beat pattern"
          >
            <Sparkles className="w-3.5 h-3.5 text-magenta" />
            <span className="hidden xl:inline">AI Beat</span>
          </button>

          <button
            onClick={onOpenCustomInstruments}
            className="btn h-8"
            title="Import custom instruments & find free samples"
          >
            <Import className="w-3.5 h-3.5 text-accent" />
            <span className="hidden lg:inline">Instruments</span>
          </button>

          <button
            onClick={onExportWav}
            className="btn-primary h-8"
            title="Export lossless WAV audio"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="flex items-center gap-1">
            <button onClick={onSaveProject} className="btn-icon" title="Save Project (.ahpah)">
              <FolderDown className="w-4 h-4" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-icon" title="Open Project (.ahpah)">
              <Upload className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept=".ahpah,.json" onChange={onLoadProject} className="hidden" />
          </div>

          <button
            onClick={onToggleViewMode}
            className="btn-icon"
            title={`Switch to ${viewMode === 'mobile' ? 'Desktop' : 'Mobile'} view`}
          >
            {viewMode === 'mobile' ? (
              <Monitor className="w-3.5 h-3.5 text-accent" />
            ) : (
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          <button
            onClick={onOpenDesktopModal}
            className="btn-icon hidden md:inline-flex"
            title="Download desktop app (.exe)"
          >
            <Wand2 className="w-3.5 h-3.5 text-ink-2" />
          </button>
        </div>
      </div>
    </header>
  );
};
