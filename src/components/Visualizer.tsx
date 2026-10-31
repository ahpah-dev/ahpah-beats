import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { Activity, BarChart2 } from 'lucide-react';

export const Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'wave' | 'spectrum'>('spectrum');
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.masterAnalyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameId.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      // Dark translucent background for phosphor trails
      ctx.fillStyle = 'rgba(11, 14, 20, 0.28)';
      ctx.fillRect(0, 0, width, height);

      if (mode === 'spectrum') {
        analyser.getByteFrequencyData(dataArray);

        const barCount = 48;
        const barWidth = (width / barCount) * 0.75;
        const gap = (width / barCount) * 0.25;

        for (let i = 0; i < barCount; i++) {
          // Logarithmic index distribution for musical frequency perception
          const index = Math.min(
            bufferLength - 1,
            Math.floor(Math.pow(i / barCount, 2) * (bufferLength / 2) + i * 2)
          );
          const value = dataArray[index] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * (height - 8));
          const x = i * (barWidth + gap) + gap / 2;
          const y = height - barHeight;

          // Glowing gradient
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, '#00f2fe');
          grad.addColorStop(0.5, '#7928ca');
          grad.addColorStop(1, '#ff007f');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Peak cap
          if (barHeight > 8) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, Math.max(0, y - 2), barWidth, 1.5);
          }
        }
      } else {
        // Oscilloscope mode
        analyser.getByteTimeDomainData(timeDomainArray);

        ctx.lineWidth = 2.5;
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#00f2fe');
        grad.addColorStop(0.5, '#00ff88');
        grad.addColorStop(1, '#ff007f');
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00f2fe';

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomainArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [mode]);

  return (
    <div className="relative w-full h-16 sm:h-20 bg-[#0d111a] rounded-xl overflow-hidden border border-slate-800/80 shadow-inner group">
      <canvas
        ref={canvasRef}
        width={720}
        height={90}
        className="w-full h-full block"
      />
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-md px-1.5 py-1 rounded-md border border-slate-700/60 text-xs">
        <button
          onClick={() => setMode('spectrum')}
          className={`p-1 rounded transition-colors ${
            mode === 'spectrum' ? 'text-cyan-400 bg-cyan-950/60 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
          title="Spectrum Analyzer"
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setMode('wave')}
          className={`p-1 rounded transition-colors ${
            mode === 'wave' ? 'text-cyan-400 bg-cyan-950/60 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
          title="Oscilloscope Waveform"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="absolute left-3 top-2 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
          Master Out {mode === 'spectrum' ? 'FFT' : 'SCOPE'}
        </span>
      </div>
    </div>
  );
};
