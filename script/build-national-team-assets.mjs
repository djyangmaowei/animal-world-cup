#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const runtime = join(root, "public/match-runtime-min");
const data = join(runtime, "data");
const teams = {
  china: {
    code: "CHN", name: "China", continent: "asia", rating: 1760, baseRace: "panda",
    palette: {
      home: { shirt: "c92f2f", shorts: "b91f28", socks: "c92f2f", trim: "d8ad3d" },
      away: { shirt: "f2eee2", shorts: "f2eee2", socks: "f2eee2", trim: "c92f2f" },
      goalkeeper: { shirt: "222222", shorts: "202020", socks: "202020", trim: "3f7850" },
    },
    kitColors: { home: "c92f2f", away: "f2eee2" }, glove: "#d8ad3d",
  },
  norway: {
    code: "NOR", name: "Norway", continent: "europe", rating: 1780, baseRace: "reindeer",
    palette: {
      home: { shirt: "ba2e35", shorts: "172c4d", socks: "ba2e35", trim: "f4f0e5" },
      away: { shirt: "f4f0e5", shorts: "f4f0e5", socks: "f4f0e5", trim: "ba2e35" },
      goalkeeper: { shirt: "164c50", shorts: "123f43", socks: "123f43", trim: "79b7ac" },
    },
    kitColors: { home: "ba2e35", away: "f4f0e5" }, glove: "#172c4d",
  },
  japan: {
    code: "JPN", name: "Japan", continent: "asia", rating: 1810, baseRace: "monkey",
    palette: {
      home: { shirt: "1b4f95", shorts: "172c4d", socks: "1b4f95", trim: "d44a4a" },
      away: { shirt: "f4efe6", shorts: "f4efe6", socks: "f4efe6", trim: "1b4f95" },
      goalkeeper: { shirt: "2b2b2b", shorts: "242424", socks: "242424", trim: "d44a4a" },
    },
    kitColors: { home: "1b4f95", away: "f4efe6" }, glove: "#202020",
  },
};
const id = process.argv[2];
const config = teams[id];
if (!config) throw new Error(`Choose a team: ${Object.keys(teams).join(", ")}`);
const source = join(root, `artwork/${id}/${id}-parts-sheet-chroma.png`);
const headVariantsSource = join(root, `artwork/${id}/${id}-head-variants-chroma.png`);
const teamDir = join(data, `teams/${id}`);
const raceDir = join(data, `player/races/${id}`);

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
const palette = config.palette;

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
    writeFileSync(join(out, "hand_left.png"), await sharp(join(gloveSource, "hand_left.png")).tint(config.glove).png().toBuffer());
    writeFileSync(join(out, "hand_right.png"), await sharp(join(gloveSource, "hand_right.png")).tint(config.glove).png().toBuffer());
  }
}

function makeFlag() {
  if (id === "norway") return Buffer.from('<svg width="512" height="256" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="256" fill="#ba0c2f"/><path d="M0 104h512v48H0zM144 0h48v256h-48z" fill="#fff"/><path d="M0 116h512v24H0zM156 0h24v256h-24z" fill="#00205b"/></svg>');
  if (id === "japan") return Buffer.from('<svg width="512" height="256" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="256" fill="#fff"/><circle cx="256" cy="128" r="77" fill="#bc002d"/></svg>');
  const star = (cx, cy, outer, rotation = -Math.PI / 2) => `<polygon points="${Array.from({ length: 10 }, (_, p) => { const a = rotation + p * Math.PI / 5; const r = p % 2 ? outer * .4 : outer; return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`; }).join(" ")}" fill="#ffde00"/>`;
  return Buffer.from(`<svg width="512" height="256" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="256" fill="#de2910"/>${star(80, 72, 36)}${star(142, 36, 12, -2.5)}${star(164, 68, 12, -2.9)}${star(160, 105, 12, -3.2)}${star(132, 132, 12, -3.5)}</svg>`);
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
  team.rating = config.rating;
  team.code = config.code;
  team.flag = "flag.png";
  team.continent = config.continent;
  team.id = id;
  team.kitColors = config.kitColors;
  const roles = ["G", "D", "D", "M", "A", "A", "D", "D", "M", "A", "A"];
  team.players = roles.map((role, i) => ({
    race: i === 0 ? id : `${id}_v${(i - 1) % 6 + 1}`,
    role, number: i + 1, skin: {},
  }));
  patchKitPaths(team);
  writeFileSync(join(teamDir, "team.json"), `${JSON.stringify(team, null, 4)}\n`);
  mkdirSync(join(teamDir, "languages"), { recursive: true });
  writeFileSync(join(teamDir, "languages/en.json"), `${JSON.stringify({ name: { message: config.name } })}\n`);
}

async function writeHeadVariants() {
  if (!existsSync(headVariantsSource)) return;
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
    const dir = join(data, `player/races/${id}_v${i + 1}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "head.png"), trimmed);
    const variantRace = structuredClone(baseRace);
    for (const [part, spec] of Object.entries(variantRace)) {
      if (part !== "head_front" && spec && typeof spec === "object" && spec.name) spec.name = `../${id}/${spec.name}`;
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
  cpSync(join(data, `player/races/${config.baseRace}/race.json`), join(raceDir, "race.json"));
  await writeHeadVariants();
  await writeKit(sheet, "home");
  await writeKit(sheet, "away");
  await writeKit(sheet, "goalkeeper");
  writeFileSync(join(teamDir, "flag.png"), await sharp(makeFlag()).png().toBuffer());
  writeTeamData();
  cpSync(join(root, `artwork/${id}/${id}-portrait-512.png`), join(root, `public/animal-cup/portraits/${id}.png`));
  rebuildIndexes();
  console.log(`${config.name} base race, kits, flag, portrait, team data, and runtime indexes generated.`);
}

await main();
