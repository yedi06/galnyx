import fs from 'node:fs';
import path from 'node:path';
import { photo } from './photos.mjs';
import { scene } from './scenes.mjs';

const ROOT = path.resolve('.');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'galnyx-canvas');

/* Las imágenes NO se incrustan en base64: se copian a galnyx-canvas/ y las
   páginas las referencian por nombre de archivo hermano. Es como está publicado
   el canvas hoy y es lo correcto: incrustada, la misma foto viaja una vez por
   cada página que la usa (34 artboards), y el bundle se iba a 17 MB contra un
   tope de 16. Referenciada, viaja una sola vez.
   usadas[] recoge lo que realmente pide alguna página; al final del build se
   copia solo eso, así una foto retirada del catálogo no queda de polizón. */
const usadas = new Set();
function activo(rel, ayuda) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) throw new Error('falta ' + rel + ' — corre: ' + ayuda);
  usadas.add(rel);
  return path.basename(rel);
}

/* ---------- fuentes reales, como archivo hermano (OFL, sin CDN) ---------- */
const FACES = [
  ['Instrument Serif', 'normal', '400', 'InstrumentSerif-Regular.woff2'],
  ['Instrument Serif', 'italic', '400', 'InstrumentSerif-Italic.woff2'],
  ['Instrument Sans', 'normal', '400 700', 'InstrumentSans-Variable.woff2'],
  ['Big Shoulders', 'normal', '100 900', 'BigShoulders-Variable.woff2'],
  ['JetBrains Mono', 'normal', '400', 'JetBrainsMono-Regular.woff2'],
  ['JetBrains Mono', 'normal', '500', 'JetBrainsMono-Medium.woff2'],
];
/* Las fuentes van como archivo hermano, igual que las fotos: incrustadas en
   base64 eran 184 KB EN CADA UNO de los 34 artboards -- 6 MB de bundle para
   seis archivos que suman 138 KB. Referenciadas, viajan una sola vez.
   fuentes/_subset lo produce scripts/subset-fuentes.py; si no existe todavia se
   usan los originales completos y el sitio se ve igual, solo pesa mas. */
const SUBSET = path.join(ROOT, 'fuentes', '_subset');
const FONTS = FACES.map(([fam, style, wt, file]) => {
  const rel = fs.existsSync(path.join(SUBSET, file))
    ? path.join('fuentes', '_subset', file)
    : path.join('fuentes', file);
  const src = activo(rel, 'python scripts/subset-fuentes.py');
  return `@font-face {
  font-family: "${fam}";
  font-style: ${style};
  font-weight: ${wt};
  src: url("${src}") format("woff2");
  font-display: swap;
}`;
}).join('\n');

/* ---------- CSS base: el mismo de Main/Producto/Blog + añadidos ---------- */
const CSS = `
    /* ---------- tema GALNYX Horror (por defecto) + Play + Glamour ----------
       [data-collection="play"|"glamour"] envuelven tarjetas/secciones de
       producto que no encajan con la estética de terror -- Play para
       Cuentos de hadas (dorado), Glamour para Glamour adulto (rosa). El
       header, footer, nav móvil, logo y checkout NUNCA llevan ninguno de
       estos atributos: son el ancla de marca y se quedan siempre en verde,
       vengan de header()/footer()/mheader()/mfooter()/logo()/fab()/
       chkheader()/qrSvg() -- ninguna de esas funciones fue tocada. */
    :root {
      --bg:#020A06; --bg-raised:#06150F; --bg-raised-2:#0B1D14;
      --card:#14211B; --line:#1A2620; --border:#25312B;
      --text-faintest:#5E6E66; --text-faint:#7C8B83; --text-muted:#9FB0A7;
      --text-link:#B9C6BF; --text:#DFE7E2; --text-hi:#F5FAF7;
      --accent-deep:#2E854D; --accent:#56BD78; --accent-bright:#7BD497;
      --on-accent:#02160A; --photo-glow:#143020; --photo-shadow:#04100A;
      --bg-rgb:2,10,6; --accent-rgb:86,189,120; --accent-deep-rgb:46,133,77;
    }
    [data-collection="play"] {
      --bg:#0B0710; --bg-raised:#170D1E; --bg-raised-2:#1E1226;
      --card:#291A33; --line:#35223F; --border:#4A2F58;
      --text-faintest:#8C7A93; --text-faint:#A793AC; --text-muted:#C7B6CC;
      --text-link:#D6C8DA; --text:#EDE3EF; --text-hi:#FAF6F5;
      --accent-deep:#B5822A; --accent:#D9A441; --accent-bright:#E8C878;
      --on-accent:#160D1D; --photo-glow:#432B4D; --photo-shadow:#110A17;
      --bg-rgb:11,7,16; --accent-rgb:217,164,65; --accent-deep-rgb:181,130,42;
    }
    [data-collection="glamour"] {
      --bg:#0F0509; --bg-raised:#1C0A11; --bg-raised-2:#24101A;
      --card:#331521; --line:#3F1B2A; --border:#542339;
      --text-faintest:#8F6572; --text-faint:#A8828F; --text-muted:#C9A8B5;
      --text-link:#D7BDC7; --text:#EDDCE2; --text-hi:#FAF3F5;
      --accent-deep:#A02D5C; --accent:#D6417B; --accent-bright:#F07FA8;
      --on-accent:#1B0A11; --photo-glow:#4D2234; --photo-shadow:#16080D;
      --bg-rgb:15,5,9; --accent-rgb:214,65,123; --accent-deep-rgb:160,45,92;
    }

    * { box-sizing: border-box; }
    body { margin:0; font-family:"Instrument Sans", ui-sans-serif, sans-serif; -webkit-font-smoothing:antialiased; }
    a { color:var(--accent); text-decoration:none; }
    a:hover { color:var(--accent-bright); }

    .dsp   { font-family:"Instrument Serif", Georgia, serif; font-style:normal; letter-spacing:-0.01em; }
    .dsp-i { font-family:"Instrument Serif", Georgia, serif; font-style:italic; letter-spacing:-0.005em; }
    .kicker {
      font-family:"Big Shoulders Variable","Big Shoulders",sans-serif;
      font-variation-settings:"wdth" 75;
      text-transform:uppercase; font-weight:650; letter-spacing:0.1em;
    }
    .wordmark {
      font-family:"Big Shoulders Variable","Big Shoulders",sans-serif;
      font-variation-settings:"wdth" 100;
      text-transform:uppercase; font-weight:700;
    }
    .mono { font-family:"JetBrains Mono", ui-monospace, monospace; }

    @keyframes pulse-glow {
      0%, 100% { opacity:0.55; transform:translate(-50%,-50%) scale(1); }
      50%      { opacity:1;    transform:translate(-50%,-50%) scale(1.07); }
    }
    @keyframes pulse-glow-corner {
      0%, 100% { opacity:0.6; transform:scale(1); }
      50%      { opacity:1;   transform:scale(1.05); }
    }
    @keyframes ember-float {
      0%   { transform:translateY(0) scale(1); opacity:0; }
      12%  { opacity:0.9; }
      100% { transform:translateY(-140px) scale(0.4); opacity:0; }
    }
    @keyframes rise-in {
      from { opacity:0; transform:translateY(14px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .glow-pulse-corner { animation: pulse-glow-corner 7s ease-in-out infinite; }
    .glow-pulse-center { animation: pulse-glow 6s ease-in-out infinite; }
    .ember { position:absolute; bottom:20px; width:4px; height:4px; border-radius:50%; background:var(--accent-bright); box-shadow:0 0 8px 2px rgba(123,212,151,0.7); animation: ember-float 5.5s ease-in infinite; pointer-events:none; }
    .card-hov { transition: transform .35s ease, border-color .35s ease; }
    .card-hov:hover { transform:translateY(-5px); border-color:var(--accent-deep); }
    .rise { animation: rise-in .7s cubic-bezier(.2,.7,.3,1) both; }

    /* marco de foto de producto: halo radial + retícula técnica + viñeta + grano */
    .pbg { position:relative; background:radial-gradient(circle at 50% 40%, var(--photo-glow), var(--photo-shadow) 74%); display:flex; align-items:flex-end; justify-content:center; overflow:hidden; }
    .pbg::before { content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
      background-image:linear-gradient(0deg, rgba(2,10,6,0.78), transparent 24%), radial-gradient(ellipse at 50% 42%, transparent 32%, rgba(2,10,6,0.60) 100%), linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px);
      background-size:100% 100%, 100% 100%, 44px 44px, 44px 44px; }
    .pbg::after { content:""; position:absolute; inset:0; z-index:3; pointer-events:none; opacity:0.5;
      background-image:radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px); background-size:3px 3px; }
    .pbg > svg, .pbg > div.pset { position:relative; z-index:1; }
    /* La foto real del producto SIEMPRE por encima de la escena ilustrada. Sin
       esto la <img> queda estática (z-index auto) debajo del <svg> de escena,
       que sí lleva z-index:1 -- y la tarjeta muestra un fondo genérico en vez
       del producto. Pasó en Colección y en Catálogo. */
    .pbg > img { position:relative; z-index:2; }
    .pset { display:flex; align-items:flex-end; justify-content:center; gap:22px; }
    .pset { display:flex; align-items:flex-end; justify-content:center; gap:22px; }

    /* ---------- mega-menu ----------
       Se abre al pasar el cursor, sin JavaScript: un menu de navegacion que
       depende de un script se queda muerto si el script falla, y este es el
       camino principal al catalogo. El panel se ancla al ancho de la cabecera
       (por eso el elemento lleva position:static y la cabecera position:relative)
       y sigue abierto mientras el cursor este sobre el, para poder bajar a
       elegir sin que se cierre a mitad de camino. */
    .nav-item { position:static; }
    .mega {
      position:absolute; left:0; right:0; top:100%;
      background:#040F09; border-top:1px solid var(--line); border-bottom:1px solid var(--line);
      box-shadow:0 26px 52px rgba(0,0,0,0.6);
      opacity:0; visibility:hidden; transform:translateY(-8px); pointer-events:none;
      transition:opacity .2s ease, transform .2s ease, visibility .2s;
      z-index:40; text-align:left;
    }
    .nav-item:hover .mega, .nav-item:focus-within .mega {
      opacity:1; visibility:visible; transform:none; pointer-events:auto;
    }
    .nav-item:hover > a.lnk { color:var(--text-hi); }
    .mega-col a { display:flex; align-items:center; justify-content:space-between; gap:14px;
      padding:9px 0; font-size:14px; color:var(--text-link); text-decoration:none;
      border-bottom:1px solid rgba(26,38,32,0.7); transition:color .18s ease, padding-left .18s ease; }
    .mega-col a:hover { color:var(--text-hi); padding-left:6px; }
    .mega-col a span.n { font-family:"JetBrains Mono",monospace; font-size:11px; color:var(--text-faintest); }

    .lnk { color:var(--text-link); transition:color .2s ease; }
    .lnk:hover { color:var(--text-hi); }
    .ico { width:38px; height:38px; border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; justify-content:center; background:var(--bg-raised); transition:border-color .25s ease, background .25s ease; }
    .ico:hover { border-color:var(--accent-deep); background:#081B12; }
    .btn-p { background:var(--accent); color:var(--on-accent); font-weight:600; border-radius:8px; text-align:center; transition:filter .2s ease, transform .12s ease; cursor:pointer; border:none; font-family:inherit; }
    .btn-p:hover { filter:brightness(1.07); }
    .btn-p:active { transform:translateY(1px); }
    .btn-s { border:1px solid var(--border); color:var(--text); font-weight:600; border-radius:8px; text-align:center; background:transparent; transition:border-color .2s ease, color .2s ease; cursor:pointer; font-family:inherit; }
    .btn-s:hover { border-color:var(--accent-deep); color:var(--text-hi); }
    .chip { border:1px solid var(--border); border-radius:100px; padding:8px 16px; font-size:13px; color:var(--text-link); background:transparent; cursor:pointer; font-family:inherit; transition:border-color .2s ease, color .2s ease, background .2s ease; }
    .chip:hover { border-color:var(--accent-deep); color:var(--text-hi); }
    .fab { position:absolute; right:26px; bottom:26px; width:52px; height:52px; border-radius:14px; background:#06150F; border:1px solid #2E854D; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 7px rgba(86,189,120,0.05); }
    .qty { width:30px; height:30px; border:1px solid var(--border); border-radius:6px; background:transparent; color:var(--text); font-size:15px; cursor:pointer; font-family:inherit; transition:border-color .2s ease; }
    .qty:hover { border-color:var(--accent-deep); }
`;

