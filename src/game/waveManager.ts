import { Enemy } from '../types/game';

/**
 * Calculates the arena expansion scale for higher waves.
 * Wave 1-2: 1.0 (cozy standard arena, no zoom out)
 * Wave 3+: expands wider so the camera zooms out to provide a distant, spacious battlefield.
 */
export function getWaveArenaScale(wave: number): number {
  if (wave <= 2) return 1.0;
  if (wave === 3) return 1.20;
  if (wave === 4) return 1.38;
  if (wave === 5) return 1.55; // Boss wave: grand battle arena
  return Math.min(1.55 + (wave - 5) * 0.08, 1.85); // Wave 6+: expands up to 1.85x
}

export function spawnWaveEnemies(wave: number, arenaWidth: number, arenaHeight: number): Enemy[] {
  const enemies: Enemy[] = [];
  const cx = arenaWidth / 2;
  const cy = arenaHeight / 2;

  // Helper to place around arena center with specified distance
  const getSpawnPos = (index: number, total: number, radiusDistance: number) => {
    const angle = (index * Math.PI * 2) / total + Math.PI / 4;
    return {
      x: cx + Math.cos(angle) * radiusDistance,
      y: cy + Math.sin(angle) * radiusDistance,
    };
  };

  const spawnRadius = Math.min(arenaWidth, arenaHeight) * 0.38;

  if (wave === 1) {
    // Wave 1: 2 Snipe Orbs (Gentle Intro: slow cadence, slow bullets)
    for (let i = 0; i < 2; i++) {
      const pos = getSpawnPos(i, 2, spawnRadius * 0.9);
      enemies.push({
        id: Math.random(),
        type: 'SNIPE_ORB',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 16,
        hp: 30,
        maxHp: 30,
        mass: 1.0,
        angle: 0,
        attackTimer: 0.8 + i * 1.5,
        attackInterval: 3.6,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  } else if (wave === 2) {
    // Wave 2: 1 Gatling Sentinel + 2 Snipe Orbs
    const pos1 = getSpawnPos(0, 3, spawnRadius * 0.95);
    enemies.push({
      id: Math.random(),
      type: 'GATLING_SENTINEL',
      x: pos1.x,
      y: pos1.y,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 45,
      maxHp: 45,
      mass: 1.8,
      angle: 0,
      attackTimer: 1.2,
      attackInterval: 3.4,
      wallBounces: 0,
      hitFlashTimer: 0,
    });

    for (let i = 1; i <= 2; i++) {
      const pos = getSpawnPos(i, 3, spawnRadius * 0.95);
      enemies.push({
        id: Math.random(),
        type: 'SNIPE_ORB',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 16,
        hp: 30,
        maxHp: 30,
        mass: 1.0,
        angle: 0,
        attackTimer: 0.6 + i * 0.8,
        attackInterval: 3.2,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  } else if (wave === 3) {
    // Wave 3: 5 enemies (Stage widens, 2 Prisms + 2 Gatling Sentinels + 1 Snipe Orb)
    for (let i = 0; i < 2; i++) {
      const pos = getSpawnPos(i, 5, spawnRadius);
      enemies.push({
        id: Math.random(),
        type: 'RICOCHET_PRISM',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 50,
        maxHp: 50,
        mass: 1.5,
        angle: 0,
        attackTimer: 0.5 + i * 1.0,
        attackInterval: 2.8,
        shieldAngle: 0,
        shieldArc: (120 * Math.PI) / 180,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }

    for (let i = 2; i < 4; i++) {
      const pos = getSpawnPos(i, 5, spawnRadius);
      enemies.push({
        id: Math.random(),
        type: 'GATLING_SENTINEL',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 55,
        maxHp: 55,
        mass: 1.8,
        angle: 0,
        attackTimer: 1.0 + (i - 2) * 0.7,
        attackInterval: 2.8,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }

    const posS = getSpawnPos(4, 5, spawnRadius);
    enemies.push({
      id: Math.random(),
      type: 'SNIPE_ORB',
      x: posS.x,
      y: posS.y,
      vx: 0,
      vy: 0,
      radius: 16,
      hp: 35,
      maxHp: 35,
      mass: 1.0,
      angle: 0,
      attackTimer: 0.8,
      attackInterval: 2.6,
      wallBounces: 0,
      hitFlashTimer: 0,
    });
  } else if (wave === 4) {
    // Wave 4: 8 enemies (3 Ricochet Prisms + 3 Gatling Sentinels + 2 Snipe Orbs)
    for (let i = 0; i < 3; i++) {
      const pos = getSpawnPos(i, 8, spawnRadius);
      enemies.push({
        id: Math.random(),
        type: 'RICOCHET_PRISM',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 55,
        maxHp: 55,
        mass: 1.5,
        angle: 0,
        attackTimer: 0.4 + i * 0.6,
        attackInterval: 2.5,
        shieldAngle: 0,
        shieldArc: (120 * Math.PI) / 180,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
    for (let i = 3; i < 6; i++) {
      const pos = getSpawnPos(i, 8, spawnRadius);
      enemies.push({
        id: Math.random(),
        type: 'GATLING_SENTINEL',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 60,
        maxHp: 60,
        mass: 1.8,
        angle: 0,
        attackTimer: 0.8 + (i - 3) * 0.5,
        attackInterval: 2.4,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
    for (let i = 6; i < 8; i++) {
      const pos = getSpawnPos(i, 8, spawnRadius);
      enemies.push({
        id: Math.random(),
        type: 'SNIPE_ORB',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 16,
        hp: 35,
        maxHp: 35,
        mass: 1.0,
        angle: 0,
        attackTimer: 0.7 + (i - 6) * 0.6,
        attackInterval: 2.4,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  } else if (wave === 5) {
    // Wave 5: BOSS WAVE - GRAVITY CORE + 6 ESCORTS (3 Prisms, 3 Gatlings) in grand expanded arena!
    enemies.push({
      id: Math.random(),
      type: 'GRAVITY_CORE',
      x: cx,
      y: cy - 90,
      vx: 0,
      vy: 0,
      radius: 38,
      hp: 450,
      maxHp: 450,
      mass: 5.0,
      angle: 0,
      attackTimer: 1.5,
      attackInterval: 3.0,
      wallBounces: 0,
      hitFlashTimer: 0,
    });
    // 6 escorts
    for (let i = 0; i < 6; i++) {
      const pos = getSpawnPos(i, 6, spawnRadius);
      const isPrism = i % 2 === 0;
      enemies.push({
        id: Math.random(),
        type: isPrism ? 'RICOCHET_PRISM' : 'GATLING_SENTINEL',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: isPrism ? 50 : 55,
        maxHp: isPrism ? 50 : 55,
        mass: isPrism ? 1.5 : 1.8,
        angle: 0,
        attackTimer: 0.8 + i * 0.4,
        attackInterval: 2.5,
        shieldAngle: 0,
        shieldArc: (120 * Math.PI) / 180,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  } else {
    // Wave 6+: Escalating horde (12 ~ 24 enemies!) A true bullet-hell swarm in expansive arena
    const count = Math.min(10 + (wave - 5) * 3, 24);
    for (let i = 0; i < count; i++) {
      // Alternate between outer ring and inner ring for natural dispersal
      const dist = i % 2 === 0 ? spawnRadius * 1.05 : spawnRadius * 0.75;
      const pos = getSpawnPos(i, count, dist);
      const types = ['SNIPE_ORB', 'GATLING_SENTINEL', 'RICOCHET_PRISM'] as const;
      const type = types[i % types.length];
      const hp = 50 + wave * 6;
      enemies.push({
        id: Math.random(),
        type,
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: type === 'RICOCHET_PRISM' ? 18 : type === 'GATLING_SENTINEL' ? 18 : 16,
        hp,
        maxHp: hp,
        mass: type === 'GATLING_SENTINEL' ? 1.8 : 1.3,
        angle: 0,
        attackTimer: 0.3 + (i * 0.25),
        attackInterval: Math.max(1.6, 2.8 - wave * 0.07),
        shieldAngle: 0,
        shieldArc: (120 * Math.PI) / 180,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  }

  return enemies;
}
