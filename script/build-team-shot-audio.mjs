#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sampleRate = 44100;
const duration = 1.15;
const profiles = {
  england:    { seed: 11, bass: 88,  flare: 330, noise: .42 },
  france:     { seed: 23, bass: 110, flare: 520, noise: .28 },
  germany:    { seed: 37, bass: 72,  flare: 260, noise: .62 },
  spain:      { seed: 41, bass: 98,  flare: 610, noise: .34 },
  portugal:   { seed: 53, bass: 82,  flare: 440, noise: .40 },
  brazil:     { seed: 67, bass: 124, flare: 690, noise: .36 },
  argentina:  { seed: 71, bass: 116, flare: 760, noise: .24 },
  usa:        { seed: 83, bass: 76,  flare: 390, noise: .58 },
  cape_verde: { seed: 97, bass: 92,  flare: 470, noise: .32 },
  norway:     { seed: 101,bass: 64,  flare: 820, noise: .30 },
  japan:      { seed: 113,bass: 132, flare: 900, noise: .18 },
};

function writeWav(team, profile) {
  const pcm = new Int16Array(Math.round(sampleRate * duration));
  let seed = profile.seed;
  let noise = 0;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff) * 2 - 1;

  for (let i = 0; i < pcm.length; i += 1) {
    const t = i / sampleRate;
    noise = noise * .84 + random() * .16;
    const impact = Math.exp(-23 * t) * (Math.sin(2 * Math.PI * profile.bass * t) + noise * profile.noise);
    const rush = noise * Math.min(1, t * 28) * Math.exp(-3.1 * t) * (.35 + profile.noise * .35);
    const tone = Math.sin(2 * Math.PI * (profile.flare - profile.flare * .38 * t) * t) * Math.exp(-5.2 * t) * .24;
    const shimmer = Math.sin(2 * Math.PI * (profile.flare * 1.51) * t) * Math.exp(-8 * t) * .08;
    const value = Math.max(-1, Math.min(1, impact * .64 + rush + tone + shimmer));
    pcm[i] = Math.round(value * 32767 * .76);
  }

  const wav = Buffer.alloc(44 + pcm.byteLength);
  wav.write("RIFF", 0); wav.writeUInt32LE(36 + pcm.byteLength, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36);
  wav.writeUInt32LE(pcm.byteLength, 40);
  for (let i = 0; i < pcm.length; i += 1) wav.writeInt16LE(pcm[i], 44 + i * 2);
  writeFileSync(join(output, `shot_${team}.wav`), wav);
}

const output = join(process.cwd(), "public/animal-cup/audio");
mkdirSync(output, { recursive: true });
for (const [team, profile] of Object.entries(profiles)) writeWav(team, profile);
console.log(`Built ${Object.keys(profiles).length} team-shot sounds in ${output}`);