/* ---------- isotipo real (logo/galnyx-icono-color.svg), recortado al glifo ---------- */
const ICON_PATH = (() => {
  const raw = fs.readFileSync(path.join(ROOT, 'logo', 'galnyx-icono-color.svg'), 'utf8');
  const m = raw.match(/<path d="([\s\S]*?)"\/>/);
  if (!m) throw new Error('no se encontro el path del isotipo');
  return m[1];
})();
const logo = (h = 30, color = '#56BD78') => {
  const w = Math.round((h * 752.4) / 1015.7);
  return '<svg width="' + w + '" height="' + h + '" viewBox="250.8 120.4 752.4 1015.7" aria-label="GALNYX"><g transform="translate(0,1254) scale(0.1,-0.1)" fill="' + color + '" stroke="none"><path d="' + ICON_PATH + '"/></g></svg>';
};

/* ---------- siluetas monolinea para el fondo estandar de producto ---------- */
const MASKS = {
  silente: `<path d="M60 8C33 8 14 27 14 55c0 30 18 58 46 78 28-20 46-48 46-78 0-28-19-47-46-47z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><path d="M32 54c6-7 16-7 22 0-6 7-16 7-22 0zM66 54c6-7 16-7 22 0-6 7-16 7-22 0z" fill="#020A06" stroke="#56BD78" stroke-width="2.4"/><path d="M48 104c8 4 16 4 24 0" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/>`,
  vigia: `<path d="M60 10c-26 0-44 18-44 44 0 32 20 60 44 82 24-22 44-50 44-82 0-26-18-44-44-44z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><path d="M34 58l20 6M86 58l-20 6" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/><path d="M46 100l14-8 14 8" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  osario: `<path d="M60 8C34 8 16 26 16 52c0 34 20 62 44 82 24-20 44-48 44-82 0-26-18-44-44-44z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><circle cx="43" cy="56" r="7" stroke="#56BD78" stroke-width="2.4"/><circle cx="77" cy="56" r="7" stroke="#56BD78" stroke-width="2.4"/><path d="M44 100h32" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/><path d="M50 100v8M60 100v8M70 100v8" stroke="#2E854D" stroke-width="2"/>`,
  penumbra: `<path d="M60 12c-24 0-42 16-42 42 0 30 18 58 42 78 24-20 42-48 42-78 0-26-18-42-42-42z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><path d="M38 50c4 10 10 14 22 14s18-4 22-14" stroke="#56BD78" stroke-width="2.4" stroke-linecap="round"/><path d="M52 96c5 6 11 6 16 0" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/>`,
  payaso: `<path d="M60 10C34 10 16 28 16 54c0 32 20 60 44 80 24-20 44-48 44-80 0-26-18-44-44-44z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><path d="M36 46l16 12-16 8zM84 46L68 58l16 8z" fill="#020A06" stroke="#56BD78" stroke-width="2.2" stroke-linejoin="round"/><path d="M38 92c8 14 36 14 44 0" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/><path d="M46 96v8M60 99v9M74 96v8" stroke="#2E854D" stroke-width="1.8" stroke-linecap="round"/>`,
  muneca: `<path d="M60 10c-25 0-43 17-43 43 0 33 19 61 43 81 24-20 43-48 43-81 0-26-18-43-43-43z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><circle cx="44" cy="56" r="8" fill="#020A06" stroke="#56BD78" stroke-width="2.4"/><circle cx="76" cy="56" r="8" fill="#020A06" stroke="#56BD78" stroke-width="2.4"/><path d="M55 96c3 4 7 4 10 0" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/><path d="M76 22l6 14-9 6 7 12" stroke="#2E854D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  cazador: `<path d="M60 10c-26 0-44 18-44 44 0 32 20 60 44 80 24-20 44-48 44-80 0-26-18-44-44-44z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><path d="M22 48h76M22 68h76" stroke="#2E854D" stroke-width="1.6"/><path d="M38 56h16M66 56h16" stroke="#56BD78" stroke-width="3" stroke-linecap="round"/><path d="M44 96h32" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/><circle cx="26" cy="58" r="3" fill="#2E854D"/><circle cx="94" cy="58" r="3" fill="#2E854D"/>`,
  espectro: `<path d="M60 8c-24 0-42 18-42 44 0 22 8 40 20 54l-6 26 12-8 10 12 6-10 6 10 10-12 12 8-6-26c12-14 20-32 20-54 0-26-18-44-42-44z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4" stroke-linejoin="round"/><path d="M42 52c4-6 12-6 16 0M62 52c4-6 12-6 16 0" stroke="#56BD78" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="60" cy="80" rx="6" ry="9" stroke="#56BD78" stroke-width="2.2"/>`,
  criatura: `<path d="M60 12c-25 0-44 16-44 42 0 32 20 60 44 80 24-20 44-48 44-80 0-26-19-42-44-42z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><path d="M34 54h20M66 54h20" stroke="#56BD78" stroke-width="3" stroke-linecap="round"/><path d="M30 74h60" stroke="#2E854D" stroke-width="1.8"/><path d="M38 70v8M50 70v8M62 70v8M74 70v8M86 70v8" stroke="#2E854D" stroke-width="1.6"/><path d="M48 98h24" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/>`,
  bruja: `<path d="M60 34c-22 0-38 16-38 40 0 28 17 52 38 68 21-16 38-40 38-68 0-24-16-40-38-40z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4"/><path d="M60 34L48 6l32 14z" fill="#020A06" stroke="#2E854D" stroke-width="2.2" stroke-linejoin="round"/><path d="M40 62c5-7 13-7 18 0M62 62c5-7 13-7 18 0" stroke="#56BD78" stroke-width="2.4" stroke-linecap="round"/><path d="M50 100c6 5 14 5 20 0" stroke="#56BD78" stroke-width="2.6" stroke-linecap="round"/>`,
  traje: `<path d="M42 14l18 12 18-12 22 16-14 16v90H34V46L20 30z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4" stroke-linejoin="round"/><path d="M60 26v94" stroke="#56BD78" stroke-width="2.2"/><path d="M46 20l14 20 14-20" stroke="#56BD78" stroke-width="2.2" stroke-linejoin="round"/>`,
  accesorio: `<path d="M40 130V70c0-6 4-10 9-10s9 4 9 10V30c0-6 4-10 9-10s9 4 9 10v40c0-6 4-10 9-10s9 4 9 10v46c0 18-14 34-32 34z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4" stroke-linejoin="round"/><path d="M58 66v26M76 66v26" stroke="#56BD78" stroke-width="2.2" stroke-linecap="round"/><path d="M40 84c-8-4-14 2-12 10l6 18" stroke="#2E854D" stroke-width="2.2" stroke-linecap="round"/>`,
  fx: `<path d="M60 12c14 22 32 34 32 58a32 32 0 1 1-64 0c0-24 18-36 32-58z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.4" stroke-linejoin="round"/><path d="M46 74c0 12 6 20 14 22" stroke="#56BD78" stroke-width="2.4" stroke-linecap="round"/><path d="M52 118l8 20 8-20" stroke="#2E854D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  pareja: `<path d="M38 26c-16 0-27 11-27 28 0 20 12 38 27 52 15-14 27-32 27-52 0-17-11-28-27-28z" fill="#0B1F16" stroke="#2E854D" stroke-width="2.2"/><path d="M24 54c3-5 9-5 12 0M40 54c3-5 9-5 12 0" stroke="#56BD78" stroke-width="2" stroke-linecap="round"/><path d="M82 42c-16 0-27 11-27 28 0 20 12 38 27 52 15-14 27-32 27-52 0-17-11-28-27-28z" fill="#081A11" stroke="#2E854D" stroke-width="2.2"/><path d="M68 70c3-5 9-5 12 0M84 70c3-5 9-5 12 0" stroke="#56BD78" stroke-width="2" stroke-linecap="round"/><path d="M72 100c6 4 14 4 20 0" stroke="#56BD78" stroke-width="2.2" stroke-linecap="round"/>`,
};
const mask = (name, w, h) => {
  const d = MASKS[name];
  if (!d) throw new Error('mascara desconocida: ' + name);
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 120 150" fill="none">' + d + '</svg>';
};

/* ---------- iconos de UI (monolinea, rejilla 24px) ---------- */
const ICONS = {
  search: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#B9C6BF" stroke-width="1.8"/><path d="M20 20l-3.8-3.8" stroke="#B9C6BF" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  wa: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3.5 20.5l1.4-4.6A8.2 8.2 0 1 1 8.3 19l-4.8 1.5z" stroke="#B9C6BF" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  waBig: `<svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M3.5 20.5l1.4-4.6A8.2 8.2 0 1 1 8.3 19l-4.8 1.5z" stroke="#56BD78" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.6 9.6c0 2.9 2.4 5.3 5.3 5.3.5 0 .9-.4.9-.9v-1l-1.7-.5-.8.8a5.6 5.6 0 0 1-2.1-2.1l.8-.8-.5-1.7h-1c-.5 0-.9.4-.9.9z" fill="#56BD78"/></svg>`,
  cart: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 5h2l2.2 11.1a1.6 1.6 0 0 0 1.6 1.3h7.4a1.6 1.6 0 0 0 1.6-1.3L20 8.5H6.4" stroke="#DFE7E2" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20.5" r="1.3" fill="#DFE7E2"/><circle cx="17.5" cy="20.5" r="1.3" fill="#DFE7E2"/></svg>`,
  chev: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" style="margin-left:5px; opacity:.65;"><path d="M6 9.5l6 6 6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h13M12.5 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  truck: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" stroke="#56BD78" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.8" stroke="#56BD78" stroke-width="1.7"/><circle cx="17" cy="18" r="1.8" stroke="#56BD78" stroke-width="1.7"/></svg>`,
  shield: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7l8-4z" stroke="#56BD78" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 12l2.2 2.2L15.5 10" stroke="#56BD78" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  swap: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 9a8 8 0 0 1 14-4M20 15a8 8 0 0 1-14 4" stroke="#56BD78" stroke-width="1.7" stroke-linecap="round"/><path d="M4 4v5h5M20 20v-5h-5" stroke="#56BD78" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="11" rx="2" stroke="#56BD78" stroke-width="1.7"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#56BD78" stroke-width="1.7"/></svg>`,
};

