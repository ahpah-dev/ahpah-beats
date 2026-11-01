import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectData, Track, EffectsSettings, SynthSettings } from './types';
import { audioEngine } from './audio/AudioEngine';
import {
  PRESET_PROJECTS,
  SCALES,
  ensureStepsLength,
  duplicateBarInTrack,
  clearBarInTrack
} from './audio/presets';
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

const STORAGE_KEY = 'ahpah_beats_autosave';

export const App: React.FC = () => {
  // Initial project state: restore previous session from localStorage if available, or Cyber Trap
  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.tracks) && parsed.tracks.length > 0 && parsed.bpm) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not restore saved session', e);
    }
    return JSON.parse(JSON.stringify(PRESET_PROJECTS['Cyber Trap']));
  });

  // Undo & Redo History Stacks
  const [undoStack, setUndoStack] = useState<ProjectData[]>([]);
  const [redoStack, setRedoStack] = useState<ProjectData[]>([]);

  // Synchronous refs to prevent stale closure in hot shortcuts & event listeners
  const projectRef = useRef<ProjectData>(project);
  projectRef.current = project;
  const undoStackRef = useRef<ProjectData[]>(undoStack);
  undoStackRef.current = undoStack;
  const redoStackRef = useRef<ProjectData[]>(redoStack);
  redoStackRef.current = redoStack;

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

  // Notify user if session was restored
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        showToast('Restored previous project session!  (Undo enabled)');
      }
    } catch (e) {}
  }, []);

  // Auto-save project to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [project]);

  // History recorder: captures state before any modification
  const pushToHistory = useCallback(() => {
    try {
      const snapshot: ProjectData = JSON.parse(JSON.stringify(projectRef.current));
      setUndoStack((prev) => {
        const next = [...prev, snapshot];
        if (next.length > 50) next.shift(); // keep 50 states
        return next;
      });
      setRedoStack([]); // New action invalidates future redo branch
    } catch (e) {
      console.error('Push history error:', e);
    }
  }, []);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) {
      showToast('Nothing to undo');
      return;
    }
    const stack = [...undoStackRef.current];
    const previous = stack.pop()!;
    const currentSnapshot: ProjectData = JSON.parse(JSON.stringify(projectRef.current));

    setRedoStack((prev) => [...prev, currentSnapshot]);
    setUndoStack(stack);
    setProject(previous);
    showToast('↩️ Undone');
  }, []);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) {
      showToast('Nothing to redo');
      return;
    }
    const stack = [...redoStackRef.current];
    const next = stack.pop()!;
    const currentSnapshot: ProjectData = JSON.parse(JSON.stringify(projectRef.current));

    setUndoStack((prev) => [...prev, currentSnapshot]);
    setRedoStack(stack);
    setProject(next);
    showToast('↪️ Redone');
  }, []);

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

  // Listen to keyboard shortcuts (Space bar for Play/Pause, Ctrl+Z for Undo, Ctrl+Y for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z or Cmd+Z (without shift)
      if (isCmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y, Cmd+Y, or Ctrl+Shift+Z, Cmd+Shift+Z
      if (
        (isCmdOrCtrl && (e.key === 'y' || e.key === 'Y' || e.code === 'KeyY')) ||
        (isCmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Space bar for Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handlePlayToggle]);

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
      pushToHistory();
      const cloned = JSON.parse(JSON.stringify(preset));
      setProject(cloned);
      if (isPlaying) {
        audioEngine.stop();
        setIsPlaying(false);
      }
      showToast(`Loaded "${presetName}" preset! 🎵 (Undo with Ctrl+Z)`);
    }
  };

  // Toggle Sequencer Step
  const handleToggleStep = (trackIndex: number, stepIndex: number) => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      const newSteps = [...track.steps];
      while (newSteps.length <= stepIndex) {
        newSteps.push({ active: false, velocity: 0.85, pitchOffset: 0, duration: 1 });
      }
      const curStep = newSteps[stepIndex] || { active: false, velocity: 0.85, pitchOffset: 0, duration: 1 };

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
    pushToHistory();
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      const newSteps = [...track.steps];
      while (newSteps.length <= stepIndex) {
        newSteps.push({ active: false, velocity: 0.85, pitchOffset: 0, duration: 1 });
      }
      const curStep = newSteps[stepIndex] || { active: false, velocity: 0.85, duration: 1 };

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
  const handleSetNote = (
    trackIndex: number,
    stepIndex: number,
    note: string | null,
    duration?: number
  ) => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      const newSteps = [...track.steps];
      while (newSteps.length <= stepIndex) {
        newSteps.push({ active: false, velocity: 0.85, pitchOffset: 0, duration: 1 });
      }

      if (note === null) {
        newSteps[stepIndex] = { active: false, velocity: 0.85, duration: 1 };
      } else {
        newSteps[stepIndex] = {
          active: true,
          note: note,
          velocity: 0.85,
          pitchOffset: 0,
          duration: duration || newSteps[stepIndex]?.duration || 1
        };
      }

      track.steps = newSteps;
      newTracks[trackIndex] = track;
      return { ...prev, tracks: newTracks };
    });
  };

  // Resize existing note duration
  const handleResizeNote = (trackIndex: number, stepIndex: number, duration: number) => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      const newSteps = [...track.steps];
      if (newSteps[stepIndex] && newSteps[stepIndex].active) {
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          duration: Math.max(1, Math.min(16 - (stepIndex % 16), duration))
        };
        track.steps = newSteps;
        newTracks[trackIndex] = track;
      }
      return { ...prev, tracks: newTracks };
    });
  };

  // Change Track Sound Type
  const handleChangeTrackSound = (trackId: string, sound: any) => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = prev.tracks.map((t) => {
        if (t.id === trackId) {
          return { ...t, sound };
        }
        return t;
      });
      return { ...prev, tracks: newTracks };
    });
    showToast(`Switched synth to ${sound}! 🎹`);
  };

  // Change Step Count / Song Length (e.g. 16, 32, 64, 128 steps)
  // Preserves existing notes completely without truncation or overwriting!
  const handleChangeStepCount = (newCount: number) => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = prev.tracks.map((track) => ({
        ...track,
        steps: ensureStepsLength(track.steps, newCount, false)
      }));
      return {
        ...prev,
        stepCount: newCount,
        tracks: newTracks
      };
    });
    const bars = Math.round(newCount / 16);
    showToast(`Song length set to ${bars} ${bars === 1 ? 'Bar' : 'Bars'} (${newCount} steps)! 🎶`);
  };

  // Add 1 more Bar (16 steps)
  const handleAddBar = () => {
    pushToHistory();
    setProject((prev) => {
      const nextCount = Math.min(256, prev.stepCount + 16);
      const newTracks = prev.tracks.map((track) => ({
        ...track,
        steps: ensureStepsLength(track.steps, nextCount, false)
      }));
      return {
        ...prev,
        stepCount: nextCount,
        tracks: newTracks
      };
    });
    showToast(`Added another bar! 🚀`);
  };

  // Duplicate Bar (sourceBar -> targetBar)
  const handleDuplicateBar = (sourceBar: number, targetBar: number) => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = prev.tracks.map((track) =>
        duplicateBarInTrack(track, sourceBar, targetBar)
      );
      return {
        ...prev,
        tracks: newTracks
      };
    });
    showToast(`Copied Bar ${sourceBar + 1} to Bar ${targetBar + 1}! ✨`);
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

  // Clear all notes across project
  const handleClearAllNotes = useCallback(() => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = prev.tracks.map((track) => ({
        ...track,
        steps: Array.from({ length: prev.stepCount }, () => ({
          active: false,
          velocity: 0.85,
          pitchOffset: 0,
          duration: 1
        }))
      }));
      return { ...prev, tracks: newTracks };
    });
    showToast('Cleared all notes');
  }, [pushToHistory]);

  // Clear track
  const handleClearTrack = (trackIndex: number) => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = [...prev.tracks];
      const track = { ...newTracks[trackIndex] };
      const currentLen = Math.max(prev.stepCount, track.steps.length);
      track.steps = Array.from({ length: currentLen }, () => ({
        active: false,
        velocity: 0.85,
        pitchOffset: 0,
        duration: 1
      }));
      newTracks[trackIndex] = track;
      return { ...prev, tracks: newTracks };
    });
    showToast(`Cleared track "${project.tracks[trackIndex]?.name}"`);
  };

  // Add Track
  const handleAddTrack = (type: 'drum' | 'synth') => {
    pushToHistory();
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
          velocity: 0.85,
          pitchOffset: 0,
          duration: 1
        }))
      };
      return { ...prev, tracks: [...prev.tracks, newTrack] };
    });
    showToast(`Added new ${type} track!`);
  };

  // Remove Track
  const handleRemoveTrack = (trackIndex: number) => {
    pushToHistory();
    setProject((prev) => {
      const newTracks = prev.tracks.filter((_, i) => i !== trackIndex);
      return { ...prev, tracks: newTracks };
    });
    showToast('Removed track. (Press Undo to revert) ↩️');
  };

  // Key & Scale Change
  const handleKeyScaleChange = (key: string, scale: string) => {
    pushToHistory();
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
          pushToHistory();
          setProject(loaded);
          showToast(`Successfully opened "${loaded.title || 'Project'}"! (Undo with Ctrl+Z)`);
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
    pushToHistory();
    const scales = Object.keys(SCALES);
    const randomScale = scales[Math.floor(Math.random() * scales.length)];
    const notesInScale = SCALES[randomScale];
    const keys = ['C', 'D', 'F', 'G', 'A'];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    setProject((prev) => {
      const targetLen = Math.max(16, prev.stepCount);
      const newTracks = prev.tracks.map((track) => {
        const newSteps = Array.from({ length: targetLen }, (_, s) => {
          let active = false;
          let note: string | undefined = undefined;
          let isRoll = false;

          if (track.sound === 'kick-808' || track.sound === 'kick-punch') {
            active = s % 16 === 0 || s % 16 === 10 || (Math.random() > 0.6 && s % 4 === 2);
          } else if (track.sound === 'snare-trap' || track.sound === 'snare-clap') {
            active = s % 16 === 4 || s % 16 === 12;
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
    showToast(`AI Beat Generated in ${randomKey} ${randomScale}! ⚡ (Undo with Ctrl+Z)`);
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col font-['Inter'] antialiased">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#10141f]/95 backdrop-blur-md border border-cyan-500/50 text-cyan-100 px-4 py-2 rounded-lg shadow-xl shadow-cyan-950/40 text-xs font-mono font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
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
          onUpdateSynth={(syn) => {
            setProject((p) => ({ ...p, synth: { ...p.synth, ...syn } }));
            audioEngine.synthSettings = { ...project.synth, ...syn };
          }}
          onAddTrack={handleAddTrack}
          onChangeTrackSound={handleChangeTrackSound}
          onSetNote={handleSetNote}
          onResizeNote={handleResizeNote}
          onAddBar={handleAddBar}
          onDuplicateBar={handleDuplicateBar}
          onChangeStepCount={handleChangeStepCount}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onClearAllNotes={handleClearAllNotes}
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
            onChangeStepCount={handleChangeStepCount}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
          />

          {/* Studio Workspace Content */}
          <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto flex flex-col gap-4">
            {/* Visualizer & Peak Strip */}
            <Visualizer />

            {/* Pattern Sequencer & Drum Matrix */}
            <Sequencer
              tracks={project.tracks}
              currentStep={currentStep}
              stepCount={project.stepCount}
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
              onAddBar={handleAddBar}
              onDuplicateBar={handleDuplicateBar}
              onChangeStepCount={handleChangeStepCount}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onClearAllNotes={handleClearAllNotes}
            />

            {/* Piano Roll Melodic Note Editor */}
            <PianoRoll
              tracks={project.tracks}
              selectedTrackIndex={selectedTrackIndex}
              currentStep={currentStep}
              stepCount={project.stepCount}
              isPlaying={isPlaying}
              scaleName={project.scale}
              rootKey={project.key}
              onSelectTrack={(i) => setSelectedTrackIndex(i)}
              onSetNote={handleSetNote}
              onResizeNote={handleResizeNote}
              onAddBar={handleAddBar}
              onDuplicateBar={handleDuplicateBar}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
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
          <footer className="w-full bg-[#0a0d14]/90 border-t border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="font-bold text-slate-300">AhPah Beats Studio</span>
              <span>•</span>
              <span className="text-slate-400">Web Audio 2.0 Realtime Engine</span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">32-bit Float Precision</span>
              <span>•</span>
              <span className="text-slate-500">v1.0.6</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setIsDesktopModalOpen(true)}
                className="hover:text-pink-400 text-slate-400 transition-colors cursor-pointer"
              >
                Download Desktop App (.exe)
              </button>
              <button
                onClick={handleExportWav}
                className="hover:text-cyan-400 text-slate-400 transition-colors cursor-pointer"
              >
                Export Master WAV
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
