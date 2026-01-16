
import { ToneSettings, InstrumentProfile } from '../types';

interface ActiveNote {
  osc: OscillatorNode;
  gain: GainNode;
  baseFreq: number;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private distortion: WaveShaperNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private activeNotes: Map<string, ActiveNote> = new Map();
  private currentProfile: InstrumentProfile | null = null;

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.distortion = this.ctx.createWaveShaper();
    this.filter = this.ctx.createBiquadFilter();
    
    this.filter.type = 'lowpass';

    this.distortion.connect(this.filter);
    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  setProfile(profile: InstrumentProfile) {
    this.currentProfile = profile;
    if (this.filter && this.ctx) {
      this.filter.frequency.setTargetAtTime(profile.filterFreq, this.ctx.currentTime, 0.1);
    }
  }

  private makeDistortionCurve(amount: number) {
    const k = amount * 100;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  updateSettings(settings: ToneSettings) {
    if (!this.ctx || !this.distortion || !this.masterGain || !this.filter) return;
    this.distortion.curve = this.makeDistortionCurve(settings.distortion);
    this.masterGain.gain.setTargetAtTime(settings.gain, this.ctx.currentTime, 0.05);
    // Combiniamo il tono dell'utente con il preset dello strumento
    const baseFreq = this.currentProfile?.filterFreq || 2000;
    this.filter.frequency.setTargetAtTime(baseFreq * (0.5 + settings.tone), this.ctx.currentTime, 0.05);
  }

  startNote(id: string, frequency: number) {
    if (!this.ctx || !this.distortion || !this.currentProfile) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopNote(id);

    const osc = this.ctx.createOscillator();
    const vca = this.ctx.createGain();

    osc.type = this.currentProfile.oscType;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    
    // Inviluppo ADSR semplificato
    vca.gain.setValueAtTime(0, this.ctx.currentTime);
    vca.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + this.currentProfile.attack);

    osc.connect(vca);
    vca.connect(this.distortion);

    osc.start();
    this.activeNotes.set(id, { osc, gain: vca, baseFreq: frequency });
  }

  updateBend(id: string, bendAmount: number) {
    const note = this.activeNotes.get(id);
    if (!note || !this.ctx) return;
    
    // Mappatura espressiva del movimento
    const cents = Math.abs(bendAmount) * 2.5; 
    note.osc.detune.setTargetAtTime(cents, this.ctx.currentTime, 0.05);
  }

  stopNote(id: string) {
    const note = this.activeNotes.get(id);
    if (note && this.ctx && this.currentProfile) {
      const release = this.currentProfile.release;
      note.gain.gain.cancelScheduledValues(this.ctx.currentTime);
      note.gain.gain.setTargetAtTime(0, this.ctx.currentTime, release);
      note.osc.stop(this.ctx.currentTime + release * 4);
      this.activeNotes.delete(id);
    }
  }
}

export const audioEngine = new AudioEngine();
