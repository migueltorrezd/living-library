"""Bake seamless book-surface height fields from procedural nodes.

Each substrate is a height field on a unit plane. Every procedural input is
periodic in U and V (4D noise on a torus, integer-period waves), so the baked
tile repeats without seams. Height is baked as linear float through an
Emission bake; normal/roughness maps are derived afterwards with wrap-around
gradients (substrate_maps.py).

Idempotent: rebuilds the 'Substrate bake' scene and its objects each run.
"""
import bpy, math, os

from pathlib import Path
PROJECT = Path(globals().get('PROJECT', Path.cwd()))
OUT = str(globals().get('OUT', PROJECT / '.tmp/surface-pass/substrate-height'))
RES = globals().get('RES', 1024)
ONLY = globals().get('ONLY')  # optional list of names
os.makedirs(OUT, exist_ok=True)
TAU = 2 * math.pi

SC = 'Substrate bake'
sc = bpy.data.scenes.get(SC) or bpy.data.scenes.new(SC)
for o in list(sc.collection.objects):
    me = o.data
    bpy.data.objects.remove(o)
    if me and me.users == 0:
        bpy.data.meshes.remove(me)
sc.render.engine = 'CYCLES'
sc.cycles.samples = 4
sc.cycles.use_denoising = False
sc.render.bake.margin = 0
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    sc.cycles.device = 'GPU'
except Exception:
    pass

me = bpy.data.meshes.new('Substrate plane')
me.from_pydata([(-.5, -.5, 0), (.5, -.5, 0), (.5, .5, 0), (-.5, .5, 0)], [], [(0, 1, 2, 3)])
uv = me.uv_layers.new(name='UVMap')
for i, c in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
    uv.data[i].uv = c
plane = bpy.data.objects.new('Substrate plane', me)
sc.collection.objects.link(plane)


class G:
    """Tiny node-graph helper."""
    def __init__(self, mat):
        self.nt = mat.node_tree
        self.nt.nodes.clear()
        self.x = 0

    def node(self, kind, **props):
        n = self.nt.nodes.new(kind)
        n.location = (self.x, 0)
        self.x += 160
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def link(self, a, b):
        self.nt.links.new(a, b)

    def math(self, op, a, b=None, clamp=False):
        n = self.node('ShaderNodeMath', operation=op, use_clamp=clamp)
        for i, v in enumerate([a, b]):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                self.link(v, n.inputs[i])
        return n.outputs[0]

    def uv(self):
        t = self.node('ShaderNodeTexCoord')
        s = self.node('ShaderNodeSeparateXYZ')
        self.link(t.outputs['UV'], s.inputs[0])
        return s.outputs['X'], s.outputs['Y']

    def torus(self, u, v, radius):
        """Map (u,v) to a 4D torus: returns (vec3 socket, w socket)."""
        cu = self.math('MULTIPLY', self.math('COSINE', self.math('MULTIPLY', u, TAU)), radius)
        su = self.math('MULTIPLY', self.math('SINE', self.math('MULTIPLY', u, TAU)), radius)
        cv = self.math('MULTIPLY', self.math('COSINE', self.math('MULTIPLY', v, TAU)), radius)
        sv = self.math('MULTIPLY', self.math('SINE', self.math('MULTIPLY', v, TAU)), radius)
        c = self.node('ShaderNodeCombineXYZ')
        self.link(cu, c.inputs[0]); self.link(su, c.inputs[1]); self.link(cv, c.inputs[2])
        return c.outputs[0], sv

    def noise4(self, vec, w, scale, detail, rough, lac=2.0, distortion=0.0):
        n = self.node('ShaderNodeTexNoise', noise_dimensions='4D')
        self.link(vec, n.inputs['Vector']); self.link(w, n.inputs['W'])
        n.inputs['Scale'].default_value = scale
        n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough
        n.inputs['Lacunarity'].default_value = lac
        n.inputs['Distortion'].default_value = distortion
        return n.outputs['Fac']

    def voronoi4(self, vec, w, scale, feature='F1', metric='EUCLIDEAN', output='Distance'):
        n = self.node('ShaderNodeTexVoronoi', voronoi_dimensions='4D', feature=feature, distance=metric)
        self.link(vec, n.inputs['Vector']); self.link(w, n.inputs['W'])
        n.inputs['Scale'].default_value = scale
        return n.outputs[output]

    def fiber(self, u, v, count, length_ratio, seed):
        """Directional fibres: anisotropic torus noise stretched along U."""
        # stretch by sampling V faster than U on the torus (integer ratio keeps it periodic)
        vec, w = self.torus(u, self.math('MULTIPLY', v, length_ratio), 1.0)
        return self.noise4(vec, self.math('ADD', w, seed), count, 2.0, 0.5)


