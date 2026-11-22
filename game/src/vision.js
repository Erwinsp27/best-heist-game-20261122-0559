"use strict";
/* Guards and cameras: patrols, vision cones, arcs, suspicion, distraction. */
function segHitsRect(x1, y1, x2, y2, r) {
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy], q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) { if (q[i] < 0) return false; }
    else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
  }
  return true;
}
function losBlocked(x1, y1, x2, y2, level) {
  const obs = level.blockers;
  for (let i = 0; i < obs.length; i++) if (segHitsRect(x1, y1, x2, y2, obs[i])) return true;
  return false;
}
function pointInRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function inShadow(x, y, level) {
  for (let i = 0; i < level.shadows.length; i++) if (pointInRect(x, y, level.shadows[i])) return true;
  return false;
}
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function makeGuard(def) {
  return {
    pts: def.pts, speed: def.speed, pause: def.pause,
    x: def.pts[0][0], y: def.pts[0][1], target: 1, dir: 0,
    pauseLeft: 0, scanPhase: 0, state: "patrol", grace: 0,
    investigate: null, investigateLeft: 0, lastSeen: null, noticed: false, flash: 0
  };
}
function makeCamera(def) {
  return { x: def.x, y: def.y, base: def.base * Math.PI / 180, sweep: def.sweep * Math.PI / 180, speed: def.speed * Math.PI / 180, phase: 0, angle: def.base * Math.PI / 180, spotted: false, flash: 0 };
}
function guardStep(g, dt, level) {
  g.flash = Math.max(0, g.flash - dt);
  if (g.state === "investigate") {
    g.investigateLeft -= dt;
    if (g.investigateLeft <= 0) { g.state = "patrol"; g.investigate = null; }
    else if (g.investigate) { moveToward(g, g.investigate.x, g.investigate.y, TUNE.GUARD_SPEED, dt); }
    return;
  }
  if (g.state === "chase" && g.lastSeen) {
    const d = moveToward(g, g.lastSeen.x, g.lastSeen.y, TUNE.GUARD_SPEED, dt);
    if (d < 10) { g.state = "patrol"; g.lastSeen = null; }
    return;
  }
  const tgt = g.pts[g.target];
  if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    g.scanPhase += dt;
    g.dir += Math.sin(g.scanPhase * 2.2) * 0.9 * dt;
    return;
  }
  const d = moveToward(g, tgt[0], tgt[1], g.speed, dt);
  if (d < 6) {
    g.target = (g.target + 1) % g.pts.length;
    g.pauseLeft = g.pause;
    g.scanPhase = 0;
  }
}
function moveToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d > 0.5) {
    const step = Math.min(d, speed * dt);
    g.x += dx / d * step; g.y += dy / d * step;
    g.dir = Math.atan2(dy, dx);
  }
  return d;
}
function guardSees(g, px, py, level, smoke) {
  if (smoke && Math.hypot(px - smoke.x, py - smoke.y) < smoke.r) return { seen: false, strength: 0 };
  const dx = px - g.x, dy = py - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > TUNE.CONE_RANGE) return { seen: false, strength: 0 };
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, g.dir)) > TUNE.CONE_HALF) return { seen: false, strength: 0 };
  if (losBlocked(g.x, g.y, px, py, level)) return { seen: false, strength: 0 };
  if (inShadow(px, py, level) && dist > TUNE.SHADOW_HIDE_DIST) return { seen: false, strength: 0 };
  const strength = 1.15 - dist / TUNE.CONE_RANGE;
  return { seen: true, strength: strength };
}
function cameraStep(c, dt) {
  c.phase += dt;
  c.angle = c.base + Math.sin(c.phase * c.speed) * c.sweep;
  c.flash = Math.max(0, c.flash - dt);
}
function cameraSees(c, px, py, level, smoke) {
  if (smoke && Math.hypot(px - smoke.x, py - smoke.y) < smoke.r) return { seen: false, strength: 0 };
  const dx = px - c.x, dy = py - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist > TUNE.CAM_RANGE) return { seen: false, strength: 0 };
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, c.angle)) > TUNE.CAM_HALF) return { seen: false, strength: 0 };
  if (losBlocked(c.x, c.y, px, py, level)) return { seen: false, strength: 0 };
  if (inShadow(px, py, level) && dist > TUNE.SHADOW_HIDE_DIST) return { seen: false, strength: 0 };
  return { seen: true, strength: 1.2 - dist / TUNE.CAM_RANGE };
}