/* ---------- barra de anuncio + cabecera de 5 grupos ---------- */
const SITIO = 'https://yedi06.github.io/galnyx/';
const OG_IMAGEN = 'og.jpg';

/* esc() se usa en el <head> del envoltorio, que se arma antes que el bloque de
   catálogo donde estaba definido. Se sube aquí para que exista a tiempo. */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- rutas del sitio ----------
   Cada artboard se publica dos veces en galnyx-canvas/: con su nombre .dc.html
   (lo que consume el canvas) y con una URL limpia (lo que ve el visitante).
   Son 34 archivos HTML de ~30 KB: duplicarlos cuesta 1 MB y evita tener que
   mantener dos carpetas con los mismos 121 activos.

   'movil' apunta a la versión de celular cuando existe: el script del envoltorio
   la usa para llevar allí a quien entra desde un teléfono. Sin eso, alguien que
   llega de un anuncio de Instagram vería la maqueta de 1440 px reducida. */
const RUTAS = {
  Main:             { url: 'index.html',              titulo: 'GALNYX — Máscaras y disfraces de terror hiperrealistas | Lima, Perú', desc: 'Máscaras de látex y disfraces de terror seleccionados uno por uno. Envío 24–48 h en Lima, cambios en 7 días. 99 modelos en catálogo.', movil: 'movil-home.html' },
  Mascaras:         { url: 'mascaras.html',           titulo: 'Máscaras de terror — 41 modelos | GALNYX', desc: 'Máscaras de goma y de plástico. Michael Myers, Payaso It, Leatherface, Venom y 37 modelos más. Desde S/15.', movil: 'movil-catalogo.html' },
  Disfraces:        { url: 'disfraces.html',          titulo: 'Disfraces — 58 modelos | GALNYX', desc: 'Disfraces de terror, superhéroes, cuentos y carreras. Desde S/45, envío 24–48 h en Lima.', movil: 'movil-catalogo.html' },
  Catalogo:         { url: 'catalogo.html',           titulo: 'Catálogo completo | GALNYX', desc: 'Los 99 productos de GALNYX: máscaras de goma, de plástico y disfraces.', movil: 'movil-catalogo.html' },
  Producto:         { url: 'producto.html',           titulo: 'Ficha de producto | GALNYX', desc: 'Foto real de la pieza, precio y compra en un clic.', movil: 'movil-producto.html' },
  Coleccion:        { url: 'coleccion-payaso.html',   titulo: 'Payaso siniestro — 7 máscaras | GALNYX', desc: 'Los siete payasos del catálogo: It, Robber, Terrifier, Twisted Metal, Payday, Ojón y Joker.' },
  ColeccionCazador: { url: 'coleccion-cazador.html',  titulo: 'Cazador enmascarado | GALNYX', desc: 'Michael Myers, Leatherface, Killer, Pigsaw y Conejo asesino.' },
  ColeccionGlamour: { url: 'coleccion-glamour.html',  titulo: 'Glamour adulto | GALNYX', desc: 'Diosa griega, Cleopatra, Enfermera, Vaquera y Animadora.' },
  ColeccionHadas:   { url: 'coleccion-hadas.html',    titulo: 'Cuentos de hadas | GALNYX', desc: 'Blanca Nieves, Cenicienta, Rapunzel y Barbie escuela de princesas.' },
  Pareja:           { url: 'parejas.html',            titulo: 'Parejas — máscara y disfraz que combinan | GALNYX', desc: 'Nueve parejas del catálogo. Cada pieza se compra por separado, a su precio.' },
  Looks:            { url: 'looks.html',              titulo: 'Arquetipos | GALNYX', desc: 'Cuatro arquetipos fotografiados. La máscara y el disfraz de cada uno, por separado.' },
  LookDetalle:      { url: 'look.html',               titulo: 'Payaso siniestro — las dos piezas | GALNYX', desc: 'La máscara y el disfraz de la foto, cada uno con su precio.' },
  Historias:        { url: 'historias.html',          titulo: 'Historias — de dónde viene cada máscara | GALNYX', desc: 'El origen de cada personaje y por qué su diseño funciona. Al final de cada historia, la pieza.' },
  Historia:         { url: 'historia.html',           titulo: 'La cara que no expresa nada — Michael Myers | GALNYX', desc: 'La máscara más imitada del cine de terror empezó como una decisión de presupuesto.' },
  Carrito:          { url: 'carrito.html',            titulo: 'Tu carrito | GALNYX', desc: 'Revisa tu pedido antes de pagar.', movil: 'movil-pago.html' },
  Checkout:         { url: 'checkout.html',           titulo: 'Datos de envío | GALNYX', desc: 'Envío 24–48 h en Lima Metropolitana.', movil: 'movil-pago.html' },
  CheckoutPago:     { url: 'pago.html',               titulo: 'Pago — Yape, Plin o contra entrega | GALNYX', desc: 'Paga con Yape, Plin o contra entrega en Lima.', movil: 'movil-pago.html' },
  Confirmacion:     { url: 'confirmacion.html',       titulo: 'Pedido confirmado | GALNYX', desc: 'Tu pedido está en camino.' },
  Nosotros:         { url: 'nosotros.html',           titulo: 'Cómo trabajamos | GALNYX', desc: 'Proveedor directo, stock verificado y despacho en 24–48 h desde Lima.' },
  Contacto:         { url: 'contacto.html',           titulo: 'Contacto — WhatsApp +51 904 817 248 | GALNYX', desc: 'Escríbenos por WhatsApp de 9 a. m. a 9 p. m. Responde una persona.' },
  Error404:         { url: '404.html',                titulo: 'Página no encontrada | GALNYX', desc: 'Esta pieza ya no está aquí, pero el catálogo sigue en pie.' },
  Menus:            { url: 'menu.html',               titulo: 'Mega-menú | GALNYX', desc: 'El árbol completo del catálogo.' },
  Vacio:            { url: 'sin-resultados.html',     titulo: 'Sin resultados | GALNYX', desc: 'Esa combinación de filtros no devuelve nada.' },
  MovilHome:        { url: 'movil-home.html',         titulo: 'GALNYX — Máscaras y disfraces de terror | Lima', desc: 'Máscaras de látex y disfraces de terror. Envío 24–48 h en Lima.' },
  MovilMenu:        { url: 'movil-menu.html',         titulo: 'Menú | GALNYX', desc: 'Navega el catálogo.' },
  MovilCatalogo:    { url: 'movil-catalogo.html',     titulo: 'Máscaras | GALNYX', desc: 'El catálogo de máscaras en tu celular.' },
  MovilProducto:    { url: 'movil-producto.html',     titulo: 'Michael Myers — S/130 | GALNYX', desc: 'Máscara de Michael Myers en látex ultra realista, talla única amoldable.' },
  MovilPago:        { url: 'movil-pago.html',         titulo: 'Carrito y pago | GALNYX', desc: 'Yape, Plin o contra entrega.' },
  SEO:              { url: 'sistema-seo.html',        titulo: 'Sistema · SEO | GALNYX', desc: 'Documentación interna.', interno: true },
  Foto:             { url: 'sistema-foto.html',       titulo: 'Sistema · Fotografía | GALNYX', desc: 'Documentación interna.', interno: true },
  Fondos:           { url: 'sistema-fondos.html',     titulo: 'Sistema · Fondos | GALNYX', desc: 'Documentación interna.', interno: true },
  Gamas:            { url: 'sistema-gamas.html',      titulo: 'Sistema · Color | GALNYX', desc: 'Documentación interna.', interno: true },
  TemaPlay:         { url: 'sistema-temas.html',      titulo: 'Sistema · Temas | GALNYX', desc: 'Documentación interna.', interno: true },
  Tipografia:       { url: 'sistema-tipografia.html', titulo: 'Sistema · Tipografía | GALNYX', desc: 'Documentación interna.', interno: true },
};

