#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const runtime = join(root, "public/match-runtime-min");
const data = join(runtime, "data");
const source = join(root, "artwork/cape-verde/cape-verde-parts-sheet-chroma-v2.png");
const headVariantsSource = join(root, "artwork/cape-verde/cape-verde-head-variants-chroma.png");
const teamDir = join(data, "teams/cape_verde");
const raceDir = join(data, "player/races/cape_verde");

const raceCells = {
  "head.png": [0, 0, 81, 77],
  "head_back.png": [0, 1, 81, 77],
  "neck.png": [0, 2, 20, 18],
  "arm_right.png": [0, 3, 15, 17],
  "arm_left.png": [1, 0, 14, 11],
  "hand_left.png": [1, 1, 25, 28],
  "hand_right.png": [1, 2, 23, 38],
  "knee.png": [1, 3, 8, 9],
};

const generic = join(data, "player/kit");
const palette = {
  home: { shirt: "16549a", shorts: "174985", socks: "174985", trim: "d64536" },
  away: { shirt: "f4efe2", shorts: "eee8d9", socks: "eee8d9", trim: "1c4e91" },
  goalkeeper: { shirt: "292a2b", shorts: "242526", socks: "242526", trim: "d6a632" },
};

function largestComponent(raw, width, height) {
  const seen = new Uint8Array(width * height);
  let best = [];
  for (let start = 0; start < width * height; start += 1) {
    if (seen[start] || raw[start * 4 + 3] < 16) continue;
    const stack = [start];
    const blob = [];
    seen[start] = 1;
    while (stack.length) {
      const cur = stack.pop();
      blob.push(cur);
      const x = cur % width;
      const y = Math.floor(cur / width);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = ny * width + nx;
        if (!seen[ni] && raw[ni * 4 + 3] >= 16) {
          seen[ni] = 1;
          stack.push(ni);
        }
      }
    }
    if (blob.length > best.length) best = blob;
  }
  const keep = new Uint8Array(width * height);
  for (const i of best) keep[i] = 1;
  for (let i = 0; i < width * height; i += 1) if (!keep[i]) raw[i * 4 + 3] = 0;
}

async function sheetData() {
  const result = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: raw, info } = result;
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    const magenta = Math.min(r, b) - g;
    if ((r > 175 && b > 175 && g < 135) || magenta > 80) raw[i + 3] = 0;
    else if (magenta > 28) raw[i + 3] = Math.round(255 * (1 - (magenta - 28) / 52));
  }
  return { raw, info };
}

async function cell(sheet, row, col, width, height) {
  const x0 = Math.round(col * sheet.info.width / 4);
  const x1 = Math.round((col + 1) * sheet.info.width / 4);
  const y0 = Math.round(row * sheet.info.height / 4);
  const y1 = Math.round((row + 1) * sheet.info.height / 4);
  const w = x1 - x0, h = y1 - y0;
  const raw = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    const si = ((y0 + y) * sheet.info.width + x0 + x) * 4;
    const di = (y * w + x) * 4;
    sheet.raw.copy(raw, di, si, si + 4);
  }
  largestComponent(raw, w, h);
  return sharp(raw, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 8 })
    .resize(width, height, { fit: "fill", kernel: "lanczos3" })
    .png()
    .toBuffer();
}

async function tintedTemplate(name, color, width, height) {
  return sharp(join(generic, name)).ensureAlpha().tint(`#${color}`)
    .resize(width, height, { fit: "fill" }).png().toBuffer();
}

