import React, { useState } from 'react';
import { ProjectData, Track, SynthSettings, SynthSoundType } from '../types';
import { MobilePads } from './MobilePads';
import { MobileKeys } from './MobileKeys';
import { MobilePianoRoll } from './MobilePianoRoll';
import { MobileXYPad } from './MobileXYPad';
import { MobileMixer } from './MobileMixer';
import { audioEngine } from '../audio/AudioEngine';
import {
  Play,
  Pause,
  Square,
  Radio,
  Flame,
  Music,
  Disc,
  Zap,
  Sliders,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Layers,
  Undo2,
  Redo2,
  Plus,
  Copy
} from 'lucide-react';

type MobileTab = 'pads' | 'keys' | 'roll' | 'seq' | 'xy' | 'mix';

interface MobileViewProps {
  project: ProjectData;
  isPlaying: boolean;
  currentStep: number;
  onPlayToggle: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onToggleStep: (trackIndex: number, stepIndex: number) => void;
  onToggleRoll: (trackIndex: number, stepIndex: number) => void;
  onUpdateTrackVolume: (trackIndex: number, volume: number) => void;
  onToggleMute: (trackIndex: number) => void;
  onToggleSolo: (trackIndex: number) => void;
  onSelectPreset: (presetName: string) => void;
  onExportWav: () => void;
  onSaveProject: () => void;
  onRandomizeBeat: () => void;
  onOpenDesktopModal: () => void;
  onOpenCustomInstruments: () => void;
  onToggleViewMode: () => void;
  onUpdateSynth: (synth: Partial<SynthSettings>) => void;
  onAddTrack: (type: 'drum' | 'synth') => void;
  onChangeTrackSound: (trackId: string, sound: SynthSoundType) => void;
  onSetNote: (trackIndex: number, stepIndex: number, note: string | null, duration?: number) => void;
  onResizeNote?: (trackIndex: number, stepIndex: number, duration: number) => void;
  onAddBar?: () => void;
  onDuplicateBar?: (sourceBar: number, targetBar: number) => void;
  onChangeStepCount?: (newCount: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onClearAllNotes?: () => void;
}

export const MobileView: React.FC<MobileViewProps> = ({
  project,
  isPlaying,
  currentStep,
  onPlayToggle,
  onStop,
  onBpmChange,
  onToggleStep,
  onToggleRoll,
  onUpdateTrackVolume,
  onToggleMute,
  onToggleSolo,
  onSelectPreset,
  onExportWav,
  onSaveProject,
  onRandomizeBeat,
  onOpenDesktopModal,
  onOpenCustomInstruments,
  onToggleViewMode,
  onUpdateSynth,
  onAddTrack,
  onChangeTrackSound,
  onSetNote,
  onResizeNote,
  onAddBar,
  onDuplicateBar,
  onChangeStepCount,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onClearAllNotes
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('pads');
  const [selectedSeqTrack, setSelectedSeqTrack] = useState<number>(0);
  const [selectedSynthTrack, setSelectedSynthTrack] = useState<number>(0);
  const [seqActiveBar, setSeqActiveBar] = useState<number>(0);

  const totalBars = Math.max(1, Math.ceil(project.stepCount / 16));

  const synthTracks = project.tracks.filter((t) => t.type === 'synth');

  const handleTriggerPad = (track: Track, velocity: number = 0.9) => {
    audioEngine.triggerSound(track, 'C4', velocity);
  };

  const handleCycleMobileStepDuration = (e: React.MouseEvent, stepIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    const track = project.tracks[selectedSeqTrack];
    if (track && track.type === 'synth') {
      const step = track.steps[stepIdx];
      if (step && step.active) {
        const durations = [1, 2, 4, 8];
        const curDur = step.duration || 1;
        const nextDur = durations[(durations.indexOf(curDur) + 1) % durations.length];
        if (onResizeNote) {
          onResizeNote(selectedSeqTrack, stepIdx, nextDur);
        }
      }
    }
  };

  const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'pads', label: 'Pads', icon: <Flame className="w-5 h-5" /> },
    { id: 'keys', label: 'Keys', icon: <Music className="w-5 h-5" /> },
    { id: 'roll', label: 'Roll', icon: <Layers className="w-5 h-5" /> },
    { id: 'seq', label: 'Steps', icon: <Disc className="w-5 h-5" /> },
    { id: 'xy', label: 'XY FX', icon: <Zap className="w-5 h-5" /> },
    { id: 'mix', label: 'Mixer', icon: <Sliders className="w-5 h-5" /> }
  ];

