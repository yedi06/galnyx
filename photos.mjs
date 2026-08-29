/* GALNYX — sistema de foto de producto.
   Cada marco es un hueco real para la foto final (fondo + sujeto ya compuestos
   por el flujo de ChatGPT). Mientras no exista la foto, el hueco se dibuja con
   volumen, luz de contra y grano: no es un ícono de línea, es un maniquí.
   Relaciones de aspecto oficiales: 4:5 producto · 3:4 colección · 16:9 editorial. */

let seq = 0;
const uid = () => 'p' + (seq++).toString(36) + '_';

const defs = (u) => `<defs>` +
  `<radialGradient id="${u}s" cx="36%" cy="24%" r="84%">` +
    `<stop offset="0%" stop-color="#5C8A6D"/><stop offset="34%" stop-color="#2B5239"/>` +
    `<stop offset="74%" stop-color="#11261A"/><stop offset="100%" stop-color="#07130D"/></radialGradient>` +
  `<radialGradient id="${u}o" cx="50%" cy="42%" r="62%">` +
    `<stop offset="0%" stop-color="#010804"/><stop offset="100%" stop-color="#0C1E14"/></radialGradient>` +
  `<linearGradient id="${u}r" x1="1" y1="0.08" x2="0.1" y2="1">` +
    `<stop offset="0%" stop-color="#B4F5CB" stop-opacity="0.95"/>` +
    `<stop offset="40%" stop-color="#56BD78" stop-opacity="0.22"/>` +
    `<stop offset="100%" stop-color="#56BD78" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="${u}c" x1="0" y1="0" x2="0.2" y2="1">` +
    `<stop offset="0%" stop-color="#183524"/><stop offset="100%" stop-color="#04100A"/></linearGradient>` +
  `<filter id="${u}b3" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.6"/></filter>` +
  `<filter id="${u}b8" x="-45%" y="-45%" width="190%" height="190%"><feGaussianBlur stdDeviation="8"/></filter>` +
  `<filter id="${u}b18" x="-55%" y="-55%" width="210%" height="210%"><feGaussianBlur stdDeviation="18"/></filter>` +
  `</defs>`;

/* torso + cabeza con volumen y luz de contra */
const bust = (u) =>
  `<ellipse cx="100" cy="118" rx="86" ry="104" fill="#2E854D" opacity="0.20" filter="url(#${u}b18)"/>` +
  `<path d="M24 260c0-44 32-66 76-66s76 22 76 66z" fill="url(#${u}c)"/>` +
  `<path d="M24 260c2-42 32-64 76-64s74 22 76 64" fill="none" stroke="#3C7F55" stroke-width="1.3" opacity="0.45"/>` +
  `<path d="M86 166h28v36H86z" fill="#0D2014"/>` +
  `<ellipse cx="100" cy="102" rx="59" ry="76" fill="url(#${u}s)"/>` +
  `<ellipse cx="103" cy="102" rx="59" ry="76" fill="none" stroke="url(#${u}r)" stroke-width="3.4" filter="url(#${u}b3)"/>` +
  `<ellipse cx="70" cy="130" rx="19" ry="13" fill="#9BE9B8" opacity="0.08" filter="url(#${u}b8)"/>`;

const nose = (u) =>
  `<path d="M100 98v26l-8 6" stroke="#061309" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85"/>` +
  `<path d="M102 100v24" stroke="#9BE9B8" stroke-width="1.1" opacity="0.26"/>`;

