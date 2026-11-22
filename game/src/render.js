"use strict";
/* Drawing: the room, characters, cones and arcs, HUD, and every screen. */
function drawCone(ctx, x, y, dir, range, half, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function drawRoom(ctx, level, t) {
  const C = TUNE.COL;
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, TUNE.HUD_H, TUNE.W, TUNE.H - TUNE.HUD_H);
  ctx.fillStyle = C.floor2;
  for (let x = 0; x < TUNE.W; x += 80) for (let y = TUNE.HUD_H; y < TUNE.H; y += 80) {
    if (((x + y) / 80) % 2 === 0) ctx.fillRect(x, y, 80, 80);
  }
  ctx.fillStyle = "rgba(159, 200, 216, 0.10)";
  for (let x = 40; x < TUNE.W; x += 160) ctx.fillRect(x, TUNE.HUD_H + 4, 110, 26);
  ctx.strokeStyle = C.glassLine; ctx.lineWidth = 1;
  for (let x = 40; x < TUNE.W; x += 160) ctx.strokeRect(x, TUNE.HUD_H + 4, 110, 26);
  for (let i = 0; i < level.shadows.length; i++) {
    const s = level.shadows[i];
    ctx.fillStyle = C.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(s.x, s.y, s.w, 4);
  }
  const e = level.exit;
  ctx.fillStyle = "#3f8a66";
  ctx.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  ctx.fillStyle = "#dff5e8";
  ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("EXIT", e.x + e.w / 2, e.y + e.h / 2);
  if (level.desk) {
    ctx.fillStyle = "#8a6d3b";
    ctx.fillRect(level.desk.x - 34, level.desk.y - 20, 68, 40);
    ctx.fillStyle = "#f4f1e6";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("DESK", level.desk.x, level.desk.y);
  }
  for (let i = 0; i < level.blockers.length; i++) {
    const b = level.blockers[i];
    ctx.fillStyle = b.kind === "planter" ? C.planter : b.kind === "plinth" ? C.plinth : b.kind === "wall" ? C.wall : C.crate;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    if (b.kind === "planter") {
      ctx.fillStyle = "#4da35e";
      const sway = Math.sin(t * 1.4 + b.x) * 3;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.arc(b.x + 14 + k * 26 + sway, b.y + 14, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.strokeStyle = C.wall; ctx.lineWidth = 16;
  ctx.strokeRect(8, TUNE.HUD_H + 8, TUNE.W - 16, TUNE.H - TUNE.HUD_H - 16);
}
function drawLoot(ctx, level, state, t) {
  const C = TUNE.COL;
  for (let i = 0; i < level.loot.length; i++) {
    if (state.taken[i]) continue;
    const l = level.loot[i];
    const pulse = 0.6 + 0.4 * Math.sin(t * 3 + i);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.25 * pulse;
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(l.x, l.y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = l.main ? C.goldHot : C.gold;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - 13); ctx.lineTo(l.x + 10, l.y); ctx.lineTo(l.x, l.y + 13); ctx.lineTo(l.x - 10, l.y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#7a5a12"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#3a2c08";
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(l.label, l.x, l.y - 22);
  }
}
function drawGuards(ctx, guards, level, state) {
  const C = TUNE.COL;
  for (let i = 0; i < guards.length; i++) {
    const g = guards[i];
    const hot = g.flash > 0 || g.state === "chase";
    drawCone(ctx, g.x, g.y, g.dir, TUNE.CONE_RANGE, TUNE.CONE_HALF, hot ? C.coneHot : C.cone);
    ctx.fillStyle = C.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, TUNE.GUARD_R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#10151a"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.guardCap;
    ctx.beginPath(); ctx.arc(g.x, g.y - 4, 10, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#10151a"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + Math.cos(g.dir) * 24, g.y + Math.sin(g.dir) * 24); ctx.stroke();
    if (g.grace > 0 || g.state === "chase") {
      ctx.fillStyle = "#ffd23f";
      ctx.font = "bold 30px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText("!", g.x, g.y - 30);
    }
  }
}
function drawCameras(ctx, cameras) {
  const C = TUNE.COL;
  for (let i = 0; i < cameras.length; i++) {
    const c = cameras[i];
    drawCone(ctx, c.x, c.y, c.angle, TUNE.CAM_RANGE, TUNE.CAM_HALF, c.flash > 0 ? C.camHot : C.camArc);
    ctx.fillStyle = C.cam;
    ctx.fillRect(c.x - 12, c.y - 9, 24, 18);
    ctx.strokeStyle = "#10151a"; ctx.lineWidth = 2; ctx.strokeRect(c.x - 12, c.y - 9, 24, 18);
    ctx.fillStyle = c.flash > 0 ? "#ff5a3c" : "#d94f3d";
    ctx.beginPath(); ctx.arc(c.x + Math.cos(c.angle) * 6, c.y + Math.sin(c.angle) * 6, 4, 0, Math.PI * 2); ctx.fill();
  }
}
function drawPlayer(ctx, p, state) {
  const C = TUNE.COL;
  if (state.smoke) {
    ctx.fillStyle = C.smoke;
    ctx.beginPath(); ctx.arc(state.smoke.x, state.smoke.y, state.smoke.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = C.player;
  ctx.beginPath(); ctx.arc(p.x, p.y, TUNE.PLAYER_R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = C.scarf; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(p.x, p.y, 8, p.facing - 0.9, p.facing + 0.9); ctx.stroke();
  ctx.strokeStyle = "#eef3f6"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(p.facing) * 19, p.y + Math.sin(p.facing) * 19); ctx.stroke();
  if (p.sneaking) {
    ctx.fillStyle = C.dim;
    ctx.font = "13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("sneaking", p.x, p.y - 22);
  }
}
function drawHUD(ctx, G) {
  const C = TUNE.COL, st = G.state, lv = LEVELS[G.levelIndex];
  ctx.fillStyle = "#0a1a14";
  ctx.fillRect(0, 0, TUNE.W, TUNE.HUD_H);
  ctx.fillStyle = C.text;
  ctx.font = "bold 19px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  const taken = st.taken.filter(Boolean).length;
  ctx.fillText(lv.name + "   Loot " + taken + "/" + lv.loot.length + "   Score " + st.score, 16, 22);
  ctx.fillText("Coins Q: " + st.coinsLeft + "   Smoke F: " + (st.smokeUsed ? "used" : "ready") + "   Time " + fmtTime(st.elapsed), 16, 46);
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("ALARM", 880, 20);
  const bx = 880, bw = 236;
  ctx.fillStyle = "#243528";
  ctx.fillRect(bx, 32, bw, 20);
  const col = st.alarm < 40 ? C.alarmOk : st.alarm < 75 ? C.alarmMid : C.alarmBad;
  ctx.fillStyle = col;
  ctx.fillRect(bx, 32, bw * st.alarm / 100, 20);
  ctx.strokeStyle = "#000"; ctx.strokeRect(bx, 32, bw, 20);
  ctx.fillStyle = C.text;
  ctx.fillText(Math.round(st.alarm) + "%", 1124, 42);
  G.buttons = [
    { id: "coin", x: 640, y: 8, w: 96, h: 48, label: "Coin (Q)" },
    { id: "smoke", x: 744, y: 8, w: 96, h: 48, label: "Smoke (F)" },
    { id: "pause", x: 1196, y: 8, w: 72, h: 48, label: "Pause" }
  ];
  for (const b of G.buttons) {
    ctx.fillStyle = C.button;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = "#000"; ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
  }
  if (G.levelIndex === 0) {
    ctx.fillStyle = "rgba(8,24,19,0.85)";
    ctx.fillRect(16, TUNE.H - 34, 900, 26);
    ctx.fillStyle = C.dim; ctx.font = "15px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Legend: green shadow = safe cover · pale cone = guard sight · red arc = camera · gold = loot", 24, TUNE.H - 21);
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = TUNE.COL.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#3f8a66"; ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}
function bigButton(ctx, b, hi) {
  ctx.fillStyle = hi ? TUNE.COL.buttonHi : TUNE.COL.button;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "#fff"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
}
function drawTitle(ctx, G) {
  const C = TUNE.COL;
  drawRoom(ctx, LEVELS[1], 0);
  ctx.fillStyle = "rgba(6, 18, 13, 0.72)";
  ctx.fillRect(0, TUNE.HUD_H, TUNE.W, TUNE.H - TUNE.HUD_H);
  panel(ctx, 290, 110, 700, 500);
  ctx.fillStyle = C.goldHot; ctx.font = "bold 52px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillText("The Glasshouse Caper", 640, 180);
  ctx.fillStyle = C.text; ctx.font = "18px sans-serif";
  ctx.fillText("Moth steals back the Moonpetal from a moonlit glasshouse — and hurts nobody.", 640, 216);
  ctx.font = "18px sans-serif"; ctx.fillStyle = C.dim;
  const lines = [
    "Move: WASD / arrows · Sneak: hold Shift · Grab / open: E or click near loot",
    "Noise coin: Q or Coin button · Smoke: F or Smoke button · Pause: P / Esc",
    "Restart level: R · Mute: M · Menus: mouse click or Enter",
    "Sound starts on your first key press or click."
  ];
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 640, 252 + i * 28);
  G.buttons = [{ id: "start", x: 490, y: 400, w: 300, h: 60, label: "Start the night (Enter)" }];
  bigButton(ctx, G.buttons[0], true);
  ctx.fillStyle = C.dim; ctx.font = "16px sans-serif";
  ctx.fillText("Four rooms. Take the main loot, reach the exit, keep the alarm low.", 640, 500);
  ctx.fillText("Best played with keyboard and mouse, offline, in a desktop browser.", 640, 528);
}
function drawIntro(ctx, G) {
  const lv = LEVELS[G.levelIndex];
  ctx.fillStyle = "rgba(6, 18, 13, 0.78)";
  ctx.fillRect(0, 0, TUNE.W, TUNE.H);
  panel(ctx, 340, 170, 600, 380);
  const C = TUNE.COL;
  ctx.fillStyle = C.goldHot; ctx.font = "bold 38px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(lv.name, 640, 230);
  ctx.fillStyle = C.text; ctx.font = "20px sans-serif";
  ctx.fillText(lv.brief, 640, 272);
  ctx.fillStyle = C.dim; ctx.font = "18px sans-serif";
  ctx.fillText(lv.hint, 640, 306);
  ctx.fillText("WASD move · Shift sneak · E grab · Q coin · F smoke · P pause", 640, 344);
  G.buttons = [{ id: "begin", x: 490, y: 400, w: 300, h: 60, label: "Begin (Enter)" }];
  bigButton(ctx, G.buttons[0], true);
}
function drawPause(ctx, G) {
  ctx.fillStyle = "rgba(6, 18, 13, 0.7)";
  ctx.fillRect(0, 0, TUNE.W, TUNE.H);
  panel(ctx, 390, 170, 500, 380);
  ctx.fillStyle = TUNE.COL.text; ctx.font = "bold 40px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Paused", 640, 230);
  ctx.font = "18px sans-serif"; ctx.fillStyle = TUNE.COL.dim;
  ctx.fillText("WASD move · Shift sneak · E grab · Q coin · F smoke · R restart · M mute", 640, 272);
  G.buttons = [
    { id: "resume", x: 490, y: 320, w: 300, h: 54, label: "Resume (Enter)" },
    { id: "restart", x: 490, y: 386, w: 300, h: 54, label: "Restart level (R)" },
    { id: "mute", x: 490, y: 452, w: 300, h: 54, label: Sound.muted ? "Unmute (M)" : "Mute (M)" }
  ];
  for (let i = 0; i < G.buttons.length; i++) bigButton(ctx, G.buttons[i], i === 0);
}
function drawCaught(ctx, G) {
  ctx.fillStyle = "rgba(30, 8, 6, 0.78)";
  ctx.fillRect(0, 0, TUNE.W, TUNE.H);
  panel(ctx, 340, 170, 600, 380);
  ctx.fillStyle = "#ff8a70"; ctx.font = "bold 40px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Caught!", 640, 230);
  ctx.fillStyle = TUNE.COL.text; ctx.font = "20px sans-serif";
  ctx.fillText(G.caughtBy || "The alarm filled completely.", 640, 272);
  ctx.fillStyle = TUNE.COL.dim; ctx.font = "18px sans-serif";
  ctx.fillText("Only this level restarts. Wait for the cone to pass, then cross.", 640, 306);
  ctx.fillText("Hint: shadow hides you, sneaking slows the alarm, a coin pulls a guard away.", 640, 334);
  G.buttons = [{ id: "retry", x: 490, y: 400, w: 300, h: 60, label: "Try again (Enter)" }];
  bigButton(ctx, G.buttons[0], true);
}
function drawLevelComplete(ctx, G) {
  const lv = LEVELS[G.levelIndex];
  ctx.fillStyle = "rgba(6, 18, 13, 0.78)";
  ctx.fillRect(0, 0, TUNE.W, TUNE.H);
  panel(ctx, 340, 150, 600, 420);
  ctx.fillStyle = TUNE.COL.goldHot; ctx.font = "bold 38px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Room cleared!", 640, 210);
  ctx.fillStyle = TUNE.COL.text; ctx.font = "20px sans-serif";
  ctx.fillText(lv.name + " — loot " + G.state.taken.filter(Boolean).length + "/" + lv.loot.length, 640, 252);
  ctx.fillText("Time " + fmtTime(G.state.elapsed) + " · Level score " + G.state.levelScoreShown, 640, 284);
  ctx.fillText("Peak alarm " + Math.round(G.state.maxAlarm) + "% · Caught " + G.state.caughtCount + " time(s)", 640, 316);
  ctx.fillStyle = TUNE.COL.dim; ctx.font = "18px sans-serif";
  ctx.fillText(G.levelIndex === 2 ? "The Moonpetal is yours. One last crossing to the gate." : "Next room: press Continue.", 640, 350);
  G.buttons = [{ id: "continue", x: 490, y: 410, w: 300, h: 60, label: "Continue (Enter)" }];
  bigButton(ctx, G.buttons[0], true);
}
function drawFinal(ctx, G) {
  const C = TUNE.COL;
  ctx.fillStyle = "#0e2a24";
  ctx.fillRect(0, 0, TUNE.W, TUNE.H);
  ctx.fillStyle = "#274b3f";
  ctx.fillRect(0, 470, TUNE.W, 250);
  ctx.fillStyle = "#8a97a3";
  ctx.fillRect(420, 430, 440, 110);
  ctx.fillStyle = "#5a6b7a";
  ctx.fillRect(450, 450, 130, 60);
  ctx.fillStyle = "#9fc8d8";
  ctx.fillRect(600, 450, 200, 60);
  ctx.fillStyle = "#1c2229";
  ctx.beginPath(); ctx.arc(500, 550, 34, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(780, 550, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.goldHot; ctx.font = "bold 34px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("The van pulls away. Moth is gone.", 640, 120);
  ctx.fillStyle = C.text; ctx.font = "bold 44px sans-serif";
  ctx.fillText("The Glasshouse Caper — complete!", 640, 180);
  ctx.font = "22px sans-serif";
  ctx.fillText("Total score " + G.totalScore + " · Treasures " + G.totalLoot + "/" + G.totalLootMax + " · Caught " + G.totalCaught + " time(s)", 640, 230);
  ctx.fillText("The night was " + G.rank + ".", 640, 266);
  for (let i = 0; i < G.breakdown.length; i++) {
    ctx.font = "19px sans-serif"; ctx.fillStyle = C.dim;
    ctx.fillText(G.breakdown[i], 640, 300 + i * 28);
  }
  G.buttons = [{ id: "again", x: 490, y: 600, w: 300, h: 60, label: "Play again (Enter)" }];
  bigButton(ctx, G.buttons[0], true);
}
function drawWorld(ctx, G, t) {
  const lv = LEVELS[G.levelIndex];
  drawRoom(ctx, lv, t);
  drawGuards(ctx, G.guards, lv, G.state);
  drawCameras(ctx, G.cameras);
  drawLoot(ctx, lv, G.state, t);
  if (G.state.coin) {
    ctx.fillStyle = "#f2c14e";
    ctx.beginPath(); ctx.arc(G.state.coin.x, G.state.coin.y, 6, 0, Math.PI * 2); ctx.fill();
    if (G.state.coin.landed) {
      ctx.strokeStyle = "rgba(242,193,78,0.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(G.state.coin.x, G.state.coin.y, G.state.coin.ring, 0, Math.PI * 2); ctx.stroke();
    }
  }
  drawPlayer(ctx, G.state.player, G.state);
}