/* Destinos del menú y del pie. Cuando algo todavía no tiene página propia se
   manda a la que más se le parece en vez de dejar un enlace muerto: un enlace
   que no lleva a ningún lado cuesta más que uno que lleva a algo cercano. */
const R = (n) => (RUTAS[n] ? RUTAS[n].url : 'index.html');
const WHATSAPP = 'https://wa.me/51904817248';

const NAVLINKS = [
  ['Catálogo', 'catalogo', R('Mascaras'), () => megaCatalogo()],
  ['Colecciones', 'colecciones', R('Looks'), () => megaColecciones()],
  ['Parejas', 'parejas', R('Pareja')],
  ['Historias', 'historias', R('Historias')],
];

/* Contenido de los dos desgloses. Los conteos salen del inventario, no estan
   escritos a mano: si manana entran diez mascaras nuevas, el menu lo dice solo. */
const megaCatalogo = () => `
        <div class="mega">
          <div style="display:grid; grid-template-columns: 1fr 1fr 1.1fr; gap:52px; padding:34px 64px 30px 64px; max-width:1920px; margin:0 auto;">
            <div class="mega-col">
              <div class="kicker" style="font-size:10px; color:var(--accent); margin-bottom:14px;">Mascaras &middot; ${catalogo(CAT_GOMA).length + catalogo(CAT_PLASTICO).length}</div>
              <a href="${R('Mascaras')}">De goma <span class="n">${catalogo(CAT_GOMA).length}</span></a>
              <a href="${R('Mascaras')}">De pl&aacute;stico <span class="n">${catalogo(CAT_PLASTICO).length}</span></a>
              <a href="${R('Coleccion')}">Payaso siniestro <span class="n">7</span></a>
              <a href="${R('ColeccionCazador')}">Cazador enmascarado <span class="n">5</span></a>
            </div>
            <div class="mega-col">
              <div class="kicker" style="font-size:10px; color:var(--accent); margin-bottom:14px;">Disfraces &middot; ${catalogo(CAT_DISFRACES).length}</div>
              <a href="${R('Disfraces')}">Ver todos <span class="n">${catalogo(CAT_DISFRACES).length}</span></a>
              <a href="${R('ColeccionGlamour')}">Glamour adulto <span class="n">5</span></a>
              <a href="${R('ColeccionHadas')}">Cuentos de hadas <span class="n">4</span></a>
              <a href="${R('Pareja')}">En pareja <span class="n">9</span></a>
            </div>
            <div>
              <div class="kicker" style="font-size:10px; color:var(--text-faintest); margin-bottom:14px;">Del cat&aacute;logo</div>
              <a href="${R('Producto')}" style="display:flex; gap:16px; align-items:center; text-decoration:none; background:var(--bg-raised); border:1px solid var(--line); border-radius:12px; padding:14px;">
                <div class="pbg" style="width:78px; height:92px; border-radius:8px; flex-shrink:0;">${foto('mascara-goma-17-michael-myers', 78)}</div>
                <div style="flex-grow:1;">
                  <div class="dsp" style="font-weight:700; font-size:16px; color:var(--text-hi);">${esc(_porSlug.get('mascara-goma-17-michael-myers').nombre)}</div>
                  <div class="mono" style="font-size:11px; color:var(--text-faint); margin-top:6px;">GOMA</div>
                  <div class="dsp" style="font-weight:700; font-size:18px; color:var(--text-hi); margin-top:8px;">${esc(_porSlug.get('mascara-goma-17-michael-myers').precio)}</div>
                </div>
              </a>
              <a href="${R('Catalogo')}" class="btn-p" style="display:flex; align-items:center; justify-content:center; gap:9px; margin-top:14px; padding:13px; font-size:13.5px; text-decoration:none;">Ver los ${_inv.listos.length} productos ${ICONS.arrow}</a>
            </div>
          </div>
        </div>`;