  return (
    <div className="w-full min-h-screen bg-base text-ink flex flex-col justify-between pb-24 select-none">
      {/* Mobile Top Header */}
      <header className="w-full header-glass border-b border-line px-3 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="aurora-bar absolute top-0 left-0 right-0" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/25 flex items-center justify-center">
            <Radio className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wide text-ink leading-tight">
              AhPah Beats
            </h1>
            <span className="micro-label normal-case tracking-normal">Mobile Studio</span>
          </div>
        </div>

        {/* 4-Beat Light Tracker */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => {
            const isCurrentBeat = isPlaying && Math.floor((currentStep % 16) / 4) === i;
            return (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isCurrentBeat ? 'bg-accent' : 'bg-raised border border-line'
                }`}
              />
            );
          })}
        </div>

        {/* Mobile Transport Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPlayToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-400 text-zinc-950 shadow-[0_0_18px_-4px_rgba(251,191,36,0.7)]'
                : 'text-[#05060b] shadow-[0_0_18px_-4px_rgba(34,211,238,0.7)]'
            }`}
            style={isPlaying ? {} : { background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)' }}
            title="Play / Pause"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onStop}
            className="btn-icon w-8 h-8"
            title="Stop & Reset"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="btn-icon w-8 h-8"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="btn-icon w-8 h-8"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {/* Import Custom Instruments */}
          <button
            onClick={onOpenCustomInstruments}
            className="btn-icon w-8 h-8"
            title="Import Custom Instruments"
          >
            <Plus className="w-3.5 h-3.5 text-magenta" />
          </button>

          {/* Switch to Desktop */}
          <button
            onClick={onToggleViewMode}
            className="btn-icon w-8 h-8"
            title="Switch to Desktop Layout"
          >
            <Monitor className="w-3.5 h-3.5 text-accent" />
          </button>
        </div>
      </header>

      {/* Main Content Area based on Tab */}
      <main className="p-2 flex-1 flex flex-col justify-start overflow-y-auto gap-2">
        {activeTab === 'pads' && (
          <MobilePads
            tracks={project.tracks}
            onTriggerPad={handleTriggerPad}
          />
        )}

        {activeTab === 'keys' && (
          <MobileKeys
            synthTracks={synthTracks}
            selectedTrackIndex={selectedSynthTrack}
            scaleName={project.scale}
            rootKey={project.key}
            synthSettings={project.synth}
            onSelectTrack={(i) => setSelectedSynthTrack(i)}
            onUpdateSynth={onUpdateSynth}
            onAddSynthTrack={() => onAddTrack('synth')}
            onChangeTrackSound={onChangeTrackSound}
          />
        )}

        {activeTab === 'roll' && (
          <MobilePianoRoll
            tracks={project.tracks}
            selectedTrackIndex={selectedSynthTrack}
            currentStep={currentStep}
            stepCount={project.stepCount}
            isPlaying={isPlaying}
            scaleName={project.scale}
            rootKey={project.key}
            onSelectTrack={(i) => setSelectedSynthTrack(i)}
            onSetNote={onSetNote}
            onResizeNote={onResizeNote}
            onAddBar={onAddBar}
            onDuplicateBar={onDuplicateBar}
            onChangeStepCount={onChangeStepCount}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onClearAllNotes={onClearAllNotes}
          />
        )}

        {activeTab === 'seq' && (
          <div className="w-full flex flex-col gap-3 select-none">
            {/* Track Selector for Sequencer */}
            <div className="flex items-center justify-between bg-panel px-3 py-2 rounded-lg border border-line">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedSeqTrack((i) => Math.max(0, i - 1))}
                  disabled={selectedSeqTrack === 0}
                  className="btn-icon w-6 h-6 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-6 rounded-full"
                    style={{ backgroundColor: project.tracks[selectedSeqTrack]?.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-ink">
                      {project.tracks[selectedSeqTrack]?.name}
                    </div>
                    <div className="micro-label normal-case tracking-normal">
                      Track {selectedSeqTrack + 1} of {project.tracks.length}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSelectedSeqTrack((i) => Math.min(project.tracks.length - 1, i + 1))
                  }
                  disabled={selectedSeqTrack === project.tracks.length - 1}
                  className="btn-icon w-6 h-6 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mute & Solo */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleMute(selectedSeqTrack)}
                  className={`w-7 h-7 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                    project.tracks[selectedSeqTrack]?.muted
                      ? 'bg-rose-500 text-white border-rose-400/40'
                      : 'bg-raised text-ink-3 border-line hover:text-ink'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => onToggleSolo(selectedSeqTrack)}
                  className={`w-7 h-7 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                    project.tracks[selectedSeqTrack]?.solo
                      ? 'bg-amber-400 text-zinc-950 border-amber-300/50'
                      : 'bg-raised text-ink-3 border-line hover:text-ink'
                  }`}
                >
                  S
                </button>
              </div>
            </div>

            {/* Mobile Sequencer Bar Selector Strip */}
            <div className="flex items-center justify-between bg-panel p-2 rounded-lg border border-line gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {Array.from({ length: totalBars }).map((_, barIdx) => {
                  const isSelected = seqActiveBar === barIdx;
                  const isCurrentPlayingBar = isPlaying && Math.floor(currentStep / 16) === barIdx;
                  return (
                    <button
                      key={barIdx}
                      onClick={() => setSeqActiveBar(barIdx)}
                      className={`relative px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-raised text-ink border-line-strong'
                          : 'bg-well text-ink-3 border-line hover:text-ink-2'
                      }`}
                    >
                      {isCurrentPlayingBar && (
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
                    title="Add another bar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bar</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                {onDuplicateBar && totalBars > 1 && (
                  <button
                    onClick={() => {
                      const nextBar = (seqActiveBar + 1) % totalBars;
                      onDuplicateBar(seqActiveBar, nextBar);
                    }}
                    className="btn h-7"
                    title="Copy Bar"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Bar</span>
                  </button>
                )}
              </div>
            </div>

            {/* 16 Step Grid for Mobile Active Bar (4x4 layout) */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, stepIdx) => {
                const globalStepIdx = seqActiveBar * 16 + stepIdx;
                const track = project.tracks[selectedSeqTrack];
                const step = track?.steps[globalStepIdx];
                const isActive = step && step.active;
                const isCurrent = isPlaying && currentStep === globalStepIdx;
                const isBeatQuarter = stepIdx % 4 === 0;

                return (
                  <button
                    key={stepIdx}
                    onClick={() => onToggleStep(selectedSeqTrack, globalStepIdx)}
                    onContextMenu={(e) => handleCycleMobileStepDuration(e, globalStepIdx)}
                    className={`h-16 rounded-lg flex flex-col items-center justify-between p-2 border transition-colors cursor-pointer ${
                      isCurrent ? 'ring-1 ring-accent' : ''
                    } ${
                      isActive
                        ? 'border-transparent'
                        : isBeatQuarter
                        ? 'bg-raised border-line-strong'
                        : 'bg-well border-line'
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: track?.color }
                        : undefined
                    }
                    title={`Step ${globalStepIdx + 1}${step?.isRoll ? ' (1/32 Roll)' : ''} (Right click to resize)`}
                  >
                    <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-black/60' : 'text-ink-3'}`}>
                      #{globalStepIdx + 1}
                    </span>
                    <span className={`text-xs font-mono font-bold ${isActive ? 'text-black' : ''}`}>
                      {isActive
                        ? step.isRoll
                          ? 'ROLL'
                          : track?.type === 'synth'
                          ? `${step.note || 'C4'}${step.duration && step.duration > 1 ? ` (${step.duration})` : ''}`
                          : 'HIT'
                        : ''}
                    </span>
                    <div
                      className={`w-4 h-1 rounded-full ${
                        isActive ? 'bg-black/40' : 'bg-line'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'xy' && <MobileXYPad />}

        {activeTab === 'mix' && (
          <MobileMixer
            project={project}
            onUpdateTrackVolume={onUpdateTrackVolume}
            onToggleMute={onToggleMute}
            onToggleSolo={onToggleSolo}
            onSelectPreset={onSelectPreset}
            onExportWav={onExportWav}
            onSaveProject={onSaveProject}
            onOpenDesktopModal={onOpenDesktopModal}
            onRandomizeBeat={onRandomizeBeat}
            onChangeStepCount={onChangeStepCount}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 header-glass border-t border-line flex items-stretch justify-around px-1 z-50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
                isActive ? 'text-accent' : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-10 h-[3px] rounded-b-full" style={{ background: 'linear-gradient(90deg, #22d3ee, #8b5cf6)', boxShadow: '0 0 14px rgba(34,211,238,0.7)' }} />
              )}
              <span className={`transition-all ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
