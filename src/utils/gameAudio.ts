// Web Audio API Synthesizer for Snake Game
// Generates retro arcade sounds procedurally to avoid external dependencies

class GameAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      const g = globalThis as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextClass = g.AudioContext || g.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        this.ctx = ctx;
        this.masterGain = ctx.createGain();
        this.masterGain.connect(ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume
      }
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  public async init() {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      // Smooth transition to avoid clicking
      const now = this.ctx?.currentTime || 0;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.3, now + 0.1);
    }
  }

  // --- Sound Effects ---

  public playEatSound() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playGameOverSound() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playStageClearSound() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Simple Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      const startTime = t + i * 0.1;
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  public playClickSound() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // --- Background Drone ---
  // A simple low-frequency drone for ambience
  public startBGM() {
    if (!this.ctx || this.bgmGain) return; // Already playing or no context

    const t = this.ctx.currentTime;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.15;
    this.bgmGain.connect(this.masterGain!);

    // Bass drone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = 55; // A1
    osc1.connect(this.bgmGain);
    osc1.start(t);

    // Harmonics
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 110; // A2
    osc2.detune.value = 5; // Slight detune for thickness
    osc2.connect(this.bgmGain);
    osc2.start(t);
    
    // LFO for filter/movement effect (simulated with gain)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5; // Slow pulse
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain.gain);
    
    this.bgmOscillators = [osc1, osc2, lfo];
  }

  public stopBGM() {
    this.bgmOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch { /* ignore if already stopped */ }
    });
    this.bgmOscillators = [];
    if (this.bgmGain) {
      this.bgmGain.disconnect();
      this.bgmGain = null;
    }
  }
}

export const gameAudio = new GameAudioSynthesizer();
