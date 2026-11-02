import { ProjectData, Track, DrumSoundType, SynthSoundType } from '../types';
import { DrumSynthesizer } from './DrumSynthesizer';
import { SynthVoice } from './SynthVoice';
import { audioEngine } from './AudioEngine';

/**
 * High quality WAV audio file exporter using OfflineAudioContext
 */
export class WavExporter {
  public static async exportToWav(
    project: ProjectData,
    loopsCount: number = 4
  ): Promise<Blob> {
    const sampleRate = 44100;
    const secondsPerBeat = 60.0 / project.bpm;
    const stepDuration = 0.25 * secondsPerBeat;
    const patternDuration = project.stepCount * stepDuration;
    const totalDuration = patternDuration * loopsCount + 1.5; // +1.5s for reverb/delay tails

    const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * totalDuration), sampleRate);
    const drumSynth = new DrumSynthesizer(offlineCtx as any);
    const synthVoice = new SynthVoice(offlineCtx as any);

    // Master bus
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = project.masterVolume;

    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -3;
    compressor.knee.value = 10;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    // Filter
    const filter = offlineCtx.createBiquadFilter();
    filter.type = project.effects.filterType;
    filter.frequency.value = project.effects.filterCutoff;
    filter.Q.value = project.effects.filterResonance;

    // Reverb
    const reverbNode = offlineCtx.createConvolver();
    const reverbGain = offlineCtx.createGain();
    reverbGain.gain.value = project.effects.reverbWet;
    reverbNode.buffer = WavExporter.createImpulseResponse(offlineCtx, project.effects.reverbDecay);

    // Delay
    const delayNode = offlineCtx.createDelay(2.0);
    delayNode.delayTime.value = project.effects.delayTime;
    const delayFeedback = offlineCtx.createGain();
    delayFeedback.gain.value = project.effects.delayFeedback;
    const delayGain = offlineCtx.createGain();
    delayGain.gain.value = project.effects.delayWet;

    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayGain);

    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 1.0;

    const sum = offlineCtx.createGain();
    dryGain.connect(sum);
    reverbGain.connect(sum);
    delayGain.connect(sum);

    sum.connect(filter);
    filter.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(offlineCtx.destination);

    // Schedule all loop repetitions
    const anySoloActive = project.tracks.some((t) => t.solo);

    for (let loop = 0; loop < loopsCount; loop++) {
      const loopOffset = loop * patternDuration;

      for (let s = 0; s < project.stepCount; s++) {
        // Swing groove
        const isOdd = s % 2 === 1;
        const swingFactor = (project.swing / 100) * 0.5;
        const stepTime = loopOffset + s * stepDuration + (isOdd ? stepDuration * swingFactor : 0);

        project.tracks.forEach((track) => {
          if (track.muted || (anySoloActive && !track.solo)) return;

          const step = track.steps[s];
          if (!step || !step.active) return;

          const trackGain = offlineCtx.createGain();
          trackGain.gain.value = track.volume;

          trackGain.connect(dryGain);
          trackGain.connect(reverbNode);
          reverbNode.connect(reverbGain);
          trackGain.connect(delayNode);

          const vel = step.velocity || 0.85;
          const pitch = step.pitchOffset || 0;

          if (track.type === 'drum') {
            drumSynth.playSound(track.sound as DrumSoundType, stepTime, vel, trackGain, pitch);
            if (step.isRoll) {
              const rollTime = stepTime + stepDuration * 0.5;
              drumSynth.playSound(track.sound as DrumSoundType, rollTime, vel * 0.7, trackGain, pitch);
            }
          } else if (track.type === 'sample') {
            const buf = track.sampleId ? audioEngine.sampleBuffers.get(track.sampleId) : undefined;
            if (buf) {
              const src = offlineCtx.createBufferSource();
              src.buffer = buf;
              src.playbackRate.value = Math.pow(2, pitch / 12);
              const gn = offlineCtx.createGain();
              gn.gain.value = vel;
              src.connect(gn);
              gn.connect(trackGain);
              src.start(stepTime);
            }
          } else {
            const note = step.note || 'C4';
            const noteDuration = Math.max(0.08, (step.duration || 1) * stepDuration * 0.95);
            synthVoice.playNote(
              track.sound as SynthSoundType,
              note,
              stepTime,
              noteDuration,
              vel,
              trackGain,
              project.synth,
              pitch
            );
          }
        });
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return WavExporter.audioBufferToWavBlob(renderedBuffer);
  }

  private static createImpulseResponse(ctx: BaseAudioContext, decay: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * Math.max(0.5, decay));
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const factor = Math.pow(n / length, 2.5);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  /**
   * Convert Web Audio AudioBuffer to 16-bit PCM WAV Blob
   */
  public static audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Interleave left and right channels
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        // Clip sample between -1.0 and 1.0
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  public static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