def build(mat, name):
    g = G(mat)
    u, v = g.uv()
    vec1, w1 = g.torus(u, v, 1.0)
    if name in ('satin-paper', 'satin-case', 'foil-paper'):
        # Coated stock: fine paper tooth under a coating. Low relief, soft bumps,
        # a faint coating orange-peel at a larger scale.
        tooth = g.noise4(vec1, w1, 24.0, 2.5, 0.5)
        flock = g.voronoi4(vec1, w1, 10.0, 'SMOOTH_F1')
        peel = g.noise4(vec1, g.math('ADD', w1, 3.1), 5.0, 2.0, 0.45)
        h = g.math('ADD', g.math('MULTIPLY', tooth, 0.62), g.math('MULTIPLY', flock, 0.18))
        h = g.math('ADD', h, g.math('MULTIPLY', peel, 0.20))
    elif name == 'uncoated':
        # Uncoated wrap: visible fibre flocs and short fibres in two directions.
        tooth = g.noise4(vec1, w1, 30.0, 3.0, 0.5)
        flock = g.voronoi4(vec1, w1, 12.0, 'SMOOTH_F1')
        fa = g.fiber(u, v, 22.0, 4, 1.7)
        fb = g.fiber(v, u, 22.0, 4, 5.3)
        fib = g.math('MAXIMUM', fa, fb)
        h = g.math('ADD', g.math('MULTIPLY', tooth, 0.45), g.math('MULTIPLY', flock, 0.25))
        h = g.math('ADD', h, g.math('MULTIPLY', fib, 0.30))
    elif name == 'soft-touch':
        # Soft-touch laminate: a velvety, nearly isotropic micro-texture.
        a = g.noise4(vec1, w1, 50.0, 1.5, 0.45)
        b = g.noise4(vec1, g.math('ADD', w1, 9.0), 14.0, 2.0, 0.4)
        h = g.math('ADD', g.math('MULTIPLY', a, 0.75), g.math('MULTIPLY', b, 0.25))
    elif name == 'cloth':
        # Plain-weave book cloth (buckram): warp along V, weft along U, each thread
        # undulating over/under its neighbours. N threads per tile in each direction.
        N = globals().get('CLOTH_THREADS', 64)
        a = g.math('MULTIPLY', u, N)
        b = g.math('MULTIPLY', v, N * 1.0)
        ia = g.math('FLOOR', a); ib = g.math('FLOOR', b)
        fa = g.math('FRACT', a); fb = g.math('FRACT', b)
        # thread cross-sections: rounded profile across each thread
        pa = g.math('POWER', g.math('SINE', g.math('MULTIPLY', fa, math.pi)), 0.6)
        pb = g.math('POWER', g.math('SINE', g.math('MULTIPLY', fb, math.pi)), 0.6)
        # undulation: warp i rises/falls along v with period 2 cells, phase by i
        uw = g.math('MULTIPLY', g.math('ADD', g.math('COSINE', g.math('MULTIPLY', g.math('ADD', g.math('SUBTRACT', b, 0.5), ia), math.pi)), 1.0), 0.5)
        uf = g.math('MULTIPLY', g.math('ADD', g.math('COSINE', g.math('MULTIPLY', g.math('ADD', g.math('SUBTRACT', a, 0.5), g.math('ADD', ib, 1.0)), math.pi)), 1.0), 0.5)
        # slub: per-thread thickness variation, periodic because thread index wraps with N
        sa = g.noise4(*g.torus(g.math('DIVIDE', ia, N), g.math('MULTIPLY', v, 0.0), 1.0), 4.0, 1.0, 0.5)
        sb = g.noise4(*g.torus(g.math('MULTIPLY', u, 0.0), g.math('DIVIDE', ib, N), 1.0), 4.0, 1.0, 0.5)
        warp = g.math('MULTIPLY', g.math('MULTIPLY', pa, g.math('ADD', g.math('MULTIPLY', uw, 0.55), 0.45)), g.math('ADD', g.math('MULTIPLY', sa, 0.5), 0.75))
        weft = g.math('MULTIPLY', g.math('MULTIPLY', pb, g.math('ADD', g.math('MULTIPLY', uf, 0.55), 0.45)), g.math('ADD', g.math('MULTIPLY', sb, 0.5), 0.75))
        h = g.math('MAXIMUM', warp, weft)
        # fibre fuzz on top of the threads
        fuzz = g.noise4(vec1, w1, 80.0, 1.5, 0.5)
        h = g.math('ADD', g.math('MULTIPLY', h, 0.85), g.math('MULTIPLY', fuzz, 0.15))
    else:
        raise ValueError(name)
    em = g.node('ShaderNodeEmission')
    g.link(h, em.inputs['Color'])
    out = g.node('ShaderNodeOutputMaterial')
    g.link(em.outputs[0], out.inputs['Surface'])


NAMES = ONLY or ['satin-paper', 'uncoated', 'soft-touch', 'cloth']
win = bpy.context.window
prev = win.scene
win.scene = sc
done = []
try:
    for name in NAMES:
        mat = bpy.data.materials.get('Substrate ' + name) or bpy.data.materials.new('Substrate ' + name)
        mat.use_nodes = True
        build(mat, name)
        img = bpy.data.images.get('substrate-' + name)
        if img:
            bpy.data.images.remove(img)
        img = bpy.data.images.new('substrate-' + name, RES, RES, float_buffer=True, is_data=True)
        tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = img
        mat.node_tree.nodes.active = tex
        me.materials.clear()
        me.materials.append(mat)
        for o in sc.objects:
            o.select_set(o == plane)
        bpy.context.view_layer.objects.active = plane
        bpy.ops.object.bake(type='EMIT', margin=0, use_clear=True)
        import numpy as np
        px = np.empty(RES * RES * 4, np.float32)
        img.pixels.foreach_get(px)
        np.save(os.path.join(OUT, name + '.npy'), px.reshape(RES, RES, 4)[..., 0])
        done.append(name)
finally:
    win.scene = prev
result = {'baked': done, 'out': OUT, 'res': RES}
