import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Track, SynthSoundType, SynthSettings } from '../types';
import { SCALES } from '../audio/presets';
import { audioEngine } from '../audio/AudioEngine';
import {
  Music,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Sliders,
  Plus,
  Waves,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MobileKeysProps {
  synthTracks: Track[];
  selectedTrackIndex: number;
  scaleName: string;
  rootKey: string;
  synthSettings: SynthSettings;
  onSelectTrack: (index: number) => void;
  onUpdateSynth: (synth: Partial<SynthSettings>) => void;
  onAddSynthTrack?: () => void;
  onChangeTrackSound?: (trackId: string, sound: SynthSoundType) => void;
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SYNTH_SOUND_PRESETS: { id: SynthSoundType; label: string }[] = [
  { id: 'neon-lead', label: 'Neon Lead' },
  { id: '808-sub', label: '808 Sub Bass' },
  { id: 'cyber-pluck', label: 'Cyber Pluck' },
  { id: 'lofi-rhodes', label: 'Lo-Fi Rhodes' },
  { id: 'retro-bass', label: 'Retro Bass' },
  { id: 'warm-pad', label: 'Warm Pad' }
];

export const MobileKeys: React.FC<MobileKeysProps> = ({
  synthTracks,
  selectedTrackIndex,
  scaleName,
  rootKey,
  synthSettings,
  onSelectTrack,
  onUpdateSynth,
  onAddSynthTrack,
  onChangeTrackSound
}) => {
  const [octave, setOctave] = useState<number>(4);
  const [scaleLock, setScaleLock] = useState<boolean>(true);
  const [showSoundDesigner, setShowSoundDesigner] = useState<boolean>(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // Guards against mobile browser synthetic mouse event emulation on touch release
  const isTouchRef = useRef<boolean>(false);
  const touchTimeoutRef = useRef<number | null>(null);

  const currentTrack = synthTracks[selectedTrackIndex] || synthTracks[0];

  // Notes in scale
  const scaleIntervals = SCALES[scaleName] || SCALES['Minor (Aeolian)'];
  const rootIndex = ALL_NOTES.indexOf(rootKey);
  const scaleNotes = scaleIntervals.map((interval) => ALL_NOTES[(rootIndex + interval) % 12]);

  // Keys to display
  let keysToDisplay: string[] = [];
  if (scaleLock) {
    // Show only the scale notes across octave and next
    keysToDisplay = [
      ...scaleNotes.map((n) => `${n}${octave}`),
      ...scaleNotes.slice(0, 4).map((n) => `${n}${octave + 1}`)
    ];
  } else {
    // Standard chromatic octave
    keysToDisplay = ALL_NOTES.map((n) => `${n}${octave}`);
  }

  const handleKeyPress = useCallback((note: string) => {
    setActiveNote(note);
    if (currentTrack) {
      audioEngine.triggerSound(currentTrack, note, 0.9);
    }
  }, [currentTrack]);

  const handleKeyRelease = useCallback(() => {
    setActiveNote(null);
  }, []);

  // Global release handler to prevent stuck keys on drag out or window blur
  useEffect(() => {
    const handleGlobalRelease = () => {
      handleKeyRelease();
    };

    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);
    window.addEventListener('blur', handleGlobalRelease);

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
      if (touchTimeoutRef.current !== null) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, [handleKeyRelease]);

  // Touch handlers with e.preventDefault() to strictly prevent synthetic mousedown
  const handleTouchStart = (note: string, e: React.TouchEvent) => {
    e.preventDefault();
    isTouchRef.current = true;
    if (touchTimeoutRef.current !== null) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    handleKeyPress(note);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleKeyRelease();
    // Keep isTouchRef active for 500ms to block delayed synthetic mousedown
    touchTimeoutRef.current = window.setTimeout(() => {
      isTouchRef.current = false;
      touchTimeoutRef.current = null;
    }, 500);
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    handleKeyRelease();
    touchTimeoutRef.current = window.setTimeout(() => {
      isTouchRef.current = false;
      touchTimeoutRef.current = null;
    }, 500);
  };

  // Mouse handlers for desktop testing (ignored when initiated via touch)
  const handleMouseDown = (note: string, e: React.MouseEvent) => {
    if (isTouchRef.current) {
      return;
    }
    handleKeyPress(note);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isTouchRef.current) {
      return;
    }
    handleKeyRelease();
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none pb-6">
      {/* 1. Dedicated Unblocked Synth Track Selector Strip */}
      <div className="w-full bg-[#121622] p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin py-0.5 flex-1 min-w-0">
          {synthTracks.map((track, i) => {
            const isSelected = selectedTrackIndex === i;
            return (
              <button
                key={track.id}
                onClick={() => onSelectTrack(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <span>{track.name}</span>
              </button>
            );
          })}
        </div>

        {/* Add Synth Track Button */}
        {onAddSynthTrack && (
          <button
            onClick={onAddSynthTrack}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 border border-pink-700/60 text-pink-300 text-xs font-bold flex-shrink-0 active:scale-95"
            title="Add Custom Synth Track"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Synth</span>
          </button>
        )}
      </div>

      {/* 2. Secondary Control Bar (Scale Lock, Octave, and Sound Shaper Toggle) */}
      <div className="flex flex-wrap items-center justify-between bg-[#121622] px-3 py-2 rounded-xl border border-slate-800 gap-2">
        {/* Toggle Sound Shaper / Custom Synth Settings */}
        <button
          onClick={() => setShowSoundDesigner(!showSoundDesigner)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
            showSoundDesigner
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Synth Designer</span>
          {showSoundDesigner ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Scale Lock & Octave Controls */}
        <div className="flex items-center gap-2">
          {/* Scale Lock Button */}
          <button
            onClick={() => setScaleLock(!scaleLock)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 ${
              scaleLock
                ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
            }`}
            title="Lock keyboard to selected scale"
          >
            {scaleLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>SCALE</span>
          </button>

          {/* Octave Switcher */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setOctave((o) => Math.max(1, o - 1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Lower Octave"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-cyan-300 px-1.5">
              C{octave}
            </span>
            <button
              onClick={() => setOctave((o) => Math.min(6, o + 1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Higher Octave"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Custom Synth Sound Designer (ADSR & Waveforms) */}
      {showSoundDesigner && (
        <div className="w-full bg-[#101420] rounded-2xl border border-cyan-800/60 p-3.5 shadow-2xl flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Custom Synth Sound Shaper</span>
            </div>
            {/* Waveform Selector */}
            <select
              value={synthSettings.waveform}
              onChange={(e) => onUpdateSynth({ waveform: e.target.value as OscillatorType })}
              className="bg-slate-900 text-xs font-mono font-bold text-cyan-300 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="sawtooth">SAW</option>
              <option value="square">SQUARE</option>
              <option value="triangle">TRIANGLE</option>
              <option value="sine">SINE</option>
            </select>
          </div>

          {/* Sound Type Preset Selector */}
          {currentTrack && onChangeTrackSound && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">Sound Engine:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {SYNTH_SOUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onChangeTrackSound(currentTrack.id, preset.id)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate border transition-all ${
                      currentTrack.sound === preset.id
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ADSR Sliders */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800">
            {/* Attack */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-400">ATK</span>
              <input
                type="range"
                min={0.005}
                max={0.5}
                step={0.005}
                value={synthSettings.attack}
                onChange={(e) => onUpdateSynth({ attack: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded mt-1 accent-cyan-400"
              />
              <span className="text-[8px] font-mono text-cyan-400 mt-0.5">
                {Math.round(synthSettings.attack * 1000)}ms
              </span>
            </div>

            {/* Decay */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-400">DEC</span>
              <input
                type="range"
                min={0.05}
                max={1.0}
                step={0.01}
                value={synthSettings.decay}
                onChange={(e) => onUpdateSynth({ decay: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded mt-1 accent-cyan-400"
              />
              <span className="text-[8px] font-mono text-cyan-400 mt-0.5">
                {Math.round(synthSettings.decay * 1000)}ms
              </span>
            </div>

            {/* Sustain */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-400">SUS</span>
              <input
                type="range"
                min={0}
                max={1.0}
                step={0.02}
                value={synthSettings.sustain}
                onChange={(e) => onUpdateSynth({ sustain: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded mt-1 accent-cyan-400"
              />
              <span className="text-[8px] font-mono text-cyan-400 mt-0.5">
                {Math.round(synthSettings.sustain * 100)}%
              </span>
            </div>

            {/* Release */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-400">REL</span>
              <input
                type="range"
                min={0.05}
                max={1.5}
                step={0.02}
                value={synthSettings.release}
                onChange={(e) => onUpdateSynth({ release: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded mt-1 accent-cyan-400"
              />
              <span className="text-[8px] font-mono text-cyan-400 mt-0.5">
                {Math.round(synthSettings.release * 1000)}ms
              </span>
            </div>
          </div>

          {/* Filter Cutoff & Resonance */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Filter Cutoff</span>
                <span className="text-cyan-400">{Math.round(synthSettings.cutoff)}Hz</span>
              </div>
              <input
                type="range"
                min={200}
                max={16000}
                step={50}
                value={synthSettings.cutoff}
                onChange={(e) => onUpdateSynth({ cutoff: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded mt-1 accent-cyan-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Resonance (Q)</span>
                <span className="text-cyan-400">{synthSettings.resonance.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={8.0}
                step={0.1}
                value={synthSettings.resonance}
                onChange={(e) => onUpdateSynth({ resonance: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded mt-1 accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Touch Synth Keys */}
      <div className="w-full bg-[#0b0e14] rounded-2xl border border-slate-800 p-2 overflow-x-auto shadow-2xl">
        <div className="flex gap-1.5 min-w-full justify-center">
          {keysToDisplay.map((note) => {
            const isBlack = note.includes('#');
            const isActive = activeNote === note;

            return (
              <button
                key={note}
                onTouchStart={(e) => handleTouchStart(note, e)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                onMouseDown={(e) => handleMouseDown(note, e)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative flex-1 min-w-[42px] max-w-[56px] h-48 rounded-xl flex flex-col justify-end items-center pb-3 transition-all select-none touch-none border cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-t from-cyan-400 to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/50 scale-95'
                    : isBlack
                    ? 'bg-[#151922] text-slate-300 border-slate-800 hover:border-slate-600'
                    : 'bg-[#222938] text-white border-slate-700/80 hover:bg-[#283244]'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mb-2 ${
                    isActive ? 'bg-slate-950' : isBlack ? 'bg-slate-700' : 'bg-cyan-400/80'
                  }`}
                />
                <span className="text-xs font-mono font-bold tracking-tight">
                  {note}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 font-mono">
        <span>Scale: {rootKey} {scaleName}</span>
        <span className="text-cyan-400">{currentTrack?.name} ({currentTrack?.sound})</span>
      </div>
    </div>
  );
};
