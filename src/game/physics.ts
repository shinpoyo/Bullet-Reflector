import { Bullet, Enemy, FloatingText, GameStats, Particle, Player, RaycastSegment, Shockwave, Vector2D, WallFlash } from '../types/game';
import { soundManager } from '../audio/soundManager';

// Math utility helpers
export const vecLen = (v: Vector2D): number => Math.hypot(v.x, v.y);

export const vecNorm = (v: Vector2D): Vector2D => {
  const len = Math.hypot(v.x, v.y);
  if (len < 0.0001) return { x: 0, y: -1 };
  return { x: v.x / len, y: v.y / len };
};

export const vecDot = (a: Vector2D, b: Vector2D): number => a.x * b.x + a.y * b.y;

export const vecDist = (a: Vector2D, b: Vector2D): number => Math.hypot(a.x - b.x, a.y - b.y);

export const vecScale = (v: Vector2D, s: number): Vector2D => ({ x: v.x * s, y: v.y * s });

export const vecAdd = (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x + b.x, y: a.y + b.y });

export const vecSub = (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x - b.x, y: a.y - b.y });

export const reflectVector = (v: Vector2D, normal: Vector2D): Vector2D => {
  const dot = vecDot(v, normal);
  return {
    x: v.x - 2 * dot * normal.x,
    y: v.y - 2 * dot * normal.y,
  };
};

export const clamp = (val: number, min: number, max: number): number => Math.max(min, Math.min(max, val));

/**
 * 2-Bounce Raycasting trajectory calculator for Sling-shot Aiming
 */
export function calculateSlingTrajectory(
  player: Player,
  launchVelocity: Vector2D,
  enemies: Enemy[],
  arenaWidth: number,
  arenaHeight: number
): RaycastSegment[] {
  const segments: RaycastSegment[] = [];
  let currentPos: Vector2D = { x: player.x, y: player.y };
  let currentDir = vecNorm(launchVelocity);
  const maxBounces = 2;
  const playerRadius = player.radius;

  for (let bounce = 0; bounce <= maxBounces; bounce++) {
    // 1. Raycast vs walls
    let minT = Infinity;
    let hitNormal: Vector2D = { x: 0, y: 0 };
    let hitIsWall = false;
    let hitIsEnemy = false;
    let hitEnemy: Enemy | null = null;

    // Left wall (x = playerRadius)
    if (currentDir.x < -0.0001) {
      const t = (playerRadius - currentPos.x) / currentDir.x;
      if (t > 0.1 && t < minT) {
        minT = t;
        hitNormal = { x: 1, y: 0 };
        hitIsWall = true;
      }
    }
    // Right wall (x = arenaWidth - playerRadius)
    if (currentDir.x > 0.0001) {
      const t = (arenaWidth - playerRadius - currentPos.x) / currentDir.x;
      if (t > 0.1 && t < minT) {
        minT = t;
        hitNormal = { x: -1, y: 0 };
        hitIsWall = true;
      }
    }
    // Top wall (y = playerRadius)
    if (currentDir.y < -0.0001) {
      const t = (playerRadius - currentPos.y) / currentDir.y;
      if (t > 0.1 && t < minT) {
        minT = t;
        hitNormal = { x: 0, y: 1 };
        hitIsWall = true;
      }
    }
    // Bottom wall (y = arenaHeight - playerRadius)
    if (currentDir.y > 0.0001) {
      const t = (arenaHeight - playerRadius - currentPos.y) / currentDir.y;
      if (t > 0.1 && t < minT) {
        minT = t;
        hitNormal = { x: 0, y: -1 };
        hitIsWall = true;
      }
    }

    // 2. Raycast vs Enemies (Circle-ray intersection)
    for (const enemy of enemies) {
      const combinedRadius = playerRadius + enemy.radius;
      const m = vecSub(currentPos, { x: enemy.x, y: enemy.y });
      const b = vecDot(m, currentDir);
      const c = vecDot(m, m) - combinedRadius * combinedRadius;

      if (c > 0 && b > 0) continue;
      const discr = b * b - c;
      if (discr < 0) continue;

      let t = -b - Math.sqrt(discr);
      if (t < 0.1) t = -b + Math.sqrt(discr);

      if (t > 0.1 && t < minT) {
        minT = t;
        hitIsWall = false;
        hitIsEnemy = true;
        hitEnemy = enemy;
      }
    }

    if (!isFinite(minT) || minT > 1500) {
      // Clamp to max distance
      const endPoint = vecAdd(currentPos, vecScale(currentDir, 600));
      segments.push({
        startX: currentPos.x,
        startY: currentPos.y,
        endX: endPoint.x,
        endY: endPoint.y,
        isWallHit: false,
        isEnemyHit: false,
      });
      break;
    }

    const hitPoint = vecAdd(currentPos, vecScale(currentDir, minT));

    if (hitIsWall) {
      segments.push({
        startX: currentPos.x,
        startY: currentPos.y,
        endX: hitPoint.x,
        endY: hitPoint.y,
        isWallHit: true,
        isEnemyHit: false,
      });
      // Reflect
      currentPos = hitPoint;
      currentDir = reflectVector(currentDir, hitNormal);
    } else if (hitIsEnemy && hitEnemy) {
      // Billiard contact resolution
      const normal = vecNorm(vecSub({ x: hitEnemy.x, y: hitEnemy.y }, hitPoint));
      const tangent = { x: -normal.y, y: normal.x };

      // Knockback vector for enemy
      const enemyKnockback = vecScale(normal, 120);
      // Deflection vector for player
      const deflection = vecScale(tangent, vecDot(currentDir, tangent) * 80);

      segments.push({
        startX: currentPos.x,
        startY: currentPos.y,
        endX: hitPoint.x,
        endY: hitPoint.y,
        isWallHit: false,
        isEnemyHit: true,
        hitEnemyId: hitEnemy.id,
        enemyKnockbackVector: enemyKnockback,
        deflectionVector: deflection,
      });
      break; // Stop after hitting an enemy
    }
  }

  return segments;
}