const megaColecciones = () => `
        <div class="mega">
          <div style="display:grid; grid-template-columns: 1fr 1fr 1.1fr; gap:52px; padding:34px 64px 30px 64px; max-width:1920px; margin:0 auto;">
            <div class="mega-col">
              <div class="kicker" style="font-size:10px; color:var(--accent); margin-bottom:14px;">Arquetipos</div>
              <a href="${R('Coleccion')}">Payaso siniestro <span class="n">7</span></a>
              <a href="${R('ColeccionCazador')}">Cazador enmascarado <span class="n">5</span></a>
              <a href="${R('ColeccionGlamour')}">Glamour adulto <span class="n">5</span></a>
              <a href="${R('ColeccionHadas')}">Cuentos de hadas <span class="n">4</span></a>
            </div>
            <div class="mega-col">
              <div class="kicker" style="font-size:10px; color:var(--accent); margin-bottom:14px;">C&oacute;mo verlo</div>
              <a href="${R('Looks')}">Los cuatro arquetipos</a>
              <a href="${R('Pareja')}">Parejas <span class="n">9</span></a>
              <a href="${R('Historias')}">Historias <span class="n">${Object.keys(_historias).length}</span></a>
              <a href="${R('Nosotros')}">C&oacute;mo trabajamos</a>
            </div>
            <div>
              <div class="kicker" style="font-size:10px; color:var(--text-faintest); margin-bottom:14px;">Arquetipo destacado</div>
              <a href="${R('Coleccion')}" style="display:block; position:relative; height:158px; border-radius:12px; overflow:hidden; text-decoration:none; background:var(--photo-shadow);">
                <img src="${arte('payaso-siniestro', 'wide')}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;">
                <span style="position:absolute; inset:0; background:linear-gradient(0deg, rgba(var(--bg-rgb),0.92), transparent 62%);"></span>
                <span class="dsp" style="position:absolute; left:16px; bottom:14px; font-weight:700; font-size:20px; color:var(--text-hi);">Payaso siniestro</span>
              </a>
            </div>
          </div>
        </div>`;

const header = (active, cart, sticky) => `
  <div style="background:#06150F; border-bottom:1px solid #14211B; padding:11px 0; text-align:center;">
    <span class="mono" style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#7C8B83;">Envío 24–48 h en Lima · Cambios en 7 días · Pedidos hasta el 28 de octubre</span>
  </div>

  <div style="display:flex; align-items:center; justify-content:space-between; padding:18px 64px; border-bottom:1px solid #14211B; ${sticky ? 'position:sticky; top:0; z-index:20; background:rgba(2,10,6,0.94);' : 'position:relative; background:#020A06;'}">
    <div style="display:flex; align-items:center; gap:44px;">
      <a href="${R('Main')}" style="display:flex; align-items:center; gap:11px; text-decoration:none;">
        ${logo(30)}
        <span class="wordmark" style="font-size:23px; letter-spacing:0.04em; color:#F2F7F4;">GALNYX</span>
      </a>
      <nav style="display:flex; align-items:center; gap:30px; font-size:14px;">
${NAVLINKS.map(([label, id, href, mega]) =>
  '        <div class="nav-item">\n' +
  '          <a class="lnk" href="' + href + '" style="display:inline-flex; align-items:center; text-decoration:none;' + (active === id ? ' color:#F5FAF7;' : '') + '">' + label + (mega ? ICONS.chev : '') + '</a>' +
  (mega ? '\n' + mega() : '') + '\n' +
  '        </div>').join('\n')}
      </nav>
    </div>
    <div style="display:flex; align-items:center; gap:10px;">
      <a class="ico" href="${R('Catalogo')}" aria-label="Buscar en el catálogo">${ICONS.search}</a>
      <a class="ico" href="${WHATSAPP}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">${ICONS.wa}</a>
      <a class="ico" href="${R('Carrito')}" style="width:auto; padding:0 13px; gap:8px; text-decoration:none;" aria-label="Ver el carrito">${ICONS.cart}<span class="mono" style="font-size:12px; color:#DFE7E2;">${cart}</span></a>
    </div>
  </div>`;

const footer = () => `
  <div style="border-top:1px solid #14211B; padding:52px 64px 40px 64px;">
    <div style="display:grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap:44px; padding-bottom:40px;">
      <div>
        <a href="${R('Main')}" style="display:flex; align-items:center; gap:10px; margin-bottom:16px; text-decoration:none;">
          ${logo(26)}
          <span class="wordmark" style="font-size:20px; letter-spacing:0.04em; color:#F2F7F4;">GALNYX</span>
        </a>
        <p style="font-size:13px; color:#7C8B83; line-height:1.65; margin:0 0 18px 0; max-width:290px;">Máscaras y trajes de terror seleccionados. Operamos desde Lima, Perú.</p>
        <div style="display:flex; gap:10px;">
          <div style="width:34px; height:34px; border:1px solid #25312B; border-radius:8px; display:flex; align-items:center; justify-content:center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#9FB0A7" stroke-width="1.7"/><circle cx="12" cy="12" r="4" stroke="#9FB0A7" stroke-width="1.7"/><circle cx="17" cy="7" r="1" fill="#9FB0A7"/></svg>
          </div>
          <div style="width:34px; height:34px; border:1px solid #25312B; border-radius:8px; display:flex; align-items:center; justify-content:center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M15 4c.6 2.4 2.2 3.8 4.5 4v3c-1.7 0-3.3-.5-4.5-1.4V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.6 2.3V4h3z" stroke="#9FB0A7" stroke-width="1.6" stroke-linejoin="round"/></svg>
          </div>
          <div style="width:34px; height:34px; border:1px solid #25312B; border-radius:8px; display:flex; align-items:center; justify-content:center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3.5 20.5l1.4-4.6A8.2 8.2 0 1 1 8.3 19l-4.8 1.5z" stroke="#9FB0A7" stroke-width="1.6" stroke-linejoin="round"/></svg>
          </div>
        </div>
      </div>
      <div>
        <div class="mono" style="font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#5E6E66; margin-bottom:14px;">Tienda</div>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13.5px; color:#9FB0A7;">
          <a class="lnk" href="${R('Mascaras')}">Máscaras de goma</a><a class="lnk" href="${R('Mascaras')}">Máscaras de plástico</a><a class="lnk" href="${R('Disfraces')}">Disfraces</a>
        </div>
      </div>
      <div>
        <div class="mono" style="font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#5E6E66; margin-bottom:14px;">Ayuda</div>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13.5px; color:#9FB0A7;">
          <a class="lnk" href="${R('Nosotros')}">Envíos y entregas</a><a class="lnk" href="${R('Nosotros')}">Cambios en 7 días</a><a class="lnk" href="${R('Nosotros')}">Cómo trabajamos</a><a class="lnk" href="${R('Contacto')}">Contacto</a>
        </div>
      </div>
      <div>
        <div class="mono" style="font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#5E6E66; margin-bottom:14px;">Legal</div>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13.5px; color:#9FB0A7;">
          <a class="lnk" href="${R('Contacto')}">Términos y condiciones</a><a class="lnk" href="${R('Contacto')}">Política de privacidad</a><a class="lnk" href="${R('Contacto')}">Libro de reclamaciones</a>
        </div>
      </div>
    </div>
    <div style="display:flex; align-items:center; justify-content:space-between; padding-top:24px; border-top:1px solid #14211B;">
      <span style="font-size:12.5px; color:#5E6E66;">© 2026 GALNYX. Todos los derechos reservados.</span>
      <span class="mono" style="font-size:11px; color:#5E6E66;">Hecho en Lima, Perú · <a class="lnk" href="paginas.html">mapa del sitio</a></span>
    </div>
  </div>`;

/* ---------- retícula tipo QR, decorativa y determinista ---------- */
const qrSvg = (size) => {
  const N = 25, cell = size / N;
  let seed = 20261025;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const finder = (x, y) => {
    const c = (i, j) => `<rect x="${(x + i) * cell}" y="${(y + j) * cell}" width="${cell}" height="${cell}" fill="#DFE7E2"/>`;
    let o = '';
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const edge = i === 0 || i === 6 || j === 0 || j === 6;
      const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      if (edge || core) o += c(i, j);
    }
    return o;
  };
  const inFinder = (i, j) =>
    (i < 8 && j < 8) || (i > N - 9 && j < 8) || (i < 8 && j > N - 9);
  let cells = '';
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (inFinder(i, j)) continue;
    if (rnd() > 0.53) cells += `<rect x="${i * cell}" y="${j * cell}" width="${cell}" height="${cell}" fill="#DFE7E2"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#020A06"/>${cells}${finder(0, 0)}${finder(N - 7, 0)}${finder(0, N - 7)}</svg>`;
};

