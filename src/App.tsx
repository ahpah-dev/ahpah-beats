import React, { useState, useEffect, useCallback } from 'react';
import { ProjectData, Track, EffectsSettings, SynthSettings } from './types';
import { audioEngine } from './audio/AudioEngine';
import { PRESET_PROJECTS, SCALES } from './audio/presets';
import { WavExporter } from './audio/WavExporter';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { Sequencer } from './components/Sequencer';
import { PianoRoll } from './components/PianoRoll';
import { EffectsRack } from './components/EffectsRack';
import { MobileView } from './components/MobileView';
import { DesktopModal } from './components/DesktopModal';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, Music2 } from 'lucide-react';

export const App: React.FC = () => {
  // Initial project state from the Cyber Trap preset
  const [project, setProject] = useState<ProjectData>(() => {
    return JSON.parse(JSON.stringify(PRESET_PROJECTS['Cyber Trap']));
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(5); // default to 808 sub or lead
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Responsive layout mode: mobile vs desktop
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 820 ? 'mobile' : 'desktop';
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync project tracks and effects to audioEngine
  useEffect(() => {
    audioEngine.setTracks(project.tracks);
    audioEngine.bpm = project.bpm;
    audioEngine.swing = project.swing;
    audioEngine.setMasterVolume(project.masterVolume);
    audioEngine.updateEffects(project.effects);
    audioEngine.synthSettings = project.synth;
  }, [project]);

  // Hook up step callback from audio scheduler
  useEffect(() => {
    const unsub = audioEngine.onStep((step) => {
      setCurrentStep(step);
    });
    return unsub;
  }, []);

  // Listen to keyboard shortcuts (Space bar for Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, project]);

  // Handle window resize to auto-suggest layout if not manually toggled
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 820 && viewMode === 'desktop') {
        // can stay or switch
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Play / Pause toggle
  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.start(project.bpm, project.swing, project.stepCount);
      setIsPlaying(true);
    }
  }, [isPlaying, project.bpm, project.swing, project.stepCount]);

  // Stop playback
  const handleStop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  // BPM change
  const handleBpmChange = (bpm: number) => {
    const valid = Math.max(40, Math.min(240, bpm));
    setProject((prev) => ({ ...prev, bpm: valid }));
    audioEngine.bpm = valid;
  };

  // Swing change
  const handleSwingChange = (swing: number) => {
    setProject((prev) => ({ ...prev, swing }));
    audioEngine.swing = swing;
  };

  // Master Volume change
  const handleMasterVolumeChange = (vol: number) => {
    setProject((prev) => ({ ...prev, masterVolume: vol }));
    audioEngine.setMasterVolume(vol);
  };

  // Select Preset
  const handleSelectPreset = (presetName: string) => {
    const preset = PRESET_PROJECTS[presetName];
    if (preset) {
      const cloned = JSON.parse(JSON.stringify(preset));
      setProject(cloned);
      if (isPlaying) {
        audioEngine.stop();
        setIsPlaying(false);
      }
      showToast(`Loaded "${presetName}" preset! 🎵`);
    }
  };

  // Toggle Sequencer Step
  const handleToggleStep = (trackIndex: number, stepIndex: number) => {
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      const newSteps = [...track.steps];
      const curStep = newSteps[stepIndex] || { active: false, velocity: 0.85, pitchOffset: 0 };

      newSteps[stepIndex] = {
        ...curStep,
        active: !curStep.active,
        note: curStep.note || (track.type === 'synth' ? `${prev.key}4` : undefined)
      };

      track.steps = newSteps;
      newTracks[trackIndex] = track;
      return { ...prev, tracks: newTracks };
    });

    const track = project.tracks[trackIndex];
    if (track && !track.steps[stepIndex]?.active) {
      // Trigger sound on activation
      audioEngine.triggerSound(track, track.steps[stepIndex]?.note || 'C4', 0.85);
    }
  };

  // Toggle Roll (1/32 repeat) on step
  const handleToggleRoll = (trackIndex: number, stepIndex: number) => {
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      const newSteps = [...track.steps];
      const curStep = newSteps[stepIndex] || { active: false, velocity: 0.85 };

      newSteps[stepIndex] = {
        ...curStep,
        active: true,
        isRoll: !curStep.isRoll
      };

      track.steps = newSteps;
      newTracks[trackIndex] = track;
      return { ...prev, tracks: newTracks };
    });
    showToast('Toggled 1/32 Roll hit!');
  };

  // Set melodic note in Piano Roll
  const handleSetNote = (trackIndex: number, stepIndex: number, note: string | null) => {
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      const newSteps = [...track.steps];

      if (note === null) {
        newSteps[stepIndex] = { active: false, velocity: 0.85 };
      } else {
        newSteps[stepIndex] = {
          active: true,
          note: note,
          velocity: 0.85,
          pitchOffset: 0
        };
      }

      track.steps = newSteps;
      newTracks[trackIndex] = track;
      return { ...prev, tracks: newTracks };
    });
  };

  // Track volume update
  const handleUpdateTrackVolume = (trackIndex: number, volume: number) => {
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      newTracks[trackIndex] = { ...newTracks[trackIndex], volume };
      return { ...prev, tracks: newTracks };
    });
  };

  // Track pan update
  const handleUpdateTrackPan = (trackIndex: number, pan: number) => {
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      newTracks[trackIndex] = { ...newTracks[trackIndex], pan };
      return { ...prev, tracks: newTracks };
    });
  };

  // Track Mute
  const handleToggleMute = (trackIndex: number) => {
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        muted: !newTracks[trackIndex].muted
      };
      return { ...prev, tracks: newTracks };
    });
  };

  // Track Solo
  const handleToggleSolo = (trackIndex: number) => {
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        solo: !newTracks[trackIndex].solo
      };
      return { ...prev, tracks: newTracks };
    });
  };

  // Clear track
  const handleClearTrack = (trackIndex: number) => {
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      track.steps = Array.from({ length: prev.stepCount }, () => ({
        active: false,
        velocity: 0.85
      }));
      newTracks[trackIndex] = track;
      return { ...prev, tracks: newTracks };
    });
  };

  // Add Track
  const handleAddTrack = (type: 'drum' | 'synth') => {
    setProject((prev) => {
      const count = prev.tracks.length + 1;
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: type === 'drum' ? `Percussion ${count}` : `Synth Voice ${count}`,
        type,
        sound: type === 'drum' ? 'percussion' : 'neon-lead',
        color: type === 'drum' ? '#00f2fe' : '#ff007f',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array.from({ length: prev.stepCount }, () => ({
          active: false,
          velocity: 0.85
        }))
      };
      return { ...prev, tracks: [...prev.tracks, newTrack] };
    });
    showToast(`Added new ${type} track!`);
  };

  // Remove Track
  const handleRemoveTrack = (trackIndex: number) => {
    setProject((prev) => {
      const newTracks = prev.tracks.filter((_, i) => i !== trackIndex);
      return { ...prev, tracks: newTracks };
    });
  };

  // Key & Scale Change
  const handleKeyScaleChange = (key: string, scale: string) => {
    setProject((prev) => ({ ...prev, key, scale }));
    showToast(`Key & Scale changed to ${key} ${scale}`);
  };

  // Export to studio WAV audio
  const handleExportWav = async () => {
    try {
      showToast('Rendering lossless WAV file in 32-bit audio...');
      const blob = await WavExporter.exportToWav(project, 4);
      const safeTitle = project.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      WavExporter.downloadBlob(blob, `${safeTitle}.wav`);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('WAV Export complete! Audio downloaded. 🚀');
    } catch (err) {
      console.error(err);
      showToast('Export error. Please try again.');
    }
  };

  // Save project file (.ahpah)
  const handleSaveProject = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const safeTitle = project.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    WavExporter.downloadBlob(blob, `${safeTitle}.ahpah`);
    showToast('Project file saved!');
  };

  // Load project file (.ahpah)
  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loaded = JSON.parse(event.target?.result as string);
        if (loaded && loaded.tracks && loaded.bpm) {
          setProject(loaded);
          showToast(`Successfully opened "${loaded.title || 'Project'}"!`);
        }
      } catch (err) {
        showToast('Invalid project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Randomize / AI Beat generator
  const handleRandomizeBeat = () => {
    const scales = Object.keys(SCALES);
    const randomScale = scales[Math.floor(Math.random() * scales.length)];
    const notesInScale = SCALES[randomScale];
    const keys = ['C', 'D', 'F', 'G', 'A'];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    setProject((prev) => {
      const newTracks = prev.tracks.map((track) => {
        const newSteps = Array.from({ length: 16 }, (_, s) => {
          let active = false;
          let note: string | undefined = undefined;
          let isRoll = false;

          if (track.sound === 'kick-808' || track.sound === 'kick-punch') {
            active = s === 0 || s === 10 || (Math.random() > 0.6 && s % 4 === 2);
          } else if (track.sound === 'snare-trap' || track.sound === 'snare-clap') {
            active = s === 4 || s === 12;
          } else if (track.sound === 'hihat-closed') {
            active = Math.random() > 0.15;
            isRoll = active && Math.random() > 0.75;
          } else if (track.type === 'synth') {
            active = Math.random() > 0.55;
            if (active) {
              const semitone = notesInScale[Math.floor(Math.random() * notesInScale.length)];
              const oct = track.sound === '808-sub' ? 2 : 4;
              note = `${randomKey}${oct}`;
            }
          }
          return {
            active,
            note,
            velocity: 0.7 + Math.random() * 0.3,
            isRoll
          };
        });
        return { ...track, steps: newSteps };
      });

      return {
        ...prev,
        key: randomKey,
        scale: randomScale,
        tracks: newTracks
      };
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.3 }
    });
    showToast(`AI Beat Generated in ${randomKey} ${randomScale}! ⚡`);
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col font-['Inter']">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-cyan-950/90 border border-cyan-500/80 text-cyan-200 px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Layout Rendering based on viewMode */}
      {viewMode === 'mobile' ? (
        <MobileView
          project={project}
          isPlaying={isPlaying}
          currentStep={currentStep}
          onPlayToggle={handlePlayToggle}
          onStop={handleStop}
          onBpmChange={handleBpmChange}
          onToggleStep={handleToggleStep}
          onToggleRoll={handleToggleRoll}
          onUpdateTrackVolume={handleUpdateTrackVolume}
          onToggleMute={handleToggleMute}
          onToggleSolo={handleToggleSolo}
          onSelectPreset={handleSelectPreset}
          onExportWav={handleExportWav}
          onSaveProject={handleSaveProject}
          onRandomizeBeat={handleRandomizeBeat}
          onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
          onToggleViewMode={() => setViewMode('desktop')}
        />
      ) : (
        <div className="flex flex-col min-h-screen">
          {/* Desktop Studio Header */}
          <Header
            project={project}
            isPlaying={isPlaying}
            isRecording={isRecording}
            onPlayToggle={handlePlayToggle}
            onStop={handleStop}
            onBpmChange={handleBpmChange}
            onSwingChange={handleSwingChange}
            onMasterVolumeChange={handleMasterVolumeChange}
            onSelectPreset={handleSelectPreset}
            onExportWav={handleExportWav}
            onSaveProject={handleSaveProject}
            onLoadProject={handleLoadProject}
            onRandomizeBeat={handleRandomizeBeat}
            onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode('mobile')}
            onKeyScaleChange={handleKeyScaleChange}
          />

          {/* Studio Workspace Content */}
          <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto flex flex-col gap-5">
            {/* Visualizer & Peak Strip */}
            <Visualizer />

            {/* Pattern Sequencer & Drum Matrix */}
            <Sequencer
              tracks={project.tracks}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onToggleStep={handleToggleStep}
              onToggleRoll={handleToggleRoll}
              onUpdateTrackVolume={handleUpdateTrackVolume}
              onUpdateTrackPan={handleUpdateTrackPan}
              onToggleMute={handleToggleMute}
              onToggleSolo={handleToggleSolo}
              onPreviewSound={(track) => audioEngine.triggerSound(track, 'C4', 0.85)}
              onClearTrack={handleClearTrack}
              onAddTrack={handleAddTrack}
              onRemoveTrack={handleRemoveTrack}
            />

            {/* Piano Roll Melodic Note Editor */}
            <PianoRoll
              tracks={project.tracks}
              selectedTrackIndex={selectedTrackIndex}
              currentStep={currentStep}
              isPlaying={isPlaying}
              scaleName={project.scale}
              rootKey={project.key}
              onSelectTrack={(i) => setSelectedTrackIndex(i)}
              onSetNote={handleSetNote}
            />

            {/* FX Rack & Sound Design */}
            <EffectsRack
              effects={project.effects}
              synth={project.synth}
              selectedTrack={project.tracks[selectedTrackIndex]}
              onUpdateEffects={(eff) => {
                setProject((p) => ({ ...p, effects: { ...p.effects, ...eff } }));
                audioEngine.updateEffects(eff);
              }}
              onUpdateSynth={(syn) => {
                setProject((p) => ({ ...p, synth: { ...p.synth, ...syn } }));
                audioEngine.synthSettings = { ...project.synth, ...syn };
              }}
            />
          </main>

          {/* Desktop Studio Footer */}
          <footer className="w-full bg-[#0b0e14] border-t border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">AhPah Beats Studio</span>
              <span>•</span>
              <span>Web Audio 2.0 Engine</span>
              <span>•</span>
              <span className="text-cyan-400 font-mono">32-bit Float Processing</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDesktopModalOpen(true)}
                className="hover:text-pink-400 transition-colors font-semibold"
              >
                Download Desktop App (.exe)
              </button>
              <button
                onClick={handleExportWav}
                className="hover:text-cyan-400 transition-colors font-semibold"
              >
                Export WAV
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* Desktop Download Modal */}
      <DesktopModal
        isOpen={isDesktopModalOpen}
        onClose={() => setIsDesktopModalOpen(false)}
      />
    </div>
  );
};
