import React from 'react';
import { Shield, Volume2, VolumeX, Pause, Flame } from 'lucide-react';
import { GameStats, ParryRating, Player } from '../types/game';

interface GameHUDProps {
  stats: GameStats;
  player: Player;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onParryPress: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  player,
  isMuted,
  onToggleMute,
  onPause,
  onParryPress,
}) => {
  const isParryReady = player.parryCooldownTimer <= 0;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Status Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Player HP & Wave */}
        <div className="flex flex-col gap-1.5">
          {/* HP Shields */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-[11px] font-mono text-slate-400 mr-1">CORE HP</span>
            {Array.from({ length: player.maxHp }).map((_, i) => (
              <Shield
                key={i}
                className={`w-4 h-4 transition-all ${
                  i < player.hp
                    ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Wave Badge */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 px-3 py-1 bg-slate-900/60 rounded-md border border-slate-800/50 w-fit">
            <span className="text-slate-500">SECTOR</span>
            <span className="font-bold text-sky-400 tabular-nums">WAVE {String(stats.wave).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Center: Chain Multiplier (Glows dynamically) */}
        {stats.chain > 0 && (
          <div className="flex flex-col items-center animate-pulse">
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-amber-300">
                CHAIN x{(1 + stats.chain * 0.2).toFixed(1)}
              </span>
              <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                ({Math.floor(stats.chain)})
              </span>
            </div>
            {stats.bankShots > 0 && (
              <span className="text-[10px] font-mono text-amber-400/80 mt-0.5">
                🎱 {stats.bankShots} BANK SHOTS
              </span>
            )}
          </div>
        )}

        {/* Right: Score & System Controls */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-[10px] font-mono text-slate-400">SCORE</span>
            <span className="text-base sm:text-lg font-bold font-mono text-cyan-300 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Sound & Pause Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors cursor-pointer"
              aria-label="Toggle Sound"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors cursor-pointer"
              aria-label="Pause Game"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Status Cluster & Mobile Parry Button */}
      <div className="flex items-end justify-between w-full">
        {/* Parry status & Timing feedback */}
        <div className="flex flex-col gap-1 bg-slate-900/85 border border-slate-800/80 px-3.5 py-2 rounded-lg backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">PARRY STATUS:</span>
            {isParryReady ? (
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
                ⚡ READY [0.00s]
              </span>
            ) : (
              <span className="text-xs font-mono font-semibold text-amber-400">
                RECOVERY [{(player.parryCooldownTimer).toFixed(2)}s]
              </span>
            )}
          </div>

          {/* Last timing feedback */}
          {player.lastParryRating && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">LAST HIT:</span>
              <span
                className={`font-bold ${
                  player.lastParryRating === 'PERFECT'
                    ? 'text-amber-300'
                    : player.lastParryRating === 'GREAT'
                    ? 'text-sky-300'
                    : player.lastParryRating === 'GOOD'
                    ? 'text-cyan-300'
                    : 'text-slate-400'
                }`}
              >
                {player.lastParryRating === 'PERFECT' && '⚡ PERFECT!! (0-4F)'}
                {player.lastParryRating === 'GREAT' && '✨ GREAT! (5-9F)'}
                {player.lastParryRating === 'GOOD' && '🛡️ GOOD (10-14F)'}
                {player.lastParryRating === 'WHIFF' && '💨 WHIFF (Missed)'}
              </span>
            </div>
          )}
        </div>

        {/* On-screen Instant Touch PARRY button for Mobile/Tablet */}
        <div className="pointer-events-auto">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onParryPress();
            }}
            className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-sm tracking-widest shadow-[0_0_25px_rgba(56,189,248,0.6)] active:scale-90 active:from-cyan-400 active:to-blue-500 transition-transform cursor-pointer border border-cyan-300/40 select-none"
            style={{ touchAction: 'none' }}
          >
            <span className="text-xl sm:text-2xl">⚡</span>
            <span>PARRY</span>
            <span className="text-[9px] font-mono text-cyan-200 mt-0.5">SPACE / R-CLICK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
