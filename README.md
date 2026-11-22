[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Erwinsp27/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Erwinsp27/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# The Glasshouse Caper

An entry for the make.fun bounty [“Make the best heist game”](https://make.fun/bounty/best-heist-game-20261122-0559).

Moth, a retired locksmith turned gentle thief, spends one quiet night in a
botanical glasshouse stealing back the Moonpetal, a stolen family jewel.
Four single-room wings, top-down stealth: guard vision cones, sweeping
camera arcs, shadow cover, an alarm meter, noise coins, and one smoke puff
per level. Take the main loot, reach the exit, keep the alarm low.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and
visit the printed address). No network, no build step, no external files.

- Move: WASD / arrow keys · Sneak: hold Shift
- Grab / open: E, or click on Moth beside loot, the desk, or the exit
- Noise coin: Q, or the Coin button (throws toward the mouse)
- Smoke puff: F, or the Smoke button — one per level
- Pause: P / Esc · Restart level: R · Mute: M · Menus: mouse or Enter

Losing a level restarts only that level. Finishing all four rooms ends with
the getaway and a closing screen with the total score and a rank in words.

Verified locally with a scripted play-through (`?shot=autotest`): all four
levels complete start to finish, the desk-to-vault errand works, the alarm
fills when Moth stands in a cone, and the caught screen restarts only the
level. Screenshots are real renders of this code at 1280×720.

## Files

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output folder and writes `dossier.json` with the kit library.
- `serve.ts` — a small static server for local play-testing.
- `game/index.html` — the opening page and canvas.
- `game/src/tuning.js` — every number and colour.
- `game/src/levels.js` — the four fixed room layouts.
- `game/src/vision.js` — guard patrols, vision cones, and camera arcs.
- `game/src/player.js` — movement, sneaking, grabbing, coins, and smoke.
- `game/src/alarm.js` — the alarm meter, scoring, bonuses, and ranks.
- `game/src/sound.js` — generated tones, mute state.
- `game/src/render.js` — all drawing: rooms, characters, HUD, screens.
- `game/src/shots.js` — staged screenshot scenes and a scripted play-through check.
- `game/src/main.js` — the game loop, screen states, and input.
- `vendor/makefun-game.ts` — the kit library, unchanged.
- `LICENSE` — MIT License.
