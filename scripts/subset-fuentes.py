"""GALNYX — recorta las fuentes al juego de caracteres que el sitio usa.

Por que existe esto: build.mjs incrusta las seis woff2 en base64 DENTRO DE CADA
artboard. Con 34 artboards, las mismas 149 KB de fuente viajan 34 veces y se
comen ~6 MB del bundle publicable (galnyx-tienda.html), que tiene un tope de
16 MB. Recortarlas una vez sale mucho mas barato que bajarle calidad a las
fotos de producto, que son el argumento de venta.

El subset NO se limita a los caracteres que hoy aparecen en las paginas: el
canvas es un editor y el usuario escribe texto nuevo ahi. Se conserva
Latin-1 completo (todo el espanol: tildes, n, signos de apertura), comillas y
guiones tipograficos, simbolos de moneda y un punado de flechas y vinetas que
usa la interfaz. Si algun dia hace falta un caracter fuera de ese rango se
anade aqui y se vuelve a correr -- lo que se ve si falta es un rectangulo
vacio, no un error.

fuentes/ es SOLO LECTURA: los originales completos se quedan intactos y el
recorte se escribe en fuentes/_subset/. Si se borra esa carpeta y se corre de
nuevo, se regenera identica.

Orden de uso:
    python scripts/subset-fuentes.py
    node build.mjs --patch
"""
import os
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, 'fuentes')
DESTINO = os.path.join(ORIGEN, '_subset')

# Latin-1 entero + puntuacion tipografica + simbolos que usa la interfaz.
UNICODES = ','.join([
    'U+0020-007E',    # ASCII imprimible
    'U+00A0-00FF',    # Latin-1: tildes, n, ¿ ¡ ª º × ÷
    'U+0152-0153',    # Œ œ
    'U+2010-2015',    # guiones: - – —
    'U+2018-201A',    # ' ' ‚
    'U+201C-201E',    # " " „
    'U+2020-2022',    # † ‡ •
    'U+2026',         # …
    'U+2030',         # ‰
    'U+2039-203A',    # ‹ ›
    'U+20A0-20BF',    # monedas (€ ₡ ₱ ...)
    'U+2122',         # ™
    'U+2190-2193',    # ← ↑ → ↓
    'U+2212',         # −
    'U+25B6',         # ▶
    'U+2713-2714',    # ✓ ✔
])

FUENTES = [
    'BigShoulders-Variable.woff2',
    'InstrumentSans-Variable.woff2',
    'InstrumentSerif-Italic.woff2',
    'InstrumentSerif-Regular.woff2',
    'JetBrainsMono-Medium.woff2',
    'JetBrainsMono-Regular.woff2',
]


def main():
    os.makedirs(DESTINO, exist_ok=True)
    antes = despues = 0

    for f in FUENTES:
        src = os.path.join(ORIGEN, f)
        if not os.path.isfile(src):
            sys.exit('falta fuentes/' + f)
        dst = os.path.join(DESTINO, f)

        cmd = [
            sys.executable, '-m', 'fontTools.subset', src,
            '--unicodes=' + UNICODES,
            '--flavor=woff2',
            '--layout-features=*',   # kerning y ligaduras intactos
            '--retain-gids=0',
            '--output-file=' + dst,
        ]
        # Las variables (Big Shoulders, Instrument Sans) tienen que conservar
        # sus ejes: el sitio usa font-variation-settings "wdth" y pesos 100-900.
        if 'Variable' in f:
            cmd.append('--no-prune-unicode-ranges')

        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit('subset fallo en %s:\n%s' % (f, r.stderr[-1500:]))

        a, d = os.path.getsize(src), os.path.getsize(dst)
        antes += a
        despues += d
        print('%-38s %6.1f KB -> %6.1f KB  (-%.0f%%)' % (f, a / 1024, d / 1024, 100 * (1 - d / a)))

    print('-' * 66)
    print('%-38s %6.1f KB -> %6.1f KB' % ('TOTAL', antes / 1024, despues / 1024))
    print('por pagina en base64: %.0f KB -> %.0f KB' % (antes * 4 / 3 / 1024, despues * 4 / 3 / 1024))
    print('ahorro en el bundle de 34 artboards: %.2f MB' % ((antes - despues) * 4 / 3 * 34 / 1024 / 1024))


if __name__ == '__main__':
    main()
