import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bullet, Enemy, ExpGem, FloatingText, GameStats, LightningBolt, Particle, Player, RaycastSegment, Shockwave, Vector2D, WallFlash } from '../types/game';
import { calculateSlingTrajectory, clamp, updateGameSimulation, vecLen, vecNorm, vecScale } from '../game/physics';
import { renderGameScene } from '../game/renderer';
import { getWaveArenaScale, spawnWaveEnemies } from '../game/waveManager';
import { soundManager } from '../audio/soundManager';
import { applySkillToPlayer } from '../game/skills';

interface GameCanvasProps {
  onGameOver: (stats: GameStats, isVictory: boolean) => void;
  onUpdateStats: (stats: GameStats, player: Player) => void;
  onTriggerLevelUp: () => void;
  isPaused: boolean;
  onRequestParryRef?: React.MutableRefObject<(() => void) | null>;
  onApplySkillRef?: React.MutableRefObject<((skillId: any) => void) | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onGameOver,
  onUpdateStats,
  onTriggerLevelUp,
  isPaused,
  onRequestParryRef,
  onApplySkillRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // High score tracking
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('bullet_reflector_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Game internal state held in refs so React state updates don't affect 60fps loop
  const gameStateRef = useRef<{
    player: Player;
    bullets: Bullet[];
    enemies: Enemy[];
    expGems: ExpGem[];
    lightningBolts: LightningBolt[];
    particles: Particle[];
    shockwaves: Shockwave[];
    floatingTexts: FloatingText[];
    wallFlashes: WallFlash[];
    stats: GameStats;
    mousePos: Vector2D;
    heldKeys: Set<string>;
    screenShake: number;
    hitStopMs: number;
    lastTime: number;
    waveTransitionTimer: number;
    baseWidth: number;
    baseHeight: number;
    arenaWidth: number;
    arenaHeight: number;
    cameraZoom: number;
    targetCameraZoom: number;
    isAimingDrag: boolean;
    dragStartPos: Vector2D;
  }>({
    player: {
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
    },
    bullets: [],
    enemies: [],
    expGems: [],
    lightningBolts: [],
    particles: [],
    shockwaves: [],
    floatingTexts: [],
    wallFlashes: [],
    stats: {
      score: 0,
      highScore: highScore,
      wave: 1,
      maxWave: 1,
      chain: 0,
      maxChain: 0,
      bankShots: 0,
      perfectParries: 0,
      greatParries: 0,
      totalParries: 0,
      enemiesDefeated: 0,
    },
    mousePos: { x: 400, y: 200 },
    heldKeys: new Set<string>(),
    screenShake: 0,
    hitStopMs: 0,
    lastTime: performance.now(),
    waveTransitionTimer: 0,
    baseWidth: 800,
    baseHeight: 600,
    arenaWidth: 800,
    arenaHeight: 600,
    cameraZoom: 1.0,
    targetCameraZoom: 1.0,
    isAimingDrag: false,
    dragStartPos: { x: 0, y: 0 },
  });

  // Expose instant parry trigger for UI button / external calls
  const triggerParry = useCallback(() => {
    const state = gameStateRef.current;
    if (isPaused || state.player.hp <= 0) return;

    // Use current mouse coordinate for aiming parry
    import('../game/physics').then(({ attemptParry }) => {
      attemptParry(
        state.player,
        state.bullets,
        state.enemies,
        state.shockwaves,
        state.floatingTexts,
        state.stats,
        state.mousePos,
        (intensity) => {
          state.screenShake = Math.max(state.screenShake, intensity);
        },
        (ms) => {
          state.hitStopMs = ms;
        }
      );
      onUpdateStats({ ...state.stats }, { ...state.player });
    });
  }, [isPaused, onUpdateStats]);

  useEffect(() => {
    if (onRequestParryRef) {
      onRequestParryRef.current = triggerParry;
    }
  }, [triggerParry, onRequestParryRef]);

  useEffect(() => {
    if (onApplySkillRef) {
      onApplySkillRef.current = (skillId: any) => {
        const state = gameStateRef.current;
        applySkillToPlayer(state.player, skillId);
        onUpdateStats({ ...state.stats }, { ...state.player });
      };
    }
  }, [onApplySkillRef, onUpdateStats]);

  // Handle Resize and Canvas setup
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      canvasRef.current.width = w * dpr;
      canvasRef.current.height = h * dpr;
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      const state = gameStateRef.current;
      state.baseWidth = w;
      state.baseHeight = h;

      const scale = getWaveArenaScale(state.stats.wave);
      state.arenaWidth = Math.round(w * scale);
      state.arenaHeight = Math.round(h * scale);
      state.targetCameraZoom = 1.0 / scale;
      if (state.cameraZoom === 1.0 && scale === 1.0) {
        state.cameraZoom = 1.0;
      }

      if (state.player.x === 400 && state.player.y === 300) {
        state.player.x = state.arenaWidth / 2;
        state.player.y = state.arenaHeight * 0.7;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Wave 1
  useEffect(() => {
    const state = gameStateRef.current;
    state.enemies = spawnWaveEnemies(1, state.arenaWidth || 800, state.arenaHeight || 600);
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(gameLoop);
      const state = gameStateRef.current;

      const rawDt = Math.min((currentTime - state.lastTime) / 1000, 0.05);
      state.lastTime = currentTime;

      if (isPaused) {
        return;
      }

      // Smooth camera zoom transition
      state.cameraZoom += (state.targetCameraZoom - state.cameraZoom) * Math.min(1, rawDt * 3.0);

      // Check Hit-Stop (Micro-freeze on PERFECT parry for heavy game feel)
      if (state.hitStopMs > 0) {
        state.hitStopMs -= rawDt * 1000;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderGameScene({
              ctx,
              width: state.baseWidth,
              height: state.baseHeight,
              arenaWidth: state.arenaWidth,
              arenaHeight: state.arenaHeight,
              cameraZoom: state.cameraZoom,
              player: state.player,
              bullets: state.bullets,
              enemies: state.enemies,
              expGems: state.expGems,
              lightningBolts: state.lightningBolts,
              particles: state.particles,
              shockwaves: state.shockwaves,
              floatingTexts: state.floatingTexts,
              wallFlashes: state.wallFlashes,
              trajectorySegments: [],
              mousePos: state.mousePos,
              screenShake: state.screenShake,
              time: currentTime / 1000,
            });
          }
        }
        return;
      }

      // Decaying Screen Shake
      if (state.screenShake > 0) {
        state.screenShake = Math.max(0, state.screenShake - rawDt * 24);
      }

      // Continuous Keyboard Micro-movement (WASD / Arrows)
      const moveSpeed = 220;
      let moveX = 0;
      let moveY = 0;
      if (state.heldKeys.has('KeyW') || state.heldKeys.has('ArrowUp')) moveY -= 1;
      if (state.heldKeys.has('KeyS') || state.heldKeys.has('ArrowDown')) moveY += 1;
      if (state.heldKeys.has('KeyA') || state.heldKeys.has('ArrowLeft')) moveX -= 1;
      if (state.heldKeys.has('KeyD') || state.heldKeys.has('ArrowRight')) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const moveDir = vecNorm({ x: moveX, y: moveY });
        state.player.vx += moveDir.x * moveSpeed * rawDt * 8;
        state.player.vy += moveDir.y * moveSpeed * rawDt * 8;
      }

      // Calculate Sling Trajectory if aiming
      let trajectorySegments: RaycastSegment[] = [];
      if (state.player.isAimingSling) {
        const pullVector = {
          x: state.player.x - state.player.slingCurrent.x,
          y: state.player.y - state.player.slingCurrent.y,
        };
        const pullDist = vecLen(pullVector);
        if (pullDist > 10) {
          const launchDir = vecNorm(pullVector);
          const launchSpeed = clamp(pullDist * 4.5, 150, 750);
          trajectorySegments = calculateSlingTrajectory(
            state.player,
            vecScale(launchDir, launchSpeed),
            state.enemies,
            state.arenaWidth,
            state.arenaHeight
          );
        }
      }

      // Update Simulation with 4-substep physics
      const {
        bullets: nextBullets,
        enemies: nextEnemies,
        expGems: nextGems,
        lightningBolts: nextLightning,
      } = updateGameSimulation(
        state.player,
        state.bullets,
        state.enemies,
        state.expGems,
        state.lightningBolts,
        state.particles,
        state.shockwaves,
        state.floatingTexts,
        state.wallFlashes,
        state.stats,
        state.arenaWidth,
        state.arenaHeight,
        state.mousePos,
        rawDt,
        (intensity) => {
          state.screenShake = Math.max(state.screenShake, intensity);
        },
        (ms) => {
          state.hitStopMs = ms;
        },
        onTriggerLevelUp
      );

      state.bullets = nextBullets;
      state.enemies = nextEnemies;
      state.expGems = nextGems;
      state.lightningBolts = nextLightning;

      // Check Wave Completion
      if (state.enemies.length === 0) {
        state.waveTransitionTimer += rawDt;
        if (state.waveTransitionTimer >= 1.2) {
          state.waveTransitionTimer = 0;
          state.stats.wave += 1;
          state.stats.maxWave = Math.max(state.stats.maxWave, state.stats.wave);

          // Restore +25 numerical HP on wave clear!
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 25);

          // Check Arena Scaling (Stage widens from Wave 3+)
          const newScale = getWaveArenaScale(state.stats.wave);
          state.arenaWidth = Math.round(state.baseWidth * newScale);
          state.arenaHeight = Math.round(state.baseHeight * newScale);
          state.targetCameraZoom = 1.0 / newScale;

          soundManager.playBankShotFanfare();
          const isExpanded = newScale > 1.0;
          state.floatingTexts.push({
            id: Math.random(),
            x: state.arenaWidth / 2,
            y: state.arenaHeight / 2 - 30,
            text: `WAVE ${state.stats.wave} INCOMING!`,
            subtext: isExpanded ? `+25 HP · ARENA EXPANDED (${Math.round(newScale * 100)}%)` : '+25 HP RESTORED',
            color: '#38BDF8',
            alpha: 1,
            scale: 1.5,
            vy: -30,
            life: 0,
            maxLife: 1.4,
          });

          state.enemies = spawnWaveEnemies(state.stats.wave, state.arenaWidth, state.arenaHeight);
        }
      }

