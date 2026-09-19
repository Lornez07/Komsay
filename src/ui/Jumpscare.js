/**
 * Jumpscare Easter Egg for cs-4 (Lorenz F. Estrella)
 * Triggers every time his frame is clicked, synced with camera zoom.
 * Now with scary face overlay + authentic scream via Web Audio.
 */
export class Jumpscare {
  constructor() {
    this.isActive = false;
    this.audioCtx = null;
    this.createElement();
    this.preloadScareImage();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'jumpscare-overlay';
    this.element.className = 'jumpscare-overlay hidden';
    this.element.innerHTML = `
      <div class="jumpscare-bg"></div>
      <img class="jumpscare-img jumpscare-base" src="/classmates/estrella.jpg" alt="Jumpscare Base" />
      <img class="jumpscare-img jumpscare-scary-face" src="/jumpscare/scary-face.svg" alt="Scary Face" />
      <div class="jumpscare-glitch"></div>
      <div class="jumpscare-vignette"></div>
      <div class="jumpscare-blood-border"></div>
      <div class="jumpscare-text">GET SCARED! 😱</div>
    `;
    document.body.appendChild(this.element);
    this.baseImg = this.element.querySelector('.jumpscare-base');
    this.scaryImg = this.element.querySelector('.jumpscare-scary-face');
  }

  preloadScareImage() {
    // Preload scary face to avoid delay on first trigger
    const img = new Image();
    img.src = '/jumpscare/scary-face.svg';
  }

  ensureAudio() {
    if (this.audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.audioCtx = new AC();
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = i * 2 / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  async playScareSound() {
    this.ensureAudio();
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
    } catch {}

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Master gain + distortion chain -> destination
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.gain.linearRampToValueAtTime(1.0, now + 0.6);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);

    const distortion = ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(180);
    distortion.oversample = '4x';

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(0.8, now);

    distortion.connect(filter).connect(masterGain).connect(ctx.destination);

    // Try to play real scream file first if exists, else synth
    const tryRealFile = async () => {
      try {
        const resp = await fetch('/jumpscare/scream.mp3');
        if (!resp.ok) throw new Error('no file');
        const buf = await resp.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(buf);
        const src = ctx.createBufferSource();
        src.buffer = audioBuf;
        src.connect(distortion);
        src.start(now);
        return true;
      } catch {
        return false;
      }
    };

    const hasReal = await tryRealFile();
    if (hasReal) {
      // Also add synth underlay for punch even with real file
      this.playSynthLayers(ctx, now, distortion, 0.35);
      return;
    }

    // Pure synth scream if no file
    this.playSynthLayers(ctx, now, distortion, 1.0);
  }

  playSynthLayers(ctx, now, outNode, volumeScale) {
    // Layer 1: Deep demonic roar (sawtooth 140 -> 40)
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(145, now);
    osc1.frequency.exponentialRampToValueAtTime(38, now + 0.55);
    // Add vibrato to roar
    const lfo1 = ctx.createOscillator();
    const lfoG1 = ctx.createGain();
    lfo1.frequency.setValueAtTime(22, now);
    lfoG1.gain.setValueAtTime(18, now);
    lfo1.connect(lfoG1).connect(osc1.frequency);
    lfo1.start(now); lfo1.stop(now + 0.6);
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.85 * volumeScale, now + 0.015);
    g1.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
    osc1.connect(g1).connect(outNode);
    osc1.start(now); osc1.stop(now + 0.65);

    // Layer 2: Classic female scream (square 950 -> 1800 -> 700)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(680, now);
    osc2.frequency.linearRampToValueAtTime(1450, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(520, now + 0.55);
    const lfo2 = ctx.createOscillator();
    const lfoG2 = ctx.createGain();
    lfo2.frequency.setValueAtTime(35, now);
    lfoG2.gain.setValueAtTime(90, now);
    lfo2.connect(lfoG2).connect(osc2.frequency);
    lfo2.start(now); lfo2.stop(now + 0.6);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.55 * volumeScale, now + 0.01);
    g2.gain.setValueAtTime(0.55 * volumeScale, now + 0.22);
    g2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc2.connect(g2).connect(outNode);
    osc2.start(now); osc2.stop(now + 0.7);

    // Layer 3: High shriek (sine 2100 -> 3200)
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2100, now);
    osc3.frequency.exponentialRampToValueAtTime(3100, now + 0.12);
    osc3.frequency.exponentialRampToValueAtTime(900, now + 0.45);
    g3.gain.setValueAtTime(0, now);
    g3.gain.linearRampToValueAtTime(0.32 * volumeScale, now + 0.02);
    g3.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc3.connect(g3).connect(outNode);
    osc3.start(now); osc3.stop(now + 0.5);

    // Layer 4: Breath/noise burst for air
    const bufSize = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.8) * 0.9;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nGain = ctx.createGain();
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.setValueAtTime(1500, now);
    nGain.gain.setValueAtTime(0.5 * volumeScale, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    noise.connect(nFilter).connect(nGain).connect(outNode);
    noise.start(now);

    // Layer 5: Impact hit at start
    const oscHit = ctx.createOscillator();
    const gHit = ctx.createGain();
    oscHit.type = 'triangle';
    oscHit.frequency.setValueAtTime(60, now);
    oscHit.frequency.exponentialRampToValueAtTime(25, now + 0.2);
    gHit.gain.setValueAtTime(1.0 * volumeScale, now);
    gHit.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    oscHit.connect(gHit).connect(outNode);
    oscHit.start(now); oscHit.stop(now + 0.25);
  }

  trigger() {
    if (this.isActive) return;
    this.isActive = true;

    this.element.classList.remove('hidden');
    void this.element.offsetWidth;
    this.element.classList.add('active');

    document.body.classList.add('jumpscare-shake');

    // Play scream immediately (inside user gesture)
    this.playScareSound();

    if (navigator.vibrate) navigator.vibrate([180, 30, 180, 30, 250]);

    // Hide after 950ms (classic jumpscare length)
    setTimeout(() => {
      this.element.classList.remove('active');
      document.body.classList.remove('jumpscare-shake');
      setTimeout(() => {
        this.element.classList.add('hidden');
        this.isActive = false;
      }, 220);
    }, 950);
  }
}
