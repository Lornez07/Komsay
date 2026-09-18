/**
 * Museum Ambient Sound Synthesizer using Web Audio API
 * Generates peaceful, warm gallery background ambience without external audio dependencies.
 * Mobile fix: await resume(), fix LFO routing, louder on phone speakers.
 */
export class MuseumAudio {
  constructor() {
    this.isPlaying = false;
    this.audioCtx = null;
    this.oscillators = [];
    this.gainNode = null;
    this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia('(pointer: coarse)').matches;
  }

  init() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMobile ? 0.14 : 0.08, this.audioCtx.currentTime);

    // Warm low-pass - brighter on mobile (small speakers need higher cutoff)
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(this.isMobile ? 650 : 350, this.audioCtx.currentTime);

    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.audioCtx.destination);

    // One-time unlock for iOS: resume on first touch/click anywhere
    const unlock = async () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        try { await this.audioCtx.resume(); } catch {}
      }
    };
    // Use capture to catch first interaction
    document.addEventListener('touchend', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }

  async toggle() {
    if (!this.audioCtx) {
      this.init();
    }

    // Must resume inside user gesture - await it
    if (this.audioCtx.state === 'suspended') {
      try { await this.audioCtx.resume(); } catch {}
    }

    if (this.isPlaying) {
      this.stop();
    } else {
      // Double-check still suspended (iOS sometimes needs 2nd resume)
      if (this.audioCtx.state === 'suspended') {
        try { await this.audioCtx.resume(); } catch {}
      }
      this.start();
    }
    return this.isPlaying;
  }

  start() {
    if (this.isPlaying) return;
    this.init();

    // Harmonics chord: F# Major 9 warm pad (92.5Hz, 138.6Hz, 185Hz, 277Hz)
    const freqs = [92.5, 138.59, 185.0, 277.18, 329.63];

    this.oscillators = freqs.map((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      // LFO detune for natural room breathing - FIXED routing: lfo -> gain -> freq
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.value = 0.1 + i * 0.05;
      lfoGain.gain.value = 1.2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      // Louder on mobile
      oscGain.gain.setValueAtTime((this.isMobile ? 0.10 : 0.06) / (i + 1), this.audioCtx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(this.filter);
      osc.start();

      return { osc, lfo };
    });

    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) return;
    this.oscillators.forEach(({ osc, lfo }) => {
      try {
        osc.stop();
        lfo.stop();
      } catch (e) {}
    });
    this.oscillators = [];
    this.isPlaying = false;
  }
}
