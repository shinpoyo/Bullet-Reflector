/**
 * Web Audio API Procedural Synthesizer for Bullet Reflector
 * Fully synthetic real-time audio with chain pitch scaling,
 * metallic harmonics, and sub-bass resonance.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    const saved = localStorage.getItem('bullet_reflector_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('bullet_reflector_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('bullet_reflector_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  // Non-repeating variation trackers to eliminate repetitive audio fatigue
  private lastPerfectVariation: number = -1;
  private lastGreatVariation: number = -1;
  private lastGoodVariation: number = -1;
  private lastWhiffVariation: number = -1;
  private lastEnemyHitVariation: number = -1;
  private lastExplosionVariation: number = -1;
  private lastEnemyHitTime: number = 0;

  /**
   * Selects the next variation index in a non-repeating fashion (no two identical sounds in a row)
   */
  private pickNextVariation(lastIndex: number, total: number): number {
    if (total <= 1) return 0;
    let next = Math.floor(Math.random() * (total - 1));
    if (next >= lastIndex) {
      next++;
    }
    return next;
  }

  /**
   * Enhanced Parry Sound with 4 distinct acoustic variations for PERFECT & GREAT,
   * 3 variations for GOOD & WHIFF, micro-pitch jitter, dynamic velocity, and combo scaling.
   */
  public playParry(rating: 'PERFECT' | 'GREAT' | 'GOOD' | 'WHIFF', chain: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Humanized micro-tuning jitter (+/- 2.5%) prevents machine-gun fatigue
    const microJitter = 1 + (Math.random() * 0.05 - 0.025);
    // Pitch shift for combo chain (semitone = 1.059463)
    const pitchMultiplier = Math.pow(1.059463, Math.min(chain, 24)) * microJitter;
    // Subtle velocity dynamics (+/- 5%)
    const vel = 0.95 + Math.random() * 0.1;

    if (rating === 'PERFECT') {
      const variation = this.pickNextVariation(this.lastPerfectVariation, 4);
      this.lastPerfectVariation = variation;

      if (variation === 0) {
        // Variation 0: "Crystal Resonator" (High metallic chime + harmonic sparkle + sub punch)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880 * pitchMultiplier, t);
        osc1.frequency.exponentialRampToValueAtTime(1760 * pitchMultiplier, t + 0.12);
        gain1.gain.setValueAtTime(0.7 * vel, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(t);
        osc1.stop(t + 0.28);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320 * pitchMultiplier, t);
        osc2.frequency.exponentialRampToValueAtTime(2640 * pitchMultiplier, t + 0.1);
        gain2.gain.setValueAtTime(0.5 * vel, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(t);
        osc2.stop(t + 0.25);

        // High crystal sparkle overtone
        const oscSparkle = this.ctx.createOscillator();
        const gainSparkle = this.ctx.createGain();
        oscSparkle.type = 'sine';
        oscSparkle.frequency.setValueAtTime(3520 * pitchMultiplier, t);
        gainSparkle.gain.setValueAtTime(0.25 * vel, t);
        gainSparkle.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        oscSparkle.connect(gainSparkle);
        gainSparkle.connect(this.masterGain);
        oscSparkle.start(t);
        oscSparkle.stop(t + 0.22);

        // Sub-bass punch
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(120, t);
        sub.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        subGain.gain.setValueAtTime(0.9 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.2);

      } else if (variation === 1) {
        // Variation 1: "Cyber Katana Clash" (Dual detuned metallic blades + transient click + kick)
        const oscBladeA = this.ctx.createOscillator();
        const gainBladeA = this.ctx.createGain();
        oscBladeA.type = 'sawtooth';
        oscBladeA.frequency.setValueAtTime(930 * pitchMultiplier, t);
        oscBladeA.frequency.exponentialRampToValueAtTime(2100 * pitchMultiplier, t + 0.14);
        gainBladeA.gain.setValueAtTime(0.45 * vel, t);
        gainBladeA.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        oscBladeA.connect(gainBladeA);
        gainBladeA.connect(this.masterGain);
        oscBladeA.start(t);
        oscBladeA.stop(t + 0.24);

        const oscBladeB = this.ctx.createOscillator();
        const gainBladeB = this.ctx.createGain();
        oscBladeB.type = 'triangle';
        oscBladeB.frequency.setValueAtTime(945 * pitchMultiplier, t); // Slight detune for metallic chorus
        oscBladeB.frequency.exponentialRampToValueAtTime(2080 * pitchMultiplier, t + 0.14);
        gainBladeB.gain.setValueAtTime(0.55 * vel, t);
        gainBladeB.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
        oscBladeB.connect(gainBladeB);
        gainBladeB.connect(this.masterGain);
        oscBladeB.start(t);
        oscBladeB.stop(t + 0.26);

        // Metallic transient clatter click
        this.playNoise(0.03, 0.35, 3200);

        // Snappy low kick
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(140, t);
        sub.frequency.exponentialRampToValueAtTime(45, t + 0.14);
        subGain.gain.setValueAtTime(0.85 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.18);

      } else if (variation === 2) {
        // Variation 2: "Plasma Deflector Surge" (Sci-fi swept bandpass energy + resonant bell)
        const oscPlasma = this.ctx.createOscillator();
        const gainPlasma = this.ctx.createGain();
        oscPlasma.type = 'triangle';
        oscPlasma.frequency.setValueAtTime(760 * pitchMultiplier, t);
        oscPlasma.frequency.exponentialRampToValueAtTime(1880 * pitchMultiplier, t + 0.13);
        gainPlasma.gain.setValueAtTime(0.65 * vel, t);
        gainPlasma.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
        oscPlasma.connect(gainPlasma);
        gainPlasma.connect(this.masterGain);
        oscPlasma.start(t);
        oscPlasma.stop(t + 0.26);

        const oscBell = this.ctx.createOscillator();
        const gainBell = this.ctx.createGain();
        oscBell.type = 'sine';
        oscBell.frequency.setValueAtTime(1520 * pitchMultiplier, t);
        oscBell.frequency.exponentialRampToValueAtTime(3040 * pitchMultiplier, t + 0.15);
        gainBell.gain.setValueAtTime(0.48 * vel, t);
        gainBell.gain.exponentialRampToValueAtTime(0.001, t + 0.27);
        oscBell.connect(gainBell);
        gainBell.connect(this.masterGain);
        oscBell.start(t);
        oscBell.stop(t + 0.27);

        // Warm rounded sub body
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(115, t);
        sub.frequency.exponentialRampToValueAtTime(38, t + 0.16);
        subGain.gain.setValueAtTime(0.9 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.22);

      } else {
        // Variation 3: "Harmonic Star Prism" (Tri-harmonic chord: root + major 3rd + 5th + octave sparkle)
        const baseF = 880 * pitchMultiplier;
        const notes = [baseF, baseF * 1.2599, baseF * 1.4983]; // A5, C#6, E6
        notes.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.8, t + 0.14);
          gain.gain.setValueAtTime((0.45 / (idx + 1)) * vel, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t);
          osc.stop(t + 0.28);
        });

        // High star overtone
        const star = this.ctx.createOscillator();
        const starGain = this.ctx.createGain();
        star.type = 'sine';
        star.frequency.setValueAtTime(2960 * pitchMultiplier, t);
        starGain.gain.setValueAtTime(0.25 * vel, t);
        starGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        star.connect(starGain);
        starGain.connect(this.masterGain);
        star.start(t);
        star.stop(t + 0.24);

        // Deep sub thump
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(130, t);
        sub.frequency.exponentialRampToValueAtTime(42, t + 0.15);
        subGain.gain.setValueAtTime(0.85 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.2);
      }

    } else if (rating === 'GREAT') {
      const variation = this.pickNextVariation(this.lastGreatVariation, 4);
      this.lastGreatVariation = variation;

      if (variation === 0) {
        // Variation 0: Clear bright deflect sweep (520Hz -> 1040Hz)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520 * pitchMultiplier, t);
        osc.frequency.exponentialRampToValueAtTime(1040 * pitchMultiplier, t + 0.1);
        gain.gain.setValueAtTime(0.6 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);

        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(90, t);
        sub.frequency.exponentialRampToValueAtTime(45, t + 0.1);
        subGain.gain.setValueAtTime(0.5 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.12);

      } else if (variation === 1) {
        // Variation 1: Kinetic Shield Snap (Dual harmonic snap + transient click)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587 * pitchMultiplier, t);
        osc1.frequency.exponentialRampToValueAtTime(1174 * pitchMultiplier, t + 0.09);
        gain1.gain.setValueAtTime(0.55 * vel, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(t);
        osc1.stop(t + 0.19);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880 * pitchMultiplier, t);
        gain2.gain.setValueAtTime(0.35 * vel, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(t);
        osc2.stop(t + 0.16);

        this.playNoise(0.02, 0.25, 2400);

        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(100, t);
        sub.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        subGain.gain.setValueAtTime(0.55 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.13);

      } else if (variation === 2) {
        // Variation 2: Titanium Echo (Metallic plate chime + detune body)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(494 * pitchMultiplier, t);
        osc.frequency.exponentialRampToValueAtTime(988 * pitchMultiplier, t + 0.11);
        gain.gain.setValueAtTime(0.58 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.22);

        const body = this.ctx.createOscillator();
        const bodyGain = this.ctx.createGain();
        body.type = 'sine';
        body.frequency.setValueAtTime(247 * pitchMultiplier, t);
        bodyGain.gain.setValueAtTime(0.35 * vel, t);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        body.connect(bodyGain);
        bodyGain.connect(this.masterGain);
        body.start(t);
        body.stop(t + 0.14);

        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(85, t);
        sub.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        subGain.gain.setValueAtTime(0.48 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.12);

      } else {
        // Variation 3: Prism Bounce (Ascending sweep + ping)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620 * pitchMultiplier, t);
        osc.frequency.exponentialRampToValueAtTime(1260 * pitchMultiplier, t + 0.09);
        gain.gain.setValueAtTime(0.58 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.18);

        const ping = this.ctx.createOscillator();
        const pingGain = this.ctx.createGain();
        ping.type = 'sine';
        ping.frequency.setValueAtTime(1860 * pitchMultiplier, t);
        pingGain.gain.setValueAtTime(0.28 * vel, t);
        pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        ping.connect(pingGain);
        pingGain.connect(this.masterGain);
        ping.start(t);
        ping.stop(t + 0.15);

        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(95, t);
        sub.frequency.exponentialRampToValueAtTime(45, t + 0.1);
        subGain.gain.setValueAtTime(0.5 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.12);
      }

    } else if (rating === 'GOOD') {
      const variation = this.pickNextVariation(this.lastGoodVariation, 3);
      this.lastGoodVariation = variation;

      if (variation === 0) {
        // Variation 0: Heavy Buckler (240Hz -> 180Hz)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240 * pitchMultiplier, t);
        osc.frequency.exponentialRampToValueAtTime(180 * pitchMultiplier, t + 0.08);
        gain.gain.setValueAtTime(0.4 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);

      } else if (variation === 1) {
        // Variation 1: Carbon Plate (Damped triangle knock)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(270 * pitchMultiplier, t);
        osc.frequency.exponentialRampToValueAtTime(155 * pitchMultiplier, t + 0.08);
        gain.gain.setValueAtTime(0.42 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.14);

        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(110, t);
        sub.frequency.exponentialRampToValueAtTime(55, t + 0.07);
        subGain.gain.setValueAtTime(0.4 * vel, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.1);

      } else {
        // Variation 2: Absorption Core (Dual tone 220Hz + 330Hz quick decay)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(220 * pitchMultiplier, t);
        osc1.frequency.exponentialRampToValueAtTime(160 * pitchMultiplier, t + 0.07);
        gain1.gain.setValueAtTime(0.35 * vel, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(t);
        osc1.stop(t + 0.13);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(330 * pitchMultiplier, t);
        gain2.gain.setValueAtTime(0.25 * vel, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(t);
        osc2.stop(t + 0.11);
      }

    } else if (rating === 'WHIFF') {
      const variation = this.pickNextVariation(this.lastWhiffVariation, 3);
      this.lastWhiffVariation = variation;

      if (variation === 0) {
        this.playWhoosh(0.1, 600, 200);
      } else if (variation === 1) {
        this.playWhoosh(0.12, 460, 140);
      } else {
        this.playWhoosh(0.09, 780, 260);
      }
    }
  }

  /**
   * Enhanced Enemy Hit Audio with 5 distinct acoustic synthesis profiles:
   * 0: Kinetic Snap & Pop
   * 1: Resonant Hollow Thud
   * 2: Armor Ping & Ricochet
   * 3: Plasma Sizzle Punch
   * 4: Blunt Impact Clack
   *
   * Includes micro-tuning, non-repeating shuffle, mass-based pitch scale,
   * critical/bank accent layers, and anti-clipping rate limiting.
   */
  public playEnemyHit(options?: {
    isCritical?: boolean;
    isBank?: boolean;
    mass?: number;
    enemyType?: string;
  }) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Anti-clipping throttle: if multiple enemies are hit within 35ms (e.g. laser penetration),
    // stagger the pitch slightly and reduce volume to prevent harsh distortion and ear fatigue
    let hitGainDamping = 1.0;
    let burstOffset = 1.0;
    if (t - this.lastEnemyHitTime < 0.035) {
      hitGainDamping = 0.72;
      burstOffset = 1.05; // Slightly higher frequency for layered distinction
    }
    this.lastEnemyHitTime = t;

    // Pick non-repeating variation
    const variation = this.pickNextVariation(this.lastEnemyHitVariation, 5);
    this.lastEnemyHitVariation = variation;

    // Scale base pitch for heavy enemies and bosses (larger mass = deeper, weightier sound)
    const mass = options?.mass || 1.0;
    const massPitchFactor = Math.max(0.62, 1 / Math.sqrt(mass));

    // Micro-tuning jitter (+/- 4%) so no two successive hits sound identical
    const microJitter = 1 + (Math.random() * 0.08 - 0.04);
    const pitchScale = massPitchFactor * microJitter * burstOffset;

    // Subtle velocity variance
    const vel = (0.92 + Math.random() * 0.16) * hitGainDamping;

    if (variation === 0) {
      // Variation 0: Kinetic Snap & Pop (Fast pitch dive triangle + micro click)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(460 * pitchScale, t);
      osc.frequency.exponentialRampToValueAtTime(110 * pitchScale, t + 0.045);
      gain.gain.setValueAtTime(0.55 * vel, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.06);

      const pop = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      pop.type = 'sine';
      pop.frequency.setValueAtTime(920 * pitchScale, t);
      popGain.gain.setValueAtTime(0.28 * vel, t);
      popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      pop.connect(popGain);
      popGain.connect(this.masterGain);
      pop.start(t);
      pop.stop(t + 0.025);

    } else if (variation === 1) {
      // Variation 1: Resonant Hollow Thud (Clean, round, non-fatiguing wooden/metallic body)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360 * pitchScale, t);
      osc.frequency.exponentialRampToValueAtTime(95 * pitchScale, t + 0.06);
      gain.gain.setValueAtTime(0.62 * vel, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.08);

      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(90 * pitchScale, t);
      sub.frequency.exponentialRampToValueAtTime(45, t + 0.07);
      subGain.gain.setValueAtTime(0.48 * vel, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.09);

    } else if (variation === 2) {
      // Variation 2: Armor Ping & Ricochet (Double metallic harmonics + crisp click)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(620 * pitchScale, t);
      gain1.gain.setValueAtTime(0.42 * vel, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(t);
      osc1.stop(t + 0.055);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1240 * pitchScale, t);
      gain2.gain.setValueAtTime(0.24 * vel, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + 0.045);

      this.playNoise(0.018, 0.22 * vel, 2400);

    } else if (variation === 3) {
      // Variation 3: Plasma Sizzle Punch (Filtered sawtooth sweep + soft noise crunch)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(560 * pitchScale, t);
      osc.frequency.exponentialRampToValueAtTime(140 * pitchScale, t + 0.05);
      gain.gain.setValueAtTime(0.38 * vel, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.065);

      this.playNoise(0.03, 0.28 * vel, 1600);

    } else {
      // Variation 4: Blunt Impact Clack (Heavy triangle knock + sub punch)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(290 * pitchScale, t);
      osc.frequency.exponentialRampToValueAtTime(75 * pitchScale, t + 0.07);
      gain.gain.setValueAtTime(0.58 * vel, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.08);

      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110 * pitchScale, t);
      sub.frequency.exponentialRampToValueAtTime(35, t + 0.06);
      subGain.gain.setValueAtTime(0.55 * vel, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.08);
    }

    // Extra Layer: Critical Hit Spark / Overtone (e.g. PERFECT parry bullet hit or max tackle)
    if (options?.isCritical) {
      const crit = this.ctx.createOscillator();
      const critGain = this.ctx.createGain();
      crit.type = 'sine';
      crit.frequency.setValueAtTime(1760 * pitchScale, t);
      crit.frequency.exponentialRampToValueAtTime(2200 * pitchScale, t + 0.06);
      critGain.gain.setValueAtTime(0.35 * vel, t);
      critGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      crit.connect(critGain);
      critGain.connect(this.masterGain);
      crit.start(t);
      crit.stop(t + 0.09);
    }

    // Extra Layer: Bank Shot Billiard Chime
    if (options?.isBank) {
      const bankChime = this.ctx.createOscillator();
      const bankGain = this.ctx.createGain();
      bankChime.type = 'triangle';
      bankChime.frequency.setValueAtTime(1175 * pitchScale, t);
      bankGain.gain.setValueAtTime(0.3 * vel, t);
      bankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      bankChime.connect(bankGain);
      bankGain.connect(this.masterGain);
      bankChime.start(t);
      bankChime.stop(t + 0.08);
    }
  }

  public playWhoosh(duration = 0.12, startFreq = 600, endFreq = 200) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  public playWallBounce() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    // Subtle variation in wall bounce frequency
    const freq = 680 * (0.95 + Math.random() * 0.1);
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.06);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playBankShotFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Ascending dual chime (1046Hz -> 1318Hz)
    [1046.5, 1318.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.4, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.35);
    });
  }

  public playEnemyExplosion(mass = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const variation = this.pickNextVariation(this.lastExplosionVariation, 3);
    this.lastExplosionVariation = variation;

    // Sub rumble with mass scaling
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = variation === 1 ? 'sawtooth' : 'triangle';
    const baseFreq = (140 + variation * 20) / mass;
    sub.frequency.setValueAtTime(baseFreq, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.25);
    subGain.gain.setValueAtTime(0.6 * Math.min(mass, 2), t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.3);

    // Crunch noise with varying frequency
    const noiseFreq = 1100 + variation * 250;
    this.playNoise(0.18, 0.4, noiseFreq);
  }

  public playSlingDash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.18);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playExpCollect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.05);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playLevelUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Ascending arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.07);
      gain.gain.setValueAtTime(0.4, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.4);
    });
  }

  public playComboSurge(tier: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Ascending power-up chord for combo surge (Tier 1: 5+, Tier 2: 10+, Tier 3: 15+)
    const baseFreq = tier >= 3 ? 659.25 : tier >= 2 ? 587.33 : 523.25;
    const chords = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2.0];
    chords.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.045);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, t + i * 0.045 + 0.14);
      gain.gain.setValueAtTime(0.35, t + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.045);
      osc.stop(t + i * 0.045 + 0.35);
    });
  }

  public playTeslaZap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playEnemyFire() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playTelegraphFlash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1240, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playBossRally(rallyCount: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Ping pong paddle strike sound scaling up
    const baseFreq = 780 * Math.pow(1.15, rallyCount);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.04);
    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playPlayerHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.28);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playPlayerDefeat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Sub-bass heavy seismic implosion
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(20, t + 1.2);
    subGain.gain.setValueAtTime(0.9, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 1.2);

    // Resonant power failure down-sweep
    const powerDown = this.ctx.createOscillator();
    const pdGain = this.ctx.createGain();
    powerDown.type = 'sawtooth';
    powerDown.frequency.setValueAtTime(480, t);
    powerDown.frequency.exponentialRampToValueAtTime(30, t + 0.9);
    pdGain.gain.setValueAtTime(0.5, t);
    pdGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    powerDown.connect(pdGain);
    pdGain.connect(this.masterGain);
    powerDown.start(t);
    powerDown.stop(t + 0.9);

    // Dissonant digital shatter noise
    this.playNoise(0.5, 0.45, 800);
  }

  private playNoise(duration: number, volume: number, filterFreq = 1200) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }
}

export const soundManager = new SoundManager();
