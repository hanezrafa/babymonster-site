/* audio.js — interface sounds for the case.
   Synthesised, not sampled: a short percussive tick for page turns and
   sticker presses, and a rising sweep for the hinge. The AudioContext is
   built lazily inside a real user gesture, so nothing ever autoplays. */

(function () {
  "use strict";

  var AC = window.AudioContext || window.webkitAudioContext;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ctx = null;
  var master = null;
  var enabled = !reduce;   /* a quieter default for visitors who asked for calm */
  var quiet = reduce ? 0.5 : 1;

  function ensure() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function resume() {
    if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
  }

  /* A tick: one short blip through a fast exponential envelope.
     `hz` sets the pitch, `gain` the weight, `ms` the length. */
  function tick(hz, gain, ms) {
    if (!enabled || !ensure()) return;
    resume();
    hz = hz || 880;
    gain = (gain == null ? 0.09 : gain) * quiet;
    ms = ms || 70;

    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    var lp = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(hz, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(60, hz * 0.72), t + ms / 1000);

    lp.type = "lowpass";
    lp.frequency.setValueAtTime(Math.min(12000, hz * 7), t);

    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);

    osc.connect(lp); lp.connect(amp); amp.connect(master);
    master.gain.setTargetAtTime(1, t, 0.01);

    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  }

  /* A sweep: the hinge letting go. Rising, with a little noise on the tail. */
  function sweep() {
    if (!enabled || !ensure()) return;
    resume();
    var t = ctx.currentTime;
    var dur = 0.5;

    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    var lp = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + dur * 0.82);
    osc.frequency.exponentialRampToValueAtTime(640, t + dur);

    lp.type = "lowpass";
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(4200, t + dur * 0.8);
    lp.Q.value = 6;

    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.05 * quiet, t + 0.06);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(lp); lp.connect(amp); amp.connect(master);
    master.gain.setTargetAtTime(1, t, 0.01);

    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  /* The disc: a low repeating tick, meant to be started and stopped. */
  var loop = null;
  function loopStart() {
    if (!enabled || !ensure()) return;
    resume();
    loopStop();
    var i = 0;
    loop = window.setInterval(function () {
      tick(196 * (i % 2 ? 1.5 : 1), 0.055, 90);
      i++;
    }, 430);
  }
  function loopStop() {
    if (loop) { window.clearInterval(loop); loop = null; }
  }

  window.BMAudio = {
    init: function () { ensure(); resume(); },
    tick: tick,
    sweep: sweep,
    loopStart: loopStart,
    loopStop: loopStop,
    isEnabled: function () { return enabled; },
    setEnabled: function (on) {
      enabled = !!on;
      if (!enabled) loopStop();
    }
  };
})();
