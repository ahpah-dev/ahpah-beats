import React, { useState } from 'react';
import { Track, SynthSoundType } from '../types';
import { SCALES } from '../audio/presets';
import { audioEngine } from '../audio/AudioEngine';
import { Music, ChevronLeft, ChevronRight, Lock, Unlock, Sparkles } from 'lucide-react';

interface MobileKeysProps {
  synthTracks: Track[];
  selectedTrackIndex: number;
  scaleName: string;
  rootKey: string;
  onSelectTrack: (index: number) => void;
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MobileKeys: React.FC<MobileKeysProps> = ({
  synthTracks,
  selectedTrackIndex,
  scaleName,
  rootKey,
  onSelectTrack
}) => {
  const [octave, setOctave] = useState<number>(4);
  const [scaleLock, setScaleLock] = useState<boolean>(true);
  const [activeNote, setActiveNote] = useState<string | null>(null);

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

  const handleKeyPress = (note: string) => {
    setActiveNote(note);
    if (currentTrack) {
      audioEngine.triggerSound(currentTrack, note, 0.9);
    }
  };

  const handleKeyRelease = () => {
    setActiveNote(null);
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Top Bar for Keys */}
      <div className="flex items-center justify-between bg-[#121622] px-3 py-2 rounded-xl border border-slate-800">
        {/* Synth Selector */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {synthTracks.map((track, i) => (
            <button
              key={track.id}
              onClick={() => onSelectTrack(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTrackIndex === i
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {track.name}
            </button>
          ))}
        </div>

        {/* Scale Lock & Octave */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setScaleLock(!scaleLock)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              scaleLock
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
            title="Lock keyboard to selected scale"
          >
            {scaleLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>SCALE</span>
          </button>

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setOctave((o) => Math.max(2, o - 1))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-cyan-300 px-1">
              OCT {octave}
            </span>
            <button
              onClick={() => setOctave((o) => Math.min(6, o + 1))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Touch Synth Keys */}
      <div className="w-full bg-[#0b0e14] rounded-2xl border border-slate-800 p-2 overflow-x-auto shadow-2xl">
        <div className="flex gap-1.5 min-w-full justify-center">
          {keysToDisplay.map((note) => {
            const isBlack = note.includes('#');
            const isActive = activeNote === note;

            return (
              <button
                key={note}
                onTouchStart={() => handleKeyPress(note)}
                onTouchEnd={handleKeyRelease}
                onMouseDown={() => handleKeyPress(note)}
                onMouseUp={handleKeyRelease}
                className={`relative flex-1 min-w-[42px] max-w-[56px] h-48 rounded-xl flex flex-col justify-end items-center pb-3 transition-all select-none touch-none border ${
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
        <span>Current Scale: {rootKey} {scaleName}</span>
        <span className="text-cyan-400">Zero Latency Web Audio</span>
      </div>
    </div>
  );
};
