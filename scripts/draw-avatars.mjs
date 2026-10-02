// Draws the preset avatars (public/avatars/*.svg): black-and-white,
// hand-drawn line faces from shared parts, so they all match.
//   node scripts/draw-avatars.mjs public/avatars
// New face: add it to FACES, run this, and list it in AVATARS (lib/profile.ts).
import fs from "node:fs";
import path from "node:path";

const INK = "#111111";
const S = `stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"`;
const line = (d, w = 3.2) => `<path d="${d}" fill="none" ${S} stroke-width="${w}"/>`;
const ink = (d) => `<path d="${d}" fill="${INK}"/>`;
const white = (d, w = 3.2) => `<path d="${d}" fill="#fff" ${S} stroke-width="${w}"/>`;

// Heads (all centred around x=64).
const HEAD = {
  square: "M40 50c0-10 7-16 16-16h18c10 0 16 7 16 17v32c0 14-11 25-25 25h-2c-13 0-23-10-23-23z",
  round: "M38 68c0-20 11-34 26-34s26 14 26 34-11 38-26 38-26-18-26-38z",
  long: "M42 46c0-12 9-18 22-18s22 6 22 18v40c0 13-10 22-22 22s-22-9-22-22z",
  wide: "M34 66c0-18 13-30 30-30s30 12 30 30c0 22-13 38-30 38S34 88 34 66z",
};
const ears = (y = 72, l = 38, r = 90) =>
  white(`M${l + 1} ${y - 7}c-7-1-10 3-10 7s3 8 10 7`) + white(`M${r - 1} ${y - 7}c7-1 10 3 10 7s-3 8-10 7`);

// Faces.
const eye = (x, y) =>
  `<ellipse cx="${x}" cy="${y}" rx="6.2" ry="4.2" fill="#fff" ${S} stroke-width="2.4"/><circle cx="${x}" cy="${y}" r="2.6" fill="${INK}"/>`;
const eyes = (y = 68, gap = 12) => eye(64 - gap, y) + eye(64 + gap, y);
const closed = (y = 68, gap = 12) =>
  line(`M${64 - gap - 6} ${y}q6 5 12 0`, 2.4) + line(`M${64 + gap - 6} ${y}q6 5 12 0`, 2.4) +
  line(`M${64 + gap + 5} ${y + 1}l3 -3`, 1.8);
const brows = (y = 58, gap = 12) =>
  line(`M${64 - gap - 6} ${y}q6 -3 12 0`, 3.4) + line(`M${64 + gap - 6} ${y}q6 -3 12 0`, 3.4);
const nose = (y = 70) => line(`M66 ${y}c-1 6 -4 11 -1 14 2 2 5 1 6 -1`, 2.4);
const smile = (y = 92, w = 8) => line(`M${64 - w} ${y}q${w} 7 ${w * 2} 0`, 2.8);
const blush = (y = 84) =>
  `<circle cx="44" cy="${y}" r="3.2" fill="${INK}"/><circle cx="84" cy="${y}" r="3.2" fill="${INK}"/>`;
const freckles = (y = 82) =>
  [-22, -18, -20, 18, 22, 20].map((dx, i) => `<circle cx="${64 + dx}" cy="${y + (i % 3) * 3}" r="1.1" fill="${INK}"/>`).join("");
