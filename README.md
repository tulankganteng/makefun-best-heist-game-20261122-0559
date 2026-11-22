# Midnight Vault — a one-night heist

[![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/tulankganteng/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/tulankganteng/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A complete top-down stealth heist game for the
[make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559).
One thief, Rook, slips through the Halcyon Museum at night to steal the
Star Sapphire and reach the loading dock — past three patrolling guards
with sweeping vision cones, three wall cameras, and an alarm meter that
only forgives the unseen.

## How it plays

- **WASD / arrows** — move. **Shift** — sneak (slower, harder to spot).
- **E** — pick a lock (hold it; moving cancels). **Click** — throw a smoke
  pellet (3 per run, blocks every cone for 4 seconds). **Q** — EMP the
  cameras for 6 seconds (costs 100 points). **R** — restart. **Enter** — start.
- Grab the Star Sapphire from its pedestal, then reach the dock door.
  Side gems in the display cases are optional loot for the bold.
- Caught means the alarm hit 100% or a guard laid hands on you. Break line
  of sight to shake a chase — suspicion decays when you are unseen.

## Why it is a heist, not a maze

- **Three routes per room:** the open gallery, the crate-lined service
  corridor, and the pillar row — each with its own patrol timing.
- **Tools at a cost:** smoke is limited, the EMP costs score, the lockpick
  takes 1.2 seconds standing still in the open.
- **Cones you have to read:** guards pause at waypoints and scan; cameras
  sweep; suspicion is a visible ring, so a caught moment is always fair.
- **The getaway pays off the planning:** the dock door stays locked until
  the sapphire is yours, and the score rewards a fast, quiet run.

## Run it

```sh
node serve.ts
# open http://localhost:8080/ in a desktop browser
```

No build step, no network requests, no libraries — plain static files
under `game/`, all sound synthesized with WebAudio.

## Shots

`shots.json` lists the four deterministic frames under `screenshots/`:
the title, the mid-heist cover (thief, cones, cameras, loot and alarm in
one frame), the spotted chase, and the getaway. Each is a real render of
the game's own code via `?shot=<name>&seed=1`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).
