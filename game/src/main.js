"use strict";
/* Main: game loop, screen states, input, and the rules that tie it together. */
const G = {
  screen: "title", levelIndex: 0, guards: [], cameras: [],
  state: null, totalScore: 0, totalLoot: 0, totalLootMax: 0, totalCaught: 0,
  breakdown: [], rank: "", caughtBy: "", buttons: [], keys: {},
  mouse: { x: 0, y: 0 }, lastSeenBy: "", highlight: 0
};
for (let i = 0; i < LEVELS.length; i++) G.totalLootMax += LEVELS[i].loot.length;
function newState(levelIndex) {
  const lv = LEVELS[levelIndex];
  return {
    player: { x: lv.start.x, y: lv.start.y, facing: 0, moving: false, sneaking: false },
    alarm: lv.startAlarm, maxAlarm: lv.startAlarm, alarmWarned: false,
    score: 0, levelScore: 0, levelScoreShown: 0, elapsed: 0,
    taken: lv.loot.map(() => false), hasCard: false,
    coinsLeft: lv.coins, smokeUsed: false, smoke: null, coin: null,
    caughtCount: 0, retries: 0
  };
}
function startLevel(i, retry) {
  G.levelIndex = i;
  G.state = newState(i);
  if (retry) G.state.levelScore = -TUNE.RETRY_COST;
  G.guards = LEVELS[i].guards.map(makeGuard);
  G.cameras = LEVELS[i].cameras.map(makeCamera);
  G.screen = "intro";
}
function mainLootTaken(state, level) {
  for (let i = 0; i < level.loot.length; i++) if (level.loot[i].main && state.taken[i]) return true;
  return false;
}
function doInteract() {
  const st = G.state, lv = LEVELS[G.levelIndex];
  if (nearDesk(st.player, lv, st)) {
    st.hasCard = true;
    Sound.pickup();
    G.caughtBy = "";
    return;
  }
  const idx = nearestLoot(st.player, lv, st);
  if (idx !== null) {
    st.taken[idx] = true;
    st.levelScore += lv.loot[idx].value;
    st.score += lv.loot[idx].value;
    Sound.pickup();
    return;
  }
  if (atExit(st.player, lv) && mainLootTaken(st, lv)) finishLevel();
}
function finishLevel() {
  const st = G.state, lv = LEVELS[G.levelIndex];
  st.levelScoreShown = levelScore(st, lv, st.elapsed);
  st.score = st.levelScoreShown;
  G.totalScore += st.levelScoreShown;
  G.totalLoot += st.taken.filter(Boolean).length;
  G.totalCaught += st.caughtCount;
  G.breakdown.push(lv.name + ": " + st.levelScoreShown + " coins, " + fmtTime(st.elapsed) + ", peak alarm " + Math.round(st.maxAlarm) + "%");
  Sound.win();
  if (G.levelIndex === LEVELS.length - 1) {
    G.rank = rankFor(G.totalScore, G.totalCaught);
    G.screen = "final";
  } else {
    G.screen = "complete";
  }
}
function caught(seenBy) {
  const st = G.state;
  st.caughtCount += 1;
  G.caughtBy = seenBy;
  Sound.caught();
  G.screen = "caught";
}
function updatePlay(dt) {
  const st = G.state, lv = LEVELS[G.levelIndex];
  st.elapsed += dt;
  playerStep(st.player, G.keys, dt, lv);
  for (let i = 0; i < G.guards.length; i++) guardStep(G.guards[i], dt, lv);
  for (let i = 0; i < G.cameras.length; i++) cameraStep(G.cameras[i], dt);
  coinStep(st, dt, G.guards);
  smokeStep(st, dt);
  let strength = 0, seer = "";
  for (let i = 0; i < G.guards.length; i++) {
    const g = G.guards[i];
    const v = guardSees(g, st.player.x, st.player.y, lv, st.smoke);
    if (v.seen) {
      if (g.state === "patrol" && g.grace <= 0 && !g.noticed) {
        g.grace = TUNE.GRACE_TIME; g.noticed = true; g.flash = 0.5; Sound.warn();
      }
      if (g.grace > 0) {
        g.grace -= dt;
        if (g.grace <= 0 && g.state === "patrol") {
          g.state = "chase"; g.lastSeen = { x: st.player.x, y: st.player.y }; g.flash = 0.5;
        }
      }
      if (g.state === "chase") { g.lastSeen = { x: st.player.x, y: st.player.y }; }
      strength += v.strength;
      seer = "A guard's vision cone spotted Moth in the open.";
    } else {
      if (g.grace > 0) g.grace = Math.max(0, g.grace - dt * 2);
      if (g.grace <= 0) g.noticed = false;
    }
    if (g.state === "chase") {
      const d = Math.hypot(st.player.x - g.x, st.player.y - g.y);
      if (d < 30 && !v.seen) { /* guard reaches last seen spot, resumes patrol in guardStep */ }
      if (d < 130 && !st.smoke) strength += 0.7;
    }
  }
  for (let i = 0; i < G.cameras.length; i++) {
    const c = G.cameras[i];
    const v = cameraSees(c, st.player.x, st.player.y, lv, st.smoke);
    if (v.seen) {
      if (!c.spotted) { c.spotted = true; c.flash = 0.5; Sound.warn(); }
      strength += v.strength;
      seer = "A camera's red arc swept across Moth.";
    } else c.spotted = false;
  }
  G.lastSeenBy = seer;
  const sneaking = st.player.sneaking;
  if (alarmStep(st, dt, strength, sneaking)) {
    caught(seer || "The alarm filled completely.");
    return;
  }
  if (atExit(st.player, lv) && mainLootTaken(st, lv)) finishLevel();
}
function pressButton(id) {
  Sound.ensure(); Sound.click();
  if (id === "start") { G.totalScore = 0; G.totalLoot = 0; G.totalCaught = 0; G.breakdown = []; startLevel(0, false); }
  else if (id === "begin") G.screen = "play";
  else if (id === "resume") G.screen = "play";
  else if (id === "restart") { const c = G.state.caughtCount; startLevel(G.levelIndex, true); G.state.caughtCount = c; G.screen = "play"; }
  else if (id === "mute") Sound.toggleMute();
  else if (id === "retry") { const c = G.state.caughtCount; startLevel(G.levelIndex, true); G.state.caughtCount = c; G.state.levelScore = Math.max(0, G.state.levelScore - 0); G.screen = "play"; G.state.score = 0; }
  else if (id === "continue") { startLevel(G.levelIndex + 1, false); }
  else if (id === "again") { G.totalScore = 0; G.totalLoot = 0; G.totalCaught = 0; G.breakdown = []; G.screen = "title"; }
  else if (id === "coin") { if (G.screen === "play") throwCoin(G.state, G.mouse.x, G.mouse.y); }
  else if (id === "smoke") { if (G.screen === "play") useSmoke(G.state); }
  else if (id === "pause") { if (G.screen === "play") G.screen = "pause"; }
}
function keyName(e) {
  const k = e.key;
  if (k === "w" || k === "W" || k === "ArrowUp") return "up";
  if (k === "s" || k === "S" || k === "ArrowDown") return "down";
  if (k === "a" || k === "A" || k === "ArrowLeft") return "left";
  if (k === "d" || k === "D" || k === "ArrowRight") return "right";
  return null;
}
function setupInput(canvas) {
  window.addEventListener("keydown", function (e) {
    Sound.ensure();
    const dir = keyName(e);
    if (dir) { G.keys[dir] = true; e.preventDefault(); }
    if (e.key === "Shift") G.keys.sneak = true;
    if (e.key === "e" || e.key === "E") { if (G.screen === "play") doInteract(); }
    if (e.key === "q" || e.key === "Q") { if (G.screen === "play") throwCoin(G.state, G.mouse.x, G.mouse.y); }
    if (e.key === "f" || e.key === "F") { if (G.screen === "play") useSmoke(G.state); }
    if (e.key === "m" || e.key === "M") Sound.toggleMute();
    if (e.key === "r" || e.key === "R") { if (G.screen === "play" || G.screen === "pause") pressButton("restart"); }
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (G.screen === "play") G.screen = "pause";
      else if (G.screen === "pause") G.screen = "play";
    }
    if (e.key === "Enter" || e.key === " ") {
      if (G.buttons.length && G.screen !== "play") pressButton(G.buttons[0].id);
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", function (e) {
    const dir = keyName(e);
    if (dir) G.keys[dir] = false;
    if (e.key === "Shift") G.keys.sneak = false;
  });
  canvas.addEventListener("mousemove", function (e) {
    const r = canvas.getBoundingClientRect();
    G.mouse.x = (e.clientX - r.left) * (TUNE.W / r.width);
    G.mouse.y = (e.clientY - r.top) * (TUNE.H / r.height);
  });
  canvas.addEventListener("click", function (e) {
    Sound.ensure();
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (TUNE.W / r.width);
    const y = (e.clientY - r.top) * (TUNE.H / r.height);
    G.mouse.x = x; G.mouse.y = y;
    for (let i = 0; i < G.buttons.length; i++) {
      const b = G.buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { pressButton(b.id); return; }
    }
    if (G.screen === "play" && G.state) {
      const p = G.state.player;
      if (Math.hypot(x - p.x, y - p.y) < 44) doInteract();
    }
  });
}
function renderFrame(ctx, t) {
  if (G.screen === "title") drawTitle(ctx, G);
  else if (G.screen === "intro") { drawWorld(ctx, G, t); drawIntro(ctx, G); }
  else if (G.screen === "play") { drawWorld(ctx, G, t); drawHUD(ctx, G); }
  else if (G.screen === "pause") { drawWorld(ctx, G, t); drawHUD(ctx, G); drawPause(ctx, G); }
  else if (G.screen === "caught") { drawWorld(ctx, G, t); drawHUD(ctx, G); drawCaught(ctx, G); }
  else if (G.screen === "complete") { drawWorld(ctx, G, t); drawHUD(ctx, G); drawLevelComplete(ctx, G); }
  else if (G.screen === "final") drawFinal(ctx, G);
}
function boot() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  G.state = newState(0);
  G.guards = LEVELS[0].guards.map(makeGuard);
  G.cameras = LEVELS[0].cameras.map(makeCamera);
  setupInput(canvas);
  let last = performance.now();
  let t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; t += dt;
    if (G.screen === "play") updatePlay(dt);
    renderFrame(ctx, t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  stageShots(G, ctx);
}
window.addEventListener("DOMContentLoaded", boot);
window.GH = G;
