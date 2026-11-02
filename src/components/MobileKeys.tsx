import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Track, SynthSoundType, SynthSettings } from '../types';
import { Select } from './Select';
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
  Layers,
  ChevronDown,
  ChevronUp,
  MoveHorizontal,
  Volume2
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

// Spanning 4 octaves from Octave 2 to Octave 5 (plus C6)
const OCTAVES_RANGE = [2, 3, 4, 5];

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
  const [interactionMode, setInteractionMode] = useState<'play' | 'scroll'>('play');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const keyRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Guards against mobile browser synthetic mouse event emulation on touch release
  const isTouchRef = useRef<boolean>(false);
  const touchTimeoutRef = useRef<number | null>(null);

  const currentTrack = synthTracks[selectedTrackIndex] || synthTracks[0];

  // Notes in scale
  const scaleIntervals = SCALES[scaleName] || SCALES['Minor (Aeolian)'];
  const rootIndex = ALL_NOTES.indexOf(rootKey);
  const scaleNotes = scaleIntervals.map((interval) => ALL_NOTES[(rootIndex + interval) % 12]);

  // Build multi-octave keys to display (spanning C2 to C6)
  const keysToDisplay: string[] = [];
  if (scaleLock) {
    OCTAVES_RANGE.forEach((oct) => {
      scaleNotes.forEach((n) => {
        keysToDisplay.push(`${n}${oct}`);
      });
    });
    // Add resolving top tonic note (e.g. C6)
    keysToDisplay.push(`${scaleNotes[0]}6`);
  } else {
    OCTAVES_RANGE.forEach((oct) => {
      ALL_NOTES.forEach((n) => {
        keysToDisplay.push(`${n}${oct}`);
      });
    });
    keysToDisplay.push(`C6`);
  }

  // Scroll to a specific note or octave
  const scrollToNote = useCallback((note: string, behavior: ScrollBehavior = 'smooth') => {
    const el = keyRefs.current.get(note);
    if (el && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      const containerWidth = container.offsetWidth;
      container.scrollTo({
        left: elLeft - (containerWidth / 2) + (elWidth / 2),
        behavior
      });
    }
  }, []);

  // Center on default octave (C4) on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToNote(`C${octave}`, 'auto');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyPress = useCallback((note: string) => {
    setActiveNote(note);
    if (currentTrack) {
      audioEngine.triggerSound(currentTrack, note, 0.9);
    }
  }, [currentTrack]);

  const handleKeyRelease = useCallback(() => {
    setActiveNote(null);
  }, []);

  // Global release handler to prevent stuck keys
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

  // Touch handlers
  const handleTouchStart = (note: string, e: React.TouchEvent) => {
    if (interactionMode === 'scroll') {
      // In scroll mode, allow native touch scroll
      return;
    }
    e.preventDefault();
    isTouchRef.current = true;
    if (touchTimeoutRef.current !== null) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    handleKeyPress(note);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (interactionMode === 'scroll') return;
    e.preventDefault();
    handleKeyRelease();
    touchTimeoutRef.current = window.setTimeout(() => {
      isTouchRef.current = false;
      touchTimeoutRef.current = null;
    }, 400);
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    if (interactionMode === 'scroll') return;
    e.preventDefault();
    handleKeyRelease();
    touchTimeoutRef.current = window.setTimeout(() => {
      isTouchRef.current = false;
      touchTimeoutRef.current = null;
    }, 400);
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (note: string, e: React.MouseEvent) => {
    if (isTouchRef.current || interactionMode === 'scroll') return;
    handleKeyPress(note);
  };

  const handleMouseUp = () => {
    if (isTouchRef.current || interactionMode === 'scroll') return;
    handleKeyRelease();
  };

  const handleOctaveJump = (targetOct: number) => {
    setOctave(targetOct);
    scrollToNote(`C${targetOct}`, 'smooth');
  };

  return (
    <div className="w-full flex flex-col gap-2.5 select-none pb-6">
      {/* 1. Track Selector Strip */}
      <div className="w-full bg-panel p-2 rounded-lg border border-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1 min-w-0">
          {synthTracks.map((track, i) => {
            const isSelected = selectedTrackIndex === i;
            return (
              <button
                key={track.id}
                onClick={() => onSelectTrack(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-raised text-ink border-line-strong'
                    : 'text-ink-3 border-transparent hover:text-ink-2'
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

        {onAddSynthTrack && (
          <button
            onClick={onAddSynthTrack}
            className="btn h-7"
            title="Add Custom Synth Track"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>Synth</span>
          </button>
        )}
      </div>

      {/* 2. Secondary Control Bar: Mode, Scale Lock, Sound Shaper */}
      <div className="flex flex-wrap items-center justify-between bg-panel px-3 py-2 rounded-lg border border-line gap-2">
        {/* Toggle Sound Shaper */}
        <button
          onClick={() => setShowSoundDesigner(!showSoundDesigner)}
          className={`btn h-7 ${showSoundDesigner ? 'text-ink' : ''}`}
          title="Toggle synth sound designer"
        >
          <Sliders className="w-3.5 h-3.5 text-accent" />
          <span>Sound Shaper</span>
          {showSoundDesigner ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Interaction Mode & Scale Lock */}
        <div className="flex items-center gap-2">
          {/* Mode Switch: Play vs Scroll */}
          <div className="seg">
            <button
              onClick={() => setInteractionMode(interactionMode === 'scroll' ? 'play' : 'scroll')}
              className={`seg-item flex items-center gap-1 ${interactionMode === 'scroll' ? 'seg-item-active' : ''}`}
              title={interactionMode === 'play' ? 'Switch to touch swipe scroll mode' : 'Switch to touch key play mode'}
            >
              {interactionMode === 'scroll' ? (
                <>
                  <MoveHorizontal className="w-3.5 h-3.5" />
                  <span>SCROLL</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-accent" />
                  <span>PLAY</span>
                </>
              )}
            </button>
          </div>

          {/* Scale Lock Button */}
          <div className="seg">
            <button
              onClick={() => setScaleLock(!scaleLock)}
              className={`seg-item flex items-center gap-1 ${scaleLock ? 'seg-item-active' : ''}`}
              title="Lock keyboard to selected musical scale"
            >
              {scaleLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>SCALE</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Sound Designer (ADSR & Waveforms) */}
      {showSoundDesigner && (
        <div className="w-full bg-well rounded-lg border border-line p-3.5 flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Layers className="w-4 h-4 text-accent" />
              <span>Sound Shaper</span>
            </div>
            <Select
              value={synthSettings.waveform}
              options={[
                { value: 'sawtooth', label: 'SAW', accent: '#22d3ee' },
                { value: 'square', label: 'SQUARE', accent: '#22d3ee' },
                { value: 'triangle', label: 'TRIANGLE', accent: '#22d3ee' },
                { value: 'sine', label: 'SINE', accent: '#22d3ee' }
              ]}
              onChange={(v) => onUpdateSynth({ waveform: v as OscillatorType })}
              size="sm"
              variant="solid"
            />
          </div>

          {currentTrack && onChangeTrackSound && (
            <div className="flex flex-col gap-1">
              <span className="micro-label">Sound Engine</span>
              <div className="grid grid-cols-3 gap-1.5">
                {SYNTH_SOUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onChangeTrackSound(currentTrack.id, preset.id)}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold truncate border transition-colors cursor-pointer ${
                      currentTrack.sound === preset.id
                        ? 'bg-raised text-ink border-line-strong'
                        : 'text-ink-3 border-line hover:text-ink-2'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ADSR Sliders */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-line">
            <div className="flex flex-col items-center">
              <span className="micro-label">ATK</span>
              <input
                type="range"
                min={0.005}
                max={0.5}
                step={0.005}
                value={synthSettings.attack}
                onChange={(e) => onUpdateSynth({ attack: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-[8px] font-mono text-ink-3 mt-0.5">
                {Math.round(synthSettings.attack * 1000)}ms
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="micro-label">DEC</span>
              <input
                type="range"
                min={0.05}
                max={1.0}
                step={0.01}
                value={synthSettings.decay}
                onChange={(e) => onUpdateSynth({ decay: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-[8px] font-mono text-ink-3 mt-0.5">
                {Math.round(synthSettings.decay * 1000)}ms
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="micro-label">SUS</span>
              <input
                type="range"
                min={0}
                max={1.0}
                step={0.02}
                value={synthSettings.sustain}
                onChange={(e) => onUpdateSynth({ sustain: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-[8px] font-mono text-ink-3 mt-0.5">
                {Math.round(synthSettings.sustain * 100)}%
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="micro-label">REL</span>
              <input
                type="range"
                min={0.05}
                max={1.5}
                step={0.02}
                value={synthSettings.release}
                onChange={(e) => onUpdateSynth({ release: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-[8px] font-mono text-ink-3 mt-0.5">
                {Math.round(synthSettings.release * 1000)}ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Mini Octave Jump Ribbon & Scroll Navigator */}
      <div className="w-full bg-panel px-3 py-1.5 rounded-lg border border-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-3">
          <span className="text-accent font-bold">OCTAVES:</span>
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
              }
            }}
            className="btn-icon w-6 h-6 rounded"
            title="Scroll Keys Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
              }
            }}
            className="btn-icon w-6 h-6 rounded"
            title="Scroll Keys Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {OCTAVES_RANGE.map((oct) => (
            <button
              key={oct}
              onClick={() => handleOctaveJump(oct)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer border ${
                octave === oct
                  ? 'bg-raised text-ink border-line-strong'
                  : 'bg-well text-ink-3 border-line hover:text-ink-2'
              }`}
            >
              C{oct}
            </button>
          ))}
          <button
            onClick={() => handleOctaveJump(6)}
            className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-well text-ink-3 border border-line hover:text-ink-2 transition-colors cursor-pointer"
          >
            C6
          </button>
        </div>
      </div>

      {/* 5. Scrollable Multi-Octave Keys Container */}
      <div
        ref={scrollContainerRef}
        className="w-full bg-well rounded-xl border border-line p-2 overflow-x-auto touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-1.5 min-w-max px-1 py-1">
          {keysToDisplay.map((note) => {
            const isBlack = note.includes('#');
            const isActive = activeNote === note;
            const isTonic = note.startsWith(rootKey);
            const isC = note.startsWith('C') && !note.includes('#');

            return (
              <button
                key={note}
                ref={(el) => {
                  if (el) keyRefs.current.set(note, el);
                  else keyRefs.current.delete(note);
                }}
                onTouchStart={(e) => handleTouchStart(note, e)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                onMouseDown={(e) => handleMouseDown(note, e)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative flex-shrink-0 w-12 sm:w-14 h-44 rounded-lg flex flex-col justify-end items-center pb-3 transition-colors border cursor-pointer select-none ${
                  isActive
                    ? 'bg-accent text-[#052730] border-accent'
                    : isBlack
                    ? 'bg-base text-ink-3 border-line hover:text-ink-2'
                    : isTonic
                    ? 'bg-raised text-accent border-line hover:bg-panel'
                    : 'bg-raised text-ink-2 border-line hover:bg-panel'
                }`}
              >
                {/* Octave marker at the top of C notes */}
                {isC && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-well border border-line text-ink-3 rounded px-1.5 py-0.5">
                    {note}
                  </div>
                )}

                {/* Accent indicator dot */}
                <div
                  className={`w-2 h-2 rounded-full mb-2 ${
                    isActive
                      ? 'bg-[#052730]'
                      : isTonic
                      ? 'bg-accent'
                      : isBlack
                      ? 'bg-ink-3'
                      : 'bg-ink-3/70'
                  }`}
                />

                {/* Note Label */}
                <span className="text-xs font-mono font-bold tracking-tight">
                  {note}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="flex items-center justify-between text-[11px] text-ink-3 px-2 font-mono">
        <div className="flex items-center gap-1.5">
          <span>Scale:</span>
          <span className="text-accent font-bold">{rootKey} {scaleName}</span>
          <span>•</span>
          <span>Swipe horizontally or tap C2–C6 to scroll</span>
        </div>
        <span className="text-ink-2 font-semibold">{currentTrack?.name}</span>
      </div>
    </div>
  );
};
