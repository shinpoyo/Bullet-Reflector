import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bullet, Enemy, ExpGem, FloatingText, GameStats, LightningBolt, Particle, Player, RaycastSegment, Shockwave, Vector2D, WallFlash } from '../types/game';
import { calculateSlingTrajectory, clamp, updateGameSimulation, vecDist, vecLen, vecNorm, vecScale, vecSub } from '../game/physics';
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
  onRequestDashRef?: React.MutableRefObject<(() => void) | null>;
  onApplySkillRef?: React.MutableRefObject<((skillId: any) => void) | null>;
  controlMode?: 'JOYSTICK' | 'SLING';
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onGameOver,
  onUpdateStats,
  onTriggerLevelUp,
  isPaused,
  onRequestParryRef,
  onRequestDashRef,
  onApplySkillRef,
  controlMode = 'JOYSTICK',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchPointerIdRef = useRef<number | null>(null);
  const slingPointerIdRef = useRef<number | null>(null);

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
    virtualJoystick: {
      active: boolean;
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      radius: number;
    };
    heldKeys: Set<string>;
    screenShake: number;
    hitStopMs: number;
    lastTime: number;
    waveTransitionTimer: number;
    isWaveTransitioning: boolean;
    baseWidth: number;
    baseHeight: number;
    arenaWidth: number;
    arenaHeight: number;
    cameraZoom: number;
    targetCameraZoom: number;
    isAimingDrag: boolean;
    dragStartPos: Vector2D;
    isDying: boolean;
    deathTimer: number;
  }>({
    virtualJoystick: {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      radius: 46,
    },
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
    isWaveTransitioning: false,
    baseWidth: 800,
    baseHeight: 600,
    arenaWidth: 800,
    arenaHeight: 600,
    cameraZoom: 1.0,
    targetCameraZoom: 1.0,
    isAimingDrag: false,
    dragStartPos: { x: 0, y: 0 },
    isDying: false,
    deathTimer: 0,
  });

  // Expose instant parry trigger for UI button / external calls
  const triggerParry = useCallback(() => {
    const state = gameStateRef.current;
    if (isPaused || state.player.hp <= 0 || state.isDying) return;

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

  // Expose instant Dash trigger for UI button / Shift key
  const triggerDash = useCallback(() => {
    const state = gameStateRef.current;
    if (isPaused || state.player.hp <= 0 || state.isDying) return;

    let dashDir: Vector2D;
    const currentSpeed = vecLen({ x: state.player.vx, y: state.player.vy });

    if (state.virtualJoystick.active) {
      const dx = state.virtualJoystick.currentX - state.virtualJoystick.startX;
      const dy = state.virtualJoystick.currentY - state.virtualJoystick.startY;
      if (Math.hypot(dx, dy) > 4) {
        dashDir = vecNorm({ x: dx, y: dy });
      } else {
        dashDir = { x: Math.cos(state.player.aimAngle), y: Math.sin(state.player.aimAngle) };
      }
    } else if (currentSpeed > 35) {
      dashDir = vecNorm({ x: state.player.vx, y: state.player.vy });
    } else {
      let nearestEn: Enemy | null = null;
      let minDist = Infinity;
      for (const e of state.enemies) {
        if (e.hp <= 0) continue;
        const d = vecDist({ x: state.player.x, y: state.player.y }, { x: e.x, y: e.y });
        if (d < minDist) {
          minDist = d;
          nearestEn = e;
        }
      }
      if (nearestEn) {
        dashDir = vecNorm(vecSub({ x: nearestEn.x, y: nearestEn.y }, { x: state.player.x, y: state.player.y }));
      } else {
        dashDir = { x: Math.cos(state.player.aimAngle), y: Math.sin(state.player.aimAngle) };
      }
    }

    const tackleMult = state.player.tackleMultiplier || 1.0;
    const dashSpeed = clamp(580 * tackleMult, 500, 800);
    state.player.vx = dashDir.x * dashSpeed;
    state.player.vy = dashDir.y * dashSpeed;
    soundManager.playSlingDash();

    state.shockwaves.push({
      x: state.player.x,
      y: state.player.y,
      radius: 10,
      maxRadius: 55,
      alpha: 1,
      color: '#38BDF8',
      lineWidth: 3.5,
      expansionSpeed: 380,
    });
  }, [isPaused]);

  useEffect(() => {
    if (onRequestDashRef) {
      onRequestDashRef.current = triggerDash;
    }
  }, [triggerDash, onRequestDashRef]);

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
      if (w <= 0 || h <= 0) return;

      canvasRef.current.width = w * dpr;
      canvasRef.current.height = h * dpr;
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;

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
              virtualJoystick: state.virtualJoystick,
              screenShake: state.screenShake,
              time: currentTime / 1000,
            });
          }
        }
        return;
      }

      // Visceral Decaying Screen Shake (Exponential shock impulse damping)
      if (state.screenShake > 0.05) {
        state.screenShake = Math.max(0, state.screenShake - (state.screenShake * 10 + 8) * rawDt);
      } else {
        state.screenShake = 0;
      }

      // Keyboard and touch steering (disabled during death collapse)
      if (!state.isDying) {
        // Continuous Keyboard Micro-movement (WASD / Arrows)
        const moveSpeed = 240;
        let moveX = 0;
        let moveY = 0;
        if (state.heldKeys.has('KeyW') || state.heldKeys.has('ArrowUp')) moveY -= 1;
        if (state.heldKeys.has('KeyS') || state.heldKeys.has('ArrowDown')) moveY += 1;
        if (state.heldKeys.has('KeyA') || state.heldKeys.has('ArrowLeft')) moveX -= 1;
        if (state.heldKeys.has('KeyD') || state.heldKeys.has('ArrowRight')) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
          const moveDir = vecNorm({ x: moveX, y: moveY });
          state.player.vx += moveDir.x * moveSpeed * rawDt * 9;
          state.player.vy += moveDir.y * moveSpeed * rawDt * 9;
          state.player.aimAngle = Math.atan2(moveDir.y, moveDir.x);
        }

        // Continuous Touch Virtual Joystick Steering (Smartphone & Tablet)
        if (state.virtualJoystick.active) {
          const dx = state.virtualJoystick.currentX - state.virtualJoystick.startX;
          const dy = state.virtualJoystick.currentY - state.virtualJoystick.startY;
          const dist = Math.hypot(dx, dy);
          const deadzone = 4;
          const maxR = state.virtualJoystick.radius || 46;

          if (dist > deadzone) {
            const normMagnitude = clamp((dist - deadzone) / (maxR - deadzone), 0, 1);
            const dirX = dx / dist;
            const dirY = dy / dist;
            const touchMoveSpeed = 280; // Smooth, agile, responsive 360-degree dodging!
            state.player.vx += dirX * normMagnitude * touchMoveSpeed * rawDt * 10;
            state.player.vy += dirY * normMagnitude * touchMoveSpeed * rawDt * 10;
            state.player.aimAngle = Math.atan2(dirY, dirX);
          }
        }
      }

      // Calculate Sling Trajectory if aiming
      let trajectorySegments: RaycastSegment[] = [];
      if (state.player.isAimingSling && !state.isDying) {
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

      // Update Simulation with 4-substep physics (slow motion if player is in death collapse)
      const simDt = state.isDying ? rawDt * 0.2 : rawDt;
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
        simDt,
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
      if (state.enemies.length === 0 && !state.isDying) {
        if (!state.isWaveTransitioning) {
          state.isWaveTransitioning = true;
          state.waveTransitionTimer = 0;
          state.stats.wave += 1;
          state.stats.maxWave = Math.max(state.stats.maxWave, state.stats.wave);

          // Restore +25 numerical HP on wave clear!
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 25);

          // Clean up leftover unparried enemy bullets for peace of mind
          state.bullets = state.bullets.filter((b) => b.isParried);

          // Check Arena Scaling (Stage widens from Wave 3+)
          const newScale = getWaveArenaScale(state.stats.wave);
          const oldArenaW = state.arenaWidth;
          const oldArenaH = state.arenaHeight;
          state.arenaWidth = Math.round(state.baseWidth * newScale);
          state.arenaHeight = Math.round(state.baseHeight * newScale);
          state.targetCameraZoom = 1.0 / newScale;

          // Seamless coordinate preservation on expansion:
          const shiftX = (state.arenaWidth - oldArenaW) / 2;
          const shiftY = (state.arenaHeight - oldArenaH) / 2;
          if (shiftX !== 0 || shiftY !== 0) {
            state.player.x += shiftX;
            state.player.y += shiftY;
            for (const gem of state.expGems) {
              gem.x += shiftX;
              gem.y += shiftY;
            }
            for (const b of state.bullets) {
              b.x += shiftX;
              b.y += shiftY;
            }
          }

          soundManager.playBankShotFanfare();
        } else {
          // Grace period: enemies do NOT appear or attack during this 1.5s announcement countdown
          state.waveTransitionTimer += rawDt;
          if (state.waveTransitionTimer >= 1.5) {
            state.waveTransitionTimer = 0;
            state.isWaveTransitioning = false;
            state.enemies = spawnWaveEnemies(state.stats.wave, state.arenaWidth, state.arenaHeight);
          }
        }
      }

      // Check Player Death & Complete Enemy Freeze
      if (state.player.hp <= 0) {
        if (!state.isDying) {
          state.isDying = true;
          state.deathTimer = 0;
          state.screenShake = 24;
          soundManager.playPlayerDefeat();

          // Instantly freeze all enemies in place and clear their attacks
          for (const e of state.enemies) {
            e.vx = 0;
            e.vy = 0;
            e.isTelegraphing = false;
          }
          // Remove unparried hostile enemy bullets so no bullets keep flying or hitting
          state.bullets = state.bullets.filter((b) => b.isParried);

          // Core rupture particle explosion
          for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 260;
            state.particles.push({
              x: state.player.x,
              y: state.player.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: 2 + Math.random() * 4,
              color: Math.random() > 0.4 ? '#F43F5E' : '#38BDF8',
              alpha: 1,
              decay: 0.6 + Math.random() * 0.5,
              shape: 'spark',
            });
          }

          // Core rupture shockwave
          state.shockwaves.push({
            x: state.player.x,
            y: state.player.y,
            radius: 12,
            maxRadius: 180,
            alpha: 1,
            color: '#F43F5E',
            lineWidth: 4.5,
            expansionSpeed: 200,
          });
        }

        // Lock enemy movement, velocities, and attacks every frame while dead
        for (const e of state.enemies) {
          e.vx = 0;
          e.vy = 0;
          e.isTelegraphing = false;
        }

        state.deathTimer += rawDt;

        // Cinematic 1.4s death slow-motion before transitioning to GameOver modal
        if (state.deathTimer >= 1.4) {
          if (state.stats.score > highScore) {
            localStorage.setItem('bullet_reflector_highscore', String(state.stats.score));
            setHighScore(state.stats.score);
          }
          onGameOver(state.stats, false);
          return;
        }
      }

      // Render Scene
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
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
              virtualJoystick: state.virtualJoystick,
              screenShake: state.screenShake,
              time: currentTime / 1000,
              stats: state.stats,
            });
          } catch (renderErr) {
            console.error('Render error:', renderErr);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#040711';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
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
      if (e.code === 'Space' || e.code === 'KeyZ') {
        e.preventDefault();
        triggerParry();
        return;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC' || e.code === 'KeyK') {
        e.preventDefault();
        triggerDash();
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
      state.virtualJoystick.active = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [triggerParry, triggerDash]);

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

  // Pointer / Touch Handlers for Virtual Joystick Movement & Sling-shot Aiming
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Right-click is parry!
    if (e.button === 2) {
      triggerParry();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(e.clientX, e.clientY);

    const state = gameStateRef.current;
    state.mousePos = worldPos;

    if (controlMode === 'SLING') {
      state.isAimingDrag = true;
      state.dragStartPos = worldPos;
      state.player.isAimingSling = true;
      state.player.slingStart = { x: state.player.x, y: state.player.y };
      state.player.slingCurrent = worldPos;
      slingPointerIdRef.current = e.pointerId;
    } else {
      // Default: Virtual Joystick mode (Smooth 360-degree mobile thumb dodging)
      touchPointerIdRef.current = e.pointerId;
      state.virtualJoystick.active = true;
      state.virtualJoystick.startX = screenX;
      state.virtualJoystick.startY = screenY;
      state.virtualJoystick.currentX = screenX;
      state.virtualJoystick.currentY = screenY;
    }

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(e.clientX, e.clientY);

    const state = gameStateRef.current;
    state.mousePos = worldPos;

    if (controlMode === 'SLING') {
      if (state.isAimingDrag && state.player.isAimingSling && e.pointerId === slingPointerIdRef.current) {
        state.player.slingCurrent = worldPos;
      }
    } else {
      if (state.virtualJoystick.active && e.pointerId === touchPointerIdRef.current) {
        const dx = screenX - state.virtualJoystick.startX;
        const dy = screenY - state.virtualJoystick.startY;
        const dist = Math.hypot(dx, dy);
        const maxR = state.virtualJoystick.radius || 46;

        if (dist > maxR) {
          state.virtualJoystick.currentX = state.virtualJoystick.startX + (dx / dist) * maxR;
          state.virtualJoystick.currentY = state.virtualJoystick.startY + (dy / dist) * maxR;
        } else {
          state.virtualJoystick.currentX = screenX;
          state.virtualJoystick.currentY = screenY;
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    const state = gameStateRef.current;

    if (controlMode === 'SLING') {
      if (state.isAimingDrag && state.player.isAimingSling && e.pointerId === slingPointerIdRef.current) {
        const pullVector = {
          x: state.player.x - state.player.slingCurrent.x,
          y: state.player.y - state.player.slingCurrent.y,
        };
        const pullDist = vecLen(pullVector);

        if (pullDist > 20) {
          const launchDir = vecNorm(pullVector);
          const launchSpeed = clamp(pullDist * 5, 200, 750);
          state.player.vx = launchDir.x * launchSpeed;
          state.player.vy = launchDir.y * launchSpeed;
          soundManager.playSlingDash();
        }

        state.isAimingDrag = false;
        state.player.isAimingSling = false;
        slingPointerIdRef.current = null;
      }
    } else {
      if (e.pointerId === touchPointerIdRef.current) {
        state.virtualJoystick.active = false;
        touchPointerIdRef.current = null;
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
};