const stubble = (cx = 64, cy = 96, n = 26, rx = 18, ry = 9) => {
  let seed = 7;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: n }, () => {
    const a = r() * Math.PI, d = Math.sqrt(r());
    return `<circle cx="${(cx + Math.cos(a) * rx * d * (r() > 0.5 ? 1 : -1)).toFixed(1)}" cy="${(cy + Math.sin(a) * ry * d).toFixed(1)}" r="1.1" fill="${INK}"/>`;
  }).join("");
};
const curls = (pts, r = 8) =>
  pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`).join("");

const FACES = {
  quiff: () =>
    ears(72, 40, 90) + white(HEAD.square) +
    ink("M36 46c0-16 14-24 32-24 16 0 28 6 28 16 0 6-4 8-10 8H52c-6 0-6 8-12 10-3-2-4-6-4-10z") +
    ink("M88 52c4 0 6 6 4 20l-4 2z") +
    eyes(70) + nose(70) + smile(92) + freckles(82),
  "curly-bob": () =>
    curls([[34, 60], [30, 76], [34, 92], [94, 60], [98, 76], [94, 92], [42, 98], [86, 98]], 10) +
    white(HEAD.round) +
    ink("M38 62c0-18 12-30 26-30s26 12 26 30c-6-6-10-14-12-18-4 6-12 8-14 2-4 6-14 8-26 16z") +
    eyes(70) + line("M64 72c-1 5-3 8-1 10", 2.4) + smile(90, 7) + blush(84),
  "bald-stubble": () =>
    ears(76, 38, 90) + white(HEAD.long) +
    ink("M58 30c2-4 10-4 12 0-4 2-8 2-12 0z") + ink("M42 60c0-6 2-10 5-12v16z") +
    eyes(68, 13) + nose(68) + smile(92, 9) + stubble(64, 96, 30, 18, 8),
  ponytail: () =>
    ink("M30 60c-12-12-8-34 8-38 8 0 6 10 0 14-4 4-4 14-8 24z") +
    white(HEAD.round) +
    ink("M38 62c0-20 12-30 28-30 14 0 24 10 24 24-10 0-22-4-28-12-6 10-14 16-24 18z") +
    closed(70) + line("M64 72c-1 5-3 8-1 10", 2.4) + smile(90, 6) + freckles(80),
  spiky: () =>
    ears(72, 38, 90) + white(HEAD.square) +
    ink("M40 48l2-14 6 6 4-12 6 8 6-12 5 10 7-8 3 10 7-4-2 16c-8-2-34-2-44 0z") +
    brows(58) + eyes(68) + line("M66 70c-2 6-6 10-2 14 3 2 6 0 7-2", 2.4) + smile(92, 9),
  curls: () =>
    curls([[34, 54], [30, 72], [34, 90], [94, 54], [98, 72], [94, 90], [42, 38], [56, 30], [72, 30], [86, 38], [40, 102], [88, 102]], 9) +
    white(HEAD.wide) +
    curls([[46, 42], [60, 38], [74, 40], [84, 46]], 6) +
    closed(70) + line("M64 74c-2 4-2 7 1 8", 2.4) +
    `<path d="M58 92c2-4 6-2 6 0 0-2 4-4 6 0-2 4-10 4-12 0z" fill="${INK}"/>` + freckles(84),
  cap: () =>
    ears(76, 38, 90) + white(HEAD.long) +
    white("M38 52c0-16 12-26 26-26s26 10 26 26z") +
    white("M66 52h44c4 0 4 6-2 8-14 4-30 2-42-2z") +
    `<circle cx="64" cy="26" r="2.5" fill="${INK}"/>` +
    ink("M42 52h8l-2 22-6 2z") +
    eyes(70) + nose(70) + smile(92, 7) + freckles(84),
  bandana: () =>
    ink("M88 70c10 6 18 20 14 34-6-4-10-10-14-16z") +
    white(HEAD.long) +
    ink("M42 52c0-14 8-22 22-22s22 8 22 22c-8-4-14-6-22-6s-14 2-22 6z") +
    white("M42 50c8-6 36-6 44 0v6c-8-6-36-6-44 0z", 2.6) +
    white("M70 30c4-10 14-12 18-8-4 2-8 6-10 10M66 30c-2-10 4-14 10-14-2 4-4 8-4 12", 2.6) +
    [48, 56, 64, 72, 80, 75, 82].map((x, i) => `<circle cx="${x}" cy="${i > 4 ? 22 + i : 52}" r="1.2" fill="${INK}"/>`).join("") +
    eyes(70) + line("M54 64v-3M74 64v-3", 1.6) + nose(70) + smile(92, 6) + blush(84),
  beard: () =>
    ears(70, 40, 90) + white(HEAD.square) +
    ink("M36 40c0-8 6-12 14-12h32c8 0 12 4 12 10v6H40z") +
    ink("M40 78c4 6 8 8 12 8 6-4 18-4 24 0 4 0 8-2 12-8v14c0 20-14 30-24 30S40 112 40 92z") +
    `<path d="M57 98q7 5 14 0" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>` +
    brows(58) + eyes(66) + line("M66 68c-1 5-3 9-1 12", 2.4),
  "bucket-hat": () =>
    curls([[36, 70], [32, 84], [92, 70], [96, 84], [38, 96], [90, 96]], 9) +
    white(HEAD.long) +
    white("M28 54c4-4 14-6 18-6l4-18c4-6 24-6 28 0l4 18c4 0 14 2 18 6-10 6-62 6-72 0z") +
    line("M48 40h32", 1.6) +
    [[40, 46], [52, 36], [64, 34], [76, 36], [88, 46], [58, 44], [70, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${INK}"/>`).join("") +
    eyes(68) + nose(68) + smile(92, 7),
  glasses: () =>
    ears(72, 38, 90) + white(HEAD.square) +
    ink("M38 44c0-12 10-18 24-18h12c12 0 18 6 18 14v20l-6-12c-10 2-34 0-48-4z") +
    `<circle cx="52" cy="68" r="9" fill="#fff" ${S} stroke-width="2.6"/><circle cx="76" cy="68" r="9" fill="#fff" ${S} stroke-width="2.6"/>` +
    line("M61 68h6M43 66l-4-2M85 66l4-2", 2.4) +
    `<circle cx="52" cy="68" r="2.6" fill="${INK}"/><circle cx="76" cy="68" r="2.6" fill="${INK}"/>` +
    line("M66 76c-1 4-3 6-1 8", 2.4) + smile(94, 7) + stubble(64, 98, 34, 20, 8),
  bob: () =>
    ink("M30 62c0-24 14-38 34-38s34 14 34 38v40H30z") +
    white(HEAD.long) +
    ink("M40 52c0-14 10-22 24-22s24 8 24 22c-4-2-8-6-10-10-6 4-26 4-38 10z") +
    eyes(70) + line("M54 64v-3M74 64v-3", 1.6) + nose(70) + smile(92, 6) + freckles(84),
};

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
for (const [id, draw] of Object.entries(FACES)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#fff"/><g transform="translate(64 70) scale(1.22) translate(-64 -68)">${draw()}</g></svg>\n`;
  fs.writeFileSync(path.join(out, `${id}.svg`), svg);
}
console.log(Object.keys(FACES).join(" "));
