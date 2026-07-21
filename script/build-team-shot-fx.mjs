#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const teams = [
  "england", "france", "germany", "spain",
  "portugal", "brazil", "argentina", "usa",
  "cape_verde", "norway", "japan", "china",
];
const root = process.cwd();
const source = join(root, "artwork/team-shot-fx");
const output = join(root, "public/animal-cup/fx/team-shots");
await mkdir(output, { recursive: true });

async function cropAtlas(file, kind, width, height) {
  const input = sharp(join(source, file));
  const meta = await input.metadata();
  const cellWidth = Math.floor(meta.width / 4);
  const cellHeight = Math.floor(meta.height / 3);

  for (let index = 0; index < teams.length; index += 1) {
    if (teams[index] === "china") continue; // China keeps the approved original fire assets.
    const left = (index % 4) * cellWidth;
    const top = Math.floor(index / 4) * cellHeight;
    const cell = await sharp(join(source, file))
      .extract({ left, top, width: cellWidth, height: cellHeight })
      .png()
      .toBuffer();
    await sharp(cell)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize(width, height, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: "lanczos3",
      })
      .png()
      .toFile(join(output, `${teams[index]}-${kind}.png`));
  }
}

await cropAtlas("trails-atlas.png", "trail", 256, 128);
await cropAtlas("impacts-atlas.png", "impact", 128, 128);
console.log(`Built ${(teams.length - 1) * 2} team-shot sprites in ${output}`);
