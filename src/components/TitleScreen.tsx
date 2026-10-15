import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Disc3, Target, Sparkles, ChevronRight, Play } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface TitleScreenProps {
  onStart: () => void;
  highScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, highScore }) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [activeTab, setActiveTab] = useState<'rules' | 'enemies' | 'controls'>('rules');
  const bgCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Floating particles & ricochet lasers
    const nodes = Array.from({ length: 30 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60,
      radius: 1.5 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#38BDF8' : '#FDE047',
    }));

    let last = performance.now();
    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      // Subtle arena grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.3)';
      ctx.lineWidth = 1;
      const step = 45;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Move & connect nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 130) * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 md:p-12 text-slate-100 select-none overflow-y-auto">
      {/* Background ambient canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none -z-10" />
      {/* Top Bar info */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold tracking-wider">BULLET REFLECTOR</span>
          <span>·</span>
          <span>HIGH SCORE: <strong className="text-amber-400 tabular-nums">{highScore}</strong></span>
        </div>
        <button
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors cursor-pointer"
          aria-label="Toggle Audio"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
        </button>
      </div>

      {/* Main Hero & Title Lockup */}
      <div className="flex flex-col items-center text-center max-w-2xl my-auto">
        {/* Inline SVG Title Lockup */}
        <div className="relative mb-6">
          <svg className="w-72 sm:w-96 md:w-[480px] h-auto drop-shadow-[0_0_25px_rgba(56,189,248,0.45)]" viewBox="0 0 520 110" fill="none">
            {/* Background Hex Pattern */}
            <path d="M20 55 L35 25 L65 25 L80 55 L65 85 L35 85 Z" stroke="#0284C7" strokeWidth="1.5" opacity="0.4" />
            <path d="M440 55 L455 25 L485 25 L500 55 L485 85 L455 85 Z" stroke="#FDE047" strokeWidth="1.5" opacity="0.4" />
            
            {/* Title Glow Text */}
            <text
              x="260"
              y="58"
              textAnchor="middle"
              className="font-black text-4xl sm:text-5xl tracking-widest fill-transparent stroke-cyan-400"
              strokeWidth="4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              BULLET REFLECTOR
            </text>
            <text
              x="260"
              y="58"
              textAnchor="middle"
              className="font-black text-4xl sm:text-5xl tracking-widest fill-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              BULLET REFLECTOR
            </text>
            {/* Sub-strip line */}
            <line x1="80" y1="78" x2="440" y2="78" stroke="url(#paint_grad)" strokeWidth="2" />
            <defs>
              <linearGradient id="paint_grad" x1="80" y1="0" x2="440" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="0.5" stopColor="#FDE047" />
                <stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          <p className="text-cyan-400 font-medium text-xs sm:text-sm tracking-widest uppercase mt-2">
            超精密アングル反射 × ノンストップ・ジャストパリィ弾幕アクション
          </p>
        </div>

        {/* Primary Start CTA */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base sm:text-lg font-bold tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 rounded-lg shadow-[0_0_30px_rgba(56,189,248,0.5)] hover:shadow-[0_0_45px_rgba(253,224,71,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>START OPERATION</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Flat control-hint line */}
        <p className="mt-4 text-xs font-mono text-slate-400">
          Press <strong className="text-slate-200">Space</strong> or <strong className="text-slate-200">Enter</strong> to start
        </p>

        {/* Mechanics Tabs */}
        <div className="w-full mt-8 bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left max-w-xl">
          <div className="flex border-b border-slate-800 mb-3 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'rules' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              PARRY TIMING
            </button>
            <button
              onClick={() => setActiveTab('enemies')}
              className={`px-3 py-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'enemies' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              TRICK SHOTS
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-3 py-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'controls' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              CONTROLS
            </button>
          </div>

          {activeTab === 'rules' && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">⚡ PERFECT (0-4F):</span>
                <span>3.5x Speed & 3.0x Damage. Piercing laser. <strong>0s Cooldown Reset</strong>! Aim with your cursor.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sky-400 font-bold shrink-0">✨ GREAT (5-9F):</span>
                <span>2.4x Speed & 2.0x Damage. Impact shockwave. <strong>0s Cooldown Reset</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">🛡️ GOOD (10-14F):</span>
                <span>1.5x Speed deflect. 0.12s recovery. Zero movement lock!</span>
              </div>
            </div>
          )}

          {activeTab === 'enemies' && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">🎱 BANK SHOTS:</span>
                <span>Bounce bullets or knocked enemies off walls before striking foes for <strong>x2.0 Bank Shot Bonus</strong>!</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-fuchsia-400 font-bold shrink-0">🟣 RICOCHET PRISM:</span>
                <span>Invulnerable to frontal strikes! Bank shot into its rear or tackle another enemy into its flank.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-400 font-bold shrink-0">🔵 TABLE TENNIS RALLY:</span>
                <span>PERFECT-parry the Boss Mega Core 3 times in a row to trigger overload detonation!</span>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Aim / Deflect Angle:</span>
                <span className="font-mono text-cyan-300">Mouse Cursor / Touch Pointer</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hyper Just-Parry:</span>
                <span className="font-mono text-cyan-300">Space · Right-Click · Z · Screen PARRY Button</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sling-shot Dash (0.25x Time):</span>
                <span className="font-mono text-cyan-300">Drag & Release Mouse / Touch Screen</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Micro Nudge Movement:</span>
                <span className="font-mono text-cyan-300">WASD or Arrow Keys</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom control-hint line */}
      <div className="text-center text-xs font-mono text-slate-500">
        WASD Move · Space / Right-Click Parry · Drag Sling Dash · Esc Pause
      </div>
    </div>
  );
};
