import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Track } from '../types';
import { Flame, Repeat } from 'lucide-react';

interface MobilePadsProps {
  tracks: Track[];
  onTriggerPad: (track: Track, velocity?: number) => void;
  onRecordStep?: (trackIndex: number) => void;
}

export const MobilePads: React.FC<MobilePadsProps> = ({ tracks, onTriggerPad }) => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [rollMode, setRollMode] = useState<boolean>(false);
  const repeatIntervalRef = useRef<number | null>(null);
  const isTouchRef = useRef<boolean>(false);

  // We map up to 16 pads: all available tracks plus melodic variations
  const pads = tracks.slice(0, 8);

  const stopRepeating = useCallback(() => {
    if (repeatIntervalRef.current !== null) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    setActivePad(null);
  }, []);

  // Ensure any global touch release or window blur terminates any ongoing rolls
  useEffect(() => {
    const handleGlobalRelease = () => {
      stopRepeating();
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
      if (repeatIntervalRef.current !== null) {
        clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
    };
  }, [stopRepeating]);

  const handlePadStart = (track: Track, e: React.TouchEvent | React.MouseEvent) => {
    // Clear any previous interval immediately
    if (repeatIntervalRef.current !== null) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }

    if (e.type === 'touchstart') {
      isTouchRef.current = true;
    } else if (e.type === 'mousedown' && isTouchRef.current) {
      // Ignore synthetic mousedown fired after touchstart
      return;
    }

    setActivePad(track.id);

    // Calculate touch velocity
    let vel = 0.9;
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0];
      const target = touch.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const relativeY = (touch.clientY - rect.top) / rect.height;
      vel = Math.max(0.5, 1.0 - relativeY * 0.5);
    }

    onTriggerPad(track, vel);

    if (rollMode) {
      // Repeat roll at 1/16th rate while held down
      repeatIntervalRef.current = window.setInterval(() => {
        onTriggerPad(track, vel * 0.88);
      }, 125);
    }
  };

  const handlePadEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    stopRepeating();
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none pb-4">
      {/* Pads Header Bar */}
      <div className="flex items-center justify-between bg-[#121622] px-3 py-2 rounded-md border border-slate-800">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            MPC Beat Performance Pads
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              stopRepeating();
              setRollMode(!rollMode);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 ${
              rollMode
                ? 'bg-amber-500 text-slate-950  shadow-amber-500/40 ring-2 ring-amber-400'
                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>REPEAT ROLL: {rollMode ? 'ON' : 'OFF'}</span>
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
              onTouchStart={(e) => handlePadStart(track, e)}
              onTouchEnd={handlePadEnd}
              onTouchCancel={handlePadEnd}
              onMouseDown={(e) => handlePadStart(track, e)}
              onMouseUp={handlePadEnd}
              onMouseLeave={handlePadEnd}
              className={`relative h-28 rounded-lg flex flex-col justify-between p-3.5 transition-all transform active:scale-95 border select-none touch-none cursor-pointer ${
                isActive
                  ? 'brightness-125 scale-98 shadow-sm ring-2'
                  : 'bg-[#121622] hover:bg-[#161c2b] border-slate-800'
              }`}
              style={{
                borderColor: isActive ? track.color : undefined,
                boxShadow: isActive ? `0 0 25px ${track.color}88` : undefined,
                background: isActive
                  ? `radial-gradient(circle at center, ${track.color}55 0%, #121622 100%)`
                  : undefined
              }}
            >
              {/* Pad Indicator Light */}
              <div className="flex items-center justify-between w-full pointer-events-none">
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
              <div className="text-left pointer-events-none">
                <div className="text-sm font-bold text-slate-100 font-['Inter'] leading-tight">
                  {track.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {track.sound}
                </div>
              </div>

              {/* Touch Feedback Bar */}
              <div
                className="w-full h-1 rounded-full opacity-60 pointer-events-none"
                style={{ backgroundColor: track.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
