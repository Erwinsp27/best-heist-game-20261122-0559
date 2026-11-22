"use strict";
/* Levels: four fixed, hand-placed rooms. Layouts never change between plays. */
function R(x, y, w, h, kind) { return { x: x, y: y, w: w, h: h, kind: kind || "crate" }; }
const LEVELS = [
  {
    name: "1 · Foyer", brief: "Cross the foyer, take the brass key, reach the far door.",
    hint: "Two routes: straight across the lit floor, or slow and safe behind the planters through shadow.",
    start: { x: 90, y: 620 }, exit: { x: 1150, y: 96, w: 84, h: 56 },
    coins: 3, startAlarm: 0,
    blockers: [R(300, 430, 120, 40, "planter"), R(560, 430, 120, 40, "planter"), R(820, 430, 120, 40, "planter"), R(1000, 480, 90, 70, "crate")],
    shadows: [R(240, 520, 220, 90), R(760, 520, 220, 90), R(180, 180, 200, 90)],
    guards: [{ pts: [[400, 300], [880, 300]], speed: 62, pause: 1.4 }],
    cameras: [{ x: 640, y: 82, base: 90, sweep: 50, speed: 34 }],
    loot: [
      { x: 1080, y: 180, kind: "key", label: "Brass key", value: 500, main: true },
      { x: 640, y: 620, kind: "gem", label: "Loose gem", value: 150, main: false }
    ],
    desk: null, vent: null
  },
  {
    name: "2 · Fern Gallery", brief: "Take the jade frog from the central plinth while two patrols cross.",
    hint: "Curtain passage along the top wall, or the crate maze along the bottom. A coin splits the crossing patrols.",
    start: { x: 80, y: 640 }, exit: { x: 1180, y: 620, w: 84, h: 56 },
    coins: 3, startAlarm: 0,
    blockers: [
      R(610, 330, 60, 60, "plinth"),
      R(220, 470, 110, 44, "crate"), R(470, 520, 110, 44, "crate"), R(730, 470, 110, 44, "crate"), R(960, 520, 110, 44, "crate"),
      R(240, 210, 90, 44, "planter"), R(950, 210, 90, 44, "planter")
    ],
    shadows: [R(120, 92, 1040, 46), R(180, 580, 260, 60), R(840, 580, 260, 60), R(520, 130, 240, 60)],
    guards: [
      { pts: [[180, 180], [1100, 540]], speed: 88, pause: 1.0 },
      { pts: [[1100, 180], [180, 540]], speed: 88, pause: 1.0 }
    ],
    cameras: [
      { x: 320, y: 82, base: 90, sweep: 62, speed: 40 },
      { x: 960, y: 82, base: 90, sweep: 62, speed: 40 }
    ],
    loot: [
      { x: 640, y: 296, kind: "frog", label: "Jade frog", value: 500, main: true },
      { x: 1180, y: 150, kind: "gem", label: "Loose gem", value: 150, main: false }
    ],
    desk: null, vent: null
  },
  {
    name: "3 · Vault Corridor", brief: "Take the keycard from the desk, open the vault, take the Moonpetal.",
    hint: "Desk first, then vault. The vent walkway along the top skips the middle camera entirely.",
    start: { x: 80, y: 360 }, exit: { x: 1180, y: 620, w: 84, h: 56 },
    coins: 3, startAlarm: 0,
    blockers: [
      R(120, 170, 760, 16, "wall"),
      R(980, 240, 56, 240, "wall"),
      R(420, 470, 120, 40, "planter"), R(720, 470, 120, 40, "planter")
    ],
    shadows: [R(120, 92, 860, 62), R(180, 560, 240, 70), R(880, 560, 200, 70)],
    guards: [{ pts: [[500, 520], [900, 520]], speed: 80, pause: 1.2 }],
    cameras: [
      { x: 300, y: 260, base: 90, sweep: 55, speed: 42 },
      { x: 640, y: 260, base: 90, sweep: 55, speed: 42 },
      { x: 980, y: 260, base: 90, sweep: 55, speed: 42 }
    ],
    loot: [
      { x: 1140, y: 360, kind: "moonpetal", label: "The Moonpetal", value: 500, main: true, needsCard: true },
      { x: 240, y: 620, kind: "gem", label: "Loose gem", value: 150, main: false }
    ],
    desk: { x: 430, y: 330 },
    vent: { x: 120, y: 92, w: 860, h: 62 }
  },
  {
    name: "4 · Roof & Garden Gate", brief: "Empty the last display case and slip out through the garden gate.",
    hint: "The alarm starts a quarter full. Two treasures sit far off the direct route — worth it only on a clean run.",
    start: { x: 80, y: 640 }, exit: { x: 1180, y: 96, w: 84, h: 56 },
    coins: 4, startAlarm: 25,
    blockers: [
      R(610, 330, 60, 60, "plinth"),
      R(300, 250, 110, 44, "planter"), R(870, 250, 110, 44, "planter"),
      R(300, 520, 110, 44, "crate"), R(870, 520, 110, 44, "crate"),
      R(560, 470, 160, 40, "planter")
    ],
    shadows: [R(140, 120, 220, 70), R(920, 120, 220, 70), R(480, 590, 320, 60), R(120, 330, 150, 90), R(1010, 330, 150, 90)],
    guards: [
      { pts: [[220, 200], [1060, 200]], speed: 92, pause: 1.0 },
      { pts: [[220, 520], [1060, 520]], speed: 92, pause: 1.0 },
      { pts: [[640, 160], [640, 560]], speed: 84, pause: 1.4 }
    ],
    cameras: [
      { x: 340, y: 82, base: 90, sweep: 58, speed: 44 },
      { x: 640, y: 82, base: 90, sweep: 58, speed: 44 },
      { x: 940, y: 82, base: 90, sweep: 58, speed: 44 }
    ],
    loot: [
      { x: 640, y: 296, kind: "case", label: "Display-case jewel", value: 500, main: true },
      { x: 150, y: 150, kind: "gem", label: "Loose gem", value: 150, main: false },
      { x: 1130, y: 560, kind: "gem", label: "Loose gem", value: 150, main: false }
    ],
    desk: null, vent: null
  }
];
