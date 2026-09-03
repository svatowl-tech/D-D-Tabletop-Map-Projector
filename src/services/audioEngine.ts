/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Звуковой движок и синтезатор на базе нативного Web Audio API.
 * 
 * Особенности:
 * - 100% автономный, работает без внешних аудиофайлов и интернета.
 * - Процедурная генерация эмбиента: дождь, ветер, костер, капли в пещере, шум таверны.
 * - Процедурные атмосферные BGM-лупы: Battle, Dungeon, Tavern, Crypt, Forest.
 * - SFX Soundboard: звон мечей, фаербол, рык дракона, монеты, бросок кубиков, исцеление.
 * - Плавный Crossfade и раздельное микширование каналов.
 */

import { AmbienceChannelState, AudioEngineState } from '../types';

export class AudioEngineService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Эмбиент генераторы
  private rainNode: { source: AudioNode; gain: GainNode } | null = null;
  private windNode: { source: AudioNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private fireNode: { source: AudioNode; gain: GainNode; interval?: any } | null = null;
  private dungeonNode: { timer?: any; gain: GainNode } | null = null;
  private tavernNode: { timer?: any; gain: GainNode } | null = null;

  // BGM генератор
  private bgmLoopTimer: any = null;
  private activeBgmName: string | null = null;

  private state: AudioEngineState = {
    masterVolume: 0.8,
    bgmVolume: 0.6,
    ambienceVolume: 0.7,
    sfxVolume: 0.9,
    activeBgm: null,
    ambienceChannels: {
      rain: 0,
      wind: 0,
      fire: 0,
      dungeon: 0,
      tavern: 0
    },
    isPlaying: false
  };

  private listeners: Set<(state: AudioEngineState) => void> = new Set();

  constructor() {
    // AudioContext инициализируется при первом взаимодействии пользователя
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Мастер шины микшера
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.state.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.state.bgmVolume;
      this.bgmGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.value = this.state.ambienceVolume;
      this.ambienceGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.state.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public getState(): AudioEngineState {
    return { ...this.state };
  }

  public subscribe(listener: (state: AudioEngineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public setMasterVolume(val: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.state.masterVolume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public setBgmVolume(val: number): void {
    this.state.bgmVolume = Math.max(0, Math.min(1, val));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.state.bgmVolume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public setAmbienceVolume(val: number): void {
    this.state.ambienceVolume = Math.max(0, Math.min(1, val));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(this.state.ambienceVolume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public setSfxVolume(val: number): void {
    this.state.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.state.sfxVolume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  // ==========================================
  // SFX SOUNDBOARD (Мгновенные звуковые эффекты)
  // ==========================================

  public playSFX(sfxType: 'sword' | 'fireball' | 'roar' | 'coin' | 'dice' | 'heal' | 'lightning' | 'victory' | 'darkness' | 'whoosh'): void {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    const now = ctx.currentTime;

    switch (sfxType) {
      case 'whoosh': {
        // Воздушный свист смены карты / свитка
        const noise = this.createNoiseBuffer(ctx, 0.4);
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(2200, now + 0.18);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.38);
        filter.Q.setValueAtTime(3, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noiseNode.start(now);
        break;
      }

      case 'dice': {
        // Щелчок и перекатывание костей
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450 + Math.random() * 300, now + i * 0.07);
          gain.gain.setValueAtTime(0.35, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.06);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.07);
        }
        break;
      }

      case 'sword': {
        // Удар металла о металл
        const osc = ctx.createOscillator();
        const noise = this.createNoiseBuffer(ctx, 0.3);
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2800, now);
        filter.Q.setValueAtTime(10, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        noiseNode.start(now);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case 'fireball': {
        // Гул и взрыв пламени
        const noise = this.createNoiseBuffer(ctx, 1.2);
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 1.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noiseNode.start(now);
        break;
      }

      case 'roar': {
        // Рык монстра / дракона
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.5);
        osc.frequency.linearRampToValueAtTime(160, now + 1.0);
        osc.frequency.exponentialRampToValueAtTime(40, now + 1.8);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.9, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 1.9);
        break;
      }

      case 'coin': {
        // Звон золотых монет
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(3200, now);
        osc2.frequency.setValueAtTime(4800, now);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
        break;
      }

      case 'heal': {
        // Магический колокольчик исцеления (мажорный арпеджио)
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.1;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.35, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(startTime);
          osc.stop(startTime + 0.85);
        });
        break;
      }

      case 'lightning': {
        // Удар молнии
        const noise = this.createNoiseBuffer(ctx, 0.8);
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.8);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noiseNode.start(now);
        break;
      }

      case 'victory': {
        // Победная фанфара
        const chord = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now);
          osc.stop(now + 1.7);
        });
        break;
      }

      case 'darkness': {
        // Зловещий низкий диссонирующий гул
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, now);
        osc2.frequency.setValueAtTime(58.5, now); // биения

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.1);
        osc2.stop(now + 2.1);
        break;
      }
    }
  }

  // ==========================================
  // AMBIENCE MIXER (Многоканальный фоновый шум)
  // ==========================================

  public setAmbienceChannel(channel: keyof AmbienceChannelState, volume: number): void {
    this.state.ambienceChannels[channel] = Math.max(0, Math.min(1, volume));
    this.updateAmbienceGenerators();
    this.notify();
  }

  private updateAmbienceGenerators(): void {
    const ctx = this.ensureContext();
    if (!this.ambienceGain) return;

    const { rain, wind, fire, dungeon, tavern } = this.state.ambienceChannels;

    // 1. ДОЖДЬ
    if (rain > 0) {
      if (!this.rainNode) {
        const buffer = this.createNoiseBuffer(ctx, 3.0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1400;

        const gain = ctx.createGain();
        gain.gain.value = rain * 0.5;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambienceGain);
        source.start();

        this.rainNode = { source, gain };
      } else {
        this.rainNode.gain.gain.setTargetAtTime(rain * 0.5, ctx.currentTime, 0.1);
      }
    } else if (this.rainNode) {
      this.rainNode.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    }

    // 2. ВЕТЕР
    if (wind > 0) {
      if (!this.windNode) {
        const buffer = this.createNoiseBuffer(ctx, 3.0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 4.0;

        const gain = ctx.createGain();
        gain.gain.value = wind * 0.6;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambienceGain);
        source.start();

        this.windNode = { source, filter, gain };
      } else {
        this.windNode.gain.gain.setTargetAtTime(wind * 0.6, ctx.currentTime, 0.1);
      }
    } else if (this.windNode) {
      this.windNode.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    }

    // 3. КОСТЕР / КАМИН
    if (fire > 0) {
      if (!this.fireNode) {
        const gain = ctx.createGain();
        gain.gain.value = fire * 0.7;
        gain.connect(this.ambienceGain);

        // Периодические потрескивания углей
        const interval = setInterval(() => {
          if (this.state.ambienceChannels.fire > 0 && this.ctx) {
            const crackleOsc = this.ctx.createOscillator();
            const crackleGain = this.ctx.createGain();
            crackleOsc.type = 'triangle';
            crackleOsc.frequency.setValueAtTime(800 + Math.random() * 2000, this.ctx.currentTime);
            crackleGain.gain.setValueAtTime(0.15 * this.state.ambienceChannels.fire, this.ctx.currentTime);
            crackleGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
            crackleOsc.connect(crackleGain);
            crackleGain.connect(gain);
            crackleOsc.start(this.ctx.currentTime);
            crackleOsc.stop(this.ctx.currentTime + 0.05);
          }
        }, 180);

        this.fireNode = { source: gain, gain, interval };
      } else {
        this.fireNode.gain.gain.setTargetAtTime(fire * 0.7, ctx.currentTime, 0.1);
      }
    } else if (this.fireNode) {
      this.fireNode.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    }

    // 4. ПОДЗЕМЕЛЬЕ / КАПЛИ
    if (dungeon > 0) {
      if (!this.dungeonNode) {
        const gain = ctx.createGain();
        gain.gain.value = dungeon * 0.8;
        gain.connect(this.ambienceGain);

        const timer = setInterval(() => {
          if (this.state.ambienceChannels.dungeon > 0 && this.ctx) {
            const drop = this.ctx.createOscillator();
            const dropGain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            drop.frequency.setValueAtTime(1800, now);
            drop.frequency.exponentialRampToValueAtTime(450, now + 0.15);
            dropGain.gain.setValueAtTime(0.3 * this.state.ambienceChannels.dungeon, now);
            dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            drop.connect(dropGain);
            dropGain.connect(gain);
            drop.start(now);
            drop.stop(now + 0.45);
          }
        }, 1200);

        this.dungeonNode = { timer, gain };
      } else {
        this.dungeonNode.gain.gain.setTargetAtTime(dungeon * 0.8, ctx.currentTime, 0.1);
      }
    } else if (this.dungeonNode) {
      this.dungeonNode.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    }

    // 5. ТАВЕРНА
    if (tavern > 0) {
      if (!this.tavernNode) {
        const gain = ctx.createGain();
        gain.gain.value = tavern * 0.6;
        gain.connect(this.ambienceGain);
        this.tavernNode = { gain };
      } else {
        this.tavernNode.gain.gain.setTargetAtTime(tavern * 0.6, ctx.currentTime, 0.1);
      }
    } else if (this.tavernNode) {
      this.tavernNode.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    }
  }

  // ==========================================
  // BGM SYNTHESIZER (Процедурные мелодические темы)
  // ==========================================

  public playBgmPreset(preset: 'battle' | 'dungeon' | 'tavern' | 'crypt' | 'forest' | null): void {
    const ctx = this.ensureContext();
    if (!this.bgmGain) return;

    if (this.bgmLoopTimer) {
      clearInterval(this.bgmLoopTimer);
      this.bgmLoopTimer = null;
    }

    if (!preset) {
      this.state.activeBgm = null;
      this.activeBgmName = null;
      this.state.isPlaying = false;
      this.notify();
      return;
    }

    this.state.activeBgm = preset;
    this.activeBgmName = preset;
    this.state.isPlaying = true;
    this.notify();

    // Процедурные гармонии
    const scales: Record<string, number[]> = {
      battle: [110, 130.81, 146.83, 164.81, 220],       // A minor pentatonic low
      dungeon: [73.42, 87.31, 98.0, 110.0, 123.47],      // D dorian drone
      tavern: [261.63, 293.66, 329.63, 392.0, 440.0],    // C major pleasant
      crypt: [65.41, 77.78, 92.5, 98.0, 116.54],         // C harmonic minor
      forest: [329.63, 392.0, 493.88, 587.33, 659.25]    // E minor ethereal
    };

    const currentScale = scales[preset] || scales.dungeon;
    let step = 0;

    const playStep = () => {
      if (this.state.activeBgm !== preset || !this.ctx || !this.bgmGain) return;
      const now = this.ctx.currentTime;

      const freq = currentScale[step % currentScale.length];
      step++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = preset === 'battle' ? 'sawtooth' : preset === 'forest' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 2.5);
    };

    playStep();
    const intervalMs = preset === 'battle' ? 600 : preset === 'tavern' ? 800 : 1500;
    this.bgmLoopTimer = setInterval(playStep, intervalMs);
  }

  private customAudioEl: HTMLAudioElement | null = null;

  public playCustomAudioTrack(name: string, url: string): void {
    if (this.customAudioEl) {
      this.customAudioEl.pause();
      this.customAudioEl = null;
    }
    this.customAudioEl = new Audio(url);
    this.customAudioEl.loop = true;
    this.customAudioEl.volume = this.state.bgmVolume * this.state.masterVolume;
    this.customAudioEl.play().catch((err) => console.warn('Custom audio playback error:', err));
    this.state.activeBgm = name;
    this.state.isPlaying = true;
    this.notify();
  }

  public stopAll(): void {
    if (this.bgmLoopTimer) {
      clearInterval(this.bgmLoopTimer);
      this.bgmLoopTimer = null;
    }
    this.state.activeBgm = null;
    this.state.ambienceChannels = { rain: 0, wind: 0, fire: 0, dungeon: 0, tavern: 0 };
    this.state.isPlaying = false;
    this.updateAmbienceGenerators();
    this.notify();
  }

  private createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const audioEngine = new AudioEngineService();
