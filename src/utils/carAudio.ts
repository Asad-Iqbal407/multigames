/**
 * Car Racing Game Audio Synthesizer
 * Uses Web Audio API for procedural sound generation
 */

class CarAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineStarted: boolean = false;

  constructor() {
    if (typeof window === 'undefined') return;
    
    const w = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass =
      typeof AudioContext !== 'undefined' ? AudioContext : w.webkitAudioContext;
    
    if (AudioContextClass) {
      try {
        const ctx = new AudioContextClass();
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(ctx.destination);
        this.ctx = ctx;
        this.masterGain = masterGain;
      } catch (e) {
        console.error('Web Audio API not supported:', e);
      }
    }
  }

  private resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startEngine() {
    if (!this.ctx || !this.masterGain || this.isEngineStarted) return;
    this.resume();

    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
    
    this.engineGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    
    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    
    this.engineOsc.start();
    this.isEngineStarted = true;
  }

  stopEngine() {
    if (this.engineOsc) {
      this.engineOsc.stop();
      this.engineOsc.disconnect();
      this.engineOsc = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
    this.isEngineStarted = false;
  }

  updateEngine(speed: number) {
    if (!this.ctx || !this.engineOsc) return;
    const freq = 60 + (speed * 20);
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
  }

  playCrash() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playScore() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
}

export const carAudio = new CarAudioSynthesizer();
