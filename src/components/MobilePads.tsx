import React, { useState } from 'react';
import { Track, DrumSoundType, SynthSoundType } from '../types';
import { audioEngine } from '../audio/AudioEngine';
import { Flame, Repeat, Volume2, Sparkles } from 'lucide-react';

interface MobilePadsProps {
  tracks: Track[];
  onTriggerPad: (track: Track, velocity?: number) => void;
  onRecordStep?: (trackIndex: number) => void;
}

export const MobilePads: React.FC<MobilePadsProps> = ({ tracks, onTriggerPad }) => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [rollMode, setRollMode] = useState<boolean>(false);
  const [repeatInterval, setRepeatInterval] = useState<number | null>(null);

  // We map up to 16 pads: first all available tracks, then octave/pitch variations
  const pads = tracks.slice(0, 8);

  const handleTouchStart = (track: Track, e: React.TouchEvent | React.MouseEvent) => {
    setActivePad(track.id);

    // Estimate velocity from touch client coordinate or default 0.9
    let vel = 0.9;
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0];
      const target = touch.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const relativeY = (touch.clientY - rect.top) / rect.height;
      // Tapping near top is harder velocity (1.0), near bottom is softer (0.6)
      vel = Math.max(0.5, 1.0 - relativeY * 0.5);
    }

    onTriggerPad(track, vel);

    if (rollMode) {
      // Repeat roll
      const id = window.setInterval(() => {
        onTriggerPad(track, vel * 0.85);
      }, 120);
      setRepeatInterval(id);
    }
  };

  const handleTouchEnd = () => {
    setActivePad(null);
    if (repeatInterval) {
      clearInterval(repeatInterval);
      setRepeatInterval(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Pads Header Bar */}
      <div className="flex items-center justify-between bg-[#121622] px-3 py-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            MPC Beat Performance Pads
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRollMode(!rollMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 ${
              rollMode
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>ROLL</span>
          </button>
        </div>
      </div>

      {/* 4x2 or 4x4 Big Touch Pad Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {pads.map((track) => {
          const isActive = activePad === track.id;

          return (
            <button
              key={track.id}
              onTouchStart={(e) => handleTouchStart(track, e)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={(e) => handleTouchStart(track, e)}
              onMouseUp={handleTouchEnd}
              className={`relative h-28 rounded-2xl flex flex-col justify-between p-3.5 transition-all transform active:scale-95 border select-none touch-none ${
                isActive
                  ? 'brightness-125 scale-98 shadow-2xl'
                  : 'bg-[#121622] hover:bg-[#161c2b] border-slate-800'
              }`}
              style={{
                borderColor: isActive ? track.color : undefined,
                boxShadow: isActive ? `0 0 25px ${track.color}88` : undefined,
                background: isActive
                  ? `radial-gradient(circle at center, ${track.color}44 0%, #121622 100%)`
                  : undefined
              }}
            >
              {/* Pad Indicator Light */}
              <div className="flex items-center justify-between w-full">
                <span
                  className="w-3 h-3 rounded-full transition-transform"
                  style={{
                    backgroundColor: track.color,
                    boxShadow: isActive ? `0 0 10px ${track.color}` : 'none',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)'
                  }}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  {track.type}
                </span>
              </div>

              {/* Pad Name */}
              <div className="text-left">
                <div className="text-sm font-bold text-slate-100 font-['Inter'] leading-tight">
                  {track.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {track.sound}
                </div>
              </div>

              {/* Touch Feedback Ripple */}
              <div
                className="w-full h-1 rounded-full opacity-60"
                style={{ backgroundColor: track.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
