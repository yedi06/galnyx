/* GALNYX — reempaqueta galnyx-tienda.html con el contenido actual del canvas.

   galnyx-tienda.html es el bundle publicable: trae DENTRO tanto el editor de
   canvas como el contenido. El contenido vive en un solo <script
   type="application/json" id="appifact-doc"> con la forma:

     { "title": ..., "content": { "files": { "<nombre>": "<contenido>" } },
       "comments": [...] }

   Este script NO toca el editor: cambia solo ese bloque JSON, releyendo
   galnyx-canvas/ desde disco. Así el bundle deja de quedarse atrás cada vez
   que se corre el build -- que es justo lo que había pasado: el publicado no
   tenía ni Disfraces.dc.html ni Mascaras.dc.html.

   Los binarios (.png, .webp) van como base64 pelado (sin prefijo data:), que es
   como los guarda el formato: las paginas los piden por nombre de archivo
   hermano, no incrustados, asi cada foto viaja una vez y no una por artboard.

   El '<' se escapa como < en todo el JSON porque si no, un
   "</script>" dentro del HTML de un artboard cerraría el <script> antes de
   tiempo y el bundle no abriría.

   Orden de uso:
       node build.mjs --patch
       node scripts/empaquetar.mjs
*/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const CANVAS = path.join(ROOT, 'galnyx-canvas');
const BUNDLE = path.join(ROOT, 'galnyx-tienda.html');
const MARCA = 'id="appifact-doc"';

const html = fs.readFileSync(BUNDLE, 'utf8');
const marca = html.indexOf(MARCA);
if (marca === -1) throw new Error('no se encontró el bloque appifact-doc en el bundle');
const ini = html.indexOf('>', marca) + 1;
const fin = html.indexOf('</script>', ini);
if (fin === -1) throw new Error('bloque appifact-doc sin cierre');

const doc = JSON.parse(html.slice(ini, fin));

const files = {};
for (const f of fs.readdirSync(CANVAS).sort()) {
  const p = path.join(CANVAS, f);
  if (f.endsWith('.dc.html') || f === 'canvas.json') {
    files[f] = fs.readFileSync(p, 'utf8');
  } else if (f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.woff2') || f.endsWith('.mp4')) {
    // binarios como base64 pelado, sin prefijo data: -- es el formato del bundle
    files[f] = fs.readFileSync(p).toString('base64');
  }
}

/* Cada artboard del canvas.json tiene que existir como archivo y al revés:
   un artboard sin archivo abre roto, y un archivo sin artboard viaja en el
   bundle sin que nadie lo vea nunca. */
const canvas = JSON.parse(files['canvas.json']);
const enCanvas = new Set(canvas.artboards.map((a) => a.file));
const enDisco = new Set(Object.keys(files).filter((f) => f.endsWith('.dc.html')));
for (const f of enCanvas) if (!enDisco.has(f)) throw new Error('canvas.json apunta a un archivo que no existe: ' + f);
const huerfanos = [...enDisco].filter((f) => !enCanvas.has(f));
if (huerfanos.length) console.log('AVISO — generados pero sin artboard en canvas.json:', huerfanos.join(', '));

doc.content.files = files;

const json = JSON.stringify(doc).replace(/</g, '\\u003c');
fs.writeFileSync(BUNDLE, html.slice(0, ini) + '\n' + json + '\n' + html.slice(fin));

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log('artboards  ', canvas.artboards.length);
console.log('archivos   ', Object.keys(files).length);
console.log('bundle     ', kb(fs.statSync(BUNDLE).size));
