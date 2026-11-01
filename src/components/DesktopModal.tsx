import React, { useState } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  Cpu,
  ShieldCheck,
  CheckCircle,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0c1018] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#10141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-600/90 border border-pink-500/50 flex items-center justify-center shadow-md shadow-pink-500/20">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Inter']">
                Download AhPah Beats for Windows (.exe)
              </h3>
              <p className="text-xs text-slate-400 font-mono">Native High-Performance Offline Studio • v1.0.6</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Main Download Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-cyan-950/40 border border-pink-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-pink-200">Windows Standalone Installer</div>
              <div className="text-xs text-slate-300 mt-0.5 font-mono">
                Version 1.0.6 • 64-bit Windows (.exe) • Offline Studio
              </div>
            </div>
            <a
              href={`${repoUrl}/releases/latest`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .EXE Release</span>
            </a>
          </div>

          {/* Desktop App Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#111624] border border-slate-800/80">
              <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-200">Zero Audio Latency</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Direct hardware audio buffer with ultra-low latency playback and recording.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#111624] border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-200">100% Offline Capable</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Create beats and produce music anytime, anywhere without an internet connection.
                </div>
              </div>
            </div>
          </div>

          {/* How to Build Desktop .exe locally */}
          <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-[#080b11] border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Build Local Windows .EXE:</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-md border border-slate-800 font-mono text-[10px] text-cyan-300 overflow-x-auto">
              <code>{buildCommand}</code>
            </div>
          </div>

          {/* PWA 1-Click Install Alternative */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#111624] border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">Browser App (PWA)</div>
                <div className="text-[11px] text-slate-400">
                  Click the install icon in Chrome or Edge address bar to pin directly to Windows taskbar!
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
              Instant
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#10141f] text-xs">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-cyan-400 hover:underline font-mono"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
