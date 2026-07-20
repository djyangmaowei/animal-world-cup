#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const sampleRate = 44100;
const duration = 1.15;
const pcm = new Int16Array(Math.round(sampleRate * duration));
let seed = 0x46495245;
let noise = 0;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff) * 2 - 1;

for (let i = 0; i < pcm.length; i += 1) {
  const t = i / sampleRate;
  noise = noise * .82 + random() * .18;
  const impact = Math.exp(-24 * t) * (Math.sin(2 * Math.PI * 92 * t) + noise * .7);
  const whoosh = noise * Math.min(1, t * 24) * Math.exp(-2.8 * t) * .55;
  const flare = Math.sin(2 * Math.PI * (420 - 220 * t) * t) * Math.exp(-5.5 * t) * .22;
  const value = Math.max(-1, Math.min(1, impact * .65 + whoosh + flare));
  pcm[i] = Math.round(value * 32767 * .78);
}

const wav = Buffer.alloc(44 + pcm.byteLength);
wav.write("RIFF", 0); wav.writeUInt32LE(36 + pcm.byteLength, 4); wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36);
wav.writeUInt32LE(pcm.byteLength, 40);
for (let i = 0; i < pcm.length; i += 1) wav.writeInt16LE(pcm[i], 44 + i * 2);

const output = join(process.cwd(), "public/animal-cup/audio/fire_shot.wav");
writeFileSync(output, wav);
console.log(`Generated ${output}`);
