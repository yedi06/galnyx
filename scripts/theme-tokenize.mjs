/* Convierte hex hardcodeado -> var(--token) en src/*.dc.html.
   Alcance deliberado y seguro:
     - Solo dentro de atributos style="..." y fill="#.."/stroke="#..".
       Nunca toca texto entre etiquetas (así el prompt-copy de Foto.dc.html,
       que MUESTRA códigos hex como contenido legible, queda intacto).
     - Nunca toca #F2F7F4 (wordmark del logo, vive en header()/footer()/
       mheader()/mfooter(), que no se tocan).
     - Los ~17 tonos "de sobra" (gradient-stops puntuales de tarjetas y
       héroes) NO se tokenizan aquí: no tienen variable dedicada porque
       son de un solo uso, no componentes compartidos. Quedan como hex
       literal, sin cambio visual.
   Reporta, por archivo, cuántas sustituciones hizo cada token. */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(path.resolve('.'), 'src');

const TOKENS = {
  '#020A06': 'bg', '#06150F': 'bg-raised', '#0B1D14': 'bg-raised-2',
  '#14211B': 'card', '#1A2620': 'line', '#25312B': 'border',
  '#5E6E66': 'text-faintest', '#7C8B83': 'text-faint', '#9FB0A7': 'text-muted',
  '#B9C6BF': 'text-link', '#DFE7E2': 'text', '#F5FAF7': 'text-hi',
  '#2E854D': 'accent-deep', '#56BD78': 'accent', '#7BD497': 'accent-bright',
  '#02160A': 'on-accent',
};
const SKIP = new Set(['#F2F7F4']); // wordmark, vive en funciones excluidas

const RGB_TOKENS = {
  '2,10,6': 'bg-rgb',
  '86,189,120': 'accent-rgb',
  '46,133,77': 'accent-deep-rgb',
};
const rgbaRe = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g;

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.dc.html'));
const totals = {};
let filesChanged = 0;

for (const f of files) {
  const p = path.join(SRC, f);
  const before = fs.readFileSync(p, 'utf8');
  const counts = {};

  const subHex = (raw) => {
    const hex = raw.toUpperCase();
    if (SKIP.has(hex)) return raw;
    const token = TOKENS[hex];
    if (!token) return raw; // uno de los ~17 de sobra: no tocar
    counts[token] = (counts[token] || 0) + 1;
    return `var(--${token})`;
  };

  // 1) dentro de style="...": sustituye cada #HEX y cada rgba(triplete,op) conocido
  let after = before.replace(/style="([^"]*)"/g, (m, css) => {
    let newCss = css.replace(/#[0-9A-Fa-f]{6}/g, subHex);
    newCss = newCss.replace(rgbaRe, (full, r, g, b, a) => {
      const triple = `${+r},${+g},${+b}`;
      const token = RGB_TOKENS[triple];
      if (!token) return full; // no es uno de los 3 tripletes de marca (p.ej. blanco de grano): no tocar
      counts[token] = (counts[token] || 0) + 1;
      return `rgba(var(--${token}),${a})`;
    });
    return `style="${newCss}"`;
  });

  // 2) atributos SVG planos fill="#.." / stroke="#.."
  after = after.replace(/(fill|stroke)="(#[0-9A-Fa-f]{6})"/g, (m, attr, hex) => {
    const replaced = subHex(hex);
    return replaced === hex ? m : `${attr}="${replaced}"`;
  });

  if (after !== before) {
    fs.writeFileSync(p, after);
    filesChanged++;
    const parts = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' ');
    console.log(f.padEnd(24), parts);
    for (const [k, v] of Object.entries(counts)) totals[k] = (totals[k] || 0) + v;
  }
}

console.log('\n--- total por token (', filesChanged, 'archivos tocados ) ---');
for (const [k, v] of Object.entries(totals).sort((a, b) => b[1] - a[1])) console.log(' ', k.padEnd(16), v);
console.log('  TOTAL', Object.values(totals).reduce((a, b) => a + b, 0));
