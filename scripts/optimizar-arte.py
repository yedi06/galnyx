"""GALNYX — deriva las 13 imagenes de arte (Colecciones, Tendencias, Looks).

Hermano de optimizar-fotos.py, pero para el OTRO tipo de imagen del sitio:

  optimizar-fotos.py  -> foto de producto: recorte con alfa, sujeto pegado a los
                         bordes, una sola altura (500 px) porque siempre se usa
                         igual, dentro de una tarjeta de catalogo.
  optimizar-arte.py   -> imagen editorial de escena: fotografia completa, sin
                         alfa, que se usa a tres tamanos distintos (banner de
                         pagina, tarjeta cuadrada, banda 16:9) y por eso se
                         derivan tres archivos por imagen en vez de uno.

Las carpetas de origen (imagenes/PARTE-1.., PARTE-2.., PARTE-3..) son SOLO
LECTURA: aqui nunca se escribe ni se borra nada dentro de ellas.

imagenes/_web/arte es derivada: se limpia y se regenera entera en cada corrida,
igual que imagenes/_web.

El emparejamiento imagen -> arquetipo NO se adivina por nombre de archivo: se
hace por el numero con el que empieza el archivo (1..13), que es el mismo orden
del prompt que las genero. Si falta un numero o hay uno de mas, el script lo
reporta y no publica nada de ese numero -- una imagen asignada al arquetipo
equivocado es un error de marca visible.

Orden de uso:
    python scripts/optimizar-arte.py
    node build.mjs
"""
import os
import sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'imagenes', '_web', 'arte')

CALIDAD = 80

# numero -> (slug, grupo, foco_x)
#
# foco_x es la posicion horizontal del sujeto en la imagen original, medida a
# ojo sobre la imagen. Solo la usa el recorte cuadrado de tarjeta: sin ella, un
# recorte al centro le corta la cabeza al sujeto de "Bruja moderna" (que esta
# a la derecha del encuadre) y deja media tarjeta de invernadero vacio.
CATALOGO = {
    1:  ('payaso-siniestro',     'coleccion', 0.62),
    2:  ('muneca-poseida',       'coleccion', 0.48),
    3:  ('cazador-enmascarado',  'coleccion', 0.48),
    4:  ('espectro-victoriano',  'coleccion', 0.47),
    5:  ('criatura-laboratorio', 'coleccion', 0.63),
    6:  ('bruja-moderna',        'coleccion', 0.70),
    7:  ('tendencia-vintage',    'tendencia', 0.52),
    8:  ('tendencia-tech',       'tendencia', 0.62),
    9:  ('tendencia-editorial',  'tendencia', 0.60),
    10: ('look-payaso',          'look',      0.50),
    11: ('look-muneca',          'look',      0.50),
    12: ('look-cazador',         'look',      0.50),
    13: ('look-bruja',           'look',      0.50),
}

CARPETAS = [
    'PARTE-1-COLECCIONES-NSPIRADO-EN-EL-CINE-DE-TERROR',
    'PARTE-2-LÍNEAS-DE-TENDENCIAS',
    'PARTE-3-LOOKS-DESTACADOS',
]

EXT = ('.jfif', '.jpg', '.jpeg', '.png', '.webp')


def numero_de(nombre):
    """El archivo empieza por el numero de la imagen: '7.-TENDENCIA-...'."""
    cabeza = ''
    for ch in nombre:
        if ch.isdigit():
            cabeza += ch
        else:
            break
    return int(cabeza) if cabeza else None


def recorte(im, ancho, alto, foco_x=0.5, foco_y=0.5):
    """Recorta al ratio pedido tomando el maximo posible del original y
    centrando en el foco, y recien ahi escala. Nunca amplia mas alla del
    original: si el destino pide mas pixeles de los que hay, se queda con los
    que hay -- estas imagenes no dan para 2x en todos los tamanos y estirarlas
    se ve peor que servirlas a 1x."""
    ratio = ancho / alto
    w, h = im.size
    if w / h > ratio:
        nw, nh = int(round(h * ratio)), h
    else:
        nw, nh = w, int(round(w / ratio))
    x = int(round((w - nw) * foco_x))
    y = int(round((h - nh) * foco_y))
    im = im.crop((x, y, x + nw, y + nh))
    if im.width > ancho:
        im = im.resize((ancho, alto), Image.LANCZOS)
    return im


def main():
    fuentes = {}
    problemas = []

    for carpeta in CARPETAS:
        ruta = os.path.join(RAIZ, 'imagenes', carpeta)
        if not os.path.isdir(ruta):
            problemas.append('falta la carpeta ' + carpeta)
            continue
        for f in sorted(os.listdir(ruta)):
            if not f.lower().endswith(EXT):
                continue
            n = numero_de(f)
            if n is None or n not in CATALOGO:
                problemas.append('sin numero reconocible, NO se publica: %s/%s' % (carpeta, f))
                continue
            if n in fuentes:
                problemas.append('numero %d duplicado: %s y %s' % (n, fuentes[n][1], f))
                continue
            fuentes[n] = (ruta, f)

    faltan = sorted(set(CATALOGO) - set(fuentes))
    for n in faltan:
        problemas.append('falta la imagen %d (%s)' % (n, CATALOGO[n][0]))

    os.makedirs(DESTINO, exist_ok=True)
    for f in os.listdir(DESTINO):
        if f.endswith('.webp'):
            os.remove(os.path.join(DESTINO, f))

    total = 0
    hechas = []

    for n in sorted(fuentes):
        slug, grupo, foco = CATALOGO[n]
        ruta, archivo = fuentes[n]
        im = Image.open(os.path.join(ruta, archivo)).convert('RGB')

        if grupo == 'look':
            # vertical 3:4 — se usa tal cual en la tarjeta del listado y en la
            # cabecera del detalle. Un solo derivado: el original ya es chico.
            variantes = [('look', 896, 1200, 0.5, 0.5)]
        else:
            # banner de cabecera de pagina (ancho completo del contenido),
            # tarjeta cuadrada de la grilla de Colecciones del home, y banda
            # 16:9 de las tarjetas de Tendencias.
            variantes = [
                ('banner', 1376, 768, 0.5, 0.5),
                ('card',    768, 768, foco, 0.42),
                ('wide',    848, 476, 0.5, 0.5),
            ]

        for nombre, w, h, fx, fy in variantes:
            salida = os.path.join(DESTINO, '%s-%s.webp' % (slug, nombre))
            recorte(im, w, h, fx, fy).save(salida, 'WEBP', quality=CALIDAD, method=6)
            peso = os.path.getsize(salida)
            total += peso
            hechas.append((slug, nombre, peso))

    por_slug = {}
    for slug, _, peso in hechas:
        por_slug[slug] = por_slug.get(slug, 0) + peso

    for slug in sorted(por_slug, key=lambda s: [k for k in CATALOGO if CATALOGO[k][0] == s]):
        print('%-22s %6.1f KB' % (slug, por_slug[slug] / 1024))
    print('-' * 46)
    print('%-22s %3d archivos · %.2f MB · ~%.2f MB en base64'
          % ('TOTAL', len(hechas), total / 1024 / 1024, total * 4 / 3 / 1024 / 1024))

    if problemas:
        print('\nPENDIENTES — no se publicaron:')
        for p in problemas:
            print('   ', p)
        sys.exit(1)


if __name__ == '__main__':
    main()
