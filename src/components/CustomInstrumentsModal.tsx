import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  Music,
  Drum,
  Globe,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface CustomInstrumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSample: (file: File) => Promise<void>;
}

const SOURCES = [
  { name: 'Freesound.org', url: 'https://freesound.org', desc: 'Huge library of CC-licensed WAV samples (drums, synths, FX).', color: '#22d3ee' },
  { name: 'Cymatics.fm (Free Packs)', url: 'https://cymatics.fm/free-download-vault/', desc: 'Free pro drum kits, loops & one-shots.', color: '#8b5cf6' },
  { name: 'Bedroom Producers Blog', url: 'https://bedroomproducersblog.com/free-samples/', desc: 'Curated free sample packs & virtual instruments.', color: '#f472b6' },
  { name: 'Splice (Free Tier)', url: 'https://splice.com/sounds', desc: 'Search & download individual samples.', color: '#34d399' },
  { name: 'SampleSwap.org', url: 'https://sampleswap.org', desc: 'Royalty-free WAV samples & loops.', color: '#fbbf24' }
];

export const CustomInstrumentsModal: React.FC<CustomInstrumentsModalProps> = ({ isOpen, onClose, onImportSample }) => {
  const [importing, setImporting] = useState<boolean>(false);
  const [importedName, setImportedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await onImportSample(file);
      setImportedName(file.name);
      setTimeout(() => setImportedName(null), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-panel border border-line rounded-2xl shadow-overlay overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(34,211,238,0.4)' }}>
              <Music className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Custom Instruments</h3>
              <p className="micro-label normal-case tracking-normal mt-0.5">Import your own synths & drum one-shots (WAV/MP3/OGG)</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon w-8 h-8">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto">
          <div className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-5 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(139,92,246,0.2))' }}>
              <Upload className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink">Import Audio Sample</div>
              <div className="text-xs text-ink-2 mt-1 max-w-md">
                Drop a WAV/MP3/OGG file to create a new playable instrument track. The sample becomes a one-shot triggered on every active step.
              </div>
            </div>
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="btn-primary">
              {importing ? 'Importing…' : 'Choose File'}
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a" onChange={handleFile} className="hidden" />
            {importedName && (
              <div className="flex items-center gap-2 text-xs text-success font-semibold animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Imported "{importedName}" as new track</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-magenta" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">Where to find free instruments & samples</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SOURCES.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 p-3 rounded-xl bg-well border border-line hover:border-line-strong transition-all duration-150 cursor-pointer">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}1a`, border: `1px solid ${s.color}40` }}>
                    <Download className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-ink group-hover:text-accent transition-colors">{s.name}</span>
                      <ExternalLink className="w-3 h-3 text-ink-3 group-hover:text-accent transition-colors" />
                    </div>
                    <div className="text-[11px] text-ink-2 mt-0.5 leading-snug">{s.desc}</div>
                  </div>
                </a>
              ))}
            </div>
            <p className="text-[10px] text-ink-3 mt-3 leading-relaxed">
              Tip: Download a WAV/MP3 one-shot, then import it here. It becomes a new track that plays on every active sequencer step. Samples are saved inside your project file (.ahpah) for portability.
            </p>
          </div>

          <div className="rounded-xl bg-raised/40 border border-line p-3.5 flex items-start gap-3">
            <Drum className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-ink-2 leading-relaxed">
              <span className="font-bold text-ink">Built-in sounds:</span> 8 drum engines + 6 synth voices are already included. Use the + Drum / + Synth buttons in the Sequencer to add them. Custom imports are best for unique one-shots, vocals, or FX.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomInstrumentsModal;