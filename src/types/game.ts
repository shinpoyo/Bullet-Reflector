export type ParryRating = 'PERFECT' | 'GREAT' | 'GOOD' | 'WHIFF';

export type EnemyType = 'SNIPE_ORB' | 'GATLING_SENTINEL' | 'RICOCHET_PRISM' | 'GRAVITY_CORE';

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY' | 'LEVEL_UP';

export type SkillId =
  | 'MULTI_MIRROR'
  | 'MAGNET_CORE'
  | 'PARRY_WINDOW'
  | 'EXPLOSIVE_RICOCHET'
  | 'TESLA_DISCHARGE'
  | 'CORE_REINFORCE'
  | 'TACKLE_BOOST'
  | 'TRICKSHOT_MASTER';

export interface SkillDefinition {
  id: SkillId;
  name: string;
  nameJa: string;
  description: string;
  icon: string;
  maxLevel: number;
}

export interface ExpGem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  color: string;
  lifeTime: number;
  isAttracted: boolean;
}

export interface LightningBolt {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  points: Vector2D[];
  alpha: number;
  color: string;
  lifeTime: number;
  maxLife: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  invulnerableTimer: number;
  parryCooldownTimer: number;
  parryBufferTimer: number;
  isParrying: boolean;
  parryAge: number; // frames since parry input
  lastParryRating: ParryRating | null;
  lastParryTimeDiffMs: number; // timing feedback in ms
  isAimingSling: boolean;
  slingStart: Vector2D;
  slingCurrent: Vector2D;
  aimAngle: number;
  // Vampire Survivors Roguelite mechanics
  level: number;
  exp: number;
  expToNext: number;
  magnetRadius: number;
  skills: Record<SkillId, number>;
  parryWindowMultiplier: number;
  multiMirrorLevel: number;
  explosiveLevel: number;
  teslaLevel: number;
  teslaTimer: number;
  tackleMultiplier: number;
  bankMultiplier: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isParried: boolean;
  parryRating?: ParryRating;
  isLaserPenetrating?: boolean;
  hitsLeft?: number;
  wallBounces: number;
  color: string;
  glowColor: string;
  isBossCore?: boolean;
  rallyCount?: number;
  trail: Vector2D[];
  lifeTime: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  mass: number;
  angle: number;
  attackTimer: number;
  attackInterval: number;
  burstCount?: number;
  burstTimer?: number;
  telegraphTimer?: number;
  isTelegraphing?: boolean;
  shieldAngle?: number; // For Ricochet Prism
  shieldArc?: number; // radians of shield
  wallBounces: number; // for billiards bank shot tracking
  isKnockedByPlayer?: boolean;
  hitFlashTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  decay: number;
  shape?: 'circle' | 'line' | 'cross' | 'spark';
  length?: number;
  angle?: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
  expansionSpeed: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface WallFlash {
  side: 'top' | 'bottom' | 'left' | 'right';
  intensity: number;
}

export interface RaycastSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isWallHit: boolean;
  isEnemyHit: boolean;
  hitEnemyId?: number;
  deflectionVector?: Vector2D;
  enemyKnockbackVector?: Vector2D;
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  maxWave: number;
  chain: number;
  maxChain: number;
  bankShots: number;
  perfectParries: number;
  greatParries: number;
  totalParries: number;
  enemiesDefeated: number;
}
