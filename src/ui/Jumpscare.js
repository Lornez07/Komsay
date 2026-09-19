/**
 * Jumpscare Easter Egg for cs-4 (Lorenz F. Estrella)
 * Triggers every time his frame is clicked, synced with camera zoom.
 * Now with custom scary image + 2.5s shouting scream.
 */
export class Jumpscare {
  constructor() {
    this.isActive = false;
    this.audioCtx = null;
    this.SCARY_IMAGE = '/jumpscare/scary-custom.jpg';
    this.SCREAM_FILE = '/jumpscare/scream.mp3';
    this.DURATION = 2500; // 2.5s as requested
    this.createElement();
    this.preloadAssets();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'jumpscare-overlay';
    this.element.className = 'jumpscare-overlay hidden';
    this.element.innerHTML = `
      <div class="jumpscare-bg"></div>
      <img class="jumpscare-img jumpscare-base" src="/classmates/estrella.jpg" alt="Jumpscare Base" />
      <img class="jumpscare-img jumpscare-scary-face" src="${this.SCARY_IMAGE}" alt="Scary Face" onerror="this.src='/jumpscare/scary-face.svg'" />
      <div class="jumpscare-glitch"></div>
      <div class="jumpscare-vignette"></div>
      <div class="jumpscare-blood-border"></div>
      <div class="jumpscare-text">GET SCARED! 😱</div>
    `;
    document.body.appendChild(this.element);
    this.baseImg = this.element.querySelector('.jumpscare-base');
    this.scaryImg = this.element.querySelector('.jumpscare-scary-face');
  }

  preloadAssets() {
    const img = new Image();
    img.src = this.SCARY_IMAGE;
    // Also preload audio
    fetch(this.SCREAM_FILE).catch(()=>{});
  }

  ensureAudio() {
    if (this.audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.audioCtx = new AC();
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 80;
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
    const dur = this.DURATION / 1000;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.gain.setValueAtTime(1.0, now + dur - 0.35);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    const distortion = ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(160);
    distortion.oversample = '4x';

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1150, now);
    filter.Q.setValueAtTime(0.9, now);

    distortion.connect(filter).connect(masterGain).connect(ctx.destination);

    const tryRealFile = async () => {
      try {
        const resp = await fetch(this.SCREAM_FILE + '?t=' + Date.now());
        if (!resp.ok) throw new Error('no file');
        const buf = await resp.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(buf.slice(0));
        const src = ctx.createBufferSource();
        src.buffer = audioBuf;
        // Slight playbackRate randomization for extra fear
        src.playbackRate.setValueAtTime(1.0, now);
        src.connect(distortion);
        src.start(now);
        return true;
      } catch (e) {
        return false;
      }
    };

    const hasReal = await tryRealFile();
    if (hasReal) {
      // Add synth layer underneath for extra punch during 2.5s
      this.playSynthLayers(ctx, now, distortion, 0.28, dur);
      return;
    }
    this.playSynthLayers(ctx, now, distortion, 1.0, dur);
  }

  playSynthLayers(ctx, now, outNode, volumeScale, dur) {
    dur = dur || 2.5;
    // Layer 1: Deep demonic roar 0-0.7s
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(145, now);
    osc1.frequency.exponentialRampToValueAtTime(42, now + 0.65);
    const lfo1 = ctx.createOscillator();
    const lfoG1 = ctx.createGain();
    lfo1.frequency.setValueAtTime(18, now);
    lfoG1.gain.setValueAtTime(22, now);
    lfo1.connect(lfoG1).connect(osc1.frequency);
    lfo1.start(now); lfo1.stop(now + 0.7);
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.82 * volumeScale, now + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.01, now + 0.75);
    osc1.connect(g1).connect(outNode);
    osc1.start(now); osc1.stop(now + 0.75);

    // Layer 2: Main shouting scream - extended to 2.5s with waver
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(720, now);
    osc2.frequency.linearRampToValueAtTime(1380, now + 0.14);
    osc2.frequency.linearRampToValueAtTime(980, now + 0.55);
    osc2.frequency.linearRampToValueAtTime(1120, now + 1.15);
    osc2.frequency.exponentialRampToValueAtTime(520, now + dur);
    const lfo2 = ctx.createOscillator();
    const lfoG2 = ctx.createGain();
    lfo2.frequency.setValueAtTime(28, now);
    lfoG2.gain.setValueAtTime(85, now);
    lfo2.connect(lfoG2).connect(osc2.frequency);
    lfo2.start(now); lfo2.stop(now + dur);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.58 * volumeScale, now + 0.015);
    g2.gain.setValueAtTime(0.52 * volumeScale, now + 1.6);
    g2.gain.exponentialRampToValueAtTime(0.01, now + dur);
    osc2.connect(g2).connect(outNode);
    osc2.start(now); osc2.stop(now + dur);

    // Layer 3: High shriek 0-1.1s
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1950, now);
    osc3.frequency.linearRampToValueAtTime(2850, now + 0.18);
    osc3.frequency.exponentialRampToValueAtTime(950, now + 1.0);
    g3.gain.setValueAtTime(0, now);
    g3.gain.linearRampToValueAtTime(0.30 * volumeScale, now + 0.03);
    g3.gain.setValueAtTime(0.22 * volumeScale, now + 0.9);
    g3.gain.exponentialRampToValueAtTime(0.01, now + 1.15);
    osc3.connect(g3).connect(outNode);
    osc3.start(now); osc3.stop(now + 1.15);

    // Layer 4: Breath/noise for human air throughout 2.5s
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / ctx.sampleRate;
      const env = t < 0.05 ? t/0.05 : (t < dur-0.3 ? 1 : (dur - t)/0.3);
      data[i] = (Math.random()*2-1) * Math.pow(env, 1.2) * 0.85;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nGain = ctx.createGain();
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.setValueAtTime(1400, now);
    nGain.gain.setValueAtTime(0.42 * volumeScale, now);
    nGain.gain.setValueAtTime(0.35 * volumeScale, now + 1.2);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + dur);
    noise.connect(nFilter).connect(nGain).connect(outNode);
    noise.start(now);

    // Layer 5: Impact + second hit at 1.1s for extended scare
    const hit = (at, freq) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, at);
      o.frequency.exponentialRampToValueAtTime(freq*0.45, at+0.22);
      g.gain.setValueAtTime(0.95*volumeScale, at);
      g.gain.exponentialRampToValueAtTime(0.01, at+0.28);
      o.connect(g).connect(outNode);
      o.start(at); o.stop(at+0.28);
    };
    hit(now, 68);
    hit(now+0.95, 52);
  }

  trigger() {
    if (this.isActive) return;
    this.isActive = true;

    this.element.classList.remove('hidden');
    void this.element.offsetWidth;
    this.element.classList.add('active');
    document.body.classList.add('jumpscare-shake');

    this.playScareSound();
    if (navigator.vibrate) navigator.vibrate([200, 40, 200, 40, 300, 40, 200]);

    // Hide after 2.5s
    setTimeout(() => {
      this.element.classList.remove('active');
      document.body.classList.remove('jumpscare-shake');
      setTimeout(() => {
        this.element.classList.add('hidden');
        this.isActive = false;
      }, 280);
    }, this.DURATION);
  }
}
