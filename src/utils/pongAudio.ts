// Web Audio API Synthesizer for Ping Pong Game
// Generates retro arcade sounds procedurally

class PongAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

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
      const now = this.ctx?.currentTime || 0;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.3, now + 0.1);
    }
  }

  public playPaddleHit() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playWallHit() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playScore() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.2);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

export const pongAudio = new PongAudioSynthesizer();
