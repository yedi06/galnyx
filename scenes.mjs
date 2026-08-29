/* GALNYX — "imagen de película": el hueco de la IMAGEN 1 de cada producto.
   Es una panorámica de ambiente, no una foto de la pieza. Cubre el marco
   completo (slice), trae su propio degradado inferior para sostener el texto
   y está dibujada en SVG: cero peso de hosting mientras no exista la real. */

let n = 0;
const uid = () => 's' + (n++).toString(36) + '_';

const defs = (u) => '<defs>' +
  `<linearGradient id="${u}k" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#0E2A1B"/><stop offset="42%" stop-color="#071A11"/>` +
    `<stop offset="100%" stop-color="#020A06"/></linearGradient>` +
  `<radialGradient id="${u}m" cx="50%" cy="50%" r="50%">` +
    `<stop offset="0%" stop-color="#D6F8E3" stop-opacity="0.50"/>` +
    `<stop offset="32%" stop-color="#7BD497" stop-opacity="0.20"/>` +
    `<stop offset="100%" stop-color="#56BD78" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#9BE9B8" stop-opacity="0"/>` +
    `<stop offset="50%" stop-color="#9BE9B8" stop-opacity="0.17"/>` +
    `<stop offset="100%" stop-color="#9BE9B8" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="${u}v" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#020A06" stop-opacity="0"/>` +
    `<stop offset="62%" stop-color="#020A06" stop-opacity="0.55"/>` +
    `<stop offset="100%" stop-color="#020A06" stop-opacity="0.96"/></linearGradient>` +
  `<filter id="${u}bf" x="-30%" y="-120%" width="160%" height="340%"><feGaussianBlur stdDeviation="24"/></filter>` +
  `<filter id="${u}bs" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8"/></filter>` +
  '</defs>';

const sky = (u) => `<rect width="1600" height="900" fill="url(#${u}k)"/>`;

const moon = (u, x, y, r) =>
  `<ellipse cx="${x}" cy="${y}" rx="${r * 4.4}" ry="${r * 4.4}" fill="url(#${u}m)"/>` +
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#DFF3E6" opacity="0.30"/>` +
  `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#CFF7DE" stroke-width="1.5" opacity="0.35"/>`;

const fog = (u, cy, ry, op) =>
  `<ellipse cx="800" cy="${cy}" rx="1000" ry="${ry}" fill="url(#${u}f)" filter="url(#${u}bf)" opacity="${op}"/>`;

/* figura enmascarada de fondo: pies en groundY, altura h */
const figure = (u, x, groundY, h, tone = '#010604') => {
  const s = h / 262;
  return `<g transform="translate(${x},${groundY}) scale(${s})">` +
    `<path d="M-36 0c-3-98 6-152 10-178 3-21 13-32 26-32s23 11 26 32c4 26 13 80 10 178z" fill="${tone}"/>` +
    `<ellipse cx="0" cy="-226" rx="27" ry="35" fill="${tone}"/>` +
    `<path d="M22 0c3-98-5-152-9-178" fill="none" stroke="#56BD78" stroke-width="3.4" opacity="0.45"/>` +
    `<path d="M23 -204a27 35 0 0 0 0-44" fill="none" stroke="#7BD497" stroke-width="3" opacity="0.5"/>` +
    `<path d="M-13 -232c4-5 11-5 15 0-4 5-11 5-15 0zM3 -232c4-5 11-5 15 0-4 5-11 5-15 0z" fill="#0B2116"/>` +
    '</g>';
};

const scrim = (u) => `<rect y="330" width="1600" height="570" fill="url(#${u}v)"/>`;
const grain = () =>
  '<rect width="1600" height="900" fill="none"/>' ;