async function writeKit(sheet, kit) {
  const out = join(teamDir, kit);
  mkdirSync(out, { recursive: true });
  const frontCell = kit === "home" ? [2, 0] : kit === "away" ? [3, 0] : [3, 1];
  writeFileSync(join(out, "shirt_front.png"), await cell(sheet, ...frontCell, 56, 52));
  const specs = [
    ["shirt_back.png", "shirt_back.png", palette[kit].shirt, 56, 52],
    ["sleeve_left.png", "sleeve_left.png", palette[kit].shirt, 14, 22],
    ["sleeve_right.png", "sleeve_right.png", palette[kit].shirt, 23, 18],
    ["shorts.png", "shorts.png", palette[kit].shorts, 55, 8],
    ["shorts_leg_left.png", "shorts_leg.png", palette[kit].shorts, 12, 16],
    ["shorts_leg_right.png", "shorts_leg.png", palette[kit].shorts, 12, 16],
    ["socks.png", "socks.png", palette[kit].socks, 11, 14],
    ["socks_left.png", "socks.png", palette[kit].socks, 11, 14],
    ["socks_right.png", "socks.png", palette[kit].socks, 11, 14],
    ["shoes_left.png", "shoes.png", "393531", 16, 6],
    ["shoes_right.png", "shoes.png", "393531", 16, 6],
  ];
  for (const [dest, template, color, width, height] of specs) {
    writeFileSync(join(out, dest), await tintedTemplate(template, color, width, height));
  }
  if (kit === "goalkeeper") {
    const gloveSource = join(data, "teams/portugal/goalkeeper");
    writeFileSync(join(out, "hand_left.png"), await sharp(join(gloveSource, "hand_left.png")).tint("#377fc0").png().toBuffer());
    writeFileSync(join(out, "hand_right.png"), await sharp(join(gloveSource, "hand_right.png")).tint("#377fc0").png().toBuffer());
  }
}

function makeFlag() {
  const stars = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 10;
    const cx = 164 + Math.cos(a) * 64;
    const cy = 142 + Math.sin(a) * 64;
    const points = Array.from({ length: 10 }, (_, p) => {
      const pa = -Math.PI / 2 + p * Math.PI / 5;
      const rr = p % 2 ? 4.3 : 10;
      return `${cx + Math.cos(pa) * rr},${cy + Math.sin(pa) * rr}`;
    }).join(" ");
    return `<polygon points="${points}" fill="#f7d117"/>`;
  }).join("");
  return Buffer.from(`<svg width="512" height="256" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="256" fill="#003893"/><rect y="140" width="512" height="38" fill="#fff"/><rect y="148" width="512" height="22" fill="#cf2027"/>${stars}</svg>`);
}

function patchKitPaths(team) {
  for (const [kitName, kit] of Object.entries(team.kits)) {
    for (const [part, spec] of Object.entries(kit)) {
      if (!spec || typeof spec !== "object") continue;
      const names = {
        arm_left_sleeve: "sleeve_left.png", arm_right_sleeve: "sleeve_right.png",
        shirt_back: "shirt_back.png", shirt_front: "shirt_front.png",
        leg_left_shoe: "shoes_left.png", leg_right_shoe: "shoes_right.png",
        leg_left_shorts: "shorts_leg_left.png", leg_right_shorts: "shorts_leg_right.png",
        leg_left_sock: "socks_left.png", leg_right_sock: "socks_right.png",
        pelvis_shorts: "shorts.png", hand_left_glove: "hand_left.png", hand_right_glove: "hand_right.png",
      };
      if (names[part]) spec.name = `${kitName}/${names[part]}`;
      if (part === "number") spec.name = "../../player/kit/number.png";
      spec.color = "ffffffff";
    }
  }
}

function writeTeamData() {
  const team = JSON.parse(readFileSync(join(data, "teams/portugal/team.json"), "utf8"));
  team.rating = 1685;
  team.code = "CPV";
  team.flag = "flag.png";
  team.continent = "africa";
  team.id = "cape_verde";
  team.kitColors = { home: "16549a", away: "f4efe2" };
  const roles = ["G", "D", "D", "M", "A", "A", "D", "D", "M", "A", "A"];
  team.players = roles.map((role, i) => ({
    race: i === 0 ? "cape_verde" : `cape_verde_v${(i - 1) % 6 + 1}`,
    role, number: i + 1, skin: {},
  }));
  patchKitPaths(team);
  writeFileSync(join(teamDir, "team.json"), `${JSON.stringify(team, null, 4)}\n`);
  mkdirSync(join(teamDir, "languages"), { recursive: true });
  writeFileSync(join(teamDir, "languages/en.json"), '{"name":{"message":"Cape Verde"}}\n');
}

