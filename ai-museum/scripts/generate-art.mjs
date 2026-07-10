/**
 * Generates deterministic abstract SVG "artworks", artist avatars and
 * exhibition banners into /public/art. These are stand-ins so the museum is
 * fully browsable before Supabase Storage is connected — swap them for real
 * uploads in production.
 *
 * Run: node scripts/generate-art.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "art");
mkdirSync(OUT, { recursive: true });

// Small deterministic PRNG (mulberry32) so regeneration is stable.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Muted, gallery-appropriate palettes keyed by mood.
const PALETTES = {
  dusk: ["#2b2530", "#5d4a66", "#a98ea1", "#e3cfc3", "#8c6a4a"],
  sand: ["#e8e0d1", "#cbb99a", "#8c6a4a", "#4f4234", "#23201b"],
  sea: ["#12232b", "#2e5359", "#6f9490", "#c3d0c0", "#ede8dc"],
  bloom: ["#f0e6dc", "#d9b8a5", "#a5716b", "#5f4351", "#2c2331"],
  night: ["#0e1016", "#232a3d", "#4a5878", "#8f9bb3", "#d8d3c8"],
  ember: ["#1d1512", "#4f2e22", "#94553a", "#cf9668", "#efe1cd"],
  moss: ["#171c14", "#38452c", "#66754a", "#a3ab7f", "#e6e2ce"],
  fog: ["#e9e7e2", "#c9c6bd", "#a09c92", "#6c6961", "#3a3833"],
};

function blob(r, cx, cy, radius, color, opacity) {
  const pts = [];
  const n = 8 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const rad = radius * (0.65 + r() * 0.55);
    pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const [x, y] = pts[i % n];
    const [px, py] = pts[i - 1];
    d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((x + px) / 2).toFixed(1)} ${((y + py) / 2).toFixed(1)}`;
  }
  return `<path d="${d} Z" fill="${color}" opacity="${opacity}"/>`;
}

function artwork(seed, w, h, paletteName) {
  const r = rng(seed);
  const p = PALETTES[paletteName];
  const bg = p[0];
  let body = "";

  // Layered soft gradient wash
  body += `<defs>
    <linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p[1]}"/>
      <stop offset="1" stop-color="${p[0]}"/>
    </linearGradient>
    <filter id="b${seed}"><feGaussianBlur stdDeviation="${Math.round(w / 22)}"/></filter>
    <filter id="grain${seed}">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0"/>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
  </defs>`;
  body += `<rect width="${w}" height="${h}" fill="url(#g${seed})"/>`;

  // Blurred organic forms
  body += `<g filter="url(#b${seed})">`;
  const forms = 4 + Math.floor(r() * 4);
  for (let i = 0; i < forms; i++) {
    const color = p[1 + Math.floor(r() * (p.length - 1))];
    body += blob(r, r() * w, r() * h, (0.18 + r() * 0.3) * Math.min(w, h), color, 0.5 + r() * 0.45);
  }
  body += `</g>`;

  // A few crisp accents: thin arcs / lines / small discs
  const accents = 2 + Math.floor(r() * 3);
  for (let i = 0; i < accents; i++) {
    const color = p[p.length - 1];
    const kind = r();
    if (kind < 0.4) {
      const cx = r() * w, cy = r() * h, rad = (0.05 + r() * 0.18) * Math.min(w, h);
      body += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="none" stroke="${color}" stroke-width="${(1 + r() * 2).toFixed(1)}" opacity="0.7"/>`;
    } else if (kind < 0.7) {
      const y = r() * h;
      body += `<line x1="0" y1="${y.toFixed(0)}" x2="${w}" y2="${(y + (r() - 0.5) * h * 0.3).toFixed(0)}" stroke="${color}" stroke-width="1" opacity="0.5"/>`;
    } else {
      body += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h).toFixed(0)}" r="${(2 + r() * 5).toFixed(1)}" fill="${color}" opacity="0.85"/>`;
    }
  }

  // Film grain over everything
  body += `<rect width="${w}" height="${h}" filter="url(#grain${seed})" fill="${bg}" opacity="0.35"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

function avatar(seed, paletteName) {
  const r = rng(seed);
  const p = PALETTES[paletteName];
  const s = 240;
  let body = `<rect width="${s}" height="${s}" fill="${p[0]}"/>`;
  body += `<defs><filter id="ab${seed}"><feGaussianBlur stdDeviation="14"/></filter></defs><g filter="url(#ab${seed})">`;
  for (let i = 0; i < 4; i++) {
    body += blob(r, r() * s, r() * s, 40 + r() * 70, p[1 + Math.floor(r() * (p.length - 1))], 0.7);
  }
  body += `</g>`;
  body += `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 6}" fill="none" stroke="${p[p.length - 1]}" stroke-width="1.5" opacity="0.6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${body}</svg>`;
}

const moods = Object.keys(PALETTES);

// 36 artworks in varied aspect ratios for the masonry feed
const ratios = [
  [1200, 1500], [1200, 900], [1200, 1200], [1200, 1700], [1200, 800], [1200, 1400],
];
for (let i = 1; i <= 36; i++) {
  const [w, h] = ratios[i % ratios.length];
  writeFileSync(join(OUT, `artwork-${String(i).padStart(2, "0")}.svg`), artwork(i * 7919, w, h, moods[i % moods.length]));
}

// 10 artist avatars
for (let i = 1; i <= 10; i++) {
  writeFileSync(join(OUT, `avatar-${String(i).padStart(2, "0")}.svg`), avatar(i * 104729, moods[(i + 3) % moods.length]));
}

// 8 wide banners (exhibitions / rooms / hero)
for (let i = 1; i <= 8; i++) {
  writeFileSync(join(OUT, `banner-${String(i).padStart(2, "0")}.svg`), artwork(i * 15485863, 2000, 900, moods[(i + 5) % moods.length]));
}

console.log("Generated placeholder art into public/art");
