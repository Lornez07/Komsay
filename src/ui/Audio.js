/**
 * Museum Ambient Sound Synthesizer using Web Audio API
 * Generates peaceful, warm gallery background ambience without external audio dependencies.
 */
export class MuseumAudio {
  constructor() {
    this.isPlaying = false;
    this.audioCtx = null;
    this.oscillators = [];
    this.gainNode = null;
  }

  init() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);

    // Warm low-pass filter to sound like soft distant hall acoustics
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(350, this.audioCtx.currentTime);

    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.audioCtx.destination);
  }

  toggle() {
    if (!this.audioCtx) {
      this.init();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) {
      this.stop();
    } else {
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

      // Subtle LFO detune for natural room breathing
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.value = 0.1 + i * 0.05;
      lfoGain.gain.value = 1.2;
      lfo.connect(osc.frequency);
      lfo.start();

      oscGain.gain.setValueAtTime(0.06 / (i + 1), this.audioCtx.currentTime);

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
