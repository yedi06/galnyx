# GALNYX

Tienda de máscaras y disfraces de terror hiperrealistas. Lima, Perú.

**Sitio en vivo:** https://yedi06.github.io/galnyx/

---

## Qué es esto

El prototipo navegable completo de la tienda: 34 páginas de escritorio y móvil
generadas **desde el catálogo real**. No hay datos de ejemplo — cada nombre,
precio, descripción y foto de producto sale de las fichas del proveedor.

| | |
|---|---|
| Productos | 99 (28 máscaras de goma, 13 de plástico, 58 disfraces) |
| Rango de precios | S/15 – S/150 |
| Historias de producto | 12 |
| Imágenes de dirección de arte | 13 (colecciones, tendencias, looks) |

---

## Cómo funciona

El sitio no se escribe a mano: se **genera**. Las páginas de `src/` son
plantillas con marcadores, y `build.mjs` los sustituye por datos reales.

```
imagenes/Mascaras/…/producto.txt      ← fuente de verdad (solo en local)
imagenes/Disfraces/…/producto.txt
          │
          ├─ python scripts/inventario.py        valida y produce _inventario.json
          ├─ python scripts/optimizar-fotos.py   99 fotos → imagenes/_web/*.webp
          ├─ python scripts/optimizar-arte.py    13 imágenes → 31 derivadas
          ├─ python scripts/optimizar-video.py   Video-Banner.mp4 → hero.mp4 + póster
          └─ python scripts/subset-fuentes.py    recorta las 6 tipografías
          │
          ▼
      node build.mjs        src/*.dc.html + datos → galnyx-canvas/  ← esto se publica
      node scripts/empaquetar.mjs                → galnyx-tienda.html (bundle del canvas)
```

### URLs

El build escribe cada página **dos veces** en `galnyx-canvas/`: con su nombre de
artboard (`Main.dc.html`, lo que consume el canvas) y con su URL limpia
(`index.html`, lo que ve el visitante). Comparten los 121 activos, así que la
copia cuesta ~30 KB de HTML por página. El mapa vive en `RUTAS`, dentro de
`build.mjs`; añadir una página es añadir su entrada ahí.

El envoltorio resuelve además tres cosas que un diseño de ancho fijo necesita
para servirse como sitio: centra el lienzo (si no, queda pegado a la izquierda
con una franja vacía al lado), lo escala con `zoom` cuando la ventana es más
angosta, y manda a la versión de 390 px a quien entra desde un teléfono.

### Los marcadores

| Marcador | Qué inserta |
|---|---|
| `<!--@P:slug:nombre\|precio\|desc\|cat@-->` | Un campo real del producto |
| `<!--@IMG:slug:alto@-->` | Su `imagen_principal` optimizada |
| `<!--@GOMA@-->` `<!--@PLASTICO@-->` `<!--@DISFRACES@-->` | La grilla completa de una categoría |
| `<!--@N:todo\|mascaras\|disfraces\|historias@-->` | Un conteo, calculado |
| `<!--@ARTE:slug:banner\|card\|wide\|look@-->` | Una imagen de dirección de arte |
| `<!--@H:slug:titulo\|entrada\|parrafos@-->` | La historia de ese producto |
| `<!--@MEDIA:hero.mp4@-->` | El vídeo de portada |
| `<!--@HEADER@--> <!--@FOOTER@--> <!--@ICON:x@-->` | Componentes compartidos |

**Si un slug no existe, el build falla.** Es a propósito: es preferible que no
compile a que salga en producción una tarjeta con un hueco o un botón de compra
que no lleva a ningún producto.

---

## Reglas del proyecto

Estas reglas vienen de decisiones de negocio, no de estilo. Romperlas rompe algo real.

1. **Nada de datos inventados.** Ni reseñas, ni valoraciones, ni stock, ni
   descuentos, ni cuotas, ni materiales que el catálogo no tiene. Si el dato no
   está en `producto.txt`, no sale en la web. El tráfico es pagado: una promesa
   falsa en la ficha es un reclamo.
2. **No existen los productos combinados.** GALNYX no confecciona ni empaqueta
   packs. Cuando se muestra una máscara junto a un disfraz es una sugerencia
   visual: **cada uno con su precio y su propio botón**. Nunca un total sumado
   ni un "agregar el conjunto".
3. **Una sola foto por producto.** El modelo es dropshipping: no hay estudio, ni
   galería de ángulos, ni vídeo de producto. No se diseñan huecos para fotos
   que no van a existir.
4. **Las carpetas fuente son de solo lectura.** `imagenes/Mascaras/`,
   `imagenes/Disfraces/` y `PARTE-1/2/3` no se tocan desde ningún script.
5. **La ropa de las fotos de ambiente no se vende.** Solo son comprables las
   máscaras y los disfraces del catálogo.

---

## Estructura

```
src/               34 plantillas de página (aquí se edita el diseño)
build.mjs          el generador
scripts/           inventario, optimización de imágenes/vídeo/fuentes, historias
galnyx-canvas/     salida generada — es lo que sirve GitHub Pages
imagenes/_web/     fotos ya optimizadas (99 productos + arte + vídeo)
fuentes/  logo/    tipografías OFL y marca
prompts/           prompts de IA usados para generar la dirección de arte
```

### Qué no está en el repo

- `imagenes/Mascaras/` e `imagenes/Disfraces/` — las fotos **crudas** del
  proveedor (111 MB). Solo se publica la `imagen_principal` de cada producto, ya
  optimizada, en `imagenes/_web/`.
- `galnyx-tienda.html` — el bundle del canvas, derivado; se regenera con
  `node scripts/empaquetar.mjs`.

Como consecuencia, desde un clon **sí** se puede correr `node build.mjs` (usa
`scripts/_inventario.json` e `imagenes/_web/`, ambos versionados), pero **no**
`inventario.py` ni `optimizar-fotos.py`, que necesitan las carpetas fuente.

---

## Levantarlo en local

```bash
node build.mjs                 # regenera galnyx-canvas/
cd galnyx-canvas
python -c "from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer; ThreadingHTTPServer(('127.0.0.1',8000), SimpleHTTPRequestHandler).serve_forever()"
```

Y abrir http://127.0.0.1:8000

> Usa el servidor **multihilo** de arriba, no `python -m http.server`: el de un
> solo hilo bloquea el streaming del vídeo de portada y la portada se queda en
> el póster.

Las páginas están diseñadas a ancho fijo — 1440 px las de escritorio, 390 px las
de móvil (`Movil*.dc.html`).

---

## Publicación

Cada `push` a `main` despliega `galnyx-canvas/` en GitHub Pages
(`.github/workflows/pages.yml`). Lo que se publica es exactamente lo que se
revisó en local: el workflow no compila nada.
