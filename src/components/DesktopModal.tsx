import React, { useState } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  Cpu,
  ShieldCheck,
  X,
  ExternalLink,
  Laptop,
  Copy,
  Check
} from 'lucide-react';

interface DesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoUrl?: string;
}

export const DesktopModal: React.FC<DesktopModalProps> = ({
  isOpen,
  onClose,
  repoUrl = 'https://github.com/ahpah-dev/ahpah-beats'
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const buildCommand = `git clone ${repoUrl} && cd ahpah-beats && npm install && npm run build:electron`;

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-panel border border-line rounded-xl shadow-overlay overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">
                Download AhPah Beats for Windows
              </h3>
              <p className="micro-label normal-case tracking-normal mt-0.5">Native High-Performance Offline Studio • v1.3.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon w-8 h-8"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Main Download Banner */}
          <div className="p-4 rounded-xl bg-raised border border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-ink">Windows Standalone Installer</div>
              <div className="text-xs text-ink-2 mt-0.5 font-mono">
                Version 1.3.0 • 64-bit Windows (.exe) • Offline Studio
              </div>
            </div>
            <a
              href={`${repoUrl}/releases/latest`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent hover:bg-accent/85 text-[#052730] font-bold text-xs shadow-panel transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .EXE Release</span>
            </a>
          </div>

          {/* Desktop App Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-well border border-line">
              <Cpu className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-ink">Zero Audio Latency</div>
                <div className="text-[11px] text-ink-2 mt-0.5">
                  Direct hardware audio buffer with ultra-low latency playback and recording.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-well border border-line">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-ink">100% Offline Capable</div>
                <div className="text-[11px] text-ink-2 mt-0.5">
                  Create beats and produce music anytime, anywhere without an internet connection.
                </div>
              </div>
            </div>
          </div>

          {/* How to Build Desktop .exe locally */}
          <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-well border border-line">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ink font-mono">
                <Terminal className="w-4 h-4 text-accent" />
                <span>Build Local Windows .EXE:</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-mono font-bold text-accent hover:text-ink transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
            <div className="bg-base p-2.5 rounded-md border border-line font-mono text-[10px] text-ink-2 overflow-x-auto">
              <code>{buildCommand}</code>
            </div>
          </div>

          {/* PWA 1-Click Install Alternative */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-well border border-line">
            <div className="flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-magenta flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-ink">Browser App (PWA)</div>
                <div className="text-[11px] text-ink-2">
                  Click the install icon in Chrome or Edge address bar to pin directly to Windows taskbar!
                </div>
              </div>
            </div>
            <span className="badge text-magenta">Instant</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-line text-xs">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-accent hover:text-ink transition-colors font-mono"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
