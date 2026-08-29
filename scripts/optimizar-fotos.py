"""GALNYX — deriva las fotos de producto para la web.

Lee scripts/_inventario.json (lo produce inventario.py) y escribe un .webp por
producto en imagenes/_web/. Las carpetas de origen son SOLO LECTURA: aqui nunca
se escribe ni se borra nada dentro de imagenes/Mascaras ni imagenes/Disfraces.

imagenes/_web es derivada: se limpia y se regenera entera en cada corrida, para
que un producto renombrado o retirado no deje un .webp huerfano publicandose.

WebP porque los recortes traen canal alfa -- el fondo de la card tiene que verse
a traves del sujeto, y JPEG lo aplanaria contra un color solido. El unico origen
sin alfa se convierte igual: queda opaco, pero no rompe nada.

Se recorta al bounding box del alfa para que el sujeto quede pegado a los bordes
del lienzo: asi, al escalar por altura, todos los productos quedan con el mismo
tamano optico en la grilla en vez de flotar cada uno a su aire.

Orden de uso:
    python scripts/inventario.py
    python scripts/optimizar-fotos.py
    node build.mjs
"""
import json
import os
import sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INVENTARIO = os.path.join(RAIZ, 'scripts', '_inventario.json')
DESTINO = os.path.join(RAIZ, 'imagenes', '_web')

# 2x de los 250px a los que se muestran las tarjetas, para pantallas retina.
# No hace falta bajarlo por peso: desde que el bundle publicable referencia los
# .webp como archivos hermanos (y no incrustados en base64 en cada pagina),
# cada foto viaja UNA vez y no 34.
ALTURA = 500
CALIDAD = 82


def main():
    if not os.path.isfile(INVENTARIO):
        sys.exit('falta _inventario.json — corre antes: python scripts/inventario.py')

    with open(INVENTARIO, encoding='utf-8') as fh:
        datos = json.load(fh)

    os.makedirs(DESTINO, exist_ok=True)
    for f in os.listdir(DESTINO):
        if f.endswith('.webp'):
            os.remove(os.path.join(DESTINO, f))

    total = 0
    por_categoria = {}
    sin_alfa = []

    for item in datos['listos']:
        src = os.path.join(RAIZ, item['ruta'], item['imagen'])
        if not os.path.isfile(src):
            print('  FALTA en disco:', src)
            continue

        im = Image.open(src)
        tenia_alfa = im.mode in ('RGBA', 'LA') or 'transparency' in im.info
        im = im.convert('RGBA')

        caja = im.getchannel('A').getbbox()
        if caja:
            im = im.crop(caja)
        if not tenia_alfa:
            sin_alfa.append(item['carpeta'])

        ancho = max(1, round(im.width * ALTURA / im.height))
        im = im.resize((ancho, ALTURA), Image.LANCZOS)

        salida = os.path.join(DESTINO, item['slug'] + '.webp')
        im.save(salida, 'WEBP', quality=CALIDAD, method=6)

        peso = os.path.getsize(salida)
        total += peso
        por_categoria[item['categoria']] = por_categoria.get(item['categoria'], 0) + 1

    for cat, n in por_categoria.items():
        print('%-22s %3d imagenes' % (cat, n))
    print('-' * 46)
    print('%-22s %3d · %.2f MB · ~%.2f MB en base64'
          % ('TOTAL', sum(por_categoria.values()), total / 1024 / 1024, total * 4 / 3 / 1024 / 1024))

    if sin_alfa:
        print('\nAVISO — origen sin transparencia (queda opaco en la tarjeta):')
        for c in sin_alfa:
            print('   ', c)


if __name__ == '__main__':
    main()
