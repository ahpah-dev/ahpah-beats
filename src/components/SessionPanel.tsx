import React from 'react';
import { Layers, Music, Activity, Volume2, Sparkles, Import, Trash2, Keyboard } from 'lucide-react';
import { ProjectData } from '../types';
import { PRESET_PROJECTS, SCALES } from '../audio/presets';
import { Select } from './Select';

interface SessionPanelProps {
  project: ProjectData;
  onSelectPreset: (presetName: string) => void;
  onKeyScaleChange: (key: string, scale: string) => void;
  onChangeStepCount: (stepCount: number) => void;
  onSwingChange: (swing: number) => void;
  onMasterVolumeChange: (vol: number) => void;
  onRandomizeBeat: () => void;
  onOpenCustomInstruments: () => void;
  onClearAllNotes: () => void;
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const Bars: { count: number; label: string }[] = [
  { count: 16, label: '1' },
  { count: 32, label: '2' },
  { count: 64, label: '4' },
  { count: 128, label: '8' }
];

export const SessionPanel: React.FC<SessionPanelProps> = ({
  project,
  onSelectPreset,
  onKeyScaleChange,
  onChangeStepCount,
  onSwingChange,
  onMasterVolumeChange,
  onRandomizeBeat,
  onOpenCustomInstruments,
  onClearAllNotes
}) => {
  return (
    <aside className="hidden md:flex flex-col gap-3 w-[252px] flex-shrink-0 sticky top-[82px] self-start">

      {/* Session */}
      <section className="panel p-4 flex flex-col gap-3.5">
        <div className="section-head">
          <div className="tile"><Music className="w-3.5 h-3.5 text-accent" /></div>
          <span>Session</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="micro-label">Preset</span>
          <Select
            value={Object.keys(PRESET_PROJECTS).find((k) => PRESET_PROJECTS[k].title === project.title) || ''}
            options={[
              { value: '', label: 'Demo Presets', accent: '#f472b6' },
              ...Object.keys(PRESET_PROJECTS).map((p) => ({ value: p, label: p, accent: '#22d3ee' }))
            ]}
            onChange={onSelectPreset}
            placeholder="Demo Presets"
            leadingIcon={<Layers className="w-3.5 h-3.5" />}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <span className="micro-label">Key</span>
            <Select
              value={project.key}
              options={KEYS.map((k) => ({ value: k, label: k, accent: '#22d3ee' }))}
              onChange={(v) => onKeyScaleChange(v, project.scale)}
              size="sm"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="micro-label">Scale</span>
            <Select
              value={project.scale}
              options={Object.keys(SCALES).map((s) => ({ value: s, label: s, accent: '#8b5cf6' }))}
              onChange={(v) => onKeyScaleChange(project.key, v)}
              size="sm"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="micro-label">Song Length</span>
            <span className="text-[10px] font-mono text-ink-3">{project.stepCount} steps</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {Bars.map(({ count, label }) => {
              const active = project.stepCount === count;
              return (
                <button
                  key={count}
                  onClick={() => onChangeStepCount(count)}
                  className={`h-7 rounded-lg text-[11px] font-mono font-bold transition-all duration-150 cursor-pointer border ${
                    active
                      ? 'bg-accent/15 text-accent border-accent/35 shadow-[0_0_14px_-6px_rgba(34,211,238,0.7)]'
                      : 'bg-well text-ink-3 border-line hover:text-ink-2 hover:border-line-strong'
                  }`}
                  title={`${count / 16} Bar${count === 16 ? '' : 's'} (${count} steps)`}
                >
                  {label}B
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mix & Groove */}
      <section className="panel p-4 flex flex-col gap-4">
        <div className="section-head">
          <div className="tile"><Activity className="w-3.5 h-3.5 text-magenta" /></div>
          <span>Groove &amp; Mix</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="micro-label">Swing</span>
            <span className="text-[11px] font-mono font-bold text-accent">{project.swing}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            value={project.swing}
            onChange={(e) => onSwingChange(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="micro-label flex items-center gap-1.5">
              <Volume2 className="w-3 h-3" /> Master
            </span>
            <span className="text-[11px] font-mono font-bold text-accent">{Math.round(project.masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.01}
            value={project.masterVolume}
            onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
          />
          {/* Level ticks */}
          <div className="flex justify-between px-0.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <span
                key={i}
                className={`h-1 rounded-full flex-1 mx-0.5 transition-colors ${
                  project.masterVolume * 8 >= i + 1 ? 'bg-accent/70' : 'bg-white/8'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Create */}
      <section className="panel p-4 flex flex-col gap-2">
        <div className="section-head mb-1">
          <div className="tile"><Sparkles className="w-3.5 h-3.5 text-accent" /></div>
          <span>Create</span>
        </div>

        <button onClick={onRandomizeBeat} className="btn w-full justify-start h-9">
          <Sparkles className="w-3.5 h-3.5 text-magenta" />
          <span>Generate Beat</span>
        </button>

        <button onClick={onOpenCustomInstruments} className="btn w-full justify-start h-9">
          <Import className="w-3.5 h-3.5 text-accent" />
          <span>Import Instruments</span>
        </button>

        <button
          onClick={onClearAllNotes}
          className="btn-ghost w-full justify-start h-9 border border-line hover:border-danger/40 hover:text-danger"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Notes</span>
        </button>
      </section>

      {/* Tip */}
      <section className="card p-3 flex items-start gap-2.5">
        <Keyboard className="w-4 h-4 text-ink-3 flex-shrink-0 mt-0.5" />
        <div className="text-[10px] leading-relaxed text-ink-3">
          <span className="text-ink-2 font-semibold">Shortcuts:</span>{' '}
          <span className="kbd">Space</span> play · <span className="kbd">Ctrl</span>+<span className="kbd">Z</span> undo · right-click a step for 1/32 roll
        </div>
      </section>
    </aside>
  );
};
