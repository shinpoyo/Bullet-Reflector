/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameStats, Player, SkillDefinition } from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameCanvas } from './components/GameCanvas';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { LevelUpModal } from './components/LevelUpModal';
import { soundManager } from './audio/soundManager';
import { getRandomSkillChoices } from './game/skills';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [gameKey, setGameKey] = useState<number>(1);
  const [levelUpChoices, setLevelUpChoices] = useState<SkillDefinition[]>([]);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    wave: 1,
    maxWave: 1,
    chain: 0,
    maxChain: 0,
    bankShots: 0,
    perfectParries: 0,
    greatParries: 0,
    totalParries: 0,
    enemiesDefeated: 0,
  });

  const [playerInfo, setPlayerInfo] = useState<Player>({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 16,
    hp: 100,
    maxHp: 100,
    invulnerableTimer: 0,
    parryCooldownTimer: 0,
    parryBufferTimer: 0,
    isParrying: false,
    parryAge: 0,
    lastParryRating: null,
    lastParryTimeDiffMs: 0,
    isAimingSling: false,
    slingStart: { x: 400, y: 300 },
    slingCurrent: { x: 400, y: 300 },
    aimAngle: 0,
    level: 1,
    exp: 0,
    expToNext: 25,
    magnetRadius: 110,
    skills: {
      MULTI_MIRROR: 0,
      MAGNET_CORE: 0,
      PARRY_WINDOW: 0,
      EXPLOSIVE_RICOCHET: 0,
      TESLA_DISCHARGE: 0,
      CORE_REINFORCE: 0,
      TACKLE_BOOST: 0,
      TRICKSHOT_MASTER: 0,
    },
    parryWindowMultiplier: 1.0,
    multiMirrorLevel: 0,
    explosiveLevel: 0,
    teslaLevel: 0,
    teslaTimer: 0,
    tackleMultiplier: 1.0,
    bankMultiplier: 2.0,
  });

  // Reference for instant touch PARRY button & apply skills
  const requestParryRef = useRef<(() => void) | null>(null);
  const requestDashRef = useRef<(() => void) | null>(null);
  const applySkillRef = useRef<((skillId: any) => void) | null>(null);

  const [controlMode, setControlMode] = useState<'JOYSTICK' | 'SLING'>(() => {
    const saved = localStorage.getItem('bullet_reflector_ctrl_mode');
    return saved === 'SLING' ? 'SLING' : 'JOYSTICK';
  });

  const handleToggleControlMode = useCallback(() => {
    setControlMode((prev) => {
      const next = prev === 'JOYSTICK' ? 'SLING' : 'JOYSTICK';
      localStorage.setItem('bullet_reflector_ctrl_mode', next);
      return next;
    });
  }, []);

  const handleDashPress = useCallback(() => {
    if (requestDashRef.current) {
      requestDashRef.current();
    }
  }, []);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('bullet_reflector_highscore');
    if (saved) {
      const val = parseInt(saved, 10);
      setStats((prev) => ({ ...prev, highScore: val }));
    }
  }, []);

  const handleStartGame = useCallback(() => {
    setGameState('PLAYING');
    setGameKey((prev) => prev + 1);
  }, []);

  const handlePause = useCallback(() => {
    setGameState('PAUSED');
  }, []);

  const handleResume = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    setStats((prev) => ({
      score: 0,
      highScore: prev.highScore,
      wave: 1,
      maxWave: 1,
      chain: 0,
      maxChain: 0,
      bankShots: 0,
      perfectParries: 0,
      greatParries: 0,
      totalParries: 0,
      enemiesDefeated: 0,
    }));
    setPlayerInfo({
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 16,
      hp: 100,
      maxHp: 100,
      invulnerableTimer: 0,
      parryCooldownTimer: 0,
      parryBufferTimer: 0,
      isParrying: false,
      parryAge: 0,
      lastParryRating: null,
      lastParryTimeDiffMs: 0,
      isAimingSling: false,
      slingStart: { x: 400, y: 300 },
      slingCurrent: { x: 400, y: 300 },
      aimAngle: 0,
      level: 1,
      exp: 0,
      expToNext: 25,
      magnetRadius: 110,
      skills: {
        MULTI_MIRROR: 0,
        MAGNET_CORE: 0,
        PARRY_WINDOW: 0,
        EXPLOSIVE_RICOCHET: 0,
        TESLA_DISCHARGE: 0,
        CORE_REINFORCE: 0,
        TACKLE_BOOST: 0,
        TRICKSHOT_MASTER: 0,
      },
      parryWindowMultiplier: 1.0,
      multiMirrorLevel: 0,
      explosiveLevel: 0,
      teslaLevel: 0,
      teslaTimer: 0,
      tackleMultiplier: 1.0,
      bankMultiplier: 2.0,
    });
    setGameState('PLAYING');
    setGameKey((prev) => prev + 1);
  }, []);

  const handleGameOver = useCallback((finalStats: GameStats, isVictory: boolean) => {
    setStats(finalStats);
    setGameState(isVictory ? 'VICTORY' : 'GAMEOVER');
  }, []);

  const handleUpdateStats = useCallback((currentStats: GameStats, player: Player) => {
    setStats(currentStats);
    setPlayerInfo(player);
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  }, []);

  const handleParryPress = useCallback(() => {
    if (requestParryRef.current) {
      requestParryRef.current();
    }
  }, []);

  const handleTriggerLevelUp = useCallback(() => {
    const choices = getRandomSkillChoices(playerInfo, 3);
    if (choices.length > 0) {
      setLevelUpChoices(choices);
      setGameState('LEVEL_UP');
    }
  }, [playerInfo]);

  const handleSelectSkill = useCallback((skill: SkillDefinition) => {
    if (applySkillRef.current) {
      applySkillRef.current(skill.id);
    }
    setGameState('PLAYING');
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER' || gameState === 'VICTORY')) {
        e.preventDefault();
        handleRestart();
        return;
      }

      if (gameState === 'TITLE') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleStartGame();
        }
      } else if (gameState === 'PLAYING') {
        if (e.code === 'Escape') {
          e.preventDefault();
          handlePause();
        }
      } else if (gameState === 'PAUSED') {
        if (e.code === 'Escape') {
          e.preventDefault();
          handleResume();
        }
      } else if (gameState === 'GAMEOVER' || gameState === 'VICTORY') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleRestart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleStartGame, handlePause, handleResume, handleRestart]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 60FPS Game Canvas */}
      {gameState !== 'TITLE' && (
        <GameCanvas
          key={gameKey}
          isPaused={gameState === 'PAUSED' || gameState === 'LEVEL_UP'}
          onGameOver={handleGameOver}
          onUpdateStats={handleUpdateStats}
          onTriggerLevelUp={handleTriggerLevelUp}
          onRequestParryRef={requestParryRef}
          onRequestDashRef={requestDashRef}
          onApplySkillRef={applySkillRef}
          controlMode={controlMode}
        />
      )}

      {/* Title Screen */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          highScore={stats.highScore}
        />
      )}

      {/* Active In-Game HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP') && (
        <GameHUD
          stats={stats}
          player={playerInfo}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onRestart={handleRestart}
          onParryPress={handleParryPress}
          onDashPress={handleDashPress}
          controlMode={controlMode}
          onToggleControlMode={handleToggleControlMode}
        />
      )}

      {/* Level Up Roguelite 3-Card Selection Modal */}
      {gameState === 'LEVEL_UP' && (
        <LevelUpModal
          player={playerInfo}
          choices={levelUpChoices}
          onSelectSkill={handleSelectSkill}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over / Victory Modal */}
      {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
        <GameOverModal
          stats={stats}
          isVictory={gameState === 'VICTORY'}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
