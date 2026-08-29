"""GALNYX — escanea las carpetas fuente y arma el inventario de catalogo.

Fuentes (SOLO LECTURA, nunca se escriben):
  imagenes/Mascaras/Goma/<modelo>/      formato con campo "Numero:"
  imagenes/Mascaras/Plastico/<modelo>/  formato con campo "Numero:"
  imagenes/Disfraces/<modelo>/          el numero va en el prefijo de la carpeta

De cada carpeta saca la imagen cuyo nombre contiene "imagen_principal"
(cualquier extension, sin distinguir mayusculas) y los campos de producto.txt.
Nada se inventa aqui: lo que falta se reporta como pendiente.

Escribe scripts/_inventario.json y imprime el resumen de validacion.
"""
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_inventario.json')

FUENTES = [
    ('Máscaras de Goma',     os.path.join('imagenes', 'Mascaras', 'Goma'),     'campo'),
    ('Máscaras de Plástico', os.path.join('imagenes', 'Mascaras', 'Plastico'), 'campo'),
    ('Disfraces',            os.path.join('imagenes', 'Disfraces'),            'prefijo'),
]

EXT_IMG = ('.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp')

# Unica excepcion a la regla de "usa el archivo llamado imagen_principal".
# En 02 Bruja Baba el imagen_principal.jpg es la foto CRUDA del proveedor, con
# fondo, del lote del 26-ago; el recorte bueno quedo sin renombrar. Las otras 40
# mascaras son PNG recortados con alfa, asi que usar el .jpg dejaria esa unica
# tarjeta con un cuadrado opaco. Confirmado con el usuario el 2026-08-27 y
# reconfirmado el 2026-08-28. Se resuelve solo cuando el archivo se renombre a
# imagen_principal.png en la carpeta de origen (que no se toca desde aqui).
EXCEPCIONES_IMAGEN = {
    '02 Bruja Baba': 'Gemini_Generated_Image_y1wp3jy1wp3jy1wp.png',
}


def imagen_principal(carpeta):
    """El unico archivo listo para produccion: el que se llama imagen_principal.
    Se ignora deliberadamente todo lo demas (fotos crudas del proveedor)."""
    forzada = EXCEPCIONES_IMAGEN.get(os.path.basename(carpeta))
    if forzada and os.path.isfile(os.path.join(carpeta, forzada)):
        return [forzada]
    hallados = []
    for f in sorted(os.listdir(carpeta)):
        base, ext = os.path.splitext(f)
        if ext.lower() in EXT_IMG and 'imagen_principal' in base.lower():
            hallados.append(f)
    return hallados


def ficha(texto):
    """Parser tolerante: acepta 'Numero'/'Número', con o sin ':', y descripcion
    en las lineas siguientes al encabezado."""
    campos = {'numero': '', 'nombre': '', 'precio': '', 'descripcion': ''}
    actual = None
    for linea in texto.split('\n'):
        m = re.match(r'^\s*(N[uú]mero|Nombre|Precio|Descripci[oó]n)\s*:?\s*(.*)$', linea.strip(), re.I)
        if m:
            clave = m.group(1).lower()
            clave = 'numero' if clave.startswith('n') and 'mero' in clave else clave
            clave = clave.replace('ó', 'o')
            actual = clave
            campos[clave] = m.group(2).strip()
        elif actual and linea.strip():
            campos[actual] = (campos[actual] + ' ' + linea.strip()).strip()
    return campos


def normaliza_precio(p):
    """'S/ 130' / 's/130.00' / '130' -> 'S/130'. Devuelve None si no hay monto."""
    m = re.search(r'(\d+(?:[.,]\d+)?)', p or '')
    if not m:
        return None
    n = float(m.group(1).replace(',', '.'))
    return 'S/' + (str(int(n)) if n == int(n) else ('%.2f' % n))


