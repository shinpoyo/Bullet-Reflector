import { Bullet, Enemy, ExpGem, FloatingText, GameStats, LightningBolt, Particle, Player, RaycastSegment, Shockwave, WallFlash } from '../types/game';

interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  arenaWidth?: number;
  arenaHeight?: number;
  cameraZoom?: number;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  expGems: ExpGem[];
  lightningBolts?: LightningBolt[];
  particles: Particle[];
  shockwaves: Shockwave[];
  floatingTexts: FloatingText[];
  wallFlashes: WallFlash[];
  trajectorySegments: RaycastSegment[];
  mousePos: { x: number; y: number };
  virtualJoystick?: {
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    radius: number;
  };
  screenShake: number;
  time: number;
  stats?: GameStats;
}

export function renderGameScene({
  ctx,
  width,
  height,
  arenaWidth,
  arenaHeight,
  cameraZoom = 1.0,
  player,
  bullets,
  enemies,
  expGems,
  lightningBolts,
  particles,
  shockwaves,
  floatingTexts,
  wallFlashes,
  trajectorySegments,
  mousePos,
  virtualJoystick,
  screenShake,
  time,
  stats,
}: RenderOptions) {
  const actualArenaW = arenaWidth || width;
  const actualArenaH = arenaHeight || height;
  const zoom = cameraZoom;

  // 1. HARD CONTEXT RESET & HARDWARE BUFFER WIPE (Equivalent to gl.clear(gl.COLOR_BUFFER_BIT))
  // Resets transformation matrix, alpha stack, composite blend modes, shadows, and filters so nothing persists or leaks
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.filter = 'none';

  // Wipe color buffer completely across the entire canvas pixel area
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#040711';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const dpr = window.devicePixelRatio || 1;
  ctx.scale(dpr, dpr);

  ctx.save();

  // Visceral Camera Transform: Centered on screen, zoomed, multi-frequency organic rumble, and micro-rotation torque
  let shakeX = 0;
  let shakeY = 0;
  let shakeRot = 0;
  if (screenShake > 0.05) {
    const freqFast = time * 55;
    const freqSlow = time * 24;
    shakeX = (Math.sin(freqFast) * 0.75 + (Math.random() - 0.5) * 0.5) * screenShake;
    shakeY = (Math.cos(freqFast * 1.15) * 0.75 + (Math.random() - 0.5) * 0.5) * screenShake;
    // Visceral camera roll micro-rotation (adds immense physical weight to heavy impacts)
    shakeRot = (Math.sin(freqSlow) * 0.0016 + (Math.random() - 0.5) * 0.0012) * Math.min(screenShake, 24);
  }

  ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
  if (shakeRot !== 0) {
    ctx.rotate(shakeRot);
  }
  ctx.scale(zoom, zoom);
  ctx.translate(-actualArenaW / 2, -actualArenaH / 2);

  // 2. Arena Floor
  ctx.fillStyle = '#060913';
  ctx.fillRect(0, 0, actualArenaW, actualArenaH);

  // Subtle cybernetic arena grid spanning the entire arena area
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= actualArenaW; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, actualArenaH);
    ctx.stroke();
  }
  for (let y = 0; y <= actualArenaH; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(actualArenaW, y);
    ctx.stroke();
  }

  // Center circular markings
  const cx = actualArenaW / 2;
  const cy = actualArenaH / 2;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 320, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Perimeter Walls with Dynamic Contact Flash
  drawNeonArenaWalls(ctx, actualArenaW, actualArenaH, wallFlashes);

  // 4. Shockwaves (rendered behind entities)
  for (const s of shockwaves) {
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = Math.max(0, s.alpha);
    ctx.lineWidth = s.lineWidth;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Enemy Telegraph Lines
  for (const enemy of enemies) {
    if (enemy.type === 'SNIPE_ORB' && enemy.isTelegraphing) {
      ctx.save();
      const flash = Math.sin(time * 30) > 0;
      ctx.strokeStyle = flash ? '#FFFFFF' : '#EF4444';
      ctx.lineWidth = flash ? 3 : 1.5;
      ctx.shadowColor = flash ? '#FFFFFF' : '#EF4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(player.x, player.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 6. Sling-shot Drag Trajectory & 2-Bounce Raycasting Laser
  if (player.isAimingSling && trajectorySegments.length > 0) {
    drawSlingTrajectory(ctx, player, trajectorySegments, time);
  }

  // 7. Particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    if (p.shape === 'spark') {
      const spd = Math.hypot(p.vx, p.vy);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.fillRect(-Math.min(spd * 0.05, 12), -p.radius, Math.min(spd * 0.1, 24), p.radius * 2);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 8. EXP Gems (Glowing neon crystals)
  if (expGems) {
    for (const gem of expGems) {
      ctx.save();
      ctx.translate(gem.x, gem.y);
      const pulse = Math.sin(time * 8 + gem.id) * 0.2 + 0.8;
      ctx.shadowColor = gem.color;
      ctx.shadowBlur = 10 * pulse;
      ctx.fillStyle = gem.color;

      // Diamond crystal shape
      ctx.beginPath();
      const sz = 5;
      ctx.moveTo(0, -sz * 1.3);
      ctx.lineTo(sz, 0);
      ctx.lineTo(0, sz * 1.3);
      ctx.lineTo(-sz, 0);
      ctx.closePath();
      ctx.fill();

      // Bright core
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // 9. Tesla Discharge Lightning Strikes
  if (lightningBolts && lightningBolts.length > 0) {
    drawLightningBolts(ctx, lightningBolts);
  }

  // 10. Bullets (with trails)
  for (const b of bullets) {
    drawBullet(ctx, b);
  }

  // 11. Enemies
  for (const enemy of enemies) {
    drawEnemy(ctx, enemy, time);
  }

  // 12. Player Core, Timing Rings & Tesla Electric Aura & In-World HP & Multiplier Indicator
  drawPlayer(ctx, player, mousePos, time, stats);

  // 13. Floating Combat Text
  for (const ft of floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.alpha);
    ctx.font = `bold ${Math.round(16 * ft.scale)}px 'Outfit', sans-serif`;
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    if (ft.subtext) {
      ctx.font = `600 ${Math.round(11 * ft.scale)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(ft.subtext, ft.x, ft.y + 14 * ft.scale);
    }
    ctx.restore();
  }

  ctx.restore();

  // Screen-space off-screen enemy indicators (Tactical Edge Radar)
  drawOffscreenEnemyIndicators(ctx, width, height, actualArenaW, actualArenaH, zoom, enemies);

  // Screen-Space Virtual Touch Joystick Overlay (Smartphone / Touch controls)
  if (virtualJoystick && virtualJoystick.active) {
    drawVirtualJoystick(ctx, virtualJoystick);
  }

  // Visceral Impact Perimeter Glow on Major Damage or Massive Parries
  if (screenShake > 8) {
    ctx.save();
    const flashAlpha = Math.min(0.35, (screenShake - 8) * 0.022);
    ctx.strokeStyle = player.hp < 30 || player.invulnerableTimer > 0.6
      ? `rgba(239, 68, 68, ${flashAlpha})`
      : `rgba(253, 224, 71, ${flashAlpha})`;
    ctx.lineWidth = Math.min(screenShake * 1.6, 28);
    ctx.strokeRect(0, 0, width, height);
    ctx.restore();
  }

  // Restore context to baseline identity transform and full opacity
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
}

/**
 * High-voltage electric lightning bolt renderer for Tesla Discharge
 */
function drawLightningBolts(ctx: CanvasRenderingContext2D, bolts: LightningBolt[]) {
  for (const lb of bolts) {
    if (!lb.points || lb.points.length < 2) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, lb.alpha);

    // 1. Wide Neon Glow Layer
    ctx.strokeStyle = '#00F5FF';
    ctx.shadowColor = '#00F5FF';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(lb.points[0].x, lb.points[0].y);
    for (let i = 1; i < lb.points.length; i++) {
      ctx.lineTo(lb.points[i].x, lb.points[i].y);
    }
    ctx.stroke();

    // 2. High-voltage Bright White Core
    ctx.strokeStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lb.points[0].x, lb.points[0].y);
    for (let i = 1; i < lb.points.length; i++) {
      ctx.lineTo(lb.points[i].x, lb.points[i].y);
    }
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Neon walls with bounce glow highlights
 */
function drawNeonArenaWalls(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  wallFlashes: WallFlash[]
) {
  ctx.save();
  // Base subtle wall lines
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // Neon glowing inner perimeter
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#0284C7';
  ctx.shadowBlur = 10;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  // Contact wall flashes
  for (const f of wallFlashes) {
    ctx.strokeStyle = `rgba(253, 224, 71, ${clamp(f.intensity, 0, 1)})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    if (f.side === 'left') {
      ctx.moveTo(3, 0);
      ctx.lineTo(3, height);
    } else if (f.side === 'right') {
      ctx.moveTo(width - 3, 0);
      ctx.lineTo(width - 3, height);
    } else if (f.side === 'top') {
      ctx.moveTo(0, 3);
      ctx.lineTo(width, 3);
    } else if (f.side === 'bottom') {
      ctx.moveTo(0, height - 3);
      ctx.lineTo(width, height - 3);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Tesla Discharge Electric Aura
 * Dynamic, pulsing electric field around the player with crackling lightning arcs and energy sparks!
 */
function drawTeslaAura(ctx: CanvasRenderingContext2D, player: Player, time: number) {
  if (player.teslaLevel <= 0) return;

  const auraRadius = player.radius + 18 + player.teslaLevel * 6; // ~40px - 54px
  const teslaInterval = Math.max(1.0, 3.0 - player.teslaLevel * 0.6);
  const chargeRatio = Math.min(1, player.teslaTimer / teslaInterval);
  const pulse = Math.sin(time * (10 + chargeRatio * 14)) * 0.12 + 0.92;

  ctx.save();

  // 1. Shimmering electric outer ring
  ctx.strokeStyle = `rgba(0, 245, 255, ${0.45 + chargeRatio * 0.45})`;
  ctx.lineWidth = 2 + chargeRatio * 2;
  ctx.shadowColor = '#00F5FF';
  ctx.shadowBlur = 14 + chargeRatio * 16;
  ctx.setLineDash([6, 5]);
  ctx.lineDashOffset = -time * 60;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius * pulse, 0, Math.PI * 2);
  ctx.stroke();

  // 2. High-frequency electric crackle arcs (lightning tendrils jumping around circumference)
  const numArcs = 3 + player.teslaLevel;
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 1.8;
  ctx.shadowColor = '#38BDF8';
  ctx.shadowBlur = 8;
  ctx.setLineDash([]);
  for (let i = 0; i < numArcs; i++) {
    const baseAngle = (i * Math.PI * 2) / numArcs + time * 2.5;
    const arcSpan = 0.55 + Math.sin(time * 16 + i) * 0.15;
    const startA = baseAngle;
    const endA = baseAngle + arcSpan;

    ctx.beginPath();
    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const a = startA + (endA - startA) * (s / steps);
      const rJitter = Math.sin(time * 36 + i * 7 + s * 4) * 6;
      const r = auraRadius + rJitter;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 3. Orbiting plasma energy sparks
  const numOrbs = 2 + player.teslaLevel;
  for (let i = 0; i < numOrbs; i++) {
    const orbAngle = time * (3.2 + player.teslaLevel * 0.6) + (i * Math.PI * 2) / numOrbs;
    const ox = Math.cos(orbAngle) * (auraRadius + 1);
    const oy = Math.sin(orbAngle) * (auraRadius + 1);

    ctx.fillStyle = '#00F5FF';
    ctx.shadowColor = '#00F5FF';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ox, oy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Overcharge lightning bolts shooting when ready to discharge
  if (chargeRatio > 0.8) {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FDE047';
    ctx.shadowBlur = 12;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + time * 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (auraRadius - 4), Math.sin(a) * (auraRadius - 4));
      ctx.lineTo(Math.cos(a) * (auraRadius + 12), Math.sin(a) * (auraRadius + 12));
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Player core rendering with PERFECT timing ring guide, Tesla aura, & in-world HP
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  mousePos: { x: number; y: number },
  time: number,
  stats?: GameStats
) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // 1. Tesla Discharge Electric Aura
  drawTeslaAura(ctx, player, time);

  // 2. Timing Guide Rings (Crucial for visually timing parries)
  // PERFECT Guide Ring (R + 10 = 26px radius)
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, player.radius + 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // GREAT Guide Ring (R + 25 = 41px radius, faint)
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, player.radius + 25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 3. Active Parry Visual Shield Burst
  if (player.isParrying) {
    const progress = player.parryAge / 14;
    const ringRadius = player.radius + progress * 40;
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.strokeStyle =
      player.lastParryRating === 'PERFECT'
        ? '#FDE047'
        : player.lastParryRating === 'GREAT'
        ? '#38BDF8'
        : '#67E8F9';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3 * (1 - progress) + 1;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Parry cross flash
    if (progress < 0.4 && player.lastParryRating === 'PERFECT') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-ringRadius * 1.3, 0);
      ctx.lineTo(ringRadius * 1.3, 0);
      ctx.moveTo(0, -ringRadius * 1.3);
      ctx.lineTo(0, ringRadius * 1.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Invulnerability blink
  if (player.invulnerableTimer > 0 && Math.sin(time * 30) > 0) {
    ctx.globalAlpha = 0.4;
  }

  // 5. Directional Aim Pointer
  const aimAngle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
  ctx.save();
  ctx.rotate(aimAngle);

  // High-tech pointer chevron
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#38BDF8';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(player.radius + 6, -6);
  ctx.lineTo(player.radius + 14, 0);
  ctx.lineTo(player.radius + 6, 6);
  ctx.stroke();
  ctx.restore();

  // 6. Player Core Body
  const isDead = player.hp <= 0;
  // Outer energetic ring
  ctx.strokeStyle = isDead ? '#EF4444' : '#38BDF8';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = isDead ? '#DC2626' : '#0284C7';
  ctx.shadowBlur = isDead ? 22 : 12;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner solid core
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, player.radius);
  if (isDead) {
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.5, '#EF4444');
    grad.addColorStop(1, '#7F1D1D');
  } else {
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.6, '#38BDF8');
    grad.addColorStop(1, '#0369A1');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius - 2, 0, Math.PI * 2);
  ctx.fill();

  // Dramatic core fracture lightning cracks if dead
  if (isDead) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#F43F5E';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-player.radius * 0.7, -player.radius * 0.4);
    ctx.lineTo(player.radius * 0.1, -1);
    ctx.lineTo(player.radius * 0.65, player.radius * 0.6);
    ctx.moveTo(player.radius * 0.1, -1);
    ctx.lineTo(-player.radius * 0.4, player.radius * 0.65);
    ctx.stroke();
  }

  // 7. Mini In-World Health Bar with Numerical Display
  const hpRatio = clamp(player.hp / Math.max(1, player.maxHp), 0, 1);
  const barW = 34;
  const barH = 3.5;
  const barY = player.radius + 13;

  ctx.save();
  // Bar background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.9)';
  ctx.lineWidth = 1;
  ctx.fillRect(-barW / 2, barY, barW, barH);
  ctx.strokeRect(-barW / 2, barY, barW, barH);

  // Bar fill
  const fillColor = hpRatio < 0.25 ? '#EF4444' : hpRatio < 0.5 ? '#F59E0B' : '#06B6D4';
  ctx.fillStyle = fillColor;
  ctx.shadowColor = fillColor;
  ctx.shadowBlur = 6;
  ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);

  // Tiny HP text below bar
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = hpRatio < 0.25 ? '#F87171' : '#CBD5E1';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 0;
  ctx.fillText(`${Math.round(player.hp)}`, 0, barY + barH + 9);
  ctx.restore();

  // 5. Visual Score Multiplier Indicator (appears above player when chain > 5)
  if (stats && stats.chain > 5) {
    drawComboMultiplierAura(ctx, player, stats, time);
  }

  ctx.restore();
}

/**
 * Screen-Space Virtual Touch Joystick Overlay for mobile & tablet gameplay
 */
function drawVirtualJoystick(
  ctx: CanvasRenderingContext2D,
  joystick: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    radius: number;
  }
) {
  const { startX, startY, currentX, currentY, radius = 46 } = joystick;
  ctx.save();

  // Outer translucent cyber ring
  ctx.beginPath();
  ctx.arc(startX, startY, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.shadowColor = '#38BDF8';
  ctx.shadowBlur = 10;
  ctx.stroke();

  // 4 directional tick notches
  const tickLen = 6;
  [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((angle) => {
    ctx.beginPath();
    ctx.moveTo(startX + Math.cos(angle) * (radius - tickLen), startY + Math.sin(angle) * (radius - tickLen));
    ctx.lineTo(startX + Math.cos(angle) * (radius + tickLen), startY + Math.sin(angle) * (radius + tickLen));
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Connecting neon vector line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(currentX, currentY);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Glowing thumb knob
  ctx.beginPath();
  ctx.arc(currentX, currentY, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.shadowColor = '#38BDF8';
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  ctx.restore();
}

/**
 * Visual Score Multiplier Indicator on Screen (Player-anchored combo halo & overhead multiplier badge)
 * Appears dynamically when chain > 5 to give immediate feedback on combo strength
 */
function drawComboMultiplierAura(
  ctx: CanvasRenderingContext2D,
  player: Player,
  stats: GameStats,
  time: number
) {
  const chain = stats.chain;
  const multiplier = (1 + chain * 0.2).toFixed(1);
  const isGodlike = chain >= 15;
  const isHyper = chain >= 10;

  const primaryColor = isGodlike ? '#38BDF8' : isHyper ? '#E879F9' : '#F59E0B';
  const glowColor = isGodlike ? '#FDE047' : isHyper ? '#F43F5E' : '#FBBF24';
  const tierName = isGodlike ? 'OVERDRIVE' : isHyper ? 'HYPER' : 'SURGE';

  ctx.save();

  // 1. Orbiting Combo Plasma Sparks (number and speed scale with combo strength)
  const sparkCount = isGodlike ? 6 : isHyper ? 4 : 3;
  const orbitR = player.radius + 12;
  for (let i = 0; i < sparkCount; i++) {
    const angle = time * (3.5 + (isGodlike ? 2 : 0)) + (i * Math.PI * 2) / sparkCount;
    const sx = Math.cos(angle) * orbitR;
    const sy = Math.sin(angle) * orbitR;

    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Overhead Floating Multiplier Badge
  const badgeY = -player.radius - 24;
  const pulseScale = 1 + Math.sin(time * 8) * 0.05;

  ctx.save();
  ctx.translate(0, badgeY);
  ctx.scale(pulseScale, pulseScale);

  // Badge background pill
  const pillW = 76;
  const pillH = 17;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 12;

  // Rounded rectangle for pill
  const r = 8.5;
  ctx.beginPath();
  ctx.moveTo(-pillW / 2 + r, -pillH / 2);
  ctx.lineTo(pillW / 2 - r, -pillH / 2);
  ctx.arc(pillW / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-pillW / 2 + r, pillH / 2);
  ctx.arc(-pillW / 2 + r, 0, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Badge text
  ctx.shadowBlur = 8;
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = glowColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🔥 x${multiplier} ${tierName}`, 0, 0);

  ctx.restore();
  ctx.restore();
}

/**
 * Sling-shot dragging elastic band & 2-bounce trajectory raycast
 */
function drawSlingTrajectory(
  ctx: CanvasRenderingContext2D,
  player: Player,
  segments: RaycastSegment[],
  time: number
) {
  ctx.save();

  // 1. Elastic pull band from slingStart to current sling drag
  const pullVector = {
    x: player.x - player.slingCurrent.x,
    y: player.y - player.slingCurrent.y,
  };
  const pullDist = Math.hypot(pullVector.x, pullVector.y);

  if (pullDist > 10) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.slingCurrent.x, player.slingCurrent.y);
    ctx.stroke();

    // Pull drag anchor point
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(player.slingCurrent.x, player.slingCurrent.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. High-precision laser trajectory preview
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    ctx.save();

    const isFirst = i === 0;
    ctx.strokeStyle = isFirst ? '#FDE047' : '#38BDF8';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12;
    ctx.lineWidth = isFirst ? 2.5 : 1.5;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -time * 30;

    ctx.beginPath();
    ctx.moveTo(seg.startX, seg.startY);
    ctx.lineTo(seg.endX, seg.endY);
    ctx.stroke();

    // Wall bounce contact indicator
    if (seg.isWallHit) {
      ctx.fillStyle = '#FDE047';
      ctx.shadowColor = '#FDE047';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(seg.endX, seg.endY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Ripple ring
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(seg.endX, seg.endY, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Enemy hit contact prediction
    if (seg.isEnemyHit) {
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(seg.endX, seg.endY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Knockback arrow preview
      if (seg.enemyKnockbackVector) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(seg.endX, seg.endY);
        ctx.lineTo(
          seg.endX + seg.enemyKnockbackVector.x * 0.35,
          seg.endY + seg.enemyKnockbackVector.y * 0.35
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Bullet rendering with dynamic luminous motion trails
 */
function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();

  // Parried multi-point motion trail
  if (b.trail.length > 1) {
    ctx.save();
    ctx.strokeStyle = b.glowColor;
    ctx.shadowColor = b.glowColor;
    ctx.shadowBlur = 12;

    for (let i = 0; i < b.trail.length - 1; i++) {
      const p1 = b.trail[i];
      const p2 = b.trail[i + 1];
      const alpha = (i / b.trail.length) * 0.7;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = b.radius * (i / b.trail.length) * 1.8;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Boss Mega Core special appearance
  if (b.isBossCore) {
    ctx.shadowColor = b.glowColor;
    ctx.shadowBlur = 24;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Rally indicator
    if (b.rallyCount && b.rallyCount > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${b.rallyCount}/3`, b.x, b.y);
    }
    ctx.restore();
    return;
  }

  // Bullet core
  ctx.shadowColor = b.glowColor;
  ctx.shadowBlur = b.isParried ? 16 : 8;
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();

  // White laser core for parried bullets
  if (b.isParried) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Enemy rendering for the 4 distinct classes
 */
function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
  ctx.save();
  ctx.translate(e.x, e.y);

  // Flash white on hit
  if (e.hitFlashTimer > 0) {
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (e.type === 'SNIPE_ORB') {
    // 🔴 Snipe Orb: High precision crimson core with targeting ocular lens
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Eye looking towards aim
    ctx.save();
    ctx.rotate(e.angle);
    ctx.fillStyle = '#F87171';
    ctx.beginPath();
    ctx.arc(e.radius * 0.4, 0, e.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(e.radius * 0.55, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else if (e.type === 'GATLING_SENTINEL') {
    // 🟠 Gatling Sentinel: Industrial chassis with 3 revolving orange barrels
    ctx.shadowColor = '#F97316';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);

    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(-e.radius + 2, -e.radius + 2, (e.radius - 2) * 2, (e.radius - 2) * 2);

    // Revolving barrels
    ctx.save();
    const barrelRot = (e.burstCount ? time * 20 : time * 4);
    for (let i = 0; i < 3; i++) {
      const angle = barrelRot + (i * Math.PI * 2) / 3;
      const bx = Math.cos(angle) * (e.radius * 0.5);
      const by = Math.sin(angle) * (e.radius * 0.5);
      ctx.fillStyle = '#FB923C';
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

  } else if (e.type === 'RICOCHET_PRISM') {
    // 🟣 Ricochet Prism: Hexagonal hull + shimmering 120-degree frontal shield!
    ctx.save();
    ctx.rotate(e.angle);

    // Frontal reflective energy shield (only rendered if shieldArc > 0)
    if (e.shieldArc && e.shieldArc > 0) {
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 6, -e.shieldArc / 2, e.shieldArc / 2);
      ctx.stroke();
    }

    // Prism body
    ctx.shadowColor = '#A855F7';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#581C87';
    ctx.beginPath();
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const a = (i * Math.PI * 2) / sides;
      const x = Math.cos(a) * e.radius;
      const y = Math.sin(a) * e.radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Weak-point core in rear
    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-e.radius * 0.45, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

  } else if (e.type === 'GRAVITY_CORE') {
    // 🔵 Gravity Core (Boss): Giant pulsating sphere with orbiting energy nodes
    ctx.shadowColor = '#0284C7';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.stroke();

    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, e.radius);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.4, '#0284C7');
    grad.addColorStop(1, '#0C4A6E');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius - 2, 0, Math.PI * 2);
    ctx.fill();

    // 4 Orbiting defense nodes
    for (let i = 0; i < 4; i++) {
      const orbAngle = time * 2 + (i * Math.PI) / 2;
      const ox = Math.cos(orbAngle) * (e.radius + 16);
      const oy = Math.sin(orbAngle) * (e.radius + 16);
      ctx.fillStyle = '#38BDF8';
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Boss HP Bar above entity
    const barWidth = 60;
    const barHeight = 5;
    const hpRatio = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(-barWidth / 2, -e.radius - 18, barWidth, barHeight);
    ctx.fillStyle = hpRatio > 0.3 ? '#EC4899' : '#EF4444';
    ctx.fillRect(-barWidth / 2, -e.radius - 18, barWidth * hpRatio, barHeight);
  }

  ctx.restore();
}

/**
 * Screen-space tactical radar chevrons for enemies outside or near the screen bounds.
 * Guarantees enemies in expanded waves (Wave 3+) are instantly trackable on any PC monitor size or aspect ratio.
 */
function drawOffscreenEnemyIndicators(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number,
  arenaW: number,
  arenaH: number,
  zoom: number,
  enemies: Enemy[]
) {
  const margin = 26;
  const cx = screenWidth / 2;
  const cy = screenHeight / 2;

  for (const e of enemies) {
    if (e.hp <= 0) continue;

    // Convert enemy world position to current canvas screen coordinates
    const sx = (e.x - arenaW / 2) * zoom + cx;
    const sy = (e.y - arenaH / 2) * zoom + cy;

    const isOffscreen = sx < margin || sx > screenWidth - margin || sy < margin || sy > screenHeight - margin;
    if (!isOffscreen) continue;

    const clampedX = clamp(sx, margin, screenWidth - margin);
    const clampedY = clamp(sy, margin, screenHeight - margin);
    const angle = Math.atan2(sy - cy, sx - cx);

    const color = getEnemyColor(e.type);

    ctx.save();
    ctx.translate(clampedX, clampedY);
    ctx.rotate(angle);

    // Glowing tactical chevron
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

function getEnemyColor(type: string): string {
  switch (type) {
    case 'SNIPE_ORB':
      return '#EF4444';
    case 'GATLING_SENTINEL':
      return '#F97316';
    case 'RICOCHET_PRISM':
      return '#C084FC';
    case 'GRAVITY_CORE':
      return '#38BDF8';
    default:
      return '#EF4444';
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

