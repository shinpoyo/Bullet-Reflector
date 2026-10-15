import React from 'react';
import { Shield, Volume2, VolumeX, Pause, Flame, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { GameStats, ParryRating, Player, SkillId } from '../types/game';
import { SKILL_DEFINITIONS } from '../game/skills';

interface GameHUDProps {
  stats: GameStats;
  player: Player;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onParryPress: () => void;
  onDashPress?: () => void;
  controlMode?: 'JOYSTICK' | 'SLING';
  onToggleControlMode?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  player,
  isMuted,
  onToggleMute,
  onPause,
  onRestart,
  onParryPress,
  onDashPress,
  controlMode = 'JOYSTICK',
  onToggleControlMode,
}) => {
  const isParryReady = player.parryCooldownTimer <= 0;
  const activeSkillEntries = Object.entries(player.skills || {}) as [SkillId, number][];

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between select-none">
      {/* Topmost Vampire Survivors Full-width EXP Bar */}
      <div className="w-full flex items-center gap-2.5 px-3 py-1 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-xs">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-mono font-bold text-cyan-300 shrink-0">
          <span>LV.</span>
          <span className="tabular-nums text-white text-xs">{player.level}</span>
        </div>
        <div className="relative flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-300 transition-all duration-150 shadow-[0_0_10px_rgba(56,189,248,0.9)]"
            style={{ width: `${Math.min(100, Math.max(0, (player.exp / Math.max(1, player.expToNext)) * 100))}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
          {player.exp} / {player.expToNext} EXP
        </span>
      </div>

      {/* Main Perimeter HUD Cluster */}
      <div className="relative p-2.5 sm:p-4 md:p-6 flex flex-col justify-between flex-1 overflow-hidden pointer-events-none">
        {/* Top Status Cluster (HP & Wave on left, Score & Controls on right) */}
        <div className="flex items-start justify-between w-full">
          {/* Left: Player HP & Wave & Skills */}
          <div className="flex flex-col gap-1 pointer-events-auto">
            {/* Numerical HP Display & Health Bar */}
            <div className="flex flex-col gap-0.5 sm:gap-1 bg-slate-900/85 border border-slate-800/80 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg shadow-sm min-w-[125px] sm:min-w-[155px]">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono">
                <span className="text-slate-400 font-bold flex items-center gap-1 sm:gap-1.5">
                  <Shield className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${player.hp < 30 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
                  CORE HP
                </span>
                <span className="tabular-nums font-bold">
                  <span className={player.hp < 30 ? 'text-rose-400 font-black' : player.hp < 60 ? 'text-amber-300' : 'text-cyan-300'}>
                    {Math.round(player.hp)}
                  </span>
                  <span className="text-slate-500 font-normal text-[10px] sm:text-xs"> / {player.maxHp}</span>
                </span>
              </div>
              {/* Health Progress Bar */}
              <div className="w-full h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full transition-all duration-200 rounded-full ${
                    player.hp < 30
                      ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : player.hp < 60
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                      : 'bg-gradient-to-r from-cyan-500 to-teal-300 shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Wave Badge */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-slate-300 px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-900/70 rounded-md border border-slate-800/50 w-fit">
              <span className="text-slate-500">SECTOR</span>
              <span className="font-bold text-sky-400 tabular-nums">WAVE {String(stats.wave).padStart(2, '0')}</span>
              {stats.wave >= 3 && (
                <span className="text-[9px] text-cyan-400/80 border-l border-slate-700/60 pl-1 font-sans hidden sm:inline">
                  EXPANDED
                </span>
              )}
            </div>

            {/* Active Skills row */}
            {activeSkillEntries.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5 flex-wrap max-w-[150px] sm:max-w-xs">
                {activeSkillEntries.map(([skillId, level]) => {
                  const def = SKILL_DEFINITIONS[skillId];
                  if (!def || level <= 0) return null;
                  return (
                    <div
                      key={skillId}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-[9px] sm:text-[10px] font-mono text-slate-200"
                      title={`${def.nameJa} (Lv.${level})`}
                    >
                      <span>{def.icon}</span>
                      <span className="text-cyan-400 font-bold">{level}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Score & System Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto">
            <div className="flex flex-col items-end bg-slate-900/85 border border-slate-800/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm">
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400">SCORE</span>
              <span className="text-sm sm:text-lg font-bold font-mono text-cyan-300 tabular-nums">
                {stats.score.toLocaleString()}
              </span>
            </div>

            {/* Sound, Retry, Mode & Pause Buttons */}
            <div className="flex items-center gap-1">
              {onToggleControlMode && (
                <button
                  onClick={onToggleControlMode}
                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-cyan-300 text-[10px] sm:text-xs font-mono font-semibold transition-colors cursor-pointer"
                  title="Toggle movement mode (Joystick / Slingshot)"
                  aria-label="Toggle Movement Mode"
                >
                  {controlMode === 'JOYSTICK' ? '🕹️ STICK' : '🏹 SLING'}
                </button>
              )}
              <button
                onClick={onRestart}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Quick Retry (R)"
                aria-label="Quick Retry"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onToggleMute}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors cursor-pointer"
                aria-label="Toggle Sound"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />}
              </button>
              <button
                onClick={onPause}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors cursor-pointer"
                aria-label="Pause Game"
              >
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Visual Score Multiplier Indicator (Appears when chain > 5) */}
        {stats.chain > 5 ? (
          <div className="absolute top-10 sm:top-13 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div
              className={`relative flex flex-col items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl max-w-[240px] sm:max-w-xs ${
                stats.chain >= 15
                  ? 'bg-slate-950/90 border-2 border-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.7)] animate-pulse'
                  : stats.chain >= 10
                  ? 'bg-slate-950/90 border-2 border-fuchsia-400 shadow-[0_0_28px_rgba(232,121,249,0.6)]'
                  : 'bg-slate-950/85 border-2 border-amber-400 shadow-[0_0_22px_rgba(245,158,11,0.55)]'
              }`}
            >
              {/* Radiant top tier badge */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-black tracking-wider uppercase ${
                    stats.chain >= 15
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                      : stats.chain >= 10
                      ? 'bg-fuchsia-500/25 text-fuchsia-200 border border-fuchsia-400/50'
                      : 'bg-amber-500/25 text-amber-200 border border-amber-400/50'
                  }`}
                >
                  {stats.chain >= 15 ? (
                    <>
                      <Sparkles className="w-3 h-3 text-cyan-300 animate-spin" />
                      <span>GODLIKE OVERDRIVE</span>
                    </>
                  ) : stats.chain >= 10 ? (
                    <>
                      <Zap className="w-3 h-3 text-fuchsia-300" />
                      <span>HYPER DRIVE</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-3 h-3 text-amber-300 animate-bounce" />
                      <span>COMBO SURGE</span>
                    </>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                  CHAIN <strong className="text-white">{Math.floor(stats.chain)}</strong>
                </span>
              </div>

              {/* Primary Multiplier Readout */}
              <div className="flex items-baseline gap-1.5 my-0.5">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${
                    stats.chain >= 15
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200 drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]'
                      : stats.chain >= 10
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-pink-300 to-amber-200 drop-shadow-[0_0_15px_rgba(232,121,249,0.85)]'
                      : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                  }`}
                >
                  x{(1 + stats.chain * 0.2).toFixed(1)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-slate-200">
                  SCORE MULTIPLIER
                </span>
              </div>

              {/* Combo Strength Progress Bar & Next Tier Milestone */}
              <div className="w-full min-w-[150px] sm:min-w-[180px] flex flex-col gap-0.5 mt-0.5">
                <div className="relative w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                  <div
                    className={`h-full transition-all duration-150 rounded-full ${
                      stats.chain >= 15
                        ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                        : stats.chain >= 10
                        ? 'bg-gradient-to-r from-fuchsia-500 to-pink-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    }`}
                    style={{
                      width: `${
                        stats.chain >= 15
                          ? 100
                          : stats.chain >= 10
                          ? Math.min(100, Math.max(10, ((stats.chain - 10) / 5) * 100))
                          : Math.min(100, Math.max(10, ((stats.chain - 5) / 5) * 100))
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-400 px-0.5">
                  <span className="text-amber-300 font-semibold">
                    +{Math.round(stats.chain * 20)}% BONUS
                  </span>
                  <span>
                    {stats.chain >= 15
                      ? 'MAX OVERDRIVE'
                      : stats.chain >= 10
                      ? 'NEXT: x4.0 AT 15'
                      : 'NEXT: x3.0 AT 10'}
                  </span>
                </div>
              </div>

              {stats.bankShots > 0 && (
                <span className="text-[9px] sm:text-[10px] font-mono text-amber-400/90 mt-0.5">
                  🎱 {stats.bankShots} BANK SHOTS (+{stats.bankShots * 100}% DMG)
                </span>
              )}
            </div>
          </div>
        ) : stats.chain > 0 ? (
          /* Subtle warm-up chain indicator (chain 1 to 5) */
          <div className="absolute top-10 sm:top-13 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center animate-pulse">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-sm">
              <Flame className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-amber-300">
                CHAIN {Math.floor(stats.chain)}/5
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 border-l border-slate-700 pl-1.5">
                x{(1 + stats.chain * 0.2).toFixed(1)}
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-mono text-amber-400/80 mt-0.5 tracking-tight">
              Reach 5 Chain for Multiplier Surge!
            </span>
          </div>
        ) : null}

        {/* Bottom Status Cluster & Mobile Controls */}
        <div className="flex items-end justify-between w-full pb-1 sm:pb-3">
          {/* Parry status & Timing feedback */}
          <div className="flex flex-col gap-0.5 sm:gap-1 bg-slate-900/85 border border-slate-800/80 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg backdrop-blur-xs max-w-[170px] sm:max-w-xs pointer-events-none">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">PARRY:</span>
              {isParryReady ? (
                <span className="text-[11px] sm:text-xs font-mono font-bold text-cyan-400 flex items-center gap-1 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
                  ⚡ READY
                </span>
              ) : (
                <span className="text-[11px] sm:text-xs font-mono font-semibold text-amber-400">
                  RECOVERY [{(player.parryCooldownTimer).toFixed(2)}s]
                </span>
              )}
            </div>

            {/* Last timing feedback */}
            {player.lastParryRating && (
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono">
                <span className="text-slate-500">LAST:</span>
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
                  {player.lastParryRating === 'PERFECT' && '⚡ PERFECT! (0-4F)'}
                  {player.lastParryRating === 'GREAT' && '✨ GREAT! (5-9F)'}
                  {player.lastParryRating === 'GOOD' && '🛡️ GOOD (10-14F)'}
                  {player.lastParryRating === 'WHIFF' && '💨 WHIFF'}
                </span>
              </div>
            )}

            {/* Movement hint for smartphones */}
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-cyan-300/85 pt-0.5 border-t border-slate-800/70">
              <span>🕹️</span>
              <span>{controlMode === 'JOYSTICK' ? '画面左ドラッグで360°移動' : 'ドラッグでスリング発射'}</span>
            </div>
          </div>

          {/* On-screen Touch DASH & PARRY buttons for Mobile/Tablet */}
          <div className="flex flex-col gap-1.5 sm:gap-2 items-center pointer-events-auto">
            {onDashPress && (
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onDashPress();
                }}
                className="flex items-center justify-center gap-1 w-18 h-9 sm:w-22 sm:h-10 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-[11px] sm:text-xs tracking-wider shadow-[0_0_15px_rgba(56,189,248,0.4)] active:scale-90 transition-transform cursor-pointer border border-sky-300/40 select-none touch-none"
                aria-label="Dash"
              >
                <span className="text-sm">🚀</span>
                <span>DASH</span>
              </button>
            )}

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onParryPress();
              }}
              className="flex flex-col items-center justify-center w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-xs sm:text-sm tracking-widest shadow-[0_0_25px_rgba(56,189,248,0.6)] active:scale-90 active:from-cyan-400 active:to-blue-500 transition-transform cursor-pointer border border-cyan-300/40 select-none touch-none"
              aria-label="Parry"
            >
              <span className="text-xl sm:text-2xl">⚡</span>
              <span>PARRY</span>
              <span className="text-[8px] sm:text-[9px] font-mono text-cyan-200 mt-0.5 sm:hidden">TAP HERE</span>
              <span className="text-[8px] sm:text-[9px] font-mono text-cyan-200 mt-0.5 hidden sm:inline">SPACE / R-CLICK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
