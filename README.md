# 🎵 AhPah Beats — Studio Beat Maker & Synth DAW

> A super easy to use, professionally designed desktop and mobile application for making music, creating beats, and composing songs. Built with high-fidelity Web Audio API, responsive studio interfaces, and native Windows desktop packaging (.exe).

[![Live Website](https://img.shields.io/badge/Live%20DAW-GitHub%20Pages-00f2fe?style=for-the-badge&logo=github)](https://ahpah-dev.github.io/ahpah-beats/)
[![Windows Download](https://img.shields.io/badge/Download-.EXE%20(Windows)-ff007f?style=for-the-badge&logo=windows)](https://github.com/ahpah-dev/ahpah-beats/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ff88?style=for-the-badge)](LICENSE)

---

## ✨ Features

### 🎧 Dual Tailored Layouts: Desktop DAW & Mobile Phone Studio
- **Desktop Layout**: Comprehensive DAW workspace with master visualizer (FFT spectrum & oscilloscope), 16/32-step drum machine, interactive piano roll with scale highlights, and real-time studio FX rack.
- **Mobile Layout**: Tailored specifically for smartphones with bottom navigation tabs:
  - 🥁 **Pads**: 16 MPC-style finger-drumming pads with touch velocity and instant 1/16 roll repeat.
  - 🎹 **Keys**: Touch piano keyboard with **Scale-Lock Mode** (every key is in tune—no wrong notes!).
  - 🎛️ **Steps**: Quick 16-step beat arranger with touch targets.
  - ⚡ **XY Touchpad**: Live Kaoss-pad style XY performance surface (drag finger to sweep filter cutoff and reverb/delay simultaneously).
  - 🎚️ **Mixer**: Per-track volume faders, mute/solo, and project manager.

### 🔊 High Quality Instruments
- **Procedural Drum Engine**:
  - **808 Sub Kick**: Deep pitch-swept sine with transient punch click and soft saturation.
  - **909 / Punch Kick**: Tight acoustic punch with snappy transient.
  - **Trap Snare**: Dual-layer body oscillator + highpass/bandpass crisp noise burst.
  - **Layered Clap**: Authentic 3-stage microburst clap with diffuse stereo reverb tail.
  - **Closed & Open Hi-Hats**: 6-oscillator metallic Roland 808 timbre with adjustable decay.
  - **Rimshot & Percussion**: Snappy wooden click with fast decay.
  - **Crash Cymbal**: Metallic high-frequency sizzle.
- **Polyphonic Synthesizers**:
  - **Deep 808 Sub**: Sub-bass with soft clipping and pitch glide.
  - **Neon Lead**: Dual detuned supersaw with dynamic lowpass sweep.
  - **Cyber Pluck**: Fast-decaying square/saw wave with sharp filter envelope.
  - **Vintage Lo-Fi Rhodes**: Warm electric piano with subtle harmonic bells.
  - **Retro Synth Bass**: Punchy 80s synthwave bassline.
  - **Warm Pad**: Atmospheric lush chorused pad.

### 🎛️ Studio FX Rack
- **Space Reverb**: Algorithmic convolution reverb with variable room decay.
- **Stereo Echo Delay**: Tempo-synced delay line with feedback gain and damping.
- **Tube Saturation**: Warm analog wave-shaping distortion.
- **Master Multi-Mode Filter**: Resonant lowpass/highpass filter with smooth frequency sweep.
- **Master Compressor & Limiter**: Anti-clipping transparent dynamics processor.

### 📥 Custom Instruments & Sample Import
Bring your own sounds into the studio with the **Instruments** panel (header, footer, or Sequencer → Import):
- **One-click audio import**: Load any `.wav`, `.mp3`, `.ogg`, `.flac`, or `.m4a` file and it instantly becomes a new playable sample track.
- **Project-portable**: Imported samples are embedded in the saved `.ahpah` project file, so your instruments travel with your song.
- **Built-in discovery links**: Jump straight to free, royalty-friendly sample libraries:
  - [Freesound.org](https://freesound.org) — CC-licensed WAV one-shots and FX
  - [Cymatics Free Vault](https://cymatics.fm/free-download-vault/) — pro drum kits and loops
  - [Bedroom Producers Blog](https://bedroomproducersblog.com/free-samples/) — curated free sample packs
  - [Splice](https://splice.com/sounds) — searchable sample catalog
  - [SampleSwap](https://sampleswap.org) — royalty-free WAV loops

### 💾 Lossless Audio Export & Project Management
- **Instant WAV Export**: Renders 32-bit floating point audio directly to uncompressed 16-bit PCM `.wav` audio files using `OfflineAudioContext`.
- **Project Files**: Save and load `.ahpah` JSON project files.
- **Preset Demo Songs**: Instant 1-click loading for *Cyber Trap* (140 BPM), *Synthwave Night* (118 BPM), *Chillhop Lo-Fi* (84 BPM), and *Club House / EDM* (126 BPM).

---

## 🚀 Getting Started

### 1. Web Application (Browser & PWA)
AhPah Beats runs directly in any modern browser without installation:
- **Live URL**: [https://ahpah-dev.github.io/ahpah-beats/](https://ahpah-dev.github.io/ahpah-beats/)
- Can also be installed as a PWA directly to Windows/Mac/Linux desktop or mobile home screens!

### 2. Desktop Windows Standalone Application (.exe)
You can run AhPah Beats as a dedicated, offline desktop application on Windows:
1. Download `AhPah.Beats-Setup-1.3.0.exe` from the [Releases](https://github.com/ahpah-dev/ahpah-beats/releases/latest) page.
2. Run the installer to add AhPah Beats to your Start Menu and Desktop.
3. Enjoy zero audio latency and 100% offline music making!

---

## 🛠️ Local Development & Build

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/)

### Clone and Install
```bash
git clone https://github.com/ahpah-dev/ahpah-beats.git
cd ahpah-beats
npm install
```

### Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Run in Electron Desktop Window
```bash
npm run electron:dev
```

### Build Web Static Files (for GitHub Pages)
```bash
npm run build
```
Generates production assets in `dist/`.

### Package Windows .EXE Installer
```bash
npm run build:electron
```
Outputs the standalone Windows installer and portable `.exe` into `dist-electron/`.

---

## 🎹 Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / Pause playback |
| `Click Track` | Audition sound |
| `Right Click Step` | Toggle 1/32 Roll hit |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
