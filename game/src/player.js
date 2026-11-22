"use strict";
/* Player and tools: movement, sneaking, grabbing, noise coins, smoke. */
function collideMove(p, dx, dy, level) {
  const r = TUNE.PLAYER_R;
  const tryMove = function (nx, ny) {
    if (nx < TUNE.PLAY_LEFT + r || nx > TUNE.PLAY_RIGHT - r) return false;
    if (ny < TUNE.PLAY_TOP + r || ny > TUNE.PLAY_BOTTOM - r) return false;
    for (let i = 0; i < level.blockers.length; i++) {
      const b = level.blockers[i];
      if (nx + r > b.x && nx - r < b.x + b.w && ny + r > b.y && ny - r < b.y + b.h) return false;
    }
    return true;
  };
  if (tryMove(p.x + dx, p.y)) p.x += dx;
  if (tryMove(p.x, p.y + dy)) p.y += dy;
}
function playerStep(p, keys, dt, level) {
  let mx = 0, my = 0;
  if (keys.left) mx -= 1;
  if (keys.right) mx += 1;
  if (keys.up) my -= 1;
  if (keys.down) my += 1;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    const speed = keys.sneak ? TUNE.SNEAK_SPEED : TUNE.PLAYER_SPEED;
    const step = speed * dt;
    collideMove(p, mx / len * step, my / len * step, level);
    p.facing = Math.atan2(my, mx);
    p.moving = true;
  } else p.moving = false;
  p.sneaking = !!keys.sneak && p.moving;
}
function nearestLoot(p, level, state) {
  let best = null, bestD = 52;
  for (let i = 0; i < level.loot.length; i++) {
    const l = level.loot[i];
    if (state.taken[i]) continue;
    if (l.needsCard && !state.hasCard) continue;
    const d = Math.hypot(p.x - l.x, p.y - l.y);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
function nearDesk(p, level, state) {
  if (!level.desk || state.hasCard) return false;
  return Math.hypot(p.x - level.desk.x, p.y - level.desk.y) < 56;
}
function atExit(p, level) {
  const e = level.exit;
  return p.x >= e.x && p.x <= e.x + e.w && p.y >= e.y && p.y <= e.y + e.h;
}
function throwCoin(state, tx, ty) {
  if (state.coinsLeft <= 0 || state.coin) return false;
  state.coinsLeft -= 1;
  state.score = Math.max(0, state.score - TUNE.COIN_COST);
  state.coin = { x: state.player.x, y: state.player.y, tx: tx, ty: ty, t: 0, landed: false, ring: 0 };
  return true;
}
function coinStep(state, dt, guards) {
  const c = state.coin;
  if (!c) return;
  c.t += dt;
  if (!c.landed) {
    const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
    const step = 520 * dt;
    if (d <= step) { c.x = c.tx; c.y = c.ty; c.landed = true; }
    else { c.x += dx / d * step; c.y += dy / d * step; }
  } else {
    c.ring += dt * 60;
    if (c.ring > 46) { state.coin = null; return; }
    let best = null, bestD = 420;
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      if (g.state !== "patrol") continue;
      const d = Math.hypot(g.x - c.x, g.y - c.y);
      if (d < bestD) { bestD = d; best = g; }
    }
    if (best && !best.distracted) {
      best.state = "investigate";
      best.investigate = { x: c.x, y: c.y };
      best.investigateLeft = TUNE.COIN_INVESTIGATE;
      best.distracted = true;
    }
  }
}
function useSmoke(state) {
  if (state.smokeUsed || state.smoke) return false;
  state.smokeUsed = true;
  state.score = Math.max(0, state.score - TUNE.SMOKE_COST);
  state.smoke = { x: state.player.x, y: state.player.y, r: 92, t: TUNE.SMOKE_TIME };
  return true;
}
function smokeStep(state, dt) {
  if (!state.smoke) return;
  state.smoke.t -= dt;
  state.smoke.x = state.player.x; state.smoke.y = state.player.y;
  if (state.smoke.t <= 0) state.smoke = null;
}
