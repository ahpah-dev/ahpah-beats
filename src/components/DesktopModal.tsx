import React from 'react';
import {
  Monitor,
  Download,
  Terminal,
  Cpu,
  ShieldCheck,
  CheckCircle,
  X,
  ExternalLink,
  Laptop
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80  animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0f1420] border border-slate-700/80 rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141b2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-rose-600 flex items-center justify-center shadow-sm shadow-pink-500/30">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Inter']">
                Download AhPah Beats for Windows (.exe)
              </h3>
              <p className="text-xs text-slate-400">Native High Performance Desktop Studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Main Download Banner */}
          <div className="p-4 rounded-md bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-cyan-950/40 border border-pink-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-pink-300">Windows Standalone Installer</div>
              <div className="text-xs text-slate-300 mt-0.5">
                Version 1.0.4 • 64-bit Windows (.exe) • Offline Studio
              </div>
            </div>
            <a
              href={`${repoUrl}/releases/latest`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm shadow-pink-500/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download .EXE</span>
            </a>
          </div>

          {/* Desktop App Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#121724] border border-slate-800">
              <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-200">Zero Audio Latency</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Direct hardware audio buffer with ultra-low latency playback.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#121724] border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-200">100% Offline Capable</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Make music anytime, anywhere without an active internet connection.
                </div>
              </div>
            </div>
          </div>

          {/* How to Build Desktop .exe locally */}
          <div className="flex flex-col gap-2 p-3.5 rounded-md bg-[#090c13] border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Developer Build Command</span>
            </div>
            <p className="text-[11px] text-slate-400">
              You can also package the Windows installer yourself using Electron Builder:
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
              <code>git clone {repoUrl} &amp;&amp; npm install &amp;&amp; npm run build:electron</code>
            </div>
          </div>

          {/* PWA 1-Click Install Alternative */}
          <div className="flex items-center justify-between p-3.5 rounded-md bg-[#121724] border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Browser App (PWA)</div>
                <div className="text-[11px] text-slate-400">
                  Click the install icon in Chrome or Edge address bar to add to Windows taskbar!
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-1 rounded-lg">
              Instant
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#141b2a] text-xs">
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
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
