"""Run inside Blender: exec(open(path).read()) with SLUG (and optionally PROJECT, OUT) defined.

Bake closed-book ambient occlusion per vertex for one edition.

Imports the shipped public/models/<slug>.gltf into an isolated scene with
merge_vertices off, so every Blender vertex is exactly one glTF vertex (meshes
concatenate their primitives in order). Cycles bakes AO into a point-domain
colour attribute on the rigid case, spine, page block and endbands, tracing
against the whole closed book except printed decals and the moving ribbon.
Writes <OUT>/<slug>-ao.npz: per target mesh name -> float AO per vertex, plus
vertex positions for the correspondence check in inject_ao.py.
Idempotent: the scene and every datablock it creates are removed afterwards.
"""
import bpy, os, re, numpy as np

SLUG = globals().get('SLUG', 'naval')
from pathlib import Path
PROJECT = Path(globals().get('PROJECT', Path.cwd()))
# Pass SRC on every exec call (an exported .glb works too); never rely on a value left from an earlier call.
SRC = str(globals().get('SRC_FOR', {}).get(SLUG) or PROJECT / 'public/models' / f'{SLUG}.gltf')
OUT = str(globals().get('OUT', PROJECT / '.tmp/surface-pass/ao'))
SAMPLES = globals().get('SAMPLES', 512)
DISTANCE = globals().get('DISTANCE', 0.006)   # metres: board overhang and joint groove, not the opposite board
KEEP = globals().get('KEEP', False)
TARGET = re.compile(r'Wrapped printed cover|Printed case|Back board|Rounded cloth spine|Continuous compressed cut|textile endband|Edition spine print')
DECAL = re.compile(r'Curved foil rule|lettering|Interior|Ink|ink|Ribbon|Stamped|Back (title|description|collection|edition|ISBN)|Spine (title|author)|Collection mark')
os.makedirs(OUT, exist_ok=True)

before = {k: set(getattr(bpy.data, k)) for k in ('objects', 'meshes', 'materials', 'images', 'collections', 'worlds', 'cameras')}
win = bpy.context.window
prev = win.scene
sc = bpy.data.scenes.get('AO bake') or bpy.data.scenes.new('AO bake')
for o in list(sc.collection.all_objects):
    bpy.data.objects.remove(o)
win.scene = sc
sc.render.engine = 'CYCLES'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = False
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    sc.cycles.device = 'GPU'
except Exception:
    pass
w = bpy.data.worlds.new('AO bake world')
sc.world = w
w.light_settings.distance = DISTANCE

data, stats = {}, {}
try:
    bpy.ops.import_scene.gltf(filepath=SRC, merge_vertices=False, import_shading='NORMALS')
    meshes = [o for o in sc.objects if o.type == 'MESH']
    targets = [o for o in meshes if TARGET.search(o.data.name)]
    for o in meshes:
        if DECAL.search(o.name) or DECAL.search(o.data.name):
            o.hide_render = True
    for o in sc.objects:
        o.select_set(False)
    for o in targets:
        attr = o.data.color_attributes.get('AO') or o.data.color_attributes.new('AO', 'FLOAT_COLOR', 'POINT')
        o.data.color_attributes.active_color = attr
        o.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    for o in targets:
        me = o.data
        c = np.empty(len(me.vertices) * 4, np.float32)
        me.color_attributes['AO'].data.foreach_get('color', c)
        co = np.empty(len(me.vertices) * 3, np.float32)
        me.vertices.foreach_get('co', co)
        data[me.name + '|ao'] = c.reshape(-1, 4)[:, 0]
        data[me.name + '|co'] = co.reshape(-1, 3)
        stats[me.name] = [len(me.vertices), round(float(c.reshape(-1, 4)[:, 0].mean()), 3)]
    np.savez_compressed(os.path.join(OUT, f'{SLUG}-ao.npz'), **data)
finally:
    win.scene = prev
    if not KEEP:
        bpy.data.scenes.remove(sc)
        for k, old in before.items():
            coll = getattr(bpy.data, k)
            for d in list(coll):
                if d not in old:
                    try:
                        coll.remove(d)
                    except Exception:
                        pass
result = {'slug': SLUG, 'targets': stats}
