/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameStats, Player } from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameCanvas } from './components/GameCanvas';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { soundManager } from './audio/soundManager';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [gameKey, setGameKey] = useState<number>(1); // used to cleanly reset canvas simulation

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
    hp: 5,
    maxHp: 5,
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
  });

  // Reference for instant touch PARRY button to trigger canvas parry
  const requestParryRef = useRef<(() => void) | null>(null);

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

  // Global Keyboard shortcuts for State transitions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 60FPS Game Canvas - Always mounted during play/pause/gameover */}
      {gameState !== 'TITLE' && (
        <GameCanvas
          key={gameKey}
          isPaused={gameState === 'PAUSED'}
          onGameOver={handleGameOver}
          onUpdateStats={handleUpdateStats}
          onRequestParryRef={requestParryRef}
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
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <GameHUD
          stats={stats}
          player={playerInfo}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onParryPress={handleParryPress}
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