async function writeHeadVariants() {
  const { data: raw, info } = await sharp(headVariantsSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    const magenta = Math.min(r, b) - g;
    if ((r > 175 && b > 175 && g < 135) || magenta > 80) raw[i + 3] = 0;
    else if (magenta > 28) raw[i + 3] = Math.round(255 * (1 - (magenta - 28) / 52));
  }
  const coords = [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]];
  const baseRace = JSON.parse(readFileSync(join(raceDir, "race.json"), "utf8"));
  for (let i = 0; i < coords.length; i += 1) {
    const [col, row] = coords[i];
    const x0 = Math.round(col * info.width / 4), x1 = Math.round((col + 1) * info.width / 4);
    const y0 = Math.round(row * info.height / 2), y1 = Math.round((row + 1) * info.height / 2);
    const w = x1 - x0, h = y1 - y0;
    const cut = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
      const si = ((y0 + y) * info.width + x0 + x) * 4, di = (y * w + x) * 4;
      raw.copy(cut, di, si, si + 4);
    }
    largestComponent(cut, w, h);
    const trimmed = await sharp(cut, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 8 })
      .resize(81, 77, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const dir = join(data, `player/races/cape_verde_v${i + 1}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "head.png"), trimmed);
    const variantRace = structuredClone(baseRace);
    for (const [part, spec] of Object.entries(variantRace)) {
      if (part !== "head_front" && spec && typeof spec === "object" && spec.name) spec.name = `../cape_verde/${spec.name}`;
    }
    writeFileSync(join(dir, "race.json"), `${JSON.stringify(variantRace, null, 4)}\n`);
  }
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path)); else out.push(path);
  }
  return out;
}

function mime(path) {
  return ({ ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".css": "text/css" })[extname(path)] || "application/octet-stream";
}

function rebuildIndexes() {
  const dirs = {};
  const visit = (dir) => {
    const key = `/${relative(runtime, dir).replaceAll("\\", "/")}`.replace(/\/$/, "") || "/";
    dirs[key] = readdirSync(dir)
      .filter((name) => key !== "/" || (!name.startsWith("__") && !name.endsWith(".bak")))
      .sort();
    for (const name of dirs[key]) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) visit(path);
    }
  };
  visit(runtime);
  writeFileSync(join(runtime, "__dirlist.json"), JSON.stringify(dirs));
  const bundle = {};
  for (const path of walk(data)) {
    const key = `/${relative(runtime, path).replaceAll("\\", "/")}`;
    bundle[key] = [readFileSync(path).toString("base64"), mime(path)];
  }
  writeFileSync(join(runtime, "__data-bundle.json"), JSON.stringify(bundle));
}

async function main() {
  mkdirSync(raceDir, { recursive: true });
  mkdirSync(teamDir, { recursive: true });
  const sheet = await sheetData();
  for (const [name, [row, col, width, height]] of Object.entries(raceCells)) {
    writeFileSync(join(raceDir, name), await cell(sheet, row, col, width, height));
  }
  cpSync(join(data, "player/races/turtle/race.json"), join(raceDir, "race.json"));
  await writeHeadVariants();
  await writeKit(sheet, "home");
  await writeKit(sheet, "away");
  await writeKit(sheet, "goalkeeper");
  writeFileSync(join(teamDir, "flag.png"), await sharp(makeFlag()).png().toBuffer());
  writeTeamData();
  cpSync(join(root, "artwork/cape-verde/cape-verde-portrait-512-v2.png"), join(root, "public/animal-cup/portraits/cape_verde.png"));
  rebuildIndexes();
  console.log("Cape Verde base race, kits, flag, portrait, team data, and runtime indexes generated.");
}

await main();
