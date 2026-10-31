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
  Clock
} from 'lucide-react';

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
  onToggleViewMode: () => void;
  onUpdateSynth: (synth: Partial<SynthSettings>) => void;
  onAddTrack: (type: 'drum' | 'synth') => void;
  onChangeTrackSound: (trackId: string, sound: SynthSoundType) => void;
  onSetNote: (trackIndex: number, stepIndex: number, note: string | null, duration?: number) => void;
  onResizeNote?: (trackIndex: number, stepIndex: number, duration: number) => void;
  onAddBar?: () => void;
  onDuplicateBar?: (sourceBar: number, targetBar: number) => void;
  onChangeStepCount?: (newCount: number) => void;
}

export type MobileTab = 'pads' | 'keys' | 'roll' | 'seq' | 'xy' | 'mix';

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
  onToggleViewMode,
  onUpdateSynth,
  onAddTrack,
  onChangeTrackSound,
  onSetNote,
  onResizeNote,
  onAddBar,
  onDuplicateBar,
  onChangeStepCount
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('pads');
  const [selectedSeqTrack, setSelectedSeqTrack] = useState<number>(0);
  const [selectedSynthTrack, setSelectedSynthTrack] = useState<number>(0);

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

  return (
    <div className="w-full min-h-screen bg-[#080a0f] text-slate-100 flex flex-col justify-between pb-24 select-none">
      {/* Mobile Top Header */}
      <header className="w-full bg-[#0b0e14]/95 backdrop-blur-md border-b border-slate-800 px-3 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-white font-['Inter'] leading-tight">
              AhPah Beats
            </h1>
            <span className="text-[9px] text-cyan-400 font-mono font-semibold">Mobile Studio</span>
          </div>
        </div>

        {/* 4-Beat Light Tracker */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => {
            const isCurrentBeat = isPlaying && Math.floor((currentStep % 16) / 4) === i;
            return (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  isCurrentBeat ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {/* Mobile Transport Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPlayToggle}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onStop}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700/60 active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Switch to Desktop */}
          <button
            onClick={onToggleViewMode}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 active:scale-95 ml-1"
            title="Switch to Desktop Layout"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area based on Tab */}
      <main className="p-3 flex-1 flex flex-col justify-start overflow-y-auto">
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
          />
        )}

        {activeTab === 'seq' && (
          <div className="w-full flex flex-col gap-3 select-none">
            {/* Track Selector for Sequencer */}
            <div className="flex items-center justify-between bg-[#121622] px-3 py-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedSeqTrack((i) => Math.max(0, i - 1))}
                  disabled={selectedSeqTrack === 0}
                  className="p-1 text-slate-400 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-6 rounded-full"
                    style={{ backgroundColor: project.tracks[selectedSeqTrack]?.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {project.tracks[selectedSeqTrack]?.name}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      Track {selectedSeqTrack + 1} of {project.tracks.length}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSelectedSeqTrack((i) => Math.min(project.tracks.length - 1, i + 1))
                  }
                  disabled={selectedSeqTrack === project.tracks.length - 1}
                  className="p-1 text-slate-400 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mute & Solo */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleMute(selectedSeqTrack)}
                  className={`w-6 h-6 rounded text-[9px] font-mono font-bold ${
                    project.tracks[selectedSeqTrack]?.muted
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => onToggleSolo(selectedSeqTrack)}
                  className={`w-6 h-6 rounded text-[9px] font-mono font-bold ${
                    project.tracks[selectedSeqTrack]?.solo
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  S
                </button>
              </div>
            </div>

            {/* 16 Step Grid for Mobile (4x4 layout) */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, stepIdx) => {
                const track = project.tracks[selectedSeqTrack];
                const step = track?.steps[stepIdx];
                const isActive = step && step.active;
                const isCurrent = isPlaying && (currentStep % 16) === stepIdx;
                const isBeatQuarter = stepIdx % 4 === 0;

                return (
                  <button
                    key={stepIdx}
                    onClick={() => onToggleStep(selectedSeqTrack, stepIdx)}
                    onContextMenu={(e) => handleCycleMobileStepDuration(e, stepIdx)}
                    className={`h-16 rounded-xl flex flex-col items-center justify-between p-2 border transition-all active:scale-95 ${
                      isCurrent
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                        : isBeatQuarter
                        ? 'border-slate-700'
                        : 'border-slate-800/80'
                    } ${
                      isActive
                        ? 'shadow-lg'
                        : isBeatQuarter
                        ? 'bg-[#151a28]'
                        : 'bg-[#0f131c]'
                    }`}
                    style={{
                      backgroundColor: isActive ? track?.color : undefined,
                      boxShadow: isActive ? `0 0 15px ${track?.color}66` : undefined
                    }}
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{stepIdx + 1}
                    </span>
                    <span className="text-xs font-mono font-black text-slate-950">
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
                        isActive ? 'bg-slate-950' : 'bg-transparent'
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

      {/* Tactile Mobile Bottom Navigation Bar with dedicated Piano Roll tab */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0b0e14]/95 backdrop-blur-lg border-t border-slate-800/90 flex items-center justify-around px-2 z-50">
        <button
          onClick={() => setActiveTab('pads')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'pads' ? 'text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider font-mono">Pads</span>
        </button>

        <button
          onClick={() => setActiveTab('keys')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'keys' ? 'text-pink-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Music className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider font-mono">Keys</span>
        </button>

        <button
          onClick={() => setActiveTab('roll')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'roll' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider font-mono">Roll</span>
        </button>

        <button
          onClick={() => setActiveTab('seq')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'seq' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Disc className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider font-mono">Steps</span>
        </button>

        <button
          onClick={() => setActiveTab('xy')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'xy' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider font-mono">XY FX</span>
        </button>

        <button
          onClick={() => setActiveTab('mix')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'mix' ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider font-mono">Mixer</span>
        </button>
      </nav>
    </div>
  );
};
