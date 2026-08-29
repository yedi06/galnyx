/* Alinea Blog.dc.html -- la única página que sigue viviendo fuera de /src --
   con la cabecera nueva y con el sistema de foto. Siempre parte de orig/
   (copia intacta extraída del artefacto), así el parche se puede repetir
   sin acumular cambios. Blog.dc.html no se toca por regla explícita del
   proyecto: por eso su contenido se sigue generando por parche quirúrgico
   en vez de migrarlo a un artboard de src/ como el resto del catálogo.
   Producto.dc.html YA NO vive aquí: se migró a src/Producto.dc.html y se
   genera como cualquier otro artboard. */
import fs from 'node:fs';
import path from 'node:path';
import { photo } from './photos.mjs';

const NL2 = '\n\n';

const GRID = '<div style="position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size:44px 44px;"></div>';

export function patchLegacy({ ROOT, OUT, header, fab, styleBlock }) {
  const ORIG = path.join(ROOT, 'orig');
  const read = (f) => fs.readFileSync(path.join(ORIG, f), 'utf8');
  const write = (f, s) => { fs.writeFileSync(path.join(OUT, f), s); console.log('parcheado', f); };
  /* orig/Blog.dc.html trae su <style> congelado de cuando se capturó -- no
     tiene ni :root ni la clase .pbg de hoy. Se reemplaza entero por el
     mismo bloque que usan las demás páginas, así var(--line)/var(--accent)
     (y .pbg) sí resuelven ahí también. */
  const restyle = (s) => {
    const a = s.indexOf('<style>'), b = s.indexOf('</style>', a);
    if (a === -1 || b === -1) throw new Error('no se encontró <style> a reemplazar');
    return s.slice(0, a) + '<style>\n' + styleBlock + '\n    </style>' + s.slice(b + 8);
  };

  const cut = (s, from, to, ins) => {
    const a = s.indexOf(from), b = s.indexOf(to, a + 1);
    if (a === -1 || b === -1 || b <= a) throw new Error('bloque no ubicado: ' + from.slice(0, 40));
    return s.slice(0, a) + ins + NL2 + s.slice(b);
  };
  const put = (s, before, ins) => {
    const i = s.indexOf(before);
    if (i === -1) throw new Error('ancla no ubicada: ' + before.slice(0, 40));
    return s.slice(0, i) + ins + NL2 + s.slice(i);
  };
  const swap = (s, from, to, n) => {
    const hits = s.split(from).length - 1;
    if (!hits) throw new Error('sin coincidencias: ' + from.slice(0, 60));
    if (n !== undefined && hits !== n) throw new Error('esperaba ' + n + ', hay ' + hits + ': ' + from.slice(0, 60));
    return s.split(from).join(to);
  };
  /* ---------------- Blog ---------------- */
  const NAVOPEN = '  <div style="display:flex; align-items:center; justify-content:space-between; padding:20px 64px; border-bottom:1px solid #14211B;';
  let b = restyle(read('Blog.dc.html'));
  b = cut(b, NAVOPEN, '  <!-- header -->', header('blog', '2', false).trim());
  b = swap(b, 'style="position:relative; background:radial-gradient(circle at 40% 45%, #16351F, #050F0A 70%); min-height:380px; display:flex; align-items:center; justify-content:center;"',
    'class="pbg" style="min-height:380px;"', 1);
  b = swap(b, GRID, '', 1);
  b = b.replace(/<svg width="150" height="186" viewBox="0 0 120 150"[\s\S]*?<\/svg>/, photo('criatura', 330));
  const postKinds = ['payaso', 'muneca', 'cazador', 'espectro', 'bruja', 'traje'];
  let pk = 0;
  b = b.replace(/<div style="height:180px; background:radial-gradient\(circle at \d+% \d+%, #12291D, #050F0A\); border-bottom:1px solid #1A2620;"><\/div>/g,
    () => '<div class="pbg" style="height:180px; border-bottom:1px solid var(--line);">' + photo(postKinds[pk++] || 'busto', 164) + '</div>');
  if (pk !== 6) throw new Error('tarjetas de blog: ' + pk);
  b = put(b, '  <!-- footer -->', fab().trim());
  write('Blog.dc.html', b);
}
