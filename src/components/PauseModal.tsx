import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-xl font-bold font-mono tracking-wider text-slate-100 mb-1">
          TACTICAL PAUSE
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Operations suspended. Prepare your timing.
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs tracking-wider flex items-center justify-center gap-2 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART GAME</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs tracking-wider flex items-center justify-center gap-2 border border-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'AUDIO MUTED' : 'AUDIO ENABLED'}</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-500">
          Press <strong className="text-slate-300">Esc</strong> to resume
        </div>
      </div>
    </div>
  );
};
