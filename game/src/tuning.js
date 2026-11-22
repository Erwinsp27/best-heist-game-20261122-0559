"use strict";
/* Tuning: every number and colour for The Glasshouse Caper lives here. */
const TUNE = {
  W: 1280, H: 720, HUD_H: 64,
  PLAY_TOP: 76, PLAY_BOTTOM: 704, PLAY_LEFT: 16, PLAY_RIGHT: 1264,
  PLAYER_R: 14, PLAYER_SPEED: 172, SNEAK_SPEED: 88,
  GUARD_R: 18, GUARD_SPEED: 96,
  CONE_RANGE: 262, CONE_HALF: 0.60,
  CAM_RANGE: 300, CAM_HALF: 0.46,
  GRACE_TIME: 1.0,
  ALARM_GUARD: 24, ALARM_CAMERA: 32, ALARM_CHASE: 46, ALARM_FALL: 9,
  SHADOW_HIDE_DIST: 92,
  COIN_COST: 25, SMOKE_COST: 50, RETRY_COST: 100,
  MAIN_VALUE: 500, OPTIONAL_VALUE: 150,
  TIME_BONUS_FAST: 75, TIME_BONUS_MID: 40, GHOST_BONUS: 120,
  GHOST_ALARM_MAX: 30, SMOKE_TIME: 4, COIN_INVESTIGATE: 4,
  COL: {
    floor: "#16382f", floor2: "#1a4237", glass: "#9fc8d8", glassLine: "#d7ecf2",
    wall: "#0d2620", shadow: "#2e5d43", crate: "#6b4f2e", planter: "#2f6b3a",
    plinth: "#7a7f8c", gold: "#f2c14e", goldHot: "#ffe08a",
    cone: "rgba(242, 196, 78, 0.20)", coneHot: "rgba(242, 120, 60, 0.34)",
    camArc: "rgba(255, 90, 70, 0.30)", camHot: "rgba(255, 90, 70, 0.46)",
    player: "#20242e", scarf: "#eef3f6", guard: "#5a6b7a", guardCap: "#33414e",
    cam: "#c8ccd2", text: "#f4f1e6", dim: "#b9c4bb", alarmOk: "#58b368",
    alarmMid: "#e0a83c", alarmBad: "#d94f3d", panel: "rgba(8, 24, 19, 0.88)",
    button: "#2e6b4f", buttonHi: "#3f8a66", smoke: "rgba(220, 230, 235, 0.55)"
  }
};
