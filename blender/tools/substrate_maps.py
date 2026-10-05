"""Derive seamless tangent-space normal maps from baked substrate heights.

Gradients use wrap-around differences, so a tile's edges match exactly.
Output: 8-bit RGB normal PNG (OpenGL / glTF convention, +Y up), plus a preview.
Usage: substrate_maps.py <height_dir> <out_dir> [name=strength ...]
"""
import sys, os, numpy as np



def normal_from_height(h, strength):
    h = (h - h.mean()) / (h.std() + 1e-9)
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    # image rows run top-to-bottom; +V points up in UV space
    n = np.dstack([-dx * strength, dy * strength, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return n


if __name__ == '__main__':
    from PIL import Image
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    strengths = dict(a.split('=') for a in sys.argv[3:])
    for f in sorted(os.listdir(src)):
        if not f.endswith('.npy'):
            continue
        name = f[:-4]
        h = np.load(os.path.join(src, f)).astype(np.float64)
        h = np.flipud(h)  # Blender images are stored bottom-up
        s = float(strengths.get(name, 1.0))
        n = normal_from_height(h, s)
        rgb = np.clip(np.round((n * 0.5 + 0.5) * 255), 0, 255).astype(np.uint8)
        Image.fromarray(rgb).save(os.path.join(out, name + '-normal.png'))
        # seam check: wrapped difference at the borders vs interior
        hn = (h - h.mean()) / h.std()
        edge = np.abs(hn[:, 0] - hn[:, -1]).mean() + np.abs(hn[0] - hn[-1]).mean()
        inner = np.abs(np.diff(hn, axis=1)).mean() + np.abs(np.diff(hn, axis=0)).mean()
        # 2x2 tiled preview of shaded height for eyeballing seams
        light = np.clip(n[..., 0] * -0.6 + n[..., 1] * 0.6 + n[..., 2] * 0.55, 0, 1)
        prev = np.tile((light * 255).astype(np.uint8), (2, 2))
        Image.fromarray(prev).save(os.path.join(out, name + '-tiled-preview.png'))
        print(name, h.shape, 'seam/inner', round(edge / inner, 3), 'strength', s)
