import React from 'react';
import { EffectsSettings, SynthSettings, Track } from '../types';
import {
  Sliders,
  Waves,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

interface EffectsRackProps {
  effects: EffectsSettings;
  synth: SynthSettings;
  selectedTrack?: Track;
  onUpdateEffects: (effects: Partial<EffectsSettings>) => void;
  onUpdateSynth: (synth: Partial<SynthSettings>) => void;
}

export const EffectsRack: React.FC<EffectsRackProps> = ({
  effects,
  synth,
  onUpdateEffects,
  onUpdateSynth
}) => {
  return (
    <div className="w-full panel p-3 sm:p-4 flex flex-col gap-3">
      {/* Rack Header */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <div className="tile">
            <Sliders className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Studio Master FX & Sound Design Rack
            </h2>
            <p className="micro-label normal-case tracking-normal mt-0.5">Hardware DSP Chain • Zero-Latency Master Inserts</p>
          </div>
        </div>
        <div className="flex items-center gap-2 well px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-mono text-ink-2 font-semibold">DSP Engine 32-bit</span>
        </div>
      </div>

      {/* 4 Studio Rack Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Unit 1: Space Reverb */}
        <div className="bg-well rounded-xl p-3.5 border border-line flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Waves className="w-4 h-4 text-accent" />
              <span>Chamber Reverb</span>
            </div>
            <span className="badge text-accent">
              {Math.round(effects.reverbWet * 100)}% WET
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between micro-label normal-case tracking-normal">
                <span>Wet / Dry Mix</span>
                <span className="text-ink-2 font-semibold">{Math.round(effects.reverbWet * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.01}
                value={effects.reverbWet}
                onChange={(e) => onUpdateEffects({ reverbWet: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between micro-label normal-case tracking-normal">
                <span>Room Decay</span>
                <span className="text-ink-2 font-semibold">{effects.reverbDecay.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.1}
                value={effects.reverbDecay}
                onChange={(e) => onUpdateEffects({ reverbDecay: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Unit 2: Stereo Echo Delay */}
        <div className="bg-well rounded-xl p-3.5 border border-line flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Zap className="w-4 h-4 text-magenta" />
              <span>Stereo Echo Delay</span>
            </div>
            <span className="badge text-magenta">
              {Math.round(effects.delayWet * 100)}% MIX
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between micro-label normal-case tracking-normal">
                <span>Delay Wet</span>
                <span className="text-ink-2 font-semibold">{Math.round(effects.delayWet * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.7}
                step={0.01}
                value={effects.delayWet}
                onChange={(e) => onUpdateEffects({ delayWet: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between micro-label normal-case tracking-normal">
                <span>Echo Sync Time</span>
                <span className="text-ink-2 font-semibold">{Math.round(effects.delayTime * 1000)}ms</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.8}
                step={0.01}
                value={effects.delayTime}
                onChange={(e) => onUpdateEffects({ delayTime: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between micro-label normal-case tracking-normal">
                <span>Feedback Regeneration</span>
                <span className="text-ink-2 font-semibold">{Math.round(effects.delayFeedback * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.01}
                value={effects.delayFeedback}
                onChange={(e) => onUpdateEffects({ delayFeedback: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Unit 3: Tube Saturation & Resonant Filter */}
        <div className="bg-well rounded-xl p-3.5 border border-line flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Tube Drive & Filter</span>
            </div>
            <span className="badge text-amber-400">ANALOG</span>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between micro-label normal-case tracking-normal">
                <span>Saturation Drive</span>
                <span className="text-ink-2 font-semibold">{effects.distortionDrive}</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={1}
                value={effects.distortionDrive}
                onChange={(e) => onUpdateEffects({ distortionDrive: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between micro-label normal-case tracking-normal">
                <span>Filter Cutoff</span>
                <span className="text-ink-2 font-semibold">{Math.round(effects.filterCutoff)}Hz</span>
              </div>
              <input
                type="range"
                min={200}
                max={20000}
                step={50}
                value={effects.filterCutoff}
                onChange={(e) => onUpdateEffects({ filterCutoff: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between micro-label normal-case tracking-normal">
                <span>Resonance (Q)</span>
                <span className="text-ink-2 font-semibold">{effects.filterResonance.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={10.0}
                step={0.1}
                value={effects.filterResonance}
                onChange={(e) => onUpdateEffects({ filterResonance: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Unit 4: Synth Voice ADSR Shaper */}
        <div className="bg-well rounded-xl p-3.5 border border-line flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Synth Voice (ADSR)</span>
            </div>
            <select
              value={synth.waveform}
              onChange={(e) => onUpdateSynth({ waveform: e.target.value as OscillatorType })}
              className="bg-base text-[10px] font-mono font-bold text-emerald-400 border border-line rounded px-1.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="sawtooth">SAW</option>
              <option value="square">SQUARE</option>
              <option value="triangle">TRIANGLE</option>
              <option value="sine">SINE</option>
            </select>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            {/* Attack */}
            <div className="flex flex-col items-center">
              <span className="micro-label">ATK</span>
              <input
                type="range"
                min={0.005}
                max={0.5}
                step={0.005}
                value={synth.attack}
                onChange={(e) => onUpdateSynth({ attack: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-[8px] font-mono text-ink-3 font-semibold mt-0.5">{Math.round(synth.attack * 1000)}ms</span>
            </div>

            {/* Decay */}
            <div className="flex flex-col items-center">
              <span className="micro-label">DEC</span>
              <input
                type="range"
                min={0.05}
                max={1.0}
                step={0.01}
                value={synth.decay}
                onChange={(e) => onUpdateSynth({ decay: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-[8px] font-mono text-ink-3 font-semibold mt-0.5">{Math.round(synth.decay * 1000)}ms</span>
            </div>

            {/* Sustain */}
            <div className="flex flex-col items-center">
              <span className="micro-label">SUS</span>
              <input
                type="range"
                min={0}
                max={1.0}
                step={0.02}
                value={synth.sustain}
                onChange={(e) => onUpdateSynth({ sustain: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-[8px] font-mono text-ink-3 font-semibold mt-0.5">{Math.round(synth.sustain * 100)}%</span>
            </div>

            {/* Release */}
            <div className="flex flex-col items-center">
              <span className="micro-label">REL</span>
              <input
                type="range"
                min={0.05}
                max={1.2}
                step={0.02}
                value={synth.release}
                onChange={(e) => onUpdateSynth({ release: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-[8px] font-mono text-ink-3 font-semibold mt-0.5">{Math.round(synth.release * 1000)}ms</span>
            </div>
          </div>

          <div className="mt-1 pt-2 border-t border-line flex items-center justify-between text-[10px] text-ink-3 font-mono">
            <span>Analog Limiter</span>
            <span className="text-emerald-400 font-bold">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
