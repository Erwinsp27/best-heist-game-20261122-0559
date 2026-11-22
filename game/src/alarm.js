"use strict";
/* Alarm and scoring: the meter, bonuses, penalties, per-level breakdown. */
function alarmStep(state, dt, seenStrength, sneaking) {
  if (seenStrength > 0) {
    const rate = seenStrength * (sneaking ? 0.45 : 1);
    state.alarm = Math.min(100, state.alarm + rate * dt * 34);
    state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
    if (state.alarm >= 75 && !state.alarmWarned) { state.alarmWarned = true; Sound.alarmRise(); }
  } else {
    state.alarm = Math.max(0, state.alarm - TUNE.ALARM_FALL * dt);
    if (state.alarm < 70) state.alarmWarned = false;
  }
  return state.alarm >= 100;
}
function levelScore(state, level, elapsed) {
  let s = state.levelScore;
  if (elapsed <= 60) s += TUNE.TIME_BONUS_FAST;
  else if (elapsed <= 110) s += TUNE.TIME_BONUS_MID;
  if (state.maxAlarm <= TUNE.GHOST_ALARM_MAX) s += TUNE.GHOST_BONUS;
  return Math.max(0, Math.round(s));
}
function rankFor(total, caught) {
  if (total >= 2600 && caught === 0) return "a legendary night";
  if (total >= 2100) return "a masterful night";
  if (total >= 1600) return "a quiet night";
  if (total >= 1100) return "a lucky night";
  return "a night that got away";
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ":" + String(s).padStart(2, "0");
}