/**
 * Executes a single frame with 4-substepping continuous collision detection
 */
export function updateGameSimulation(
  player: Player,
  bullets: Bullet[],
  enemies: Enemy[],
  particles: Particle[],
  shockwaves: Shockwave[],
  floatingTexts: FloatingText[],
  wallFlashes: WallFlash[],
  stats: GameStats,
  arenaWidth: number,
  arenaHeight: number,
  mousePos: Vector2D,
  rawDt: number,
  triggerScreenShake: (intensity: number) => void,
  triggerHitStop: (durationMs: number) => void
): { bullets: Bullet[]; enemies: Enemy[] } {
  const isAiming = player.isAimingSling;
  const timeDilation = isAiming ? 0.25 : 1.0;
  const dt = Math.min(rawDt, 0.05) * timeDilation;
  const subSteps = 4;
  const subDt = dt / subSteps;

  // Process input buffering & timers
  if (player.parryCooldownTimer > 0) {
    player.parryCooldownTimer = Math.max(0, player.parryCooldownTimer - rawDt);
  }
  if (player.parryBufferTimer > 0) {
    player.parryBufferTimer = Math.max(0, player.parryBufferTimer - rawDt);
    if (player.parryCooldownTimer <= 0 && player.parryBufferTimer > 0) {
      // Auto-trigger buffered parry
      player.parryBufferTimer = 0;
      attemptParry(player, bullets, enemies, shockwaves, floatingTexts, stats, mousePos, triggerScreenShake, triggerHitStop);
    }
  }

  if (player.isParrying) {
    player.parryAge += 1;
    if (player.parryAge > 14) {
      player.isParrying = false;
    }
  }

  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer = Math.max(0, player.invulnerableTimer - rawDt);
  }

  // 4-Substep Loop for Physics & Continuous Collision Detection
  for (let step = 0; step < subSteps; step++) {
    // 1. Move Player
    player.x += player.vx * subDt;
    player.y += player.vy * subDt;
    // Friction
    player.vx *= Math.pow(0.85, subDt * 60);
    player.vy *= Math.pow(0.85, subDt * 60);

    // Wall bounce for Player
    if (player.x - player.radius < 0) {
      player.x = player.radius;
      player.vx = -player.vx * 0.6;
      wallFlashes.push({ side: 'left', intensity: 0.6 });
      soundManager.playWallBounce();
    } else if (player.x + player.radius > arenaWidth) {
      player.x = arenaWidth - player.radius;
      player.vx = -player.vx * 0.6;
      wallFlashes.push({ side: 'right', intensity: 0.6 });
      soundManager.playWallBounce();
    }
    if (player.y - player.radius < 0) {
      player.y = player.radius;
      player.vy = -player.vy * 0.6;
      wallFlashes.push({ side: 'top', intensity: 0.6 });
      soundManager.playWallBounce();
    } else if (player.y + player.radius > arenaHeight) {
      player.y = arenaHeight - player.radius;
      player.vy = -player.vy * 0.6;
      wallFlashes.push({ side: 'bottom', intensity: 0.6 });
      soundManager.playWallBounce();
    }

    // 2. Move Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * subDt;
      b.y += b.vy * subDt;
      b.lifeTime += subDt;

      // Trail recording
      if (b.lifeTime > 0.02) {
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 8) b.trail.shift();
      }

      // Wall reflections for Parried bullets
      if (b.isParried) {
        let bounced = false;
        if (b.x - b.radius < 0) {
          b.x = b.radius;
          b.vx = Math.abs(b.vx);
          bounced = true;
          wallFlashes.push({ side: 'left', intensity: 0.5 });
        } else if (b.x + b.radius > arenaWidth) {
          b.x = arenaWidth - b.radius;
          b.vx = -Math.abs(b.vx);
          bounced = true;
          wallFlashes.push({ side: 'right', intensity: 0.5 });
        }
        if (b.y - b.radius < 0) {
          b.y = b.radius;
          b.vy = Math.abs(b.vy);
          bounced = true;
          wallFlashes.push({ side: 'top', intensity: 0.5 });
        } else if (b.y + b.radius > arenaHeight) {
          b.y = arenaHeight - b.radius;
          b.vy = -Math.abs(b.vy);
          bounced = true;
          wallFlashes.push({ side: 'bottom', intensity: 0.5 });
        }
        if (bounced) {
          b.wallBounces++;
          soundManager.playWallBounce();
          createImpactSparks(particles, b.x, b.y, b.color, 4);
        }
      }

      // Check collision between Parried Bullets and Enemies
      if (b.isParried) {
        for (const enemy of enemies) {
          const dist = vecDist({ x: b.x, y: b.y }, { x: enemy.x, y: enemy.y });
          if (dist < b.radius + enemy.radius) {
            // Check Ricochet Prism frontal shield!
            let blockedByShield = false;
            if (enemy.type === 'RICOCHET_PRISM' && enemy.shieldAngle !== undefined && enemy.shieldArc !== undefined) {
              const impactAngle = Math.atan2(b.y - enemy.y, b.x - enemy.x);
              let angleDiff = Math.abs(impactAngle - enemy.shieldAngle);
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              angleDiff = Math.abs(angleDiff);

              if (angleDiff < enemy.shieldArc / 2 && b.wallBounces === 0) {
                // Blocked by front shield!
                blockedByShield = true;
                soundManager.playWallBounce();
                floatingTexts.push({
                  id: Math.random(),
                  x: enemy.x,
                  y: enemy.y - 20,
                  text: 'BLOCKED!',
                  subtext: 'Flank or Bank Shot!',
                  color: '#9333EA',
                  alpha: 1,
                  scale: 1,
                  vy: -40,
                  life: 0,
                  maxLife: 0.8,
                });
                b.vx = -b.vx * 0.8;
                b.vy = -b.vy * 0.8;
                createImpactSparks(particles, b.x, b.y, '#C084FC', 8);
              }
            }

            if (!blockedByShield) {
              // Boss rally check for Mega Core
              if (b.isBossCore && enemy.type === 'GRAVITY_CORE') {
                // Table tennis boss rally counter-hit!
                b.rallyCount = (b.rallyCount || 0) + 1;
                soundManager.playBossRally(b.rallyCount);
                triggerScreenShake(8);

                floatingTexts.push({
                  id: Math.random(),
                  x: enemy.x,
                  y: enemy.y - 30,
                  text: `RALLY ${b.rallyCount}/3!`,
                  subtext: 'Parry it back!',
                  color: '#EC4899',
                  alpha: 1,
                  scale: 1.4,
                  vy: -40,
                  life: 0,
                  maxLife: 1.0,
                });

                if (b.rallyCount >= 3) {
                  // Boss overloaded! Massive detonation!
                  enemy.hp -= 260;
                  enemy.hitFlashTimer = 0.3;
                  soundManager.playEnemyExplosion(4);
                  triggerScreenShake(20);
                  shockwaves.push({
                    x: enemy.x,
                    y: enemy.y,
                    radius: 10,
                    maxRadius: 180,
                    alpha: 1,
                    color: '#F43F5E',
                    lineWidth: 6,
                    expansionSpeed: 500,
                  });
                  createExplosionSparks(particles, enemy.x, enemy.y, '#F43F5E', 40);
                  // Clear boss core
                  b.hitsLeft = 0;
                } else {
                  // Reflect back towards player with increased speed!
                  b.isParried = false;
                  const toPlayer = vecNorm(vecSub({ x: player.x, y: player.y }, { x: enemy.x, y: enemy.y }));
                  const rallySpeed = 380 + b.rallyCount * 120;
                  b.vx = toPlayer.x * rallySpeed;
                  b.vy = toPlayer.y * rallySpeed;
                  b.wallBounces = 0;
                }
                break;
              }

              // Normal damage dealing
              let effectiveDamage = b.damage;
              let isBankShot = false;
              if (b.wallBounces > 0) {
                isBankShot = true;
                effectiveDamage *= 2.0;
                stats.bankShots++;
                soundManager.playBankShotFanfare();
                floatingTexts.push({
                  id: Math.random(),
                  x: enemy.x,
                  y: enemy.y - 35,
                  text: '🎱 BANK SHOT! x2.0',
                  color: '#FBBF24',
                  alpha: 1,
                  scale: 1.3,
                  vy: -45,
                  life: 0,
                  maxLife: 1.0,
                });
              }

              enemy.hp -= effectiveDamage;
              enemy.hitFlashTimer = 0.15;
              // Push enemy slightly
              enemy.vx += b.vx * 0.15;
              enemy.vy += b.vy * 0.15;

              // Knockback
              createImpactSparks(particles, b.x, b.y, b.color, 12);
              floatingTexts.push({
                id: Math.random(),
                x: enemy.x,
                y: enemy.y - 15,
                text: `${Math.round(effectiveDamage)}`,
                color: isBankShot ? '#FBBF24' : '#38BDF8',
                alpha: 1,
                scale: isBankShot ? 1.2 : 0.9,
                vy: -35,
                life: 0,
                maxLife: 0.6,
              });

              if (b.isLaserPenetrating) {
                // Piercing laser
                b.hitsLeft = (b.hitsLeft ?? 3) - 1;
              } else {
                b.hitsLeft = 0;
              }

              if (b.parryRating === 'GREAT') {
                // Shockwave on hit
                shockwaves.push({
                  x: enemy.x,
                  y: enemy.y,
                  radius: 5,
                  maxRadius: 65,
                  alpha: 0.8,
                  color: '#38BDF8',
                  lineWidth: 3,
                  expansionSpeed: 300,
                });
              }
            }
          }
        }
      } else {
        // Unparried bullet hitting player
        const dist = vecDist({ x: b.x, y: b.y }, { x: player.x, y: player.y });
        if (dist < b.radius + player.radius) {
          if (player.invulnerableTimer <= 0) {
            player.hp -= 1;
            player.invulnerableTimer = 1.0;
            stats.chain = 0; // reset chain on damage
            soundManager.playPlayerHit();
            triggerScreenShake(12);
            createImpactSparks(particles, player.x, player.y, '#EF4444', 16);
            floatingTexts.push({
              id: Math.random(),
              x: player.x,
              y: player.y - 20,
              text: 'HIT! -1 HP',
              color: '#EF4444',
              alpha: 1,
              scale: 1.2,
              vy: -40,
              life: 0,
              maxLife: 0.9,
            });
          }
          b.hitsLeft = 0;
        }
      }
    }

    // 3. Move Enemies & Billiard Elastic Physics
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      e.x += e.vx * subDt;
      e.y += e.vy * subDt;
      e.vx *= Math.pow(0.92, subDt * 60);
      e.vy *= Math.pow(0.92, subDt * 60);

      // Wall bounce for enemies
      let eBounced = false;
      if (e.x - e.radius < 0) {
        e.x = e.radius;
        e.vx = Math.abs(e.vx) * 0.75;
        eBounced = true;
      } else if (e.x + e.radius > arenaWidth) {
        e.x = arenaWidth - e.radius;
        e.vx = -Math.abs(e.vx) * 0.75;
        eBounced = true;
      }
      if (e.y - e.radius < 0) {
        e.y = e.radius;
        e.vy = Math.abs(e.vy) * 0.75;
        eBounced = true;
      } else if (e.y + e.radius > arenaHeight) {
        e.y = arenaHeight - e.radius;
        e.vy = -Math.abs(e.vy) * 0.75;
        eBounced = true;
      }
      if (eBounced && e.isKnockedByPlayer) {
        e.wallBounces++;
        soundManager.playWallBounce();
      }

      // Player vs Enemy Collision (Sling tackle / Billiards impact)
      const pDist = vecDist({ x: player.x, y: player.y }, { x: e.x, y: e.y });
      if (pDist < player.radius + e.radius) {
        const normal = vecNorm(vecSub({ x: e.x, y: e.y }, { x: player.x, y: player.y }));
        // Elastic collision math
        const m1 = 3.0; // player mass
        const m2 = e.mass;
        const v1n = vecDot({ x: player.vx, y: player.vy }, normal);
        const v2n = vecDot({ x: e.vx, y: e.vy }, normal);

        const v1nNew = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
        const v2nNew = (2 * m1 * v1n + v2n * (m2 - m1)) / (m1 + m2);

        const pSpeed = vecLen({ x: player.vx, y: player.vy });

        if (pSpeed > 150) {
          // Player dashed into enemy! Deal tackle damage!
          const tackleDamage = Math.round(pSpeed * 0.12);
          e.hp -= tackleDamage;
          e.hitFlashTimer = 0.15;
          e.isKnockedByPlayer = true;
          soundManager.playEnemyExplosion(1.2);
          triggerScreenShake(6);

          floatingTexts.push({
            id: Math.random(),
            x: e.x,
            y: e.y - 20,
            text: `TACKLE! ${tackleDamage}`,
            color: '#38BDF8',
            alpha: 1,
            scale: 1.1,
            vy: -35,
            life: 0,
            maxLife: 0.7,
          });

          // Separate
          const overlap = player.radius + e.radius - pDist;
          player.x -= normal.x * overlap * 0.5;
          player.y -= normal.y * overlap * 0.5;
          e.x += normal.x * overlap * 0.5;
          e.y += normal.y * overlap * 0.5;

          player.vx += normal.x * (v1nNew - v1n);
          player.vy += normal.y * (v1nNew - v1n);
          e.vx += normal.x * (v2nNew - v2n);
          e.vy += normal.y * (v2nNew - v2n);
        } else if (player.invulnerableTimer <= 0) {
          // Slow touch hurts player
          player.hp -= 1;
          player.invulnerableTimer = 1.0;
          stats.chain = 0;
          soundManager.playPlayerHit();
          triggerScreenShake(10);
        }
      }

      // Enemy vs Enemy Billiard Collision
      for (let j = i + 1; j < enemies.length; j++) {
        const e2 = enemies[j];
        const dist = vecDist({ x: e.x, y: e.y }, { x: e2.x, y: e2.y });
        const minDist = e.radius + e2.radius;
        if (dist < minDist && dist > 0.001) {
          const normal = vecNorm(vecSub({ x: e2.x, y: e2.y }, { x: e.x, y: e.y }));
          // Elastic exchange
          const m1 = e.mass;
          const m2 = e2.mass;
          const v1n = vecDot({ x: e.vx, y: e.vy }, normal);
          const v2n = vecDot({ x: e2.vx, y: e2.vy }, normal);

          const v1nNew = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
          const v2nNew = (2 * m1 * v1n + v2n * (m2 - m1)) / (m1 + m2);

          const relativeSpeed = Math.abs(v1n - v2n);
          if (relativeSpeed > 100 && (e.isKnockedByPlayer || e2.isKnockedByPlayer)) {
            // Billiards crash damage!
            let crashDamage = Math.round(relativeSpeed * 0.08);
            if (e.wallBounces > 0 || e2.wallBounces > 0) {
              crashDamage *= 2;
              stats.bankShots++;
              soundManager.playBankShotFanfare();
              floatingTexts.push({
                id: Math.random(),
                x: (e.x + e2.x) / 2,
                y: (e.y + e2.y) / 2 - 25,
                text: '🎱 BANK COLLISION! x2.0',
                color: '#FBBF24',
                alpha: 1,
                scale: 1.2,
                vy: -40,
                life: 0,
                maxLife: 0.9,
              });
            }
            e.hp -= crashDamage;
            e2.hp -= crashDamage;
            e.hitFlashTimer = 0.15;
            e2.hitFlashTimer = 0.15;
            soundManager.playWallBounce();
          }

          // Positional resolve
          const overlap = minDist - dist;
          e.x -= normal.x * overlap * 0.5;
          e.y -= normal.y * overlap * 0.5;
          e2.x += normal.x * overlap * 0.5;
          e2.y += normal.y * overlap * 0.5;

          e.vx += normal.x * (v1nNew - v1n);
          e.vy += normal.y * (v1nNew - v1n);
          e2.vx += normal.x * (v2nNew - v2n);
          e2.vy += normal.y * (v2nNew - v2n);
        }
      }
    }
  }

  // 4. Update Enemy AI / Attacks
  updateEnemyAI(enemies, bullets, player, arenaWidth, arenaHeight, dt, floatingTexts);

  // 5. Filter dead bullets & defeated enemies
  const nextBullets = bullets.filter((b) => {
    if (b.hitsLeft !== undefined && b.hitsLeft <= 0) return false;
    // Parried bullets bounce 4 times before expiring; unparried disappear on edge
    if (b.isParried) {
      return b.wallBounces <= 4 && b.lifeTime < 5.0;
    }
    return (
      b.x >= -50 &&
      b.x <= arenaWidth + 50 &&
      b.y >= -50 &&
      b.y <= arenaHeight + 50 &&
      b.lifeTime < 10.0
    );
  });

  const nextEnemies = enemies.filter((e) => {
    if (e.hitFlashTimer > 0) e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
    if (e.hp <= 0) {
      // Enemy defeated!
      stats.enemiesDefeated++;
      stats.chain++;
      stats.maxChain = Math.max(stats.maxChain, stats.chain);
      const scoreGain = Math.round(100 * e.mass * (1 + stats.chain * 0.2));
      stats.score += scoreGain;
      stats.highScore = Math.max(stats.highScore, stats.score);

      soundManager.playEnemyExplosion(e.mass);
      triggerScreenShake(e.mass * 4);
      createExplosionSparks(particles, e.x, e.y, getEnemyColor(e.type), Math.round(e.mass * 12));

      floatingTexts.push({
        id: Math.random(),
        x: e.x,
        y: e.y,
        text: `+${scoreGain}`,
        color: '#FBBF24',
        alpha: 1,
        scale: 1.2,
        vy: -35,
        life: 0,
        maxLife: 0.8,
      });
      return false;
    }
    return true;
  });

  // 6. Update Particles, Shockwaves, Floating Texts
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.alpha -= p.decay * dt;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    s.radius += s.expansionSpeed * dt;
    s.alpha = Math.max(0, 1 - s.radius / s.maxRadius);
    if (s.radius >= s.maxRadius || s.alpha <= 0) {
      shockwaves.splice(i, 1);
    }
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy * dt;
    ft.life += dt;
    ft.alpha = Math.max(0, 1 - ft.life / ft.maxLife);
    if (ft.life >= ft.maxLife) {
      floatingTexts.splice(i, 1);
    }
  }

  for (let i = wallFlashes.length - 1; i >= 0; i--) {
    wallFlashes[i].intensity -= dt * 2.5;
    if (wallFlashes[i].intensity <= 0) {
      wallFlashes.splice(i, 1);
    }
  }

  return { bullets: nextBullets, enemies: nextEnemies };
}