const socket = (u, cx, cy, rx = 19, ry = 13) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${u}o)" filter="url(#${u}b3)"/>`;

/* ---- rasgos por arquetipo ---- */
const FACES = {
  busto: (u) => socket(u, 76, 94) + socket(u, 124, 94) +
    `<path d="M62 95c8-8 20-8 28 0-8 8-20 8-28 0z" fill="#010604"/>` +
    `<path d="M110 95c8-8 20-8 28 0-8 8-20 8-28 0z" fill="#010604"/>` +
    `<path d="M62 95c8-8 20-8 28 0M110 95c8-8 20-8 28 0" stroke="#9BE9B8" stroke-width="1.3" fill="none" opacity="0.7"/>` +
    nose(u) +
    `<path d="M80 150c12 6 28 6 40 0" stroke="#040F09" stroke-width="3.6" fill="none" stroke-linecap="round"/>` +
    `<path d="M80 153c12 6 28 6 40 0" stroke="#9BE9B8" stroke-width="1" fill="none" opacity="0.22"/>`,

  payaso: (u) => socket(u, 74, 92, 22, 16) + socket(u, 126, 92, 22, 16) +
    `<path d="M58 82l22 14-22 12z" fill="#010604"/><path d="M142 82l-22 14 22 12z" fill="#010604"/>` +
    `<path d="M58 82l22 14M142 82l-22 14" stroke="#9BE9B8" stroke-width="1.2" opacity="0.6"/>` +
    nose(u) +
    `<path d="M64 138c14 26 58 26 72 0" stroke="#030D07" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="M64 141c14 26 58 26 72 0" stroke="#9BE9B8" stroke-width="1.1" fill="none" opacity="0.25"/>` +
    `<path d="M76 148v9M90 154v10M110 154v10M124 148v9" stroke="#0A1B11" stroke-width="2.4" opacity="0.8"/>`,

  muneca: (u) => socket(u, 76, 96, 21, 18) + socket(u, 124, 96, 21, 18) +
    `<ellipse cx="76" cy="96" rx="13" ry="15" fill="#010604"/><ellipse cx="124" cy="96" rx="13" ry="15" fill="#010604"/>` +
    `<circle cx="80" cy="91" r="3.2" fill="#CFF7DE" opacity="0.85"/><circle cx="128" cy="91" r="3.2" fill="#CFF7DE" opacity="0.85"/>` +
    `<path d="M63 96a13 15 0 0 1 26 0M111 96a13 15 0 0 1 26 0" stroke="#9BE9B8" stroke-width="1.2" fill="none" opacity="0.55"/>` +
    nose(u) +
    `<path d="M92 150c5 5 11 5 16 0" stroke="#040F09" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M128 40l7 20-12 8 9 16" stroke="#0A1B11" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.9"/>` +
    `<path d="M128 40l7 20-12 8 9 16" stroke="#9BE9B8" stroke-width="0.8" fill="none" opacity="0.3"/>`,

  cazador: (u) =>
    `<path d="M42 84h116v26H42z" fill="#0A1B11" opacity="0.92"/>` +
    `<path d="M42 84h116M42 110h116" stroke="#3C7F55" stroke-width="1.3" opacity="0.7"/>` +
    `<path d="M62 97h26M112 97h26" stroke="#9BE9B8" stroke-width="4" stroke-linecap="round" opacity="0.85"/>` +
    `<circle cx="48" cy="97" r="3.4" fill="#3C7F55"/><circle cx="152" cy="97" r="3.4" fill="#3C7F55"/>` +
    nose(u) +
    `<path d="M76 146h48" stroke="#040F09" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M84 141v11M100 141v11M116 141v11" stroke="#2B5239" stroke-width="2.2"/>` +
    `<path d="M76 143h48" stroke="#9BE9B8" stroke-width="1" opacity="0.25"/>`,

  espectro: (u) => socket(u, 76, 96, 20, 15) + socket(u, 124, 96, 20, 15) +
    `<path d="M60 96c8-9 22-9 30 0-8 9-22 9-30 0zM110 96c8-9 22-9 30 0-8 9-22 9-30 0z" fill="#010604"/>` +
    nose(u) +
    `<ellipse cx="100" cy="150" rx="9" ry="13" fill="#010604"/>` +
    `<ellipse cx="100" cy="150" rx="9" ry="13" fill="none" stroke="#9BE9B8" stroke-width="1" opacity="0.35"/>` +
    `<path d="M41 96c0-46 26-74 59-74s59 28 59 74c0 18-4 34-11 47l6 30-14-10-10 14-9-12-9 12-10-14-14 10 6-30c-7-13-11-29-11-47z" fill="none" stroke="#3C7F55" stroke-width="1.4" opacity="0.55"/>`,

  criatura: (u) => socket(u, 76, 94, 20, 12) + socket(u, 124, 94, 20, 12) +
    `<path d="M60 94h30M110 94h30" stroke="#010604" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M60 92h30M110 92h30" stroke="#9BE9B8" stroke-width="1.2" opacity="0.55"/>` +
    nose(u) +
    `<path d="M46 62h108" stroke="#0A1B11" stroke-width="2.4" opacity="0.85"/>` +
    `<path d="M56 56v12M72 56v12M88 56v12M104 56v12M120 56v12M136 56v12" stroke="#2B5239" stroke-width="1.8"/>` +
    `<path d="M74 150h52" stroke="#040F09" stroke-width="4.4" stroke-linecap="round"/>` +
    `<path d="M82 145v10M98 145v10M114 145v10" stroke="#2B5239" stroke-width="1.8"/>`,

  bruja: (u) => socket(u, 76, 96, 19, 12) + socket(u, 124, 96, 19, 12) +
    `<path d="M62 97c8-7 20-7 28 0-8 7-20 7-28 0zM110 97c8-7 20-7 28 0-8 7-20 7-28 0z" fill="#010604"/>` +
    `<path d="M62 97c8-7 20-7 28 0M110 97c8-7 20-7 28 0" stroke="#9BE9B8" stroke-width="1.2" fill="none" opacity="0.6"/>` +
    nose(u) +
    `<path d="M84 152c10 5 22 5 32 0" stroke="#040F09" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M44 40h112L104 2z" fill="url(#${u}c)" stroke="#3C7F55" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M44 40h112" stroke="#9BE9B8" stroke-width="1.1" opacity="0.35"/>`,
};

/* sujetos que no son cabeza */
const OBJECTS = {
  traje: (u) =>
    `<ellipse cx="100" cy="140" rx="82" ry="112" fill="#2E854D" opacity="0.18" filter="url(#${u}b18)"/>` +
    `<path d="M68 22l32 22 32-22 44 30-24 30v198H48V82L24 52z" fill="url(#${u}c)"/>` +
    `<path d="M68 22l32 22 32-22 44 30-24 30v198H48V82L24 52z" fill="none" stroke="#3C7F55" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M132 24l40 28-22 28" fill="none" stroke="url(#${u}r)" stroke-width="3" filter="url(#${u}b3)"/>` +
    `<path d="M100 44v216" stroke="#0A1B11" stroke-width="3"/>` +
    `<path d="M102 46v214" stroke="#9BE9B8" stroke-width="1" opacity="0.22"/>` +
    `<path d="M74 30l26 34 26-34" fill="#0A1B11" opacity="0.7"/>` +
    `<path d="M74 30l26 34 26-34" fill="none" stroke="#3C7F55" stroke-width="1.2" stroke-linejoin="round"/>` +
    `<circle cx="100" cy="112" r="3" fill="#3C7F55"/><circle cx="100" cy="152" r="3" fill="#3C7F55"/><circle cx="100" cy="192" r="3" fill="#3C7F55"/>`,

  accesorio: (u) =>
    `<ellipse cx="100" cy="150" rx="72" ry="104" fill="#2E854D" opacity="0.18" filter="url(#${u}b18)"/>` +
    `<path d="M60 260V120c0-9 6-15 14-15s14 6 14 15V56c0-9 6-15 14-15s14 6 14 15v64c0-9 6-15 14-15s14 6 14 15v78c0 34-24 62-56 62z" fill="url(#${u}c)"/>` +
    `<path d="M60 260V120c0-9 6-15 14-15s14 6 14 15V56c0-9 6-15 14-15s14 6 14 15v64c0-9 6-15 14-15s14 6 14 15v78c0 34-24 62-56 62" fill="none" stroke="#3C7F55" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M130 106c8 0 14 6 14 15v78" fill="none" stroke="url(#${u}r)" stroke-width="3" filter="url(#${u}b3)"/>` +
    `<path d="M88 116v46M116 116v46" stroke="#0A1B11" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M60 148c-14-7-24 3-20 17l10 30" fill="none" stroke="#3C7F55" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M74 214h56" stroke="#2B5239" stroke-width="2" opacity="0.7"/>`,

  fx: (u) =>
    `<ellipse cx="100" cy="168" rx="62" ry="92" fill="#2E854D" opacity="0.18" filter="url(#${u}b18)"/>` +
    `<path d="M86 34h28v24l26 34c6 8 9 17 9 27v107c0 18-14 32-32 32h-34c-18 0-32-14-32-32V119c0-10 3-19 9-27l26-34z" fill="url(#${u}c)"/>` +
    `<path d="M86 34h28v24l26 34c6 8 9 17 9 27v107c0 18-14 32-32 32h-34c-18 0-32-14-32-32V119c0-10 3-19 9-27l26-34z" fill="none" stroke="#3C7F55" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M114 58l26 34c6 8 9 17 9 27v107" fill="none" stroke="url(#${u}r)" stroke-width="3" filter="url(#${u}b3)"/>` +
    `<path d="M51 158h98v68c0 18-14 32-32 32h-34c-18 0-32-14-32-32z" fill="#0A1B11" opacity="0.8"/>` +
    `<path d="M51 158h98" stroke="#9BE9B8" stroke-width="1.2" opacity="0.4"/>` +
    `<rect x="62" y="176" width="76" height="34" rx="4" fill="none" stroke="#2B5239" stroke-width="1.6"/>` +
    `<path d="M82 26h36v10H82z" fill="#0D2014" stroke="#3C7F55" stroke-width="1.3"/>`,
};

/* pareja: dos bustos a distinta escala y profundidad */
const pareja = (u2, u1) =>
  `<g transform="translate(-16,34) scale(0.68)" opacity="0.82">${bust(u2)}${FACES.muneca(u2)}</g>` +
  `<g transform="translate(74,14) scale(0.78)">${bust(u1)}${FACES.busto(u1)}</g>`;

/* duo: dos figuras de cuerpo entero para portadas de campaña (viewBox 440x560) */
const duo = (u) =>
  `<ellipse cx="230" cy="300" rx="190" ry="240" fill="#2E854D" opacity="0.16" filter="url(#${u}b18)"/>` +
  /* figura trasera */
  `<path d="M300 168c-19 0-32 9-37 24l-22 148-11 220h140l-11-220-22-148c-5-15-18-24-37-24z" fill="url(#${u}c)"/>` +
  `<path d="M300 168c-19 0-32 9-37 24l-22 148-11 220" fill="none" stroke="#2B5239" stroke-width="1.6"/>` +
  `<path d="M370 340l11 220" fill="none" stroke="url(#${u}r)" stroke-width="3.4" filter="url(#${u}b3)"/>` +
  `<path d="M279 176l21 52 21-52" fill="#0A1B11"/>` +
  `<path d="M279 176l21 52 21-52" fill="none" stroke="#3C7F55" stroke-width="1.5" stroke-linejoin="round"/>` +
  `<path d="M300 228v300" stroke="#0A1B11" stroke-width="2.6"/>` +
  `<rect x="318" y="206" width="20" height="13" fill="#2E854D" opacity="0.75"/>` +
  `<ellipse cx="300" cy="118" rx="30" ry="40" fill="url(#${u}s)"/>` +
  `<ellipse cx="303" cy="118" rx="30" ry="40" fill="none" stroke="url(#${u}r)" stroke-width="2.4" filter="url(#${u}b3)"/>` +
  `<path d="M283 112c5-6 13-6 18 0-5 6-13 6-18 0zM301 112c5-6 13-6 18 0-5 6-13 6-18 0z" fill="#010604"/>` +
  `<path d="M283 112c5-6 13-6 18 0M301 112c5-6 13-6 18 0" stroke="#9BE9B8" stroke-width="1" fill="none" opacity="0.65"/>` +
  `<path d="M291 140h18" stroke="#040F09" stroke-width="2.6" stroke-linecap="round"/>` +
  /* figura delantera */
  `<path d="M152 150c-18 0-30 8-35 23l-23 152-12 235h140l-12-235-23-152c-5-15-17-23-35-23z" fill="url(#${u}c)"/>` +
  `<path d="M152 150c-18 0-30 8-35 23l-23 152-12 235" fill="none" stroke="#2B5239" stroke-width="1.6"/>` +
  `<path d="M129 156l23 54 23-54" fill="#123023"/>` +
  `<path d="M129 156l23 54 23-54" fill="none" stroke="#3C7F55" stroke-width="1.6" stroke-linejoin="round"/>` +
  `<path d="M134 160l18 44 18-44" fill="none" stroke="#56BD78" stroke-width="1.2" opacity="0.7"/>` +
  `<path d="M152 210v300" stroke="#0A1B11" stroke-width="2.6"/>` +
  `<path d="M96 322l-11 234M208 322l11 234" stroke="#1E4430" stroke-width="1.4"/>` +
  `<ellipse cx="152" cy="98" rx="31" ry="41" fill="url(#${u}s)"/>` +
  `<ellipse cx="155" cy="98" rx="31" ry="41" fill="none" stroke="url(#${u}r)" stroke-width="2.6" filter="url(#${u}b3)"/>` +
  `<path d="M134 92c5-6 14-6 19 0-5 6-14 6-19 0zM153 92c5-6 14-6 19 0-5 6-14 6-19 0z" fill="#010604"/>` +
  `<path d="M134 92c5-6 14-6 19 0M153 92c5-6 14-6 19 0" stroke="#9BE9B8" stroke-width="1.1" fill="none" opacity="0.7"/>` +
  `<path d="M143 122h18" stroke="#040F09" stroke-width="2.8" stroke-linecap="round"/>` +
  `<ellipse cx="136" cy="116" rx="12" ry="9" fill="#9BE9B8" opacity="0.08" filter="url(#${u}b8)"/>`;

/* API: photo(kind, alturaEnPx) -> <svg> listo para meter en un .pbg */
export function photo(kind, h) {
  const u = uid();
  let body;
  let vb = '0 0 200 260';
  if (kind === 'pareja') {
    const u2 = uid();
    body = defs(u) + defs(u2) + pareja(u2, u);
  } else if (kind === 'duo') {
    vb = '0 0 440 560';
    body = defs(u) + duo(u);
  } else if (OBJECTS[kind]) {
    body = defs(u) + OBJECTS[kind](u);
  } else {
    const f = FACES[kind] || FACES.busto;
    body = defs(u) + bust(u) + f(u);
  }
  return `<svg height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMax meet" fill="none" style="width:auto; display:block;" role="presentation">${body}</svg>`;
}

export const PHOTO_KINDS = Object.keys(FACES).concat(Object.keys(OBJECTS), ['pareja', 'duo']);
