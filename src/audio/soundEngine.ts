/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio Sound Engine with Zero External Audio Assets
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Active looping nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenInterval: any = null;

  private radioOsc: OscillatorNode | null = null;
  private radioGain: GainNode | null = null;
  private radioInterval: any = null;
  private activeRadioStation: string | null = null;

  constructor() {
    // Initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.6, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public playCashSound() {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  public playMissionPassSound() {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  public playWantedLevelAlert(stars: number) {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < Math.min(stars, 5); i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440 + i * 110, t + i * 0.07);

      gain.gain.setValueAtTime(0.25, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.16);
    }
  }

  public playGunshot(type: string = 'pistol') {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = type === 'shotgun' ? 0.35 : type === 'rifle' ? 0.22 : 0.14;

    // Noise burst for mechanical gunpowder blast
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(type === 'shotgun' ? 1200 : 2800, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(150, t + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(type === 'shotgun' ? 0.8 : 0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Sub thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(type === 'shotgun' ? 120 : 180, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.12);

    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    noise.start(t);
    subOsc.start(t);
    subOsc.stop(t + 0.15);
  }

  public playPunch() {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playCrash(intensity: number = 1.0) {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const duration = Math.min(0.6 * intensity, 0.8);

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.7 * intensity, 0.9), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Deep metal hit
    const metalOsc = this.ctx.createOscillator();
    const metalGain = this.ctx.createGain();
    metalOsc.type = 'square';
    metalOsc.frequency.setValueAtTime(90, t);
    metalOsc.frequency.exponentialRampToValueAtTime(35, t + 0.25);
    metalGain.gain.setValueAtTime(0.5 * intensity, t);
    metalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    metalOsc.connect(metalGain);
    metalGain.connect(this.masterGain);

    noise.start(t);
    metalOsc.start(t);
    metalOsc.stop(t + 0.25);
  }

  public playTireSqueal(volume: number = 0.3) {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const duration = 0.2;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 400, t);
    filter.Q.value = 8.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(volume, 0.4), t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  public playHorn(start: boolean) {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    if (start && !(this as any)._hornOsc1) {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(392, this.ctx.currentTime); // G4
      osc2.frequency.setValueAtTime(493.88, this.ctx.currentTime); // B4

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start();
      osc2.start();

      (this as any)._hornOsc1 = osc1;
      (this as any)._hornOsc2 = osc2;
      (this as any)._hornGain = gain;
    } else if (!start && (this as any)._hornOsc1) {
      try {
        (this as any)._hornGain.gain.setValueAtTime(0, this.ctx.currentTime);
        (this as any)._hornOsc1.stop();
        (this as any)._hornOsc2.stop();
      } catch (e) {}
      (this as any)._hornOsc1 = null;
      (this as any)._hornOsc2 = null;
      (this as any)._hornGain = null;
    }
  }

  public updateEngineSound(active: boolean, speedNorm: number, vehicleType: string = 'supercar') {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    if (!active) {
      if (this.engineGain) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }

    const t = this.ctx.currentTime;
    if (!this.engineOsc1) {
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 600;

      this.engineGain.gain.setValueAtTime(0.18, t);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
    }

    const isHeli = vehicleType === 'helicopter';
    const baseFreq = isHeli ? 35 : vehicleType === 'muscle' ? 50 : 65;
    const maxFreq = isHeli ? 90 : vehicleType === 'muscle' ? 260 : 340;
    const freq = baseFreq + speedNorm * (maxFreq - baseFreq);

    if (this.engineOsc1 && this.engineOsc2) {
      this.engineOsc1.frequency.setValueAtTime(freq, t);
      this.engineOsc2.frequency.setValueAtTime(freq * 0.5, t);
    }
    if (this.engineFilter) {
      this.engineFilter.frequency.setValueAtTime(300 + speedNorm * 1800, t);
    }
    if (this.engineGain) {
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22 + speedNorm * 0.15, t);
    }
  }

  public updateSiren(active: boolean) {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    if (!active) {
      if (this.sirenInterval) {
        clearInterval(this.sirenInterval);
        this.sirenInterval = null;
      }
      if (this.sirenOsc) {
        try {
          this.sirenGain?.gain.setValueAtTime(0, this.ctx.currentTime);
          this.sirenOsc.stop();
        } catch (e) {}
        this.sirenOsc = null;
        this.sirenGain = null;
      }
      return;
    }

    if (!this.sirenOsc) {
      const t = this.ctx.currentTime;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc.type = 'sine';
      this.sirenGain.gain.setValueAtTime(0.2, t);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);
      this.sirenOsc.start();

      let toggle = false;
      this.sirenInterval = setInterval(() => {
        if (!this.ctx || !this.sirenOsc) return;
        toggle = !toggle;
        this.sirenOsc.frequency.setValueAtTime(toggle ? 750 : 980, this.ctx.currentTime);
      }, 450);
    }
  }

  public setRadioStation(stationId: string | null) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
    if (this.radioOsc) {
      try {
        this.radioGain?.gain.setValueAtTime(0, this.ctx.currentTime);
        this.radioOsc.stop();
      } catch (e) {}
      this.radioOsc = null;
      this.radioGain = null;
    }

    this.activeRadioStation = stationId;
    if (!stationId || stationId === 'off') return;

    // Procedural Music Generator for radio station!
    // Creates rhythmic arpeggio/bassline loops
    let scale = [130.81, 146.83, 164.81, 196.0, 220.0]; // C minor / synthwave pentatonic
    let tempo = 220; // ms
    let waveType: OscillatorType = 'sawtooth';

    if (stationId === 'synthwave') {
      scale = [110.0, 130.81, 146.83, 164.81, 196.0, 246.94]; // A minor
      waveType = 'sawtooth';
      tempo = 180;
    } else if (stationId === 'hiphop') {
      scale = [65.41, 73.42, 82.41, 98.0, 110.0]; // deep 808 sub bass
      waveType = 'triangle';
      tempo = 280;
    } else if (stationId === 'rock') {
      scale = [146.83, 174.61, 196.0, 220.0, 261.63]; // D minor overdrive
      waveType = 'square';
      tempo = 150;
    }

    let step = 0;
    this.radioInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || !this.masterGain || !this.activeRadioStation) return;
      const t = this.ctx.currentTime;
      const note = scale[step % scale.length];
      step++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = waveType;
      osc.frequency.setValueAtTime(note, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + (step % 4) * 400, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (tempo / 1000) * 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + tempo / 1000);
    }, tempo);
  }

  public playUIClick() {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playPhoneRing() {
    this.initContext();
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(853, t);
    osc.frequency.setValueAtTime(960, t + 0.08);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

export const sound = new SoundEngine();