/**
 * Hyper Just-Parry Execution with 3-tier blend formula
 */
export function attemptParry(
  player: Player,
  bullets: Bullet[],
  enemies: Enemy[],
  shockwaves: Shockwave[],
  floatingTexts: FloatingText[],
  stats: GameStats,
  cursorPos: Vector2D,
  triggerScreenShake: (intensity: number) => void,
  triggerHitStop: (durationMs: number) => void
): boolean {
  if (player.parryCooldownTimer > 0) {
    // Save to input buffer (100ms)
    player.parryBufferTimer = 0.10;
    return false;
  }

  const R = player.radius; // 16px
  let bestRating: 'PERFECT' | 'GREAT' | 'GOOD' | null = null;
  let parriedAny = false;

  // Vector aiming from player to cursor
  const cursorAim = vecNorm(vecSub(cursorPos, { x: player.x, y: player.y }));

  // Check all unparried incoming bullets
  for (const b of bullets) {
    if (b.isParried) continue;

    const dist = vecDist({ x: player.x, y: player.y }, { x: b.x, y: b.y });

    // Distance windows based on specification:
    // PERFECT: R + 2 ~ R + 18 (18 ~ 34px)
    // GREAT: R + 19 ~ R + 32 (35 ~ 48px)
    // GOOD: R + 33 ~ R + 44 (49 ~ 60px)
    let rating: 'PERFECT' | 'GREAT' | 'GOOD' | null = null;

    if (dist >= R + 2 && dist <= R + 18) {
      rating = 'PERFECT';
    } else if (dist > R + 18 && dist <= R + 32) {
      rating = 'GREAT';
    } else if (dist > R + 32 && dist <= R + 44) {
      rating = 'GOOD';
    }

    if (rating) {
      parriedAny = true;
      if (!bestRating || rating === 'PERFECT' || (rating === 'GREAT' && bestRating === 'GOOD')) {
        bestRating = rating;
      }

      // Physical impact normal from player to bullet
      const impactNormal = vecNorm(vecSub({ x: b.x, y: b.y }, { x: player.x, y: player.y }));
      const vIn = { x: b.vx, y: b.vy };
      const mirrorVector = vecNorm(reflectVector(vIn, impactNormal));

      let dOut: Vector2D;
      let speedMultiplier = 1.0;
      let damageMultiplier = 1.0;

      if (rating === 'PERFECT') {
        // Spec formula: normalize(0.65 * A_cursor + 0.35 * N_impact)
        dOut = vecNorm({
          x: 0.65 * cursorAim.x + 0.35 * impactNormal.x,
          y: 0.65 * cursorAim.y + 0.35 * impactNormal.y,
        });
        speedMultiplier = 3.5;
        damageMultiplier = 3.0;
        b.isLaserPenetrating = true;
        b.hitsLeft = 3;
        b.color = '#FDE047'; // golden laser
        b.glowColor = '#F59E0B';
      } else if (rating === 'GREAT') {
        // Spec formula: normalize(0.50 * N_impact + 0.35 * A_cursor + 0.15 * R_mirror)
        dOut = vecNorm({
          x: 0.50 * impactNormal.x + 0.35 * cursorAim.x + 0.15 * mirrorVector.x,
          y: 0.50 * impactNormal.y + 0.35 * cursorAim.y + 0.15 * mirrorVector.y,
        });
        speedMultiplier = 2.4;
        damageMultiplier = 2.0;
        b.isLaserPenetrating = false;
        b.hitsLeft = 1;
        b.color = '#38BDF8';
        b.glowColor = '#0284C7';
      } else {
        // Spec formula: normalize(0.75 * N_impact + 0.25 * R_mirror)
        dOut = vecNorm({
          x: 0.75 * impactNormal.x + 0.25 * mirrorVector.x,
          y: 0.75 * impactNormal.y + 0.25 * mirrorVector.y,
        });
        speedMultiplier = 1.5;
        damageMultiplier = 1.0;
        b.isLaserPenetrating = false;
        b.hitsLeft = 1;
        b.color = '#67E8F9';
        b.glowColor = '#06B6D4';
      }

      const initialSpeed = Math.max(vecLen(vIn), 220);
      const newSpeed = initialSpeed * speedMultiplier;
      b.vx = dOut.x * newSpeed;
      b.vy = dOut.y * newSpeed;
      b.damage *= damageMultiplier;
      b.isParried = true;
      b.parryRating = rating;
      b.wallBounces = 0;
    }
  }

  player.isParrying = true;
  player.parryAge = 0;

  if (parriedAny && bestRating) {
    player.lastParryRating = bestRating;
    stats.totalParries++;

    if (bestRating === 'PERFECT') {
      stats.perfectParries++;
      stats.chain += 0.5;
      player.parryCooldownTimer = 0; // 0s CD reset!
      soundManager.playParry('PERFECT', Math.floor(stats.chain));
      triggerScreenShake(8);
      triggerHitStop(33); // 2F micro hitstop (0.033s)

      shockwaves.push({
        x: player.x,
        y: player.y,
        radius: 12,
        maxRadius: 80,
        alpha: 1,
        color: '#FDE047',
        lineWidth: 4,
        expansionSpeed: 450,
      });

      floatingTexts.push({
        id: Math.random(),
        x: player.x,
        y: player.y - 30,
        text: '⚡ PERFECT!! x3.5',
        subtext: '0.00s CD RESET',
        color: '#FDE047',
        alpha: 1,
        scale: 1.4,
        vy: -40,
        life: 0,
        maxLife: 0.8,
      });
    } else if (bestRating === 'GREAT') {
      stats.greatParries++;
      stats.chain += 0.25;
      player.parryCooldownTimer = 0; // 0s CD reset!
      soundManager.playParry('GREAT', Math.floor(stats.chain));
      triggerScreenShake(5);

      shockwaves.push({
        x: player.x,
        y: player.y,
        radius: 12,
        maxRadius: 60,
        alpha: 0.9,
        color: '#38BDF8',
        lineWidth: 3,
        expansionSpeed: 380,
      });

      floatingTexts.push({
        id: Math.random(),
        x: player.x,
        y: player.y - 30,
        text: '✨ GREAT! x2.4',
        subtext: '0.00s CD RESET',
        color: '#38BDF8',
        alpha: 1,
        scale: 1.2,
        vy: -40,
        life: 0,
        maxLife: 0.8,
      });
    } else {
      // GOOD
      player.parryCooldownTimer = 0.12; // 0.12s short delay, zero move lock
      soundManager.playParry('GOOD', Math.floor(stats.chain));
      triggerScreenShake(3);

      floatingTexts.push({
        id: Math.random(),
        x: player.x,
        y: player.y - 30,
        text: '🛡️ GOOD x1.5',
        color: '#67E8F9',
        alpha: 1,
        scale: 1.0,
        vy: -35,
        life: 0,
        maxLife: 0.7,
      });
    }

    return true;
  } else {
    // WHIFF
    player.lastParryRating = 'WHIFF';
    player.parryCooldownTimer = 0.18; // 0.18s interval to prevent mashing
    soundManager.playParry('WHIFF', 0);

    floatingTexts.push({
      id: Math.random(),
      x: player.x,
      y: player.y - 25,
      text: 'WHIFF',
      color: '#94A3B8',
      alpha: 0.8,
      scale: 0.9,
      vy: -25,
      life: 0,
      maxLife: 0.5,
    });
    return false;
  }
}

