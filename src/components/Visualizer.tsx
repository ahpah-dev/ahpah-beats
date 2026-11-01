import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { Activity, BarChart2, Radio, Gauge } from 'lucide-react';

export const Visualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'spectrum' | 'wave' | 'phase'>('spectrum');
  const [peakDb, setPeakDb] = useState<string>('-∞ dB');
  const [isClipping, setIsClipping] = useState<boolean>(false);
  const animFrameId = useRef<number | null>(null);
  const peakHoldRef = useRef<{ values: number[]; timer: number[] }>({ values: [], timer: [] });
  const masterPeakRef = useRef<{ peak: number; holdTime: number }>({ peak: 0, holdTime: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.masterAnalyser;
    const bufferLength = analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const barCount = 56;
    if (peakHoldRef.current.values.length !== barCount) {
      peakHoldRef.current.values = new Array(barCount).fill(0);
      peakHoldRef.current.timer = new Array(barCount).fill(0);
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      animFrameId.current = requestAnimationFrame(render);
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Handle High-DPI canvas resizing
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.max(200, Math.floor(rect.width));
      const displayHeight = Math.max(60, Math.floor(rect.height));

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Studio dark background with subtle decay trail
      ctx.fillStyle = 'rgba(10, 13, 20, 0.32)';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Subtle horizontal dB reference gridlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridLevels = [0.25, 0.5, 0.75];
      gridLevels.forEach((level) => {
        const y = Math.floor(displayHeight * level);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
      });

      // Analyze time domain for master peak calculation
      analyser.getByteTimeDomainData(timeData);
      let maxInstantDiff = 0;
      for (let i = 0; i < bufferLength; i += 4) {
        const diff = Math.abs(timeData[i] - 128);
        if (diff > maxInstantDiff) maxInstantDiff = diff;
      }
      const rawPeakPercent = maxInstantDiff / 128; // 0 to 1

      // Master peak hold calculation
      if (rawPeakPercent >= masterPeakRef.current.peak) {
        masterPeakRef.current.peak = rawPeakPercent;
        masterPeakRef.current.holdTime = now + 400;
      } else if (now > masterPeakRef.current.holdTime) {
        masterPeakRef.current.peak = Math.max(0, masterPeakRef.current.peak - delta * 1.5);
      }

      // Update peak display (throttled visually)
      if (masterPeakRef.current.peak > 0.01) {
        const db = 20 * Math.log10(masterPeakRef.current.peak);
        setPeakDb(db > -0.1 ? '+0.0 dB' : `${db.toFixed(1)} dB`);
        setIsClipping(masterPeakRef.current.peak >= 0.98);
      } else {
        setPeakDb('-∞ dB');
        setIsClipping(false);
      }

      // Render Active Mode
      if (mode === 'spectrum') {
        analyser.getByteFrequencyData(freqData);

        const meterWidth = 70; // reserve space on right for stereo VU meter
        const visualWidth = displayWidth - meterWidth;
        const barWidth = Math.max(2, (visualWidth / barCount) * 0.72);
        const gap = (visualWidth / barCount) * 0.28;

        for (let i = 0; i < barCount; i++) {
          // Logarithmic frequency distribution
          const freqIndex = Math.min(
            bufferLength - 1,
            Math.floor(Math.pow(i / barCount, 2.1) * (bufferLength * 0.6) + i)
          );
          const value = freqData[freqIndex] || 0;
          const targetHeight = (value / 255) * (displayHeight - 10);

          // Peak hold logic
          if (targetHeight >= peakHoldRef.current.values[i]) {
            peakHoldRef.current.values[i] = targetHeight;
            peakHoldRef.current.timer[i] = now + 500;
          } else if (now > peakHoldRef.current.timer[i]) {
            peakHoldRef.current.values[i] = Math.max(0, peakHoldRef.current.values[i] - delta * 45);
          }

          const x = i * (barWidth + gap) + gap / 2;
          const y = displayHeight - targetHeight;

          // Studio spectrum gradient: Obsidian -> Cyan -> Emerald -> Violet -> Red
          const grad = ctx.createLinearGradient(0, displayHeight, 0, 0);
          grad.addColorStop(0, '#00f2fe');
          grad.addColorStop(0.5, '#3b82f6');
          grad.addColorStop(0.8, '#a855f7');
          grad.addColorStop(1, '#f43f5e');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, targetHeight, [2, 2, 0, 0]);
          ctx.fill();

          // High-precision peak needle cap
          const peakY = displayHeight - peakHoldRef.current.values[i];
          if (peakHoldRef.current.values[i] > 3) {
            ctx.fillStyle = peakHoldRef.current.values[i] > displayHeight * 0.85 ? '#f43f5e' : '#f1f5f9';
            ctx.fillRect(x, Math.max(1, peakY - 1.5), barWidth, 1.5);
          }
        }

        // Render Hardware VU Meter Bar on the right
        const meterX = displayWidth - 54;
        const meterH = displayHeight - 16;
        const meterY = 8;
        const meterW = 12;

        // Background groove
        ctx.fillStyle = '#101522';
        ctx.fillRect(meterX, meterY, meterW, meterH);
        ctx.fillRect(meterX + meterW + 4, meterY, meterW, meterH);

        // LED segment count
        const segments = 16;
        const segH = (meterH - (segments - 1) * 1.5) / segments;

        const leftLevel = masterPeakRef.current.peak;
        const rightLevel = Math.max(0, masterPeakRef.current.peak * 0.96);

        for (let s = 0; s < segments; s++) {
          const segY = meterY + meterH - (s + 1) * (segH + 1.5);
          const ratio = (s + 1) / segments;

          // Color per segment
          let segColor = '#10b981'; // green
          if (ratio > 0.85) segColor = '#ef4444'; // red clipping
          else if (ratio > 0.65) segColor = '#f59e0b'; // amber

          // Left channel LED
          if (leftLevel >= ratio * 0.95) {
            ctx.fillStyle = segColor;
            ctx.fillRect(meterX + 1, segY, meterW - 2, segH);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.fillRect(meterX + 1, segY, meterW - 2, segH);
          }

          // Right channel LED
          if (rightLevel >= ratio * 0.95) {
            ctx.fillStyle = segColor;
            ctx.fillRect(meterX + meterW + 5, segY, meterW - 2, segH);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.fillRect(meterX + meterW + 5, segY, meterW - 2, segH);
          }
        }

        // L / R labels
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('L', meterX + 3, displayHeight - 2);
        ctx.fillText('R', meterX + meterW + 7, displayHeight - 2);
      } else if (mode === 'wave') {
        // Oscilloscope mode
        const visualWidth = displayWidth - 40;
        ctx.lineWidth = 2;
        const grad = ctx.createLinearGradient(0, 0, visualWidth, 0);
        grad.addColorStop(0, '#00f2fe');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, '#818cf8');
        ctx.strokeStyle = grad;

        // Center zero reference line
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
        ctx.beginPath();
        ctx.moveTo(10, displayHeight / 2);
        ctx.lineTo(visualWidth + 10, displayHeight / 2);
        ctx.stroke();

        ctx.strokeStyle = grad;
        ctx.beginPath();
        const sliceWidth = visualWidth / bufferLength;
        let x = 10;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * (displayHeight - 8)) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
      } else {
        // Phase / Goniometer mode
        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        const radius = Math.min(displayWidth, displayHeight) * 0.42;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < bufferLength - 1; i += 2) {
          const l = (timeData[i] - 128) / 128;
          const r = (timeData[i + 1] - 128) / 128;
          const px = centerX + (l - r) * radius * 0.9;
          const py = centerY - (l + r) * radius * 0.6;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-16 sm:h-20 bg-[#0a0d14] rounded-lg overflow-hidden border border-slate-800/80 shadow-md group select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Top Left Studio Telemetry */}
      <div className="absolute left-3 top-2 flex items-center gap-2 pointer-events-none">
        <span className={`w-2 h-2 rounded-full transition-colors ${isClipping ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
        <span className="text-[10px] font-mono tracking-wider text-slate-300 font-semibold uppercase">
          MASTER {mode === 'spectrum' ? 'FFT ANALYZER' : mode === 'wave' ? 'OSCILLOSCOPE' : 'STEREO PHASE'}
        </span>
        <span className="hidden sm:inline text-[9px] font-mono text-slate-500">
          • 44.1 kHz • 32-bit Float
        </span>
      </div>

      {/* Right Controls & Peak DB readout */}
      <div className="absolute right-2 top-2 flex items-center gap-2">
        {/* Peak dB Readout */}
        <div className="hidden sm:flex items-center gap-1 bg-[#10141f] border border-slate-800 px-2 py-0.5 rounded font-mono text-[10px]">
          <span className="text-slate-500">PEAK:</span>
          <span className={`font-bold ${isClipping ? 'text-rose-400' : 'text-cyan-400'}`}>
            {peakDb}
          </span>
        </div>

        {/* View mode toggle switches */}
        <div className="flex items-center gap-0.5 bg-[#10141f] p-0.5 rounded-md border border-slate-800 text-xs">
          <button
            onClick={() => setMode('spectrum')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
              mode === 'spectrum'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Frequency Spectrum (FFT)"
          >
            FFT
          </button>
          <button
            onClick={() => setMode('wave')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
              mode === 'wave'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Oscilloscope Waveform"
          >
            SCOPE
          </button>
          <button
            onClick={() => setMode('phase')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
              mode === 'phase'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Stereo Phase Correlation"
          >
            PHASE
          </button>
        </div>
      </div>
    </div>
  );
};