const STEPS = [['Envío', '01'], ['Pago', '02'], ['Confirmación', '03']];
const chkheader = (step) => {
  const n = Number(step);
  const pct = n === 1 ? '16.6%' : n === 2 ? '50%' : '100%';
  return `
  <div style="display:flex; align-items:center; justify-content:space-between; padding:20px 64px; border-bottom:1px solid #14211B; background:#020A06;">
    <a href="${R('Main')}" style="display:flex; align-items:center; gap:11px; text-decoration:none;">
      ${logo(28)}
      <span class="wordmark" style="font-size:22px; letter-spacing:0.04em; color:#F2F7F4;">GALNYX</span>
    </a>
    <div style="display:flex; align-items:center; gap:9px;">
      ${ICONS.lock.replace('width="22" height="22"', 'width="15" height="15"').replace(/#56BD78/g, '#7C8B83')}
      <span class="mono" style="font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#7C8B83;">Compra protegida</span>
    </div>
  </div>

  <div style="padding:30px 64px 0 64px;">
    <div style="display:flex; align-items:center; gap:0;">
${STEPS.map(([label, num], i) => {
  const idx = i + 1;
  const done = idx < n, now = idx === n;
  const dotBorder = done || now ? '#56BD78' : '#25312B';
  const dotBg = done ? '#56BD78' : 'transparent';
  const numCol = done ? '#02160A' : (now ? '#56BD78' : '#5E6E66');
  const labCol = now ? '#F5FAF7' : (done ? '#9FB0A7' : '#5E6E66');
  return `      <div style="display:flex; align-items:center; gap:12px;">
        <span style="width:30px; height:30px; border-radius:50%; border:1.5px solid ${dotBorder}; background:${dotBg}; display:flex; align-items:center; justify-content:center;">
          <span class="mono" style="font-size:11px; color:${numCol};">${done ? '' : num}</span>${done ? ICONS.check.replace('currentColor', '#02160A') : ''}
        </span>
        <span class="kicker" style="font-size:12px; color:${labCol};">${label}</span>
      </div>${idx < 3 ? '<div style="flex-grow:1; height:1px; background:#1A2620; margin:0 20px;"></div>' : ''}`;
}).join('')}
    </div>
    <div style="height:2px; background:#14211B; border-radius:2px; margin-top:22px; overflow:hidden;">
      <div style="height:100%; width:${pct}; background:linear-gradient(90deg,#2E854D,#56BD78); border-radius:2px; transition:width .6s cubic-bezier(.2,.7,.3,1);"></div>
    </div>
  </div>`;
};

const fab = () => `
  <div style="position:relative; height:0; z-index:30;"><a class="fab" href="${WHATSAPP}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">${ICONS.waBig}</a></div>`;

/* ---------- móvil: barra superior de 56 px, objetivos de 44 px ---------- */
const mheader = (cart) => `
  <div style="background:#06150F; border-bottom:1px solid #14211B; padding:8px 0; text-align:center;">
    <span class="mono" style="font-size:9px; letter-spacing:0.12em; text-transform:uppercase; color:#7C8B83;">Envío 24–48 h en Lima · Cambios en 7 días</span>
  </div>
  <div style="position:sticky; top:0; z-index:30; display:flex; align-items:center; justify-content:space-between; padding:0 8px 0 4px; height:56px; background:rgba(2,10,6,0.95); border-bottom:1px solid #14211B;">
    <div style="display:flex; align-items:center;">
      <a href="${R('MovilMenu')}" style="width:44px; height:44px; display:flex; align-items:center; justify-content:center;" aria-label="Abrir el menú">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="#DFE7E2" stroke-width="1.9" stroke-linecap="round"/></svg>
      </a>
      <a href="${R('MovilHome')}" style="display:flex; align-items:center; gap:8px; text-decoration:none;">
        ${logo(24)}
        <span class="wordmark" style="font-size:19px; letter-spacing:0.04em; color:#F2F7F4;">GALNYX</span>
      </a>
    </div>
    <div style="display:flex; align-items:center;">
      <a href="${R('MovilCatalogo')}" style="width:44px; height:44px; display:flex; align-items:center; justify-content:center;" aria-label="Buscar">${ICONS.search}</a>
      <a href="${R('MovilPago')}" style="width:44px; height:44px; display:flex; align-items:center; justify-content:center; position:relative;" aria-label="Ver el carrito">${ICONS.cart}
        <span class="mono" style="position:absolute; top:6px; right:4px; min-width:16px; height:16px; border-radius:8px; background:#56BD78; color:#02160A; font-size:9.5px; display:flex; align-items:center; justify-content:center; padding:0 4px;">${cart}</span>
      </a>
    </div>
  </div>`;

const mfooter = () => `
  <div style="border-top:1px solid #14211B; padding:32px 20px 28px 20px;">
    <div style="display:flex; align-items:center; gap:9px; margin-bottom:14px;">
      ${logo(22)}
      <span class="wordmark" style="font-size:17px; letter-spacing:0.04em; color:#F2F7F4;">GALNYX</span>
    </div>
    <p style="font-size:12.5px; color:#7C8B83; line-height:1.65; margin:0 0 22px 0;">Máscaras y trajes de terror seleccionados. Operamos desde Lima, Perú.</p>
    <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px 20px; font-size:13px; color:#9FB0A7; padding-bottom:22px; border-bottom:1px solid #14211B;">
      <a class="lnk" href="${R('MovilCatalogo')}">Máscaras</a><a class="lnk" href="${R('Nosotros')}">Envíos y entregas</a>
      <a class="lnk" href="${R('MovilCatalogo')}">Disfraces</a><a class="lnk" href="${R('Nosotros')}">Cambios en 7 días</a>
      <a class="lnk" href="${R('Looks')}">Arquetipos</a><a class="lnk" href="${R('Contacto')}">Contacto</a>
    </div>
    <div style="display:flex; align-items:center; justify-content:space-between; padding-top:18px;">
      <span style="font-size:11.5px; color:#5E6E66;">© 2026 GALNYX</span>
      <span class="mono" style="font-size:10px; color:#5E6E66;">Hecho en Lima</span>
    </div>
  </div>`;

/* ---------- envoltorio de página ----------
   Las páginas se diseñaron a ancho fijo (1440 px escritorio, 390 px móvil).
   Servidas tal cual quedaban pegadas a la izquierda con una franja vacía al
   lado, que es justo lo que delata una maqueta. El envoltorio resuelve tres
   cosas sin tocar el diseño de ninguna página:

   1. Centrado. El lienzo va al medio y el fondo de la ventana es el de la
      marca, así el ancho sobrante deja de leerse como un error.
   2. Escalado. Si la ventana es más angosta que el lienzo, se aplica `zoom`
      para que entre completo. `zoom` y no `transform:scale` a propósito:
      transform no reflowa y deja barra horizontal y huecos abajo.
   3. Puente a móvil. Quien entra desde un teléfono a una página de escritorio
      va a su equivalente de 390 px. Sin esto, el tráfico de Instagram y TikTok
      -- que es la mayoría -- aterrizaría en la maqueta ancha reducida.

   Y las etiquetas que un sitio con tráfico pagado necesita sí o sí: título,
   descripción, y la tarjeta de compartir para cuando el enlace se pega en
   WhatsApp o en un anuncio. */
