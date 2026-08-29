// Interpolación de los 17 tonos "de sobra" + on-accent, dentro de la misma
// familia (superficie oscura o acento), proporcional a como se ubican en
// la rampa verde, aplicada a la rampa ciruela/dorado.

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0').toUpperCase()).join('');
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (h1, h2, t) => {
  const [r1, g1, b1] = hexToRgb(h1), [r2, g2, b2] = hexToRgb(h2);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
};
// posición t de `h` en la recta entre `lo` y `hi`, proyectada sobre luminancia
const t = (h, lo, hi) => {
  const L = (hex) => { const [r, g, b] = hexToRgb(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const Lh = L(h), Llo = L(lo), Lhi = L(hi);
  if (Lhi === Llo) return 0.5;
  return (Lh - Llo) / (Lhi - Llo);
};

// rampa de superficie oscura (bg -> line), en orden de luminancia
const SURF_MAIN = ['#020A06', '#06150F', '#0B1D14', '#14211B', '#1A2620'];
const SURF_PLAY = ['#0B0710', '#170D1E', '#1E1226', '#291A33', '#35223F'];
// rampa border -> acento
const ACC_MAIN = ['#25312B', '#2E854D', '#56BD78'];
const ACC_PLAY = ['#4A2F58', '#B5822A', '#D9A441'];

const bracket = (h, ramp) => {
  const L = (hex) => { const [r, g, b] = hexToRgb(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const lh = L(h);
  for (let i = 0; i < ramp.length - 1; i++) {
    if (lh >= L(ramp[i]) && lh <= L(ramp[i + 1])) return [ramp[i], ramp[i + 1]];
  }
  return lh < L(ramp[0]) ? [ramp[0], ramp[1]] : [ramp[ramp.length - 2], ramp[ramp.length - 1]];
};

const project = (hexMain, mainRamp, playRamp) => {
  const [lo, hi] = bracket(hexMain, mainRamp);
  const frac = t(hexMain, lo, hi);
  const loIdx = mainRamp.indexOf(lo), hiIdx = mainRamp.indexOf(hi);
  return mix(playRamp[loIdx], playRamp[hiIdx], frac);
};

// --- los 17 "de sobra", clasificados por familia ---
const SURFACE = ['#040F09', '#04100A', '#050F0A', '#071A11', '#0A1912', '#0B1F16', '#0B2116', '#0E2E1B', '#0F241A', '#12291D', '#143020', '#05130C', '#06160D'];
const ACCENTISH = ['#193C28', '#1F5936'];

console.log('SUPERFICIE (bg -> line):');
for (const h of SURFACE) console.log(' ', h, '->', project(h, SURF_MAIN, SURF_PLAY));

console.log('\nBORDE -> ACENTO:');
for (const h of ACCENTISH) console.log(' ', h, '->', project(h, ACC_MAIN, ACC_PLAY));