      // Check Player Death
      if (state.player.hp <= 0) {
        if (state.stats.score > highScore) {
          localStorage.setItem('bullet_reflector_highscore', String(state.stats.score));
          setHighScore(state.stats.score);
        }
        onGameOver(state.stats, false);
        return;
      }

      // Render Scene
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGameScene({
            ctx,
            width: state.baseWidth,
            height: state.baseHeight,
            arenaWidth: state.arenaWidth,
            arenaHeight: state.arenaHeight,
            cameraZoom: state.cameraZoom,
            player: state.player,
            bullets: state.bullets,
            enemies: state.enemies,
            expGems: state.expGems,
            lightningBolts: state.lightningBolts,
            particles: state.particles,
            shockwaves: state.shockwaves,
            floatingTexts: state.floatingTexts,
            wallFlashes: state.wallFlashes,
            trajectorySegments,
            mousePos: state.mousePos,
            screenShake: state.screenShake,
            time: currentTime / 1000,
            stats: state.stats,
          });
        }
      }

      onUpdateStats({ ...state.stats }, { ...state.player });
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, onGameOver, onUpdateStats, onTriggerLevelUp, highScore]);

  // Input Listeners: Keyboard & Mouse & Touch
  useEffect(() => {
    const state = gameStateRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        triggerParry();
        return;
      }
      if (e.code === 'KeyR' || e.code === 'Escape') {
        return;
      }
      state.heldKeys.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      state.heldKeys.delete(e.code);
    };

    const handleBlur = () => {
      state.heldKeys.clear();
      state.player.isAimingSling = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [triggerParry]);

  // Converts canvas screen coordinates to world arena coordinates accounting for camera zoom
  const screenToWorld = useCallback((clientX: number, clientY: number): Vector2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: clientX, y: clientY };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const state = gameStateRef.current;
    const zoom = state.cameraZoom || 1.0;
    const worldX = (screenX - state.baseWidth / 2) / zoom + state.arenaWidth / 2;
    const worldY = (screenY - state.baseHeight / 2) / zoom + state.arenaHeight / 2;

    return { x: worldX, y: worldY };
  }, []);

  // Pointer / Touch Handlers for Sling-shot Aiming and Deflect Aiming
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const state = gameStateRef.current;
    state.mousePos = worldPos;

    // Right-click is parry!
    if (e.button === 2) {
      triggerParry();
      return;
    }

    // Left click / touch drag: start sling aim!
    state.isAimingDrag = true;
    state.dragStartPos = worldPos;
    state.player.isAimingSling = true;
    state.player.slingStart = { x: state.player.x, y: state.player.y };
    state.player.slingCurrent = worldPos;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const state = gameStateRef.current;
    state.mousePos = worldPos;

    if (state.isAimingDrag && state.player.isAimingSling) {
      state.player.slingCurrent = worldPos;
    }
  };

  const handlePointerUp = () => {
    const state = gameStateRef.current;
    if (state.isAimingDrag && state.player.isAimingSling) {
      const pullVector = {
        x: state.player.x - state.player.slingCurrent.x,
        y: state.player.y - state.player.slingCurrent.y,
      };
      const pullDist = vecLen(pullVector);

      if (pullDist > 20) {
        // Launch sling dash!
        const launchDir = vecNorm(pullVector);
        const launchSpeed = clamp(pullDist * 5, 200, 750);
        state.player.vx = launchDir.x * launchSpeed;
        state.player.vy = launchDir.y * launchSpeed;
        soundManager.playSlingDash();
      }

      state.isAimingDrag = false;
      state.player.isAimingSling = false;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
};
