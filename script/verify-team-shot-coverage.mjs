#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { PLAYABLE_TEAMS } from "../app/data/teams.js";

const root = process.cwd();
const runtime = await readFile(join(root, "public/match-runtime-min/shot-fx.js"), "utf8");
const soundBank = await readFile(join(root, "app/audio/SoundBank.js"), "utf8");
const missing = [];
const effects = new Set();

for (const { id } of PLAYABLE_TEAMS) {
  const match = runtime.match(new RegExp(`${id}:\\s*\\{\\s*key:\\s*"([^"]+)"`));
  if (!match) {
    missing.push(`${id}: runtime profile`);
    continue;
  }
  if (effects.has(match[1])) missing.push(`${id}: duplicate effect key ${match[1]}`);
  effects.add(match[1]);

  if (id === "china") continue;
  for (const suffix of ["trail.png", "impact.png"]) {
    try {
      const image = join(root, `public/animal-cup/fx/team-shots/${id}-${suffix}`);
      await access(image);
      const meta = await sharp(image).metadata();
      const expected = suffix === "trail.png" ? [256, 128] : [128, 128];
      if (meta.width !== expected[0] || meta.height !== expected[1] || !meta.hasAlpha) {
        missing.push(`${id}: invalid ${suffix}`);
      }
    }
    catch { missing.push(`${id}: ${suffix}`); }
  }
  try {
    const audio = await readFile(join(root, `public/animal-cup/audio/shot_${id}.wav`));
    if (audio.length < 44 || audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE") {
      missing.push(`${id}: invalid audio`);
    }
  }
  catch { missing.push(`${id}: audio`); }
  if (!soundBank.includes(`"shot_${id}"`)) missing.push(`${id}: SoundBank registration`);
}

const result = {
  ok: missing.length === 0 && effects.size === PLAYABLE_TEAMS.length,
  playableTeams: PLAYABLE_TEAMS.length,
  uniqueEffects: effects.size,
  missing,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 1;
