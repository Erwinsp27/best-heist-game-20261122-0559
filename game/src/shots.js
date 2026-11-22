"use strict";
/* Staged screenshot scenes and a scripted play-through check, via ?shot=. */
function stageShots(G, ctx) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  if (!shot) return;
  const lv = function (i) { return LEVELS[i]; };
  if (shot === "title") {
    G.screen = "title";
  } else if (shot === "cover") {
    startLevel(1, false);
    G.screen = "play";
    G.state.player.x = 470; G.state.player.y = 380; G.state.player.facing = 0.4;
    G.state.alarm = 45; G.state.maxAlarm = 45;
    G.state.score = 650; G.state.levelScore = 650; G.state.elapsed = 47;
    G.state.taken = [false, false];
    G.state.coinsLeft = 2;
    G.guards[0].x = 420; G.guards[0].y = 260; G.guards[0].dir = 0.9;
    G.guards[1].x = 880; G.guards[1].y = 430; G.guards[1].dir = -2.4;
    G.cameras[0].angle = 1.35; G.cameras[1].angle = 1.75;
  } else if (shot === "vault") {
    startLevel(2, false);
    G.screen = "play";
    G.state.player.x = 430; G.state.player.y = 340; G.state.player.facing = 1.2;
    G.state.alarm = 18; G.state.maxAlarm = 22;
    G.state.score = 150; G.state.levelScore = 150; G.state.elapsed = 38;
    G.state.hasCard = false;
    G.state.smokeUsed = true;
    G.state.coin = { x: 470, y: 330, tx: 560, ty: 300, t: 0.3, landed: false, ring: 0 };
    G.state.smoke = { x: 430, y: 340, r: 92, t: 3 };
    G.guards[0].x = 700; G.guards[0].y = 520; G.guards[0].dir = 3.1;
    G.cameras[1].angle = 1.57; G.cameras[0].angle = 1.2; G.cameras[2].angle = 1.9;
  } else if (shot === "final") {
    G.totalScore = 2430; G.totalLoot = 6; G.totalCaught = 1;
    G.rank = "a masterful night";
    G.breakdown = [
      "1 · Foyer: 740 coins, 0:52, peak alarm 18%",
      "2 · Fern Gallery: 620 coins, 1:18, peak alarm 41%",
      "3 · Vault Corridor: 620 coins, 1:44, peak alarm 33%",
      "4 · Roof & Garden Gate: 450 coins, 1:31, peak alarm 52%"
    ];
    G.screen = "final";
  } else if (shot === "debugdesk") {
    startLevel(2, false);
    G.screen = "play";
    const out = [];
    G.state.player.x = 430; G.state.player.y = 330;
    out.push("nearDesk=" + nearDesk(G.state.player, LEVELS[2], G.state));
    doInteract();
    out.push("hasCard=" + G.state.hasCard);
    G.state.player.x = 1140; G.state.player.y = 360;
    out.push("nearestLoot=" + nearestLoot(G.state.player, LEVELS[2], G.state));
    doInteract();
    out.push("taken=" + JSON.stringify(G.state.taken) + " score=" + G.state.score);
    G.state.player.x = 1180; G.state.player.y = 620;
    out.push("atExit=" + atExit(G.state.player, LEVELS[2]) + " main=" + mainLootTaken(G.state, LEVELS[2]));
    updatePlay(1 / 60);
    out.push("screen=" + G.screen);
    const el = document.getElementById("testlog");
    if (el) { el.textContent = out.join("\n"); el.style.display = "block"; }
    window.__autoTest = out.join("\n");
    return;
  } else if (shot === "autotest") {
    runAutoTest(G);
    return;
  } else return;
  let paints = 0;
  const paintTwice = function () {
    const canvas = document.getElementById("game");
    const c2 = canvas.getContext("2d");
    renderFrame(c2, 1.2);
    paints += 1;
    if (paints >= 2) { document.title = "SHOT READY"; window.__shotReady = true; }
    else requestAnimationFrame(paintTwice);
  };
  requestAnimationFrame(paintTwice);
}
function autoWalk(G, targets, maxSteps) {
  const dt = 1 / 60;
  let steps = 0, log = [];
  const st = G.state;
  const startPt = { x: LEVELS[G.levelIndex].start.x, y: LEVELS[G.levelIndex].start.y };
  let fallback = startPt, retreating = false, calm = 0, smokeSteps = 0;
  let lastX = st.player.x, lastY = st.player.y, stuckCount = 0, nudgeLeft = 0, nudgeX = true;
  const seenNowFn = function () {
    return G.guards.some(function (g) { return guardSees(g, st.player.x, st.player.y, LEVELS[G.levelIndex], st.smoke).seen; }) ||
      G.cameras.some(function (c) { return cameraSees(c, st.player.x, st.player.y, LEVELS[G.levelIndex], st.smoke).seen; });
  };
  for (let ti = 0; ti < targets.length; ti++) {
    const tgt = targets[ti];
    let guard = 0, reached = false;
    while (guard < 4000) {
      guard += 1; steps += 1;
      if (steps > maxSteps) return { ok: false, log: log.concat(["step budget exceeded at target " + ti]) };
      if (G.screen === "caught") return { ok: false, log: log.concat(["caught at target " + ti]) };
      if (G.screen === "complete" || G.screen === "final") return { ok: true, log: log };
      if (G.screen !== "play") return { ok: false, log: log.concat(["left play at target " + ti + " screen=" + G.screen]) };
      const p = st.player;
      const seenNow = seenNowFn();
      if (seenNow && !retreating && st.alarm > (tgt.act === "loot" || tgt.act === "exit" ? 78 : 50)) retreating = true;
      if (!retreating && seenNow && (tgt.act === "loot" || tgt.act === "exit")) {
        const dx0 = tgt.x - p.x, dy0 = tgt.y - p.y;
        if (Math.hypot(dx0, dy0) > 52) { G.keys = {}; updatePlay(dt); continue; }
      }
      if (retreating) {
        if (!seenNow) calm += 1; else calm = 0;
        if (calm > 90 && st.alarm < 30) { retreating = false; calm = 0; }
        const fx = fallback.x - p.x, fy = fallback.y - p.y, fd = Math.hypot(fx, fy);
        if (fd < 20) G.keys = {};
        else G.keys = { left: fx < -8, right: fx > 8, up: fy < -8, down: fy > 8, sneak: false };
        if (seenNow) { smokeSteps += 1; if (smokeSteps > 60 && !st.smokeUsed && !st.smoke) useSmoke(st); }
        else smokeSteps = 0;
        updatePlay(dt);
        continue;
      }
      const dx = tgt.x - p.x, dy = tgt.y - p.y, d = Math.hypot(dx, dy);
      if (guard % 500 === 0) log.push("  iter " + guard + " t" + ti + " pos=" + Math.round(p.x) + "," + Math.round(p.y) + " alarm=" + Math.round(st.alarm) + " seen=" + seenNowFn() + " keys=" + JSON.stringify(G.keys));
      if (d < 16 && tgt.act !== "exit") { reached = true; break; }
      if (d < 3 && tgt.act === "exit") { reached = true; break; }
      const moved = Math.hypot(p.x - lastX, p.y - lastY);
      if (moved < 0.5) stuckCount += 1; else stuckCount = 0;
      lastX = p.x; lastY = p.y;
      if (stuckCount > 25 && nudgeLeft <= 0) { nudgeLeft = 90; nudgeX = Math.abs(dx) <= Math.abs(dy); }
      if (nudgeLeft > 0) {
        nudgeLeft -= 1; stuckCount = 0;
        G.keys = nudgeX ? { left: false, right: true, up: false, down: false, sneak: false }
                        : { left: false, right: false, up: false, down: true, sneak: false };
        updatePlay(dt);
        continue;
      }
      G.keys = { left: dx < -3, right: dx > 3, up: dy < -3, down: dy > 3, sneak: tgt.sneak === true };
      if (tgt.act === "desk" || tgt.act === "loot" || tgt.act === "exit") {
        if (d < 52) doInteract();
      }
      updatePlay(dt);
    }
    fallback = { x: tgt.x, y: tgt.y };
    log.push((reached ? "reached" : "STUCK") + " target " + ti + " (" + tgt.x + "," + tgt.y + ") alarm=" + Math.round(st.alarm) + " at=" + Math.round(st.player.x) + "," + Math.round(st.player.y) + " iters=" + guard + " retreating=" + retreating);
    if (G.screen === "complete" || G.screen === "final") break;
  }
  if (G.screen === "play" && targets.length && targets[targets.length - 1].act === "exit") updatePlay(dt);
  return { ok: G.screen === "complete" || G.screen === "final", log: log };
}
function runAutoTest(G) {
  const results = [];
  const plans = [
    [{ x: 200, y: 560 }, { x: 640, y: 560, sneak: true }, { x: 640, y: 620, act: "loot" }, { x: 300, y: 360 }, { x: 700, y: 240 }, { x: 1080, y: 180, act: "loot" }, { x: 1200, y: 120, act: "exit" }],
    [{ x: 200, y: 560 }, { x: 480, y: 600 }, { x: 640, y: 420 }, { x: 640, y: 296, act: "loot" }, { x: 900, y: 480 }, { x: 1200, y: 640, act: "exit" }],
    [{ x: 80, y: 200 }, { x: 80, y: 120 }, { x: 500, y: 120 }, { x: 900, y: 120 }, { x: 900, y: 240 }, { x: 430, y: 330, act: "desk" }, { x: 700, y: 240 }, { x: 1100, y: 240 }, { x: 1140, y: 360, act: "loot" }, { x: 1200, y: 620, act: "exit" }],
    [{ x: 200, y: 560 }, { x: 480, y: 560 }, { x: 640, y: 420 }, { x: 640, y: 296, act: "loot" }, { x: 900, y: 480 }, { x: 1150, y: 480 }, { x: 1130, y: 150, sneak: true }, { x: 1200, y: 120, act: "exit" }]
  ];
  for (let li = 0; li < 4; li++) {
    G.totalScore = 0; G.totalLoot = 0; G.totalCaught = 0; G.breakdown = [];
    startLevel(li, false);
    G.screen = "play";
    const r = autoWalk(G, plans[li], 30000);
    results.push("LEVEL " + (li + 1) + " " + (r.ok ? "PASS" : "FAIL") + " screen=" + G.screen + " score=" + G.state.score + " alarm=" + Math.round(G.state.alarm) + " card=" + G.state.hasCard + " taken=" + JSON.stringify(G.state.taken) + " player=" + Math.round(G.state.player.x) + "," + Math.round(G.state.player.y));
    for (let k = 0; k < r.log.length; k++) results.push(r.log[k]);
    if (r.ok && G.screen === "complete") pressButton("continue");
  }
  const el = document.getElementById("testlog");
  if (el) { el.textContent = results.join("\n"); el.style.display = "block"; }
  document.title = results.some(function (s) { return s.indexOf("FAIL") === 0 || s.indexOf(" FAIL") > 0; }) ? "AUTOTEST DONE" : "AUTOTEST DONE";
  window.__autoTest = results.join("\n");
}
