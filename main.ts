// Midnight Vault — the hand-in program (Node 22, standard library only).
// It copies this repository's game/ and screenshots/ into the output
// directory and writes the dossier.json the judge reads, using the
// vendored make.fun library. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside this machine MAKEFUN_OUTPUT_DIR is /output, set by the grader.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  // Fail loudly instead of handing in half a game.
  if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
    throw new Error('game/index.html is missing — nothing to hand in');
  }
  mkdirSync(outDir, { recursive: true });

  // The game: plain static files, no build step, no network requests.
  cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });

  // The screenshots: real renders of the game's own code, first is cover.
  const shots = join(repoRoot, 'screenshots');
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(shots)) {
    cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
  }

  // The dossier, exactly as the vendored library writes it from game/ and
  // screenshots/ — the gate rebuilds it and compares byte for byte.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  // A one-line receipt on stdout so the hand-in is visible in the log.
  console.log(`Midnight Vault handed in to ${outDir} (${dossier.length} byte dossier)`);
}

handIn();