/**
 * AI logic for the 4 enemy types
 */
function updateEnemyAI(
  enemies: Enemy[],
  bullets: Bullet[],
  player: Player,
  arenaWidth: number,
  arenaHeight: number,
  dt: number,
  floatingTexts: FloatingText[]
) {
  for (const e of enemies) {
    const toPlayer = vecSub({ x: player.x, y: player.y }, { x: e.x, y: e.y });
    const dist = vecLen(toPlayer);
    const dir = vecNorm(toPlayer);

    e.angle = Math.atan2(toPlayer.y, toPlayer.x);

    if (e.type === 'SNIPE_ORB') {
      // Keep medium distance ~240px
      const targetDist = 240;
      const speed = 70;
      if (dist < targetDist - 30) {
        e.vx -= dir.x * speed * dt;
        e.vy -= dir.y * speed * dt;
      } else if (dist > targetDist + 30) {
        e.vx += dir.x * speed * dt;
        e.vy += dir.y * speed * dt;
      }

      e.attackTimer += dt;
      // Telegraph 0.3s before firing
      if (e.attackTimer >= e.attackInterval - 0.3 && !e.isTelegraphing) {
        e.isTelegraphing = true;
        soundManager.playTelegraphFlash();
      }

      if (e.attackTimer >= e.attackInterval) {
        e.attackTimer = 0;
        e.isTelegraphing = false;
        // Fire high speed snipe bullet
        const bSpeed = 440;
        bullets.push({
          id: Math.random(),
          x: e.x + dir.x * (e.radius + 6),
          y: e.y + dir.y * (e.radius + 6),
          vx: dir.x * bSpeed,
          vy: dir.y * bSpeed,
          radius: 6,
          damage: 1,
          isParried: false,
          wallBounces: 0,
          color: '#EF4444',
          glowColor: '#DC2626',
          trail: [],
          lifeTime: 0,
        });
        soundManager.playEnemyFire();
      }
    } else if (e.type === 'GATLING_SENTINEL') {
      // Anchors down and shoots 3-round bursts
      e.attackTimer += dt;

      if (e.burstCount && e.burstCount > 0) {
        e.burstTimer = (e.burstTimer || 0) + dt;
        if (e.burstTimer >= 0.12) {
          e.burstTimer = 0;
          e.burstCount--;
          const bSpeed = 380;
          bullets.push({
            id: Math.random(),
            x: e.x + dir.x * (e.radius + 8),
            y: e.y + dir.y * (e.radius + 8),
            vx: dir.x * bSpeed,
            vy: dir.y * bSpeed,
            radius: 5,
            damage: 1,
            isParried: false,
            wallBounces: 0,
            color: '#F97316',
            glowColor: '#EA580C',
            trail: [],
            lifeTime: 0,
          });
          soundManager.playEnemyFire();
        }
      } else if (e.attackTimer >= e.attackInterval) {
        e.attackTimer = 0;
        e.burstCount = 3;
        e.burstTimer = 0.12; // immediate first shot
      }
    } else if (e.type === 'RICOCHET_PRISM') {
      // Always faces the player with frontal shield
      e.shieldAngle = e.angle;
      e.shieldArc = (120 * Math.PI) / 180; // 120 degrees arc

      // Slowly drifts towards player
      const speed = 55;
      e.vx += dir.x * speed * dt;
      e.vy += dir.y * speed * dt;

      e.attackTimer += dt;
      if (e.attackTimer >= e.attackInterval) {
        e.attackTimer = 0;
        // Fires twin diagonal deflected shots
        for (const offset of [-0.4, 0.4]) {
          const shotAngle = e.angle + offset;
          const bSpeed = 260;
          bullets.push({
            id: Math.random(),
            x: e.x + Math.cos(shotAngle) * (e.radius + 6),
            y: e.y + Math.sin(shotAngle) * (e.radius + 6),
            vx: Math.cos(shotAngle) * bSpeed,
            vy: Math.sin(shotAngle) * bSpeed,
            radius: 5.5,
            damage: 1,
            isParried: false,
            wallBounces: 0,
            color: '#C084FC',
            glowColor: '#9333EA',
            trail: [],
            lifeTime: 0,
          });
        }
        soundManager.playEnemyFire();
      }
    } else if (e.type === 'GRAVITY_CORE') {
      // Boss AI: heavy, orbits center, alternates ring bullets and table tennis pink core
      const centerX = arenaWidth / 2;
      const centerY = arenaHeight / 2;
      const toCenter = vecSub({ x: centerX, y: centerY }, { x: e.x, y: e.y });
      e.vx += toCenter.x * 0.8 * dt;
      e.vy += toCenter.y * 0.8 * dt;

      e.attackTimer += dt;
      if (e.attackTimer >= e.attackInterval) {
        e.attackTimer = 0;
        // Alternates attack mode
        const isMegaCoreShot = (e.burstCount || 0) % 2 === 1;
        e.burstCount = (e.burstCount || 0) + 1;

        if (isMegaCoreShot) {
          // Launch the Mega Energy Core (table tennis parryable!)
          const coreSpeed = 220;
          bullets.push({
            id: Math.random(),
            x: e.x + dir.x * (e.radius + 14),
            y: e.y + dir.y * (e.radius + 14),
            vx: dir.x * coreSpeed,
            vy: dir.y * coreSpeed,
            radius: 16,
            damage: 1,
            isParried: false,
            wallBounces: 0,
            color: '#F43F5E',
            glowColor: '#BE123C',
            isBossCore: true,
            rallyCount: 0,
            trail: [],
            lifeTime: 0,
          });
          soundManager.playEnemyFire();

          floatingTexts.push({
            id: Math.random(),
            x: e.x,
            y: e.y - 45,
            text: '💥 MEGA CORE!',
            subtext: 'Parry for Table Tennis Rally!',
            color: '#F43F5E',
            alpha: 1,
            scale: 1.3,
            vy: -40,
            life: 0,
            maxLife: 1.2,
          });
        } else {
          // 12-way ring burst with opening
          const ringCount = 10;
          const bSpeed = 200;
          for (let k = 0; k < ringCount; k++) {
            const angle = e.angle + (k * (Math.PI * 2)) / ringCount;
            bullets.push({
              id: Math.random(),
              x: e.x + Math.cos(angle) * (e.radius + 8),
              y: e.y + Math.sin(angle) * (e.radius + 8),
              vx: Math.cos(angle) * bSpeed,
              vy: Math.sin(angle) * bSpeed,
              radius: 6,
              damage: 1,
              isParried: false,
              wallBounces: 0,
              color: '#38BDF8',
              glowColor: '#0284C7',
              trail: [],
              lifeTime: 0,
            });
          }
          soundManager.playEnemyFire();
        }
      }
    }
  }
}

function getEnemyColor(type: string): string {
  switch (type) {
    case 'SNIPE_ORB':
      return '#EF4444';
    case 'GATLING_SENTINEL':
      return '#F97316';
    case 'RICOCHET_PRISM':
      return '#A855F7';
    case 'GRAVITY_CORE':
      return '#38BDF8';
    default:
      return '#FBBF24';
  }
}

function createImpactSparks(particles: Particle[], x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 260;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1.5 + Math.random() * 2,
      alpha: 1,
      color,
      decay: 2.5 + Math.random() * 2,
      shape: 'spark',
    });
  }
}

function createExplosionSparks(particles: Particle[], x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 320;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 3,
      alpha: 1,
      color,
      decay: 1.5 + Math.random() * 2,
      shape: 'circle',
    });
  }
}
