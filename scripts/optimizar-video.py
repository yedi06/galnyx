"""GALNYX — deriva el video de portada para la web.

Origen: imagenes/Video-Banner.mp4 (SOLO LECTURA, no se toca).
Salida: imagenes/_web/video/hero.mp4 + hero-poster.webp

Que hace y por que:

  - Quita la pista de audio. El hero va en loop y silenciado por norma del
    navegador (sin muted no hay autoplay), asi que el audio son 140 KB que
    nadie va a oir nunca.
  - Reencoda a CRF 29. Comparado frame a frame contra el original y contra
    CRF 26 y 32 sobre la escena mas oscura: a 29 no se ve diferencia, y pesa
    un 72 % menos que el original. Encima va un degradado oscuro, que tapa
    cualquier resto de compresion.
  - -movflags +faststart mueve el indice al principio del archivo: el video
    empieza a pintar mientras se descarga en vez de esperar al ultimo byte.
    En celular con datos esto es la diferencia entre ver algo y ver negro.
  - profile main / level 4.0 para que reproduzca en celulares viejos.
  - El poster es el PRIMER frame del video, para que el corte entre poster y
    reproduccion no se note. No es decorativo: es lo que ve quien tiene
    ahorro de datos activado o un navegador que bloquea autoplay.

Hace falta ffmpeg. Si no esta en el PATH se usa el que trae imageio-ffmpeg:
    python -m pip install imageio-ffmpeg

Orden de uso:
    python scripts/optimizar-video.py
    node build.mjs --patch
"""
import os
import shutil
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, 'imagenes', 'Video-Banner.mp4')
DESTINO = os.path.join(RAIZ, 'imagenes', '_web', 'video')

CRF = 29


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit('falta ffmpeg — instala con: python -m pip install imageio-ffmpeg')


def main():
    if not os.path.isfile(ORIGEN):
        sys.exit('falta imagenes/Video-Banner.mp4')
    ff = ffmpeg()
    os.makedirs(DESTINO, exist_ok=True)

    video = os.path.join(DESTINO, 'hero.mp4')
    poster = os.path.join(DESTINO, 'hero-poster.webp')

    subprocess.run([ff, '-y', '-loglevel', 'error', '-i', ORIGEN,
                    '-an',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', str(CRF),
                    '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-level', '4.0',
                    '-movflags', '+faststart',
                    video], check=True)

    subprocess.run([ff, '-y', '-loglevel', 'error', '-ss', '0', '-i', ORIGEN,
                    '-frames:v', '1', '-c:v', 'libwebp', '-quality', '82',
                    poster], check=True)

    o = os.path.getsize(ORIGEN)
    v = os.path.getsize(video)
    p = os.path.getsize(poster)
    print('origen        %7.0f KB' % (o / 1024))
    print('hero.mp4      %7.0f KB  (-%.0f%%, sin audio, CRF %d)' % (v / 1024, 100 * (1 - v / o), CRF))
    print('hero-poster   %7.0f KB  (primer frame)' % (p / 1024))
    print('-' * 46)
    print('en el bundle (base64): ~%.0f KB' % ((v + p) * 4 / 3 / 1024))


if __name__ == '__main__':
    main()
