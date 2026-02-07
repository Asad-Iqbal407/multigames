// Web Audio API Synthesizer for Tetris Game
// Generates retro arcade sounds procedurally

class TetrisAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
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

  // --- Sound Effects ---

  public playRotate() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playDrop() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playLineClear() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Major chord arpeggio
    [523.25, 659.25, 783.99].forEach((freq, i) => { // C5, E5, G5
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.1, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.2);
    });
  }

  public playTetris() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Victory fanfare style
    [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, i) => { 
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = t + i * 0.04;
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  public playGameOver() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(100, t + 1);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 1);
  }

  // --- Background Music ---
  public startBGM() {
    if (!this.ctx || this.bgmGain) return;

    const t = this.ctx.currentTime;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.1;
    this.bgmGain.connect(this.masterGain!);

    // Bass Sequence (Korobeiniki-ish bassline feel)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = 82.41; // E2
    
    // Filter for synth feel
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    
    osc1.connect(filter);
    filter.connect(this.bgmGain);
    osc1.start(t);
    
    // LFO to modulate filter
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 2; // 2Hz wobble
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t);

    this.bgmOscillators = [osc1, lfo];
  }

  public stopBGM() {
    this.bgmOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) { /* ignore */ }
    });
    this.bgmOscillators = [];
    if (this.bgmGain) {
      this.bgmGain.disconnect();
      this.bgmGain = null;
    }
  }
}

export const tetrisAudio = new TetrisAudioSynthesizer();