const shell = (body, script, meta) => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(meta.titulo)}</title>
  <meta name="description" content="${esc(meta.desc)}">
  ${meta.interno ? '<meta name="robots" content="noindex">' : '<link rel="canonical" href="' + SITIO + meta.url + '">'}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="GALNYX">
  <meta property="og:locale" content="es_PE">
  <meta property="og:title" content="${esc(meta.titulo)}">
  <meta property="og:description" content="${esc(meta.desc)}">
  <meta property="og:url" content="${SITIO}${meta.url}">
  <meta property="og:image" content="${SITIO}${OG_IMAGEN}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#020A06">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <script src="./support.js"></script>
  <style>
    html { background:#020A06; }
    body { min-height:100vh; }
    a { color:inherit; }
${meta.ancho === 390 ? `
    /* Página de celular: 390 px centrados sobre el fondo de marca. */
    body > x-dc > div:first-of-type { width:390px; margin:0 auto; }
` : `
    /* El lienzo se dibujó a 1440 px, pero servirlo así deja la página como una
       isla con fondo vacío a los lados -- que es exactamente lo que delata una
       maqueta. Aquí se suelta a ancho completo: las rejillas internas ya son
       fluidas (repeat(n, minmax(0,1fr))) y los márgenes van en padding, así que
       estirar el contenedor reparte el espacio en vez de dejarlo muerto.
       El tope de 1920 evita que en un monitor ultrapanorámico las tarjetas
       crezcan hasta perder proporción. Por debajo de 1180 el envoltorio vuelve
       a escalar, porque ahí las rejillas de 4 columnas ya no respiran. */
    body > x-dc > div[style*="width:1440px"] { width:100% !important; max-width:1920px; margin:0 auto; }
`}
  </style>
  <script>
  (function () {
    var ANCHO = ${meta.ancho};
    var MINIMO = ${meta.ancho === 390 ? 390 : 1180};
    var MOVIL = ${meta.movil ? JSON.stringify(meta.movil) : 'null'};
    /* A un teléfono se le manda la versión de 390 px si existe. Se comprueba
       una vez, antes de pintar, y solo hacia abajo: nunca devuelve al de
       escritorio, para que quien elija "ver versión completa" se quede ahí. */
    if (MOVIL && Math.min(screen.width, window.innerWidth) < 700) {
      location.replace(MOVIL + location.search + location.hash);
      return;
    }
    /* Entre MINIMO y el tope, el diseño es fluido y no hace falta tocar nada.
       Por debajo de MINIMO se escala para que entre completo en vez de dejar
       barra horizontal. */
    function encajar() {
      var v = document.documentElement.clientWidth;
      document.documentElement.style.zoom = v < MINIMO ? (v / MINIMO) : '';
    }
    encajar();
    addEventListener('resize', encajar);
  })();
  </script>
</head>
<body>
<x-dc>
<helmet>
    <style>
${FONTS}
${CSS}
    </style>
</helmet>
${body}
</x-dc>${script ? '\n' + script : ''}
</body>
</html>
`;

/* ---------- fotos reales de producto ----------
   imagenes/_web/<slug>.webp lo genera scripts/optimizar-fotos.py desde
   imagenes/Disfraces/NN Nombre/imagen_principal.png. Son recortes con canal
   alfa, así que respetan el mismo contrato que photo(): altura fija, ancho
   automático y pegados al borde inferior. Entran en el mismo hueco que el
   maniquí SVG y el fondo de la tarjeta se sigue viendo detrás del sujeto.
   alt="" a propósito: en las tarjetas el nombre del producto va como texto
   justo debajo, así que repetirlo en el alt solo duplicaría el anuncio. */
const WEB = path.join(ROOT, 'imagenes', '_web');

function foto(slug, h) {
  const src = activo(path.join('imagenes', '_web', slug + '.webp'), 'python scripts/optimizar-fotos.py');
  return '<img src="' + src + '"' +
    ' height="' + h + '" alt="" style="height:' + h + 'px; width:auto; display:block;">';
}

/* ---------- imágenes de arte: Colecciones, Tendencias y Looks ----------
   imagenes/_web/arte/<slug>-<variante>.webp lo genera scripts/optimizar-arte.py.
   No son fotos de producto: son escenas completas, sin alfa, y por eso NO pasan
   por foto() -- ni llevan altura fija ni se pegan al borde inferior. Se usan
   como fondo de banner o de tarjeta, y devuelven solo el nombre de archivo.

   OJO -- comprobado en el artifact publicado: el runtime del canvas resuelve el
   archivo hermano en <img src="...">, pero NO en background-image:url(...). Con
   url() la página carga sin error y la imagen simplemente no aparece. Por eso
   TODAS estas imágenes van como <img> absoluta con object-fit:cover dentro de
   un contenedor position:relative + overflow:hidden, y no como fondo CSS.

   Variantes: banner (1376x768, cabecera de página), card (768x768, tarjeta
   cuadrada del home), wide (848x476, banda de tarjeta), look (896x1200).

   Importante para el peso: cada variante que se nombre viaja en el bundle.
   Pedir 'banner' donde alcanza 'card' sube el bundle un par de cientos de KB
   sin que se note en pantalla -- elige la más chica que cubra el tamaño al
   que se muestra. */
function arte(slug, variante) {
  return activo(path.join('imagenes', '_web', 'arte', slug + '-' + variante + '.webp'),
    'python scripts/optimizar-arte.py');
}

/* ---------- video de portada ----------
   imagenes/_web/video/ lo produce scripts/optimizar-video.py desde
   imagenes/Video-Banner.mp4. Devuelve el nombre del archivo hermano, igual que
   las fotos: el <video> del hero lo pide por ruta relativa.
   El poster es el primer frame y no es decorativo -- es lo que ve quien tiene
   el dato caro, el navegador que no autoreproduce, o 'ahorro de datos' puesto.
   Por eso el titular tiene que leerse igual sobre el poster que sobre el video. */
function media(nombre) {
  return activo(path.join('imagenes', '_web', 'video', nombre),
    'python scripts/optimizar-video.py');
}

/* ---------- historias por producto ----------
   scripts/historias.json: una historia por producto, escrita por nosotros. La
   narrativa es libre (el personaje, de dónde viene, por qué funciona puesto);
   los DATOS del producto -- nombre, precio, categoría, foto -- nunca se copian
   ahí: salen del inventario por marcador, igual que en el resto del sitio. Así
   no puede haber una historia diciendo un precio distinto al del catálogo.

   El slug tiene que existir en el inventario o el build falla: una historia que
   apunta a un producto retirado dejaría un botón de compra a ninguna parte. */
const HISTORIAS = path.join(ROOT, 'scripts', 'historias.json');
const _historias = fs.existsSync(HISTORIAS)
  ? JSON.parse(fs.readFileSync(HISTORIAS, 'utf8')).historias : {};

/* La parrilla del índice se genera desde el JSON: añadir una historia es
   escribirla ahí, no tocar maquetación. El orden es el del archivo. */
function fichaHistoria(slug) {
  const h = _historias[slug];
  const p = _porSlug.get(slug);
  if (!p) throw new Error('historia sin producto en el inventario: ' + slug);
  return `      <a class="card-hov" href="${R('Historia')}" style="display:block; background:var(--bg-raised); border:1px solid var(--line); border-radius:14px; overflow:hidden; text-decoration:none;">
        <div class="pbg" style="height:230px;">${foto(slug, 194)}</div>
        <div style="padding:22px;">
          <div class="kicker" style="font-size:9.5px; color:var(--accent); margin-bottom:11px;">${esc(h.kicker)} · ${esc(String(h.lectura))} min</div>
          <h3 class="dsp" style="font-weight:700; font-size:21px; line-height:1.2; letter-spacing:-0.02em; color:var(--text-hi); margin:0 0 10px 0; min-height:50px;">${esc(h.titulo)}</h3>
          <p style="font-size:13.5px; line-height:1.65; color:var(--text-faint); margin:0 0 18px 0; min-height:66px;">${esc(h.entrada)}</p>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding-top:16px; border-top:1px solid var(--card);">
            <span class="mono" style="font-size:12.5px; color:var(--text-muted);">${esc(p.nombre)} · ${esc(p.precio)}</span>
            <span class="btn-p" style="padding:9px 14px; font-size:12.5px; white-space:nowrap;">Leer</span>
          </div>
        </div>
      </a>`;
}
const parrillaHistorias = () => Object.keys(_historias).map(fichaHistoria).join('\n');

function historia(slug, campo) {
  const h = _historias[slug];
  if (!h) throw new Error('no hay historia para: ' + slug);
  if (campo === 'parrafos') {
    return h.parrafos.map((t) => '<p style="font-size:16.5px; line-height:1.8; color:var(--text-muted); margin:0 0 22px 0; text-wrap:pretty;">' + esc(t) + '</p>').join('\n        ');
  }
  const v = h[campo];
  if (v === undefined) throw new Error('campo desconocido en historia ' + slug + ': ' + campo);
  return esc(String(v));
}

/* ---------- catálogo real, leído del inventario validado ----------
   La ficha de cada producto vive en la carpeta del producto (producto.txt) y
   esa es la única fuente de verdad. El build NO la lee directo: lee
   scripts/_inventario.json, que produce scripts/inventario.py después de
   validar que cada carpeta tenga imagen_principal y los tres campos legibles.
   Así lo que se publica es exactamente lo que pasó validación -- un producto
   con un hueco no llega nunca a la página, falla antes.

   Regenerar el catálogo entero:
     python scripts/inventario.py && python scripts/optimizar-fotos.py && node build.mjs

   El texto se copia literal, sin completar nada, con UNA excepción explícita:
   los productos listados en scripts/descripciones-ampliadas.json, cuyo
   producto.txt trae una descripción de una línea imposible de publicar. Esas
   están redactadas por nosotros describiendo solo lo que se ve en la foto,
   sin inventar materiales ni specs. Ese archivo dice cuáles son y por qué. */
const INVENTARIO = path.join(ROOT, 'scripts', '_inventario.json');
const AMPLIADAS = path.join(ROOT, 'scripts', 'descripciones-ampliadas.json');

if (!fs.existsSync(INVENTARIO)) {
  throw new Error('falta scripts/_inventario.json — corre antes: python scripts/inventario.py');
}
const _inv = JSON.parse(fs.readFileSync(INVENTARIO, 'utf8'));
const _ampliadas = fs.existsSync(AMPLIADAS)
  ? JSON.parse(fs.readFileSync(AMPLIADAS, 'utf8')).descripciones : {};


/* Los pendientes del inventario no se publican: si alguno se colara aquí sería
   una tarjeta con un hueco delante del cliente, así que se corta el build. */
if (_inv.pendientes.length) {
  const lista = _inv.pendientes.map((p) => p.carpeta + ' (' + p.fallos.join(', ') + ')').join('\n  ');
  throw new Error('hay productos sin validar, no se puede publicar:\n  ' + lista);
}

/* categoria -> productos ordenados por su número de catálogo. */
function catalogo(categoria) {
  return _inv.listos
    .filter((p) => p.categoria === categoria)
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    .map((p) => ({ ...p, descripcion: _ampliadas[p.slug] ?? p.descripcion }));
}

const CAT_GOMA = 'Máscaras de Goma';
const CAT_PLASTICO = 'Máscaras de Plástico';
const CAT_DISFRACES = 'Disfraces';

/* Misma tarjeta que ya usan las páginas de colección: mismos tokens, mismo
   radio, mismo alto de foto. Lo único que se suma es el párrafo de
   descripción. No lleva reseñas ni estrellas: ese dato no existe. */
function tarjeta(p) {
  return `      <a class="card-hov" href="${R('Producto')}" style="display:block; background:var(--bg-raised); border:1px solid var(--line); border-radius:14px; overflow:hidden; text-decoration:none;">
        <div style="height:290px; background:radial-gradient(circle at 50% 38%, var(--card), var(--bg) 74%); display:flex; align-items:flex-end; justify-content:center; position:relative;">
          ${foto(p.slug, 250)}
        </div>
        <div style="padding:20px;">
          <div class="dsp" style="font-weight:700; font-size:18px; color:var(--text-hi);">${esc(p.nombre)}</div>
          <p style="font-size:12.5px; line-height:1.65; color:var(--text-muted); margin:10px 0 14px 0;">${esc(p.descripcion)}</p>
          <span class="dsp" style="font-weight:700; font-size:19px; color:var(--text-hi);">${esc(p.precio)}</span>
        </div>
      </a>`;
}

const grilla = (categoria) => catalogo(categoria).map(tarjeta).join('\n');

/* Campo suelto de un producto real, para las páginas de colección curada:
   ahí las tarjetas están escritas a mano (llevan destacados y orden editorial
   propios), pero el dato tiene que salir del mismo inventario que las grillas,
   no copiado a mano. <!--@P:slug:campo@--> resuelve uno.
   El slug desconocido revienta el build en vez de dejar un hueco en la página. */
const _porSlug = new Map(_inv.listos.map((p) => [p.slug, p]));
function campoProducto(slug, campo) {
  const p = _porSlug.get(slug);
  if (!p) throw new Error('producto desconocido en una página: ' + slug);
  const v = campo === 'desc' ? (_ampliadas[slug] ?? p.descripcion)
    : campo === 'cat' ? (p.categoria === CAT_GOMA ? 'GOMA'
      : p.categoria === CAT_PLASTICO ? 'PLÁSTICO' : 'DISFRAZ')
      : p[campo];
  if (v === undefined || v === null || v === '') throw new Error('campo vacío ' + campo + ' en ' + slug);
  return esc(v);
}

function expand(src) {
  return src
    .replace(/<!--@DISFRACES@-->/g, () => grilla(CAT_DISFRACES))
    .replace(/<!--@P:([a-z0-9-]+):(nombre|precio|desc|cat)@-->/g, (_, s, c) => campoProducto(s, c))
    .replace(/<!--@GOMA@-->/g, () => grilla(CAT_GOMA))
    .replace(/<!--@PLASTICO@-->/g, () => grilla(CAT_PLASTICO))
    .replace(/<!--@N:(disfraces|goma|plastico|mascaras|todo)@-->/g, (_, q) => String(
      q === 'disfraces' ? catalogo(CAT_DISFRACES).length
        : q === 'goma' ? catalogo(CAT_GOMA).length
          : q === 'plastico' ? catalogo(CAT_PLASTICO).length
            : q === 'mascaras' ? catalogo(CAT_GOMA).length + catalogo(CAT_PLASTICO).length
              : _inv.listos.length))
    .replace(/<!--@HEADER:([a-z]*):([0-9]+):(sticky|plain)@-->/g, (_, a, c, s) => header(a, c, s === 'sticky'))
    .replace(/<!--@CHKHEADER:([123])@-->/g, (_, n) => chkheader(n))
    .replace(/<!--@SCENE:([a-z]+)@-->/g, (_, k) => scene(k))
    .replace(/<!--@PHOTO:([a-z]+):([0-9]+)@-->/g, (_, k, h) => photo(k, Number(h)))
    .replace(/<!--@IMG:([a-z0-9-]+):([0-9]+)@-->/g, (_, s, h) => foto(s, Number(h)))
    .replace(/<!--@ARTE:([a-z0-9-]+):(banner|card|wide|look)@-->/g, (_, s, v) => arte(s, v))
    .replace(/<!--@MEDIA:([a-z0-9.-]+)@-->/g, (_, n) => media(n))
    .replace(/<!--@H:([a-z0-9-]+):(kicker|titulo|entrada|parrafos|cierre|lectura)@-->/g, (_, sl, c) => historia(sl, c))
    .replace(/<!--@HISTORIAS@-->/g, () => parrillaHistorias())
    .replace(/<!--@N:historias@-->/g, () => String(Object.keys(_historias).length))
    .replace(/<!--@QR:([0-9]+)@-->/g, (_, n) => qrSvg(Number(n)))
    .replace(/<!--@MHEADER:([0-9]+)@-->/g, (_, c) => mheader(c))
    .replace(/<!--@MFOOTER@-->/g, () => mfooter())
    .replace(/<!--@FOOTER@-->/g, () => footer())
    .replace(/<!--@FAB@-->/g, () => fab())
    .replace(/<!--@LOGO:([0-9]+)@-->/g, (_, h) => logo(Number(h)))
    .replace(/<!--@MASK:([a-z]+):([0-9]+):([0-9]+)@-->/g, (_, n, w, h) => mask(n, Number(w), Number(h)))
    .replace(/<!--@ICON:([a-zA-Z]+)@-->/g, (_, n) => {
      if (!ICONS[n]) throw new Error('icono desconocido: ' + n);
      return ICONS[n];
    });
}

const MARKER = '<!--@SCRIPT@-->';
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.dc.html'));

/* Cada página se escribe dos veces en la misma carpeta:
     Main.dc.html   -> lo que consume el canvas (nombres de artboard)
     index.html     -> lo que ve el visitante (URL limpia)
   Comparten los 121 activos, así que el coste de la copia son unos 30 KB de
   HTML por página. A cambio, el sitio publicado deja de tener URLs con
   ".dc.html" y el home vive en la raíz, como en cualquier tienda. */
for (const f of files) {
  const nombre = f.replace('.dc.html', '');
  const ruta = RUTAS[nombre];
  if (!ruta) throw new Error('falta la ruta de ' + f + ' en RUTAS (build.mjs)');
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  const i = raw.indexOf(MARKER);
  const body = i === -1 ? raw : raw.slice(0, i);
  const script = i === -1 ? '' : raw.slice(i + MARKER.length);
  const ancho = nombre.startsWith('Movil') ? 390 : 1440;
  const out = shell(expand(body).trim(), expand(script).trim(), { ...ruta, ancho });
  fs.writeFileSync(path.join(OUT, f), out);
  fs.writeFileSync(path.join(OUT, ruta.url), out);
  console.log(('/' + ruta.url).padEnd(26), (out.length / 1024).toFixed(0) + ' KB');
}

/* Un artboard que se borra de src/ deja su URL limpia huérfana en la carpeta.
   Se limpian aquí para que el sitio no sirva páginas que ya no existen. */
const urlsVivas = new Set(files.map((f) => RUTAS[f.replace('.dc.html', '')].url));
const urlsPosibles = new Set(Object.values(RUTAS).map((r) => r.url));
for (const f of fs.readdirSync(OUT)) {
  if (urlsPosibles.has(f) && !urlsVivas.has(f)) {
    fs.unlinkSync(path.join(OUT, f));
    console.log('retirada la URL huérfana', f);
  }
}
if (/<!--@[A-Z]/.test(fs.readFileSync(path.join(OUT, 'index.html'), 'utf8'))) {
  throw new Error('quedaron marcadores sin expandir');
}

/* galnyx-canvas/ tiene que quedar autocontenido: los .webp que piden las
   páginas se copian al lado y los que ya no pide nadie se borran, para que la
   carpeta valga tanto para abrirla en local como para empaquetarla. */
let copiados = 0;
const quiere = new Set([...usadas].map((r) => path.basename(r)));
for (const f of fs.readdirSync(OUT)) {
  if ((f.endsWith('.webp') || f.endsWith('.woff2') || f.endsWith('.mp4')) && !quiere.has(f)) fs.unlinkSync(path.join(OUT, f));
}
for (const rel of usadas) {
  const dst = path.join(OUT, path.basename(rel));
  const src = path.join(ROOT, rel);
  if (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size) {
    fs.copyFileSync(src, dst);
    copiados++;
  }
}
console.log('imagenes', usadas.size, 'referenciadas ·', copiados, 'copiadas a galnyx-canvas/');

if (process.argv.includes('--patch')) patchLegacy({ ROOT, OUT, header, fab, styleBlock: FONTS + '\n' + CSS });