def slug(s):
    s = s.lower()
    for a, b in (('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ñ','n'),('ü','u')):
        s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def main():
    inventario = []
    problemas = []

    for categoria, rel, modo in FUENTES:
        base = os.path.join(RAIZ, rel)
        if not os.path.isdir(base):
            problemas.append((categoria, '(ruta)', 'no existe la carpeta ' + rel))
            continue

        for carpeta in sorted(os.listdir(base)):
            ruta = os.path.join(base, carpeta)
            if not os.path.isdir(ruta):
                continue

            item = {'categoria': categoria, 'carpeta': carpeta,
                    'ruta': os.path.join(rel, carpeta).replace('\\', '/')}
            fallos = []

            imgs = imagen_principal(ruta)
            if not imgs:
                fallos.append('sin imagen_principal')
            else:
                item['imagen'] = imgs[0]
                if len(imgs) > 1:
                    problemas.append((categoria, carpeta,
                                      'varias imagen_principal, se usa "%s" (hay %d)' % (imgs[0], len(imgs))))

            ptxt = os.path.join(ruta, 'producto.txt')
            if not os.path.isfile(ptxt):
                fallos.append('sin producto.txt')
                f = None
            else:
                with open(ptxt, encoding='utf-8', errors='replace') as fh:
                    f = ficha(fh.read())
                if not f['nombre']:
                    fallos.append('Nombre vacío')
                if not normaliza_precio(f['precio']):
                    fallos.append('Precio vacío o ilegible')
                if not f['descripcion']:
                    fallos.append('Descripcion vacía')

            # numero de catalogo
            numero = None
            if modo == 'prefijo':
                m = re.match(r'^(\d+)\s+(.*)$', carpeta)
                if m:
                    numero = int(m.group(1))
                else:
                    fallos.append('la carpeta no empieza con número de catálogo')
            else:
                if f and f['numero']:
                    m = re.search(r'\d+', f['numero'])
                    if m:
                        numero = int(m.group(0))
                if numero is None:
                    m = re.match(r'^(\d+)\s+', carpeta)
                    if m:
                        numero = int(m.group(1))
                        problemas.append((categoria, carpeta,
                                          'sin campo Número en producto.txt; se toma %d del nombre de carpeta' % numero))
                    else:
                        fallos.append('sin campo Número y la carpeta no lo trae')

            if f:
                item['nombre'] = f['nombre']
                item['precio'] = normaliza_precio(f['precio'])
                item['precio_bruto'] = f['precio']
                item['descripcion'] = f['descripcion']
            item['numero'] = numero
            item['slug'] = (('mascara-goma-' if categoria.endswith('Goma') else
                             'mascara-plastico-' if categoria.endswith('Plástico') else '')
                            + ('%02d-' % numero if numero else '') + slug(carpeta.lstrip('0123456789 ')))
            item['fallos'] = fallos
            inventario.append(item)

    listos = [i for i in inventario if not i['fallos']]
    pendientes = [i for i in inventario if i['fallos']]

    with open(SALIDA, 'w', encoding='utf-8') as fh:
        json.dump({'listos': listos, 'pendientes': pendientes, 'avisos': problemas},
                  fh, ensure_ascii=False, indent=2)

    # ---------- resumen ----------
    print('=' * 72)
    print('RESUMEN DE VALIDACIÓN')
    print('=' * 72)
    for categoria, _, _ in FUENTES:
        de_cat = [i for i in inventario if i['categoria'] == categoria]
        ok = [i for i in de_cat if not i['fallos']]
        print('%-22s  carpetas:%3d   listos:%3d   pendientes:%3d'
              % (categoria, len(de_cat), len(ok), len(de_cat) - len(ok)))
    print('-' * 72)
    print('%-22s  carpetas:%3d   listos:%3d   pendientes:%3d'
          % ('TOTAL', len(inventario), len(listos), len(pendientes)))

    if pendientes:
        print('\n' + '=' * 72)
        print('PENDIENTES — NO se publican (%d)' % len(pendientes))
        print('=' * 72)
        for i in pendientes:
            print('  [%s] %-34s -> %s' % (i['categoria'][:14], i['carpeta'][:34], '; '.join(i['fallos'])))

    if problemas:
        print('\n' + '=' * 72)
        print('AVISOS (%d)' % len(problemas))
        print('=' * 72)
        for c, carp, msg in problemas:
            print('  [%s] %-30s %s' % (c[:14], carp[:30], msg))

    # huecos / duplicados de numeracion
    print('\n' + '=' * 72)
    print('NUMERACIÓN')
    print('=' * 72)
    for categoria, _, _ in FUENTES:
        nums = sorted(i['numero'] for i in inventario
                      if i['categoria'] == categoria and i['numero'] is not None)
        if not nums:
            continue
        dup = sorted({n for n in nums if nums.count(n) > 1})
        huecos = [n for n in range(1, max(nums) + 1) if n not in nums]
        print('%-22s  %02d–%02d  duplicados:%s  huecos:%s'
              % (categoria, min(nums), max(nums), dup or 'ninguno', huecos or 'ninguno'))

    print('\ninventario -> %s' % SALIDA)


if __name__ == '__main__':
    main()