/* ---------------- las seis panorámicas ---------------- */
const SCENES = {
  /* carpa de circo abandonada — payaso siniestro */
  circo: (u) => sky(u) + moon(u, 1240, 190, 54) +
    `<path d="M0 700h1600v200H0z" fill="#020A06"/>` +
    `<path d="M760 120 400 706h720z" fill="#061710"/>` +
    `<path d="M760 120 400 706h720z" fill="none" stroke="#2E854D" stroke-width="2" opacity="0.45"/>` +
    `<path d="M760 120 560 706M760 120 660 706M760 120 860 706M760 120 960 706" stroke="#0C2417" stroke-width="8"/>` +
    `<path d="M400 706c24-22 48-22 72 0s48 22 72 0 48-22 72 0 48 22 72 0 48-22 72 0 48 22 72 0 48-22 72 0 48 22 72 0" fill="none" stroke="#0F2C1C" stroke-width="9"/>` +
    `<path d="M760 120v-56h74l-22 20 22 20h-74" fill="#0F2C1C"/>` +
    `<path d="M150 470c180-90 420-120 610-96" fill="none" stroke="#193C28" stroke-width="2.4" opacity="0.7"/>` +
    `<g fill="#9BE9B8" opacity="0.55">` +
    `<circle cx="200" cy="464" r="5"/><circle cx="300" cy="440" r="5"/><circle cx="400" cy="422" r="5"/>` +
    `<circle cx="500" cy="404" r="5"/><circle cx="600" cy="390" r="5"/><circle cx="700" cy="380" r="5"/></g>` +
    `<path d="M0 640c120-30 220-18 300 24l-40 60H0z" fill="#020A06"/>` +
    fog(u, 690, 58, 0.9) + figure(u, 980, 760, 210) + fog(u, 780, 46, 0.55) +
    `<path d="M0 762c260-26 520-26 800 0s540 26 800 0v138H0z" fill="#010604"/>` + scrim(u),

  /* casa victoriana con luz en la ventana — muñeca poseída */
  casa: (u) => sky(u) + moon(u, 300, 170, 60) +
    `<path d="M0 720h1600v180H0z" fill="#020A06"/>` +
    `<path d="M860 720V400l180-140 180 140v320z" fill="#04120B"/>` +
    `<path d="M1000 400 1040 250l40 150z" fill="#061710"/>` +
    `<path d="M840 400 1040 244l200 156" fill="none" stroke="#2E854D" stroke-width="2.4" opacity="0.5"/>` +
    `<path d="M1220 720V330l70-70 70 70v390z" fill="#03100A"/>` +
    `<path d="M1210 330 1290 246l80 84" fill="none" stroke="#2E854D" stroke-width="2" opacity="0.4"/>` +
    `<rect x="1108" y="60" width="26" height="130" fill="#061710"/>` +
    `<g opacity="0.9"><rect x="930" y="470" width="52" height="76" rx="26" fill="#2E854D" opacity="0.32"/>` +
    `<rect x="1098" y="470" width="52" height="76" rx="26" fill="#7BD497" opacity="0.42" filter="url(#${u}bs)"/>` +
    `<rect x="1098" y="470" width="52" height="76" rx="26" fill="#9BE9B8" opacity="0.30"/>` +
    `<rect x="1264" y="452" width="42" height="62" rx="21" fill="#2E854D" opacity="0.26"/></g>` +
    `<path d="M930 546h52M1098 546h52" stroke="#0B2116" stroke-width="3"/>` +
    fog(u, 706, 54, 0.9) +
    `<g stroke="#020A06" stroke-width="16" opacity="0.95">` +
    `<path d="M40 790v-96M140 790v-96M240 790v-96M340 790v-96M440 790v-96M540 790v-96M640 790v-96"/></g>` +
    `<path d="M0 700h700" stroke="#020A06" stroke-width="14"/>` +
    figure(u, 560, 782, 200) +
    `<path d="M0 784c300-24 600-24 900 0s400 22 700 0v116H0z" fill="#010604"/>` + scrim(u),

  /* bosque muerto con niebla — cazador enmascarado */
  bosque: (u) => sky(u) + moon(u, 1080, 200, 50) +
    `<path d="M0 690c60-40 90-96 130-96s60 56 120 60 90-70 140-70 70 66 130 70 96-84 150-84 82 78 140 82 96-62 150-62 84 60 140 62 100-52 160-52 130 46 160 62v138H0z" fill="#03100A"/>` +
    fog(u, 664, 50, 0.85) +
    `<g fill="#010604">` +
    `<path d="M250 900V520c0-28-30-50-30-84 14 24 30 34 30 34V330c0-20 10-30 10-30s10 10 10 30v148s18-14 34-42c0 38-34 60-34 86v378z"/>` +
    `<path d="M1330 900V560c0-26-28-44-28-76 12 22 28 30 28 30V400c0-18 9-28 9-28s9 10 9 28v112s16-12 30-38c0 34-30 54-30 78v348z"/>` +
    `<path d="M620 900V620c0-20-22-36-22-60 10 18 22 24 22 24V468c0-16 8-24 8-24s8 8 8 24v112s14-10 26-32c0 28-26 46-26 66v286z"/></g>` +
    figure(u, 880, 800, 190) + fog(u, 800, 44, 0.6) +
    `<path d="M0 806c280-30 560-30 840 0s480 28 760 0v94H0z" fill="#010604"/>` +
    `<path d="M0 0c130 40 200 120 236 190-70-40-160-56-236-52z" fill="#020A06" opacity="0.9"/>` + scrim(u),

  /* columnata en ruinas — espectro victoriano */
  mansion: (u) => sky(u) + moon(u, 800, 150, 46) +
    `<path d="M0 730h1600v170H0z" fill="#020A06"/>` +
    `<g fill="#04120B">` +
    `<path d="M120 730V330h150v400zM120 330a75 90 0 0 1 150 0z"/>` +
    `<path d="M370 730V310h160v420zM370 310a80 96 0 0 1 160 0z"/>` +
    `<path d="M1070 730V310h160v420zM1070 310a80 96 0 0 1 160 0z"/>` +
    `<path d="M1330 730V330h150v400zM1330 330a75 90 0 0 1 150 0z"/></g>` +
    `<path d="M120 330a75 90 0 0 1 150 0M370 310a80 96 0 0 1 160 0M1070 310a80 96 0 0 1 160 0M1330 330a75 90 0 0 1 150 0" fill="none" stroke="#2E854D" stroke-width="2.2" opacity="0.5"/>` +
    `<path d="M0 130h1600v54H0z" fill="#03100A"/>` +
    `<path d="M0 184h1600v14H0z" fill="#0B2116" opacity="0.6"/>` +
    `<ellipse cx="800" cy="250" rx="46" ry="60" fill="#9BE9B8" opacity="0.22" filter="url(#${u}bs)"/>` +
    `<path d="M800 190v40M770 258h60M782 240l-14 26M818 240l14 26" stroke="#7BD497" stroke-width="2.4" opacity="0.6" fill="none"/>` +
    fog(u, 716, 48, 0.8) + figure(u, 800, 792, 220) +
    `<path d="M0 792h1600v108H0z" fill="#010604"/>` +
    `<g stroke="#0B2116" stroke-width="2" opacity="0.55">` +
    `<path d="M200 900l120-108M520 900l100-108M980 900l100-108M1300 900l120-108"/></g>` +
    `<path d="M770 900l30-108h20l30 108z" fill="#193C28" opacity="0.35"/>` + scrim(u),

  /* nave industrial — criatura de laboratorio */
  laboratorio: (u) => sky(u) +
    `<rect width="1600" height="900" fill="#03100A"/>` +
    `<g opacity="0.95"><rect x="980" y="120" width="440" height="300" fill="#061710"/>` +
    `<rect x="980" y="120" width="440" height="300" fill="none" stroke="#2E854D" stroke-width="2.4" opacity="0.5"/>` +
    `<path d="M1090 120v300M1200 120v300M1310 120v300M980 220h440M980 320h440" stroke="#0F2C1C" stroke-width="6"/>` +
    `<rect x="980" y="120" width="440" height="300" fill="#7BD497" opacity="0.13"/></g>` +
    `<ellipse cx="1200" cy="300" rx="420" ry="300" fill="url(#${u}m)" opacity="0.7"/>` +
    `<g fill="#020A06">` +
    `<rect x="60" y="300" width="150" height="440" rx="14"/><rect x="230" y="380" width="110" height="360" rx="12"/>` +
    `<rect x="1440" y="420" width="120" height="320" rx="12"/></g>` +
    `<g stroke="#0B2116" stroke-width="22" fill="none" stroke-linecap="round">` +
    `<path d="M0 240h420M0 300h300"/></g>` +
    `<g stroke="#193C28" stroke-width="3" fill="none" opacity="0.7">` +
    `<path d="M60 340h150M60 400h150M230 420h110M230 470h110"/></g>` +
    `<ellipse cx="300" cy="230" rx="150" ry="90" fill="#9BE9B8" opacity="0.10" filter="url(#${u}bf)"/>` +
    `<path d="M0 740h1600v160H0z" fill="#010604"/>` +
    fog(u, 726, 46, 0.75) + figure(u, 700, 782, 216) +
    `<g stroke="#0F2C1C" stroke-width="2" opacity="0.5"><path d="M0 800h1600M0 850h1600"/></g>` + scrim(u),

  /* pantano con luna baja — bruja moderna */
  pantano: (u) => sky(u) + moon(u, 1120, 300, 72) +
    `<path d="M0 620c140-16 280-6 420 8s280 22 420 14 280-30 420-32 200 6 340 14v276H0z" fill="#03100A"/>` +
    `<path d="M0 660h1600v240H0z" fill="#04140C"/>` +
    `<g opacity="0.35"><ellipse cx="1120" cy="740" rx="60" ry="14" fill="#9BE9B8"/>` +
    `<ellipse cx="1120" cy="790" rx="44" ry="9" fill="#7BD497"/>` +
    `<ellipse cx="1120" cy="836" rx="30" ry="6" fill="#56BD78"/></g>` +
    `<g fill="#010604">` +
    `<path d="M240 900V520c0-30-40-52-40-92 18 26 40 38 40 38V330c0-18 9-26 9-26s9 8 9 26v146s24-16 44-48c0 44-44 66-44 94v378z"/>` +
    `<path d="M180 470c-40-24-70-16-96 12 34-6 62 2 96 22z"/>` +
    `<path d="M318 440c40-26 72-20 100 8-36-8-66 0-100 20z"/></g>` +
    `<g stroke="#020A06" stroke-width="5" stroke-linecap="round">` +
    `<path d="M60 900V700M96 900V670M132 900V712M168 900V684M1400 900V706M1440 900V676M1480 900V716M1520 900V690M1560 900V702"/></g>` +
    fog(u, 646, 44, 0.9) + figure(u, 700, 700, 190) + fog(u, 712, 34, 0.7) +
    `<g stroke="#193C28" stroke-width="2" opacity="0.4"><path d="M420 780h360M380 830h440"/></g>` + scrim(u),
};

export const SCENE_KINDS = Object.keys(SCENES);

/* devuelve la panorámica cubriendo el marco entero */
export function scene(kind) {
  const u = uid();
  const body = SCENES[kind] || SCENES.bosque;
  return '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" fill="none" role="presentation" ' +
    'style="position:absolute; inset:0; width:100%; height:100%; z-index:1; display:block;">' +
    defs(u) + body(u) + '</svg>';
}
