import { Bullet, Enemy, FloatingText, Particle, Player, RaycastSegment, Shockwave, WallFlash } from '../types/game';

interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  shockwaves: Shockwave[];
  floatingTexts: FloatingText[];
  wallFlashes: WallFlash[];
  trajectorySegments: RaycastSegment[];
  mousePos: { x: number; y: number };
  screenShake: number;
  time: number;
}

export function renderGameScene({
  ctx,
  width,
  height,
  player,
  bullets,
  enemies,
  particles,
  shockwaves,
  floatingTexts,
  wallFlashes,
  trajectorySegments,
  mousePos,
  screenShake,
  time,
}: RenderOptions) {
  ctx.save();

  // Apply screen shake
  if (screenShake > 0.05) {
    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;
    ctx.translate(shakeX, shakeY);
  }

  // 1. Background arena
  ctx.fillStyle = '#060913';
  ctx.fillRect(0, 0, width, height);

  // Subtle cybernetic arena grid
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Center subtle circular arena markings
  const cx = width / 2;
  const cy = height / 2;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 260, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Perimeter Walls with Dynamic Contact Flash
  drawNeonArenaWalls(ctx, width, height, wallFlashes);

  // 3. Shockwaves (rendered behind entities)
  for (const s of shockwaves) {
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = Math.max(0, s.alpha);
    ctx.lineWidth = s.lineWidth;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Enemy Telegraph Lines
  for (const enemy of enemies) {
    if (enemy.type === 'SNIPE_ORB' && enemy.isTelegraphing) {
      // Snipe Orb flashing white telegraph laser
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

  // 5. Sling-shot Drag Trajectory & 2-Bounce Raycasting Laser
  if (player.isAimingSling && trajectorySegments.length > 0) {
    drawSlingTrajectory(ctx, player, trajectorySegments, time);
  }

  // 6. Particles
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

  // 7. Bullets (with trails)
  for (const b of bullets) {
    drawBullet(ctx, b);
  }

  // 8. Enemies
  for (const enemy of enemies) {
    drawEnemy(ctx, enemy, time);
  }

  // 9. Player Core & Timing Rings
  drawPlayer(ctx, player, mousePos, time);

  // 10. Floating Combat Text
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
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#0284C7';
  ctx.shadowBlur = 8;
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
 * Player core rendering with PERFECT timing ring guide & parry aura
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  mousePos: { x: number; y: number },
  time: number
) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // 1. Timing Guide Rings (Crucial for players to visually time parries!)
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

  // 2. Active Parry Visual Shield Burst
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

  // 3. Invulnerability blink
  if (player.invulnerableTimer > 0 && Math.sin(time * 30) > 0) {
    ctx.globalAlpha = 0.4;
  }

  // 4. Directional Aim Pointer
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

  // 5. Player Core Body
  // Outer energetic ring
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#0284C7';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner solid core
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, player.radius);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.6, '#38BDF8');
  grad.addColorStop(1, '#0369A1');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius - 2, 0, Math.PI * 2);
  ctx.fill();

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

  // 1. Elastic pull band (rubber band between player and drag point)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.slingCurrent.x, player.slingCurrent.y);
  ctx.stroke();

  // Anchor dot at sling current
  ctx.fillStyle = '#38BDF8';
  ctx.shadowColor = '#38BDF8';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(player.slingCurrent.x, player.slingCurrent.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // 2. Trajectory Laser Raycasting Segments
  ctx.setLineDash([]);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isFirstSegment = i === 0;

    // Glowing laser beam
    ctx.save();
    ctx.strokeStyle = isFirstSegment ? '#FDE047' : '#38BDF8';
    ctx.lineWidth = isFirstSegment ? 2.5 : 1.5;
    ctx.shadowColor = isFirstSegment ? '#FDE047' : '#38BDF8';
    ctx.shadowBlur = 10;
    ctx.globalAlpha = Math.max(0.3, 1 - i * 0.25);

    ctx.beginPath();
    ctx.moveTo(seg.startX, seg.startY);
    ctx.lineTo(seg.endX, seg.endY);
    ctx.stroke();

    // Hit markers
    if (seg.isWallHit) {
      // Wall ricochet point
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(seg.endX, seg.endY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (seg.isEnemyHit) {
      // Enemy contact point & Billiard Knockback Vectors!
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(seg.endX, seg.endY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Enemy projected knockback arrow (white dashed line as requested in spec)
      if (seg.enemyKnockbackVector) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(seg.endX, seg.endY);
        ctx.lineTo(
          seg.endX + seg.enemyKnockbackVector.x,
          seg.endY + seg.enemyKnockbackVector.y
        );
        ctx.stroke();
      }

      // Player deflection arrow (yellow solid line as requested in spec)
      if (seg.deflectionVector) {
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(seg.endX, seg.endY);
        ctx.lineTo(
          seg.endX + seg.deflectionVector.x,
          seg.endY + seg.deflectionVector.y
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Bullet rendering with motion trails & glowing laser styling
 */
function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();

  // Draw trail
  if (b.trail.length > 1) {
    ctx.save();
    for (let i = 0; i < b.trail.length - 1; i++) {
      const p1 = b.trail[i];
      const p2 = b.trail[i + 1];
      const progress = i / b.trail.length;
      ctx.strokeStyle = b.glowColor;
      ctx.lineWidth = b.radius * progress * 1.5;
      ctx.globalAlpha = progress * 0.6;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Boss Mega Core special appearance
  if (b.isBossCore) {
    ctx.save();
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
    // 🟠 Gatling Sentinel: Industrial rotating triple-barrel turret
    ctx.shadowColor = '#F97316';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#7C2D12';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Rotating barrels
    ctx.save();
    ctx.rotate(e.angle);
    const barrelRot = e.burstCount ? time * 20 : 0;
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

    // Frontal reflective energy shield
    if (e.shieldArc) {
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

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
