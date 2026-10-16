import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Flame, Shield, Target, Lock, CheckCircle2 } from 'lucide-react';
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

  // Accidental Space-mash protection lockout (1.5 seconds)
  // Ensures the player cannot accidentally skip past the results screen during parry panic
  const LOCKOUT_DURATION_MS = 1500;
  const [lockoutRemainingMs, setLockoutRemainingMs] = useState<number>(LOCKOUT_DURATION_MS);
  const [displayedScore, setDisplayedScore] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const remaining = Math.max(0, LOCKOUT_DURATION_MS - elapsed);
      setLockoutRemainingMs(remaining);

      if (remaining > 0) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Smooth final score count-up animation
  useEffect(() => {
    const startTime = performance.now();
    const duration = 900;
    const target = stats.score;
    let animId: number;

    const updateScore = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedScore(Math.floor(target * eased));

      if (progress < 1) {
        animId = requestAnimationFrame(updateScore);
      }
    };

    animId = requestAnimationFrame(updateScore);
    return () => cancelAnimationFrame(animId);
  }, [stats.score]);

  const isLocked = lockoutRemainingMs > 0;
  const lockProgress = (LOCKOUT_DURATION_MS - lockoutRemainingMs) / LOCKOUT_DURATION_MS;

  // Keyboard shortcut listener with lockout protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) {
        // Intercept and swallow Space / Enter / KeyR during lockout to prevent accidental skips
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isLocked, onRestart]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/88 backdrop-blur-md select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center max-h-[96dvh]">
        {/* Title status */}
        <div className="mb-2 sm:mb-3">
          <span className={`text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase ${isVictory ? 'text-cyan-400' : 'text-rose-400'}`}>
            {isVictory ? 'SECTOR SECURED' : 'CORE CRITICAL COLLAPSE'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-slate-100 mt-1">
            {isVictory ? 'MISSION ACCOMPLISHED' : 'DEFEAT'}
          </h2>
        </div>

        {/* High score callout */}
        {isNewHigh && (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold mb-3 animate-bounce shadow-[0_0_15px_rgba(251,191,36,0.25)]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW HIGH SCORE REGISTERED!</span>
          </div>
        )}

        {/* Score Display with animated count-up */}
        <div className="w-full py-4 px-6 bg-slate-950/80 border border-slate-800/90 rounded-xl mb-4 flex flex-col items-center shadow-inner">
          <span className="text-[11px] font-mono text-slate-400 tracking-wider">FINAL COMBAT SCORE</span>
          <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 tabular-nums my-0.5">
            {displayedScore.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            HIGH: {stats.highScore.toLocaleString()}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2 text-left mb-5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Sector:</span>
            <strong className="font-mono text-slate-200 tabular-nums">WAVE {stats.wave}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Peak Combo:</span>
            <strong className="font-mono text-amber-400 tabular-nums">
              {Math.floor(stats.maxChain)} <span className="text-cyan-300 font-bold">(x{(1 + stats.maxChain * 0.2).toFixed(1)})</span>
            </strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">⚡ Perfects:</span>
            <strong className="font-mono text-yellow-300 tabular-nums">{stats.perfectParries}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">🎱 Bank Shots:</span>
            <strong className="font-mono text-cyan-300 tabular-nums">{stats.bankShots}</strong>
          </div>
        </div>

        {/* Restart Button with Lockout Progress Protection */}
        <div className="w-full relative">
          <button
            onClick={() => {
              if (!isLocked) onRestart();
            }}
            disabled={isLocked}
            className={`w-full relative overflow-hidden py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
              isLocked
                ? 'bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:shadow-[0_0_35px_rgba(253,224,71,0.7)] active:scale-95 cursor-pointer'
            }`}
          >
            {/* Progress fill bar during lockout */}
            {isLocked && (
              <div
                className="absolute inset-y-0 left-0 bg-sky-500/20 border-r border-sky-400/50 transition-all duration-75"
                style={{ width: `${lockProgress * 100}%` }}
              />
            )}

            <div className="relative z-10 flex items-center justify-center gap-2">
              {isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  <span className="font-mono text-xs text-sky-300">
                    ANALYZING RUN... ({(lockoutRemainingMs / 1000).toFixed(1)}s)
                  </span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 fill-slate-950" />
                  <span>PLAY AGAIN</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/30 text-slate-950 border border-slate-950/20 ml-1">
                    SPACE
                  </span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Lockout status reminder */}
        <p className="mt-2.5 text-[11px] font-mono text-slate-400">
          {isLocked ? (
            <span className="text-slate-500 flex items-center justify-center gap-1.5">
              <span>🛡️</span>
              <span>連打誤爆防止ロック作動中... 少しお待ちください</span>
            </span>
          ) : (
            <span>
              Press <strong className="text-cyan-300 font-bold">Space</strong>, <strong className="text-slate-300 font-bold">Enter</strong>, or <strong className="text-slate-300 font-bold">R</strong> to restart
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
