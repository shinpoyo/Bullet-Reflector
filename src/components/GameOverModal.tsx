import React from 'react';
import { RotateCcw, Trophy, Flame, Shield, Target } from 'lucide-react';
import { GameStats } from '../types/game';

interface GameOverModalProps {
  stats: GameStats;
  isVictory: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isVictory,
  onRestart,
}) => {
  const isNewHigh = stats.score >= stats.highScore && stats.score > 0;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col items-center text-center max-h-[96dvh]">
        {/* Title status */}
        <div className="mb-2 sm:mb-4">
          <span className={`text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase ${isVictory ? 'text-cyan-400' : 'text-rose-400'}`}>
            {isVictory ? 'SECTOR SECURED' : 'CORE CRITICAL COLLAPSE'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-slate-100 mt-1">
            {isVictory ? 'MISSION ACCOMPLISHED' : 'DEFEAT'}
          </h2>
        </div>

        {/* High score callout */}
        {isNewHigh && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold mb-4 animate-bounce">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW HIGH SCORE REGISTERED!</span>
          </div>
        )}

        {/* Score Display */}
        <div className="w-full py-4 px-6 bg-slate-950/70 border border-slate-800 rounded-xl mb-5 flex flex-col items-center">
          <span className="text-[11px] font-mono text-slate-400">FINAL COMBAT SCORE</span>
          <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 tabular-nums">
            {stats.score.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-slate-500 mt-1">
            HIGH: {stats.highScore.toLocaleString()}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 text-left mb-6 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Sector Reached:</span>
            <strong className="font-mono text-slate-200 tabular-nums">WAVE {stats.wave}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Peak Combo:</span>
            <strong className="font-mono text-amber-400 tabular-nums">
              {Math.floor(stats.maxChain)} <span className="text-cyan-300 font-bold">(x{(1 + stats.maxChain * 0.2).toFixed(1)})</span>
            </strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">⚡ Perfects:</span>
            <strong className="font-mono text-yellow-300 tabular-nums">{stats.perfectParries}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">🎱 Bank Shots:</span>
            <strong className="font-mono text-cyan-300 tabular-nums">{stats.bankShots}</strong>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(253,224,71,0.6)] active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 fill-slate-950" />
          <span>PLAY AGAIN</span>
        </button>

        <p className="mt-3 text-[11px] font-mono text-slate-500">
          Press <strong className="text-slate-300">Space</strong>, <strong className="text-slate-300">Enter</strong>, or <strong className="text-slate-300">R</strong> to restart
        </p>
      </div>
    </div>
  );
};
