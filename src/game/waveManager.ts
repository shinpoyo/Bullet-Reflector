import { Enemy } from '../types/game';

export function spawnWaveEnemies(wave: number, arenaWidth: number, arenaHeight: number): Enemy[] {
  const enemies: Enemy[] = [];
  const cx = arenaWidth / 2;
  const cy = arenaHeight / 2;

  // Helper to place around arena edge
  const getSpawnPos = (index: number, total: number, radiusDistance: number) => {
    const angle = (index * Math.PI * 2) / total + Math.PI / 4;
    return {
      x: cx + Math.cos(angle) * radiusDistance,
      y: cy + Math.sin(angle) * radiusDistance,
    };
  };

  if (wave === 1) {
    // Wave 1: 2 Snipe Orbs (Intro to Timing & Reflect Angles)
    for (let i = 0; i < 2; i++) {
      const pos = getSpawnPos(i, 2, Math.min(arenaWidth, arenaHeight) * 0.35);
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
        attackTimer: 0.5 + i * 0.8,
        attackInterval: 2.4,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  } else if (wave === 2) {
    // Wave 2: 1 Gatling Sentinel + 2 Snipe Orbs (Rapid Chain Parry)
    const pos1 = getSpawnPos(0, 3, Math.min(arenaWidth, arenaHeight) * 0.35);
    enemies.push({
      id: Math.random(),
      type: 'GATLING_SENTINEL',
      x: pos1.x,
      y: pos1.y,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 55,
      maxHp: 55,
      mass: 1.8,
      angle: 0,
      attackTimer: 0.8,
      attackInterval: 2.6,
      wallBounces: 0,
      hitFlashTimer: 0,
    });

    for (let i = 1; i <= 2; i++) {
      const pos = getSpawnPos(i, 3, Math.min(arenaWidth, arenaHeight) * 0.35);
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
        attackTimer: 0.2 + i * 0.6,
        attackInterval: 2.2,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  } else if (wave === 3) {
    // Wave 3: 2 Ricochet Prisms (Frontal Shield + Bank Shots) + 1 Gatling Sentinel
    for (let i = 0; i < 2; i++) {
      const pos = getSpawnPos(i, 3, Math.min(arenaWidth, arenaHeight) * 0.32);
      enemies.push({
        id: Math.random(),
        type: 'RICOCHET_PRISM',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 45,
        maxHp: 45,
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

    const posG = getSpawnPos(2, 3, Math.min(arenaWidth, arenaHeight) * 0.35);
    enemies.push({
      id: Math.random(),
      type: 'GATLING_SENTINEL',
      x: posG.x,
      y: posG.y,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 55,
      maxHp: 55,
      mass: 1.8,
      angle: 0,
      attackTimer: 1.2,
      attackInterval: 2.5,
      wallBounces: 0,
      hitFlashTimer: 0,
    });
  } else if (wave === 4) {
    // Wave 4: 2 Ricochet Prisms + 2 Gatling Sentinels
    for (let i = 0; i < 2; i++) {
      const pos = getSpawnPos(i, 4, Math.min(arenaWidth, arenaHeight) * 0.33);
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
        attackTimer: 0.4 + i * 0.7,
        attackInterval: 2.5,
        shieldAngle: 0,
        shieldArc: (120 * Math.PI) / 180,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
    for (let i = 2; i < 4; i++) {
      const pos = getSpawnPos(i, 4, Math.min(arenaWidth, arenaHeight) * 0.35);
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
        attackTimer: 0.8 + i * 0.5,
        attackInterval: 2.4,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  } else if (wave === 5) {
    // Wave 5: BOSS WAVE - GRAVITY CORE!
    enemies.push({
      id: Math.random(),
      type: 'GRAVITY_CORE',
      x: cx,
      y: cy - 80,
      vx: 0,
      vy: 0,
      radius: 36,
      hp: 350,
      maxHp: 350,
      mass: 5.0,
      angle: 0,
      attackTimer: 1.5,
      attackInterval: 3.2,
      wallBounces: 0,
      hitFlashTimer: 0,
    });
    // 2 escorts
    const escort1 = getSpawnPos(0, 2, Math.min(arenaWidth, arenaHeight) * 0.38);
    const escort2 = getSpawnPos(1, 2, Math.min(arenaWidth, arenaHeight) * 0.38);
    enemies.push({
      id: Math.random(),
      type: 'SNIPE_ORB',
      x: escort1.x,
      y: escort1.y,
      vx: 0,
      vy: 0,
      radius: 16,
      hp: 35,
      maxHp: 35,
      mass: 1.0,
      angle: 0,
      attackTimer: 1.0,
      attackInterval: 2.0,
      wallBounces: 0,
      hitFlashTimer: 0,
    });
    enemies.push({
      id: Math.random(),
      type: 'RICOCHET_PRISM',
      x: escort2.x,
      y: escort2.y,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 50,
      maxHp: 50,
      mass: 1.5,
      angle: 0,
      attackTimer: 1.8,
      attackInterval: 2.4,
      shieldAngle: 0,
      shieldArc: (120 * Math.PI) / 180,
      wallBounces: 0,
      hitFlashTimer: 0,
    });
  } else {
    // Wave 6+: Escalating Endless Challenge
    const count = Math.min(4 + (wave - 5), 8);
    for (let i = 0; i < count; i++) {
      const pos = getSpawnPos(i, count, Math.min(arenaWidth, arenaHeight) * 0.36);
      const types = ['SNIPE_ORB', 'GATLING_SENTINEL', 'RICOCHET_PRISM'] as const;
      const type = types[i % types.length];
      const hp = 40 + wave * 5;
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
        mass: type === 'GATLING_SENTINEL' ? 1.8 : 1.2,
        angle: 0,
        attackTimer: 0.3 + (i * 0.4),
        attackInterval: Math.max(1.6, 2.8 - wave * 0.1),
        shieldAngle: 0,
        shieldArc: (120 * Math.PI) / 180,
        wallBounces: 0,
        hitFlashTimer: 0,
      });
    }
  }

  return enemies;
}
