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
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
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
    const nodes = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50,
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
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
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
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 110) * 0.2})`;
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
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 md:p-8 text-slate-100 select-none overflow-hidden max-h-[100dvh]">
      {/* Background ambient canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none -z-10" />

      {/* Top Bar info */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-cyan-400 font-semibold tracking-wider">BULLET REFLECTOR</span>
          <span className="hidden sm:inline">·</span>
          <span className="bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded text-[10px] sm:text-xs">
            HIGH: <strong className="text-amber-400 tabular-nums">{highScore.toLocaleString()}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-cyan-300 transition-colors cursor-pointer text-[10px] sm:text-xs"
            aria-label="Open Guide"
          >
            <span>📖</span>
            <span>GUIDE</span>
          </button>
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors cursor-pointer text-[10px] sm:text-xs"
            aria-label="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{isMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>
        </div>
      </div>

      {/* Main Hero & Title Lockup (Vertically centered, compact on mobile) */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto my-auto py-2 sm:py-4">
        {/* Title Lockup */}
        <div className="relative mb-3 sm:mb-5">
          <svg className="w-60 sm:w-80 md:w-[460px] h-auto drop-shadow-[0_0_25px_rgba(56,189,248,0.45)]" viewBox="0 0 520 110" fill="none">
            <path d="M20 55 L35 25 L65 25 L80 55 L65 85 L35 85 Z" stroke="#0284C7" strokeWidth="1.5" opacity="0.4" />
            <path d="M440 55 L455 25 L485 25 L500 55 L485 85 L455 85 Z" stroke="#FDE047" strokeWidth="1.5" opacity="0.4" />
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
            <line x1="80" y1="78" x2="440" y2="78" stroke="url(#paint_grad)" strokeWidth="2" />
            <defs>
              <linearGradient id="paint_grad" x1="80" y1="0" x2="440" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="0.5" stopColor="#FDE047" />
                <stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          <p className="text-cyan-400 font-medium text-[11px] sm:text-xs md:text-sm tracking-wider uppercase mt-1">
            超精密アングル反射 × ノンストップ・ジャストパリィ
          </p>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-2.5 px-7 sm:px-9 py-3 sm:py-3.5 text-sm sm:text-base font-black tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:shadow-[0_0_35px_rgba(253,224,71,0.7)] active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
          <span>START OPERATION</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Platform-adaptive Control Hint */}
        <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-mono text-slate-400">
          <span className="sm:hidden text-cyan-300 font-semibold">🕹️ 画面左ドラッグで360°移動 · 🚀 DASH · ⚡ PARRY</span>
          <span className="hidden sm:inline">
            Press <strong className="text-cyan-300">Space</strong> / <strong className="text-cyan-300">Enter</strong> to start · <strong className="text-slate-200">WASD</strong> Move · <strong className="text-slate-200">Shift</strong> Dash · <strong className="text-slate-200">Space / R-Click</strong> Parry
          </span>
        </div>

        {/* Feature Highlights (Visible on all devices without scrolling) */}
        <div className="grid grid-cols-3 gap-2 mt-3 sm:mt-5 max-w-lg w-full text-center">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex flex-col items-center">
            <span className="text-base sm:text-lg">⚡</span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-300 mt-0.5">JUST PARRY</span>
            <span className="text-[9px] text-slate-400 hidden sm:block">0-4F 直撃ホーミング</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex flex-col items-center">
            <span className="text-base sm:text-lg">🔥</span>
            <span className="text-[10px] sm:text-xs font-bold text-cyan-300 mt-0.5">5+ CHAIN SURGE</span>
            <span className="text-[9px] text-slate-400 hidden sm:block">最大x4.0+ 倍率インジケーター</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex flex-col items-center">
            <span className="text-base sm:text-lg">🎱</span>
            <span className="text-[10px] sm:text-xs font-bold text-yellow-300 mt-0.5">BANK SHOTS</span>
            <span className="text-[9px] text-slate-400 hidden sm:block">壁反射でダメージ倍増</span>
          </div>
        </div>

        {/* Large screen mechanics tabs (hidden on small mobile to guarantee 1-screen fit) */}
        <div className="hidden md:block w-full mt-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-left max-w-lg">
          <div className="flex border-b border-slate-800 mb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1 cursor-pointer border-b-2 ${
                activeTab === 'rules' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              PARRY TIMING
            </button>
            <button
              onClick={() => setActiveTab('enemies')}
              className={`px-3 py-1 cursor-pointer border-b-2 ${
                activeTab === 'enemies' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              MULTIPLIER & TRICKS
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-3 py-1 cursor-pointer border-b-2 ${
                activeTab === 'controls' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              CONTROLS
            </button>
          </div>

          {activeTab === 'rules' && (
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold shrink-0">⚡ PERFECT (0-4F):</span>
                <span>3.6x Speed & 3.2x Dmg. 直撃ホーミング＋CT即時リセット！</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold shrink-0">✨ GREAT (5-9F):</span>
                <span>2.4x Speed & 2.0x Dmg. 着弾ショックウェーブ。CT即時リセット。</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold shrink-0">🛡️ GOOD (10-14F):</span>
                <span>1.5x Speed 反射。硬直ゼロでテンポよく迎撃可能！</span>
              </div>
            </div>
          )}

          {activeTab === 'enemies' && (
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-start gap-1.5">
                <span className="text-amber-300 font-bold shrink-0">🔥 MULTIPLIER SURGE:</span>
                <span>チェーン <strong>5回以上</strong> で倍率インジケーター出現！最大 <strong>x4.0+ OVERDRIVE</strong>！</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-yellow-400 font-bold shrink-0">🎱 BANK SHOTS:</span>
                <span>弾や敵を壁に跳ね返すと <strong>x2.0〜x4.4 バンクショットボーナス</strong>！</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold shrink-0">💎 EXP＆スキル:</span>
                <span>敵を倒してEXP回収！分裂弾や放電オーラなど8種のスキルを獲得。</span>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Aim / Deflect:</span>
                <span className="font-mono text-cyan-300">Mouse Cursor / Touch Pointer</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hyper Just-Parry:</span>
                <span className="font-mono text-cyan-300">Space · Right-Click · Screen Button</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sling Dash (0.25x Time):</span>
                <span className="font-mono text-cyan-300">Drag & Release Mouse / Touch Screen</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom control-hint line (Fits within 1 screen) */}
      <div className="text-center text-[10px] sm:text-xs font-mono text-slate-500 pb-1">
        <span className="sm:hidden">スマホ & PC両対応 · 1画面完結型アーケード</span>
        <span className="hidden sm:inline">WASD Move · Space / R-Click Parry · Drag Sling Dash · R Quick Retry</span>
      </div>

      {/* Full Guide Modal (for mobile or desktop popup) */}
      {showGuideModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono font-bold text-slate-100 text-sm sm:text-base">TACTICAL COMBAT GUIDE</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <span>⚡</span> パリィタイミングと効果 (0-14F)
                </h4>
                <ul className="space-y-1 list-disc list-inside text-slate-300 pl-1">
                  <li><strong className="text-amber-300">PERFECT (0-4F):</strong> 弾速3.6倍・威力3.2倍。敵へ直撃ホーミング＋クールダウン即時0秒リセット！</li>
                  <li><strong className="text-sky-300">GREAT (5-9F):</strong> 弾速2.4倍・威力2.0倍。着弾ショックウェーブ＋クールダウン即時0秒リセット！</li>
                  <li><strong className="text-cyan-300">GOOD (10-14F):</strong> 弾速1.5倍反射。硬直なしで連続反撃！</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <span>🔥</span> スコア倍率インジケーター (5コンボ以上)
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  敵を倒すかジャストパリィでチェーンが <strong>5回</strong> を超えると、画面上部にスコア倍率インジケーターが発動！
                  <br />・チェーン 5-9: <strong>COMBO SURGE (x2.0〜)</strong>
                  <br />・チェーン 10-14: <strong>HYPER DRIVE (x3.0〜)</strong>
                  <br />・チェーン 15+: <strong>GODLIKE OVERDRIVE (x4.0+ 最大倍率)</strong>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-yellow-300 mb-1 flex items-center gap-1.5">
                  <span>🎱</span> バンクショット (壁反射ボーナス)
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  反射した弾や突撃した敵を壁に跳ね返してから撃破すると、<strong>x2.0〜x4.4のボーナススコア</strong> 獲得！
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <span>📱</span> 操作方法 (スマホ & PC両対応)
                </h4>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div>・<strong>スマホ:</strong> 画面ドラッグでスリングダッシュ (時間0.25倍速) / 右下の大きなPARRYボタンで弾反射</div>
                  <div>・<strong>PC:</strong> WASD移動 / マウスドラッグでスリング / Spaceまたは右クリックでパリィ</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider cursor-pointer"
            >
              GOT IT (了解)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
