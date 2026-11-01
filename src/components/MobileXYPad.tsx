import React, { useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { Sparkles, Zap } from 'lucide-react';

export const MobileXYPad: React.FC = () => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [isEngaged, setIsEngaged] = useState<boolean>(false);

  const handlePointerEvent = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();

    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    setTouchPos({ x: relX, y: relY });

    // Modulate audio in real time!
    // X Axis: Filter Cutoff (200Hz to 18000Hz exponential)
    const cutoff = 200 * Math.pow(18000 / 200, relX);

    // Y Axis: Inverted (Top = 100% FX wet, Bottom = Dry)
    const fxWet = (1 - relY) * 0.6; // up to 60% wet

    audioEngine.updateEffects({
      filterCutoff: cutoff,
      reverbWet: fxWet * 0.7,
      delayWet: fxWet * 0.5
    });
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsEngaged(true);
    if ('touches' in e && e.touches.length > 0) {
      handlePointerEvent(e.touches[0].clientX, e.touches[0].clientY);
    } else if ('clientX' in e) {
      handlePointerEvent(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isEngaged) return;
    if ('touches' in e && e.touches.length > 0) {
      handlePointerEvent(e.touches[0].clientX, e.touches[0].clientY);
    } else if ('clientX' in e) {
      handlePointerEvent(e.clientX, e.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsEngaged(false);
    // Smooth reset or hold
    audioEngine.updateEffects({
      filterCutoff: 18000,
      reverbWet: 0.25,
      delayWet: 0.2
    });
    setTouchPos(null);
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-panel px-3 py-2 rounded-lg border border-line">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink">
            Live XY FX Touchpad
          </span>
        </div>
        <span className={`text-[11px] font-mono font-bold ${isEngaged ? 'text-accent' : 'text-ink-3'}`}>
          {isEngaged ? 'TOUCH ACTIVE' : 'DRAG FINGER'}
        </span>
      </div>

      {/* Interactive Surface */}
      <div
        ref={padRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        className="relative w-full h-64 rounded-xl border border-line bg-well overflow-hidden flex items-center justify-center cursor-crosshair touch-none"
        style={{
          background: touchPos
            ? `radial-gradient(circle at ${touchPos.x * 100}% ${touchPos.y * 100}%, rgba(34, 211, 238, 0.08), rgba(12, 14, 21, 0.98) 70%)`
            : undefined
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-60">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border border-line" />
          ))}
        </div>

        {/* Labels on sides */}
        <div className="absolute top-2 left-3 micro-label normal-case tracking-normal text-ink-3 pointer-events-none">
          + REVERB & DELAY (Y)
        </div>
        <div className="absolute bottom-2 right-3 micro-label normal-case tracking-normal text-ink-3 pointer-events-none">
          + FILTER CUTOFF (X) →
        </div>

        {/* Cursor Reticle */}
        {touchPos && (
          <div
            className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 border-accent bg-accent/10 pointer-events-none flex items-center justify-center"
            style={{
              left: `${touchPos.x * 100}%`,
              top: `${touchPos.y * 100}%`
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          </div>
        )}

        {!isEngaged && (
          <div className="pointer-events-none text-center">
            <Sparkles className="w-8 h-8 text-ink-3 mx-auto mb-2" />
            <div className="text-xs font-semibold text-ink-2">Touch & Drag for Live FX Sweeps</div>
            <div className="micro-label normal-case tracking-normal mt-0.5">Filter Cutoff ↔ Echo Reverb</div>
          </div>
        )}
      </div>
    </div>
  );
};
