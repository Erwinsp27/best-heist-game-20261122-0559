"use strict";
/* Sound: short generated tones only, started after the first input. No audio files. */
const Sound = {
  ctx: null, muted: false,
  ensure: function () {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    } catch (e) { this.ctx = null; }
  },
  tone: function (freq, dur, type, vol, slideTo) {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* sound never blocks play */ }
  },
  pickup: function () { this.tone(880, 0.16, "sine", 0.07, 1320); },
  warn: function () { this.tone(220, 0.22, "square", 0.045, 180); },
  alarmRise: function () { this.tone(520, 0.3, "sawtooth", 0.03, 780); },
  win: function () { this.tone(660, 0.14, "sine", 0.07); setTimeout(() => this.tone(880, 0.2, "sine", 0.07), 120); setTimeout(() => this.tone(1100, 0.28, "sine", 0.07), 260); },
  caught: function () { this.tone(180, 0.4, "sawtooth", 0.05, 90); },
  click: function () { this.tone(700, 0.06, "sine", 0.05); },
  toggleMute: function () { this.muted = !this.muted; return this.muted; }
};
